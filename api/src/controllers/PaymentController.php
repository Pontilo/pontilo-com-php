<?php

/** Equivalente a src/routes/paymentRoutes.ts + src/services/stripeService.ts */
final class PaymentController
{
    public static function createCheckoutSession(): void
    {
        $body = Helpers::body();
        $teacherId = $body['teacherId'] ?? null;
        $planType = $body['planType'] ?? null;

        if (!$teacherId || !$planType) {
            Response::error('teacherId e planType são obrigatórios', 400);
        }
        if (!in_array($planType, ['GRATUITO', 'PRO', 'ESCOLA'], true)) {
            Response::error('Tipo de plano inválido', 400);
        }

        $baseUrl = Config::get('frontend_url', 'http://localhost:3000');
        $successUrl = $baseUrl . '/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}';
        $cancelUrl = $baseUrl . '/dashboard/billing/canceled';

        try {
            $pdo = Database::pdo();
            $planStmt = $pdo->prepare('SELECT * FROM plans WHERE type = :type');
            $planStmt->execute(['type' => $planType]);
            $plan = $planStmt->fetch();
            if (!$plan) {
                throw new RuntimeException('Plano não encontrado');
            }

            $teacherStmt = $pdo->prepare('SELECT * FROM teachers WHERE id = :id');
            $teacherStmt->execute(['id' => $teacherId]);
            $teacher = $teacherStmt->fetch();
            if (!$teacher) {
                throw new RuntimeException('Professor não encontrado');
            }

            $customer = StripeClient::findCustomerByEmail($teacher['email']);
            if (!$customer) {
                $customer = StripeClient::createCustomer($teacher['email'], $teacher['name']);
            }

            $session = StripeClient::createCheckoutSession([
                'customer' => $customer['id'],
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'brl',
                        'product_data' => [
                            'name' => $plan['name'],
                            'description' => "Plano {$plan['name']} - App Pontos",
                        ],
                        'unit_amount' => (int) round(((float) $plan['price']) * 100),
                        'recurring' => ['interval' => 'month'],
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'subscription',
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'metadata' => ['teacherId' => $teacherId, 'planType' => $planType],
            ]);

            Response::json(['url' => $session['url']]);
        } catch (Throwable $e) {
            error_log('Erro ao criar sessão de checkout: ' . $e->getMessage());
            Response::error('Erro interno do servidor', 500);
        }
    }

    public static function webhook(): void
    {
        $payload = file_get_contents('php://input');
        $signature = Helpers::header('Stripe-Signature') ?? '';

        try {
            $event = StripeClient::verifyWebhookSignature($payload, $signature);
            self::handleWebhookEvent($event);
            Response::json(['received' => true]);
        } catch (Throwable $e) {
            error_log('Erro no webhook: ' . $e->getMessage());
            Response::error('Webhook error', 400);
        }
    }

    public static function createCustomerPortal(): void
    {
        $body = Helpers::body();
        $teacherId = $body['teacherId'] ?? null;

        if (!$teacherId) {
            Response::error('teacherId é obrigatório', 400);
        }

        try {
            $stmt = Database::pdo()->prepare('SELECT * FROM subscriptions WHERE teacher_id = :teacher_id');
            $stmt->execute(['teacher_id' => $teacherId]);
            $subscription = $stmt->fetch();

            if (!$subscription || !$subscription['stripe_customer_id']) {
                Response::error('Assinatura não encontrada', 404);
            }

            $baseUrl = Config::get('frontend_url', 'http://localhost:3000');
            $returnUrl = $baseUrl . '/dashboard/billing';

            $portal = StripeClient::createBillingPortalSession($subscription['stripe_customer_id'], $returnUrl);

            Response::json(['url' => $portal['url']]);
        } catch (Throwable $e) {
            error_log('Erro ao criar portal do cliente: ' . $e->getMessage());
            Response::error('Erro interno do servidor', 500);
        }
    }

    private static function handleWebhookEvent(array $event): void
    {
        $type = $event['type'] ?? '';
        $object = $event['data']['object'] ?? [];

        switch ($type) {
            case 'checkout.session.completed':
                self::handleCheckoutCompleted($object);
                break;
            case 'invoice.payment_succeeded':
                self::handlePaymentSucceeded($object);
                break;
            case 'invoice.payment_failed':
                self::handlePaymentFailed($object);
                break;
            case 'customer.subscription.updated':
                self::handleSubscriptionUpdated($object);
                break;
            case 'customer.subscription.deleted':
                self::handleSubscriptionDeleted($object);
                break;
            default:
                error_log("Unhandled event type: {$type}");
        }
    }

    private static function handleCheckoutCompleted(array $session): void
    {
        $teacherId = $session['metadata']['teacherId'] ?? null;
        $planType = $session['metadata']['planType'] ?? null;

        if (!$teacherId || !$planType) {
            error_log('Metadata missing in checkout session');
            return;
        }

        $pdo = Database::pdo();
        $planStmt = $pdo->prepare('SELECT * FROM plans WHERE type = :type');
        $planStmt->execute(['type' => $planType]);
        $plan = $planStmt->fetch();
        if (!$plan) {
            error_log('Plan not found: ' . $planType);
            return;
        }

        $stripeSubscription = StripeClient::retrieveSubscription($session['subscription']);

        $id = Id::generate();
        $stmt = $pdo->prepare('
            INSERT INTO subscriptions (id, teacher_id, plan_id, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end)
            VALUES (:id, :teacher_id, :plan_id, "ACTIVE", :customer_id, :sub_id, :start, :end)
        ');
        $stmt->execute([
            'id' => $id,
            'teacher_id' => $teacherId,
            'plan_id' => $plan['id'],
            'customer_id' => $session['customer'],
            'sub_id' => $stripeSubscription['id'],
            'start' => date('Y-m-d H:i:s.v', $stripeSubscription['current_period_start']),
            'end' => date('Y-m-d H:i:s.v', $stripeSubscription['current_period_end']),
        ]);

        $pdo->prepare('UPDATE teachers SET plan_type = :plan_type, subscription_status = "ACTIVE" WHERE id = :id')
            ->execute(['plan_type' => $planType, 'id' => $teacherId]);

        error_log("Subscription created for teacher {$teacherId} with plan {$planType}");
    }

    private static function handlePaymentSucceeded(array $invoice): void
    {
        $subscriptionId = $invoice['subscription'] ?? null;
        if (!$subscriptionId) {
            return;
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM subscriptions WHERE stripe_subscription_id = :sub_id');
        $stmt->execute(['sub_id' => $subscriptionId]);
        $subscription = $stmt->fetch();

        if (!$subscription) {
            error_log('Subscription not found for Stripe subscription: ' . $subscriptionId);
            return;
        }

        $id = Id::generate();
        $paidAt = isset($invoice['status_transitions']['paid_at']) ? date('Y-m-d H:i:s.v', $invoice['status_transitions']['paid_at']) : null;

        $stmt = $pdo->prepare('
            INSERT INTO payments (id, subscription_id, amount, currency, status, stripe_payment_id, paid_at)
            VALUES (:id, :subscription_id, :amount, :currency, "COMPLETED", :payment_id, :paid_at)
        ');
        $stmt->execute([
            'id' => $id,
            'subscription_id' => $subscription['id'],
            'amount' => ($invoice['amount_paid'] ?? 0) / 100,
            'currency' => strtoupper($invoice['currency'] ?? 'brl'),
            'payment_id' => $invoice['payment_intent'] ?? null,
            'paid_at' => $paidAt,
        ]);

        error_log("Payment recorded for subscription {$subscription['id']}");
    }

    private static function handlePaymentFailed(array $invoice): void
    {
        $subscriptionId = $invoice['subscription'] ?? null;
        if (!$subscriptionId) {
            return;
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM subscriptions WHERE stripe_subscription_id = :sub_id');
        $stmt->execute(['sub_id' => $subscriptionId]);
        $subscription = $stmt->fetch();

        if (!$subscription) {
            error_log('Subscription not found for Stripe subscription: ' . $subscriptionId);
            return;
        }

        $pdo->prepare('UPDATE subscriptions SET status = "PAST_DUE" WHERE id = :id')->execute(['id' => $subscription['id']]);
        $pdo->prepare('UPDATE teachers SET subscription_status = "PAST_DUE" WHERE id = :id')->execute(['id' => $subscription['teacher_id']]);

        error_log("Payment failed for subscription {$subscription['id']}");
    }

    private static function handleSubscriptionUpdated(array $stripeSubscription): void
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM subscriptions WHERE stripe_subscription_id = :sub_id');
        $stmt->execute(['sub_id' => $stripeSubscription['id']]);
        $subscription = $stmt->fetch();

        if (!$subscription) {
            error_log('Subscription not found for Stripe subscription: ' . $stripeSubscription['id']);
            return;
        }

        $status = ($stripeSubscription['status'] ?? '') === 'active' ? 'ACTIVE' : 'CANCELED';

        $stmt = $pdo->prepare('
            UPDATE subscriptions SET status = :status, current_period_start = :start, current_period_end = :end, cancel_at_period_end = :cancel
            WHERE id = :id
        ');
        $stmt->execute([
            'status' => $status,
            'start' => date('Y-m-d H:i:s.v', $stripeSubscription['current_period_start']),
            'end' => date('Y-m-d H:i:s.v', $stripeSubscription['current_period_end']),
            'cancel' => !empty($stripeSubscription['cancel_at_period_end']) ? 1 : 0,
            'id' => $subscription['id'],
        ]);

        error_log("Subscription updated: {$subscription['id']}");
    }

    private static function handleSubscriptionDeleted(array $stripeSubscription): void
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM subscriptions WHERE stripe_subscription_id = :sub_id');
        $stmt->execute(['sub_id' => $stripeSubscription['id']]);
        $subscription = $stmt->fetch();

        if (!$subscription) {
            error_log('Subscription not found for Stripe subscription: ' . $stripeSubscription['id']);
            return;
        }

        $pdo->prepare('UPDATE subscriptions SET status = "CANCELED" WHERE id = :id')->execute(['id' => $subscription['id']]);
        $pdo->prepare('UPDATE teachers SET plan_type = "GRATUITO", subscription_status = "INACTIVE" WHERE id = :id')
            ->execute(['id' => $subscription['teacher_id']]);

        error_log("Subscription canceled: {$subscription['id']}");
    }
}

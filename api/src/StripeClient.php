<?php

/**
 * Cliente minimo para a API REST do Stripe via cURL, sem depender do SDK
 * oficial (que exige composer). Cobre apenas as chamadas usadas pelo
 * backend Node original (src/services/stripeService.ts):
 *   - customers.create / customers.list
 *   - checkout.sessions.create
 *   - billingPortal.sessions.create
 *   - subscriptions.retrieve / subscriptions.cancel
 *   - verificação de assinatura de webhook
 */
final class StripeClient
{
    private const API_BASE = 'https://api.stripe.com/v1';

    private static function secretKey(): string
    {
        $key = Config::get('stripe.secret_key');
        if (!$key) {
            throw new RuntimeException('STRIPE_SECRET_KEY não configurado');
        }
        return $key;
    }

    private static function request(string $method, string $path, array $params = []): array
    {
        $ch = curl_init(self::API_BASE . $path . ($method === 'GET' && $params ? '?' . http_build_query($params) : ''));

        $options = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . self::secretKey(),
            ],
            CURLOPT_TIMEOUT => 30,
        ];

        if ($method !== 'GET' && $params) {
            $options[CURLOPT_POSTFIELDS] = http_build_query($params);
        }

        curl_setopt_array($ch, $options);
        $body = curl_exec($ch);

        if ($body === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException('Erro de conexão com o Stripe: ' . $error);
        }

        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decoded = json_decode($body, true);

        if ($status >= 400) {
            $message = $decoded['error']['message'] ?? 'Erro desconhecido do Stripe';
            throw new RuntimeException($message);
        }

        return $decoded ?? [];
    }

    public static function createCustomer(string $email, string $name): array
    {
        return self::request('POST', '/customers', ['email' => $email, 'name' => $name]);
    }

    public static function findCustomerByEmail(string $email): ?array
    {
        $result = self::request('GET', '/customers', ['email' => $email, 'limit' => 1]);
        return $result['data'][0] ?? null;
    }

    public static function createCheckoutSession(array $params): array
    {
        return self::request('POST', '/checkout/sessions', $params);
    }

    public static function retrieveSubscription(string $subscriptionId): array
    {
        return self::request('GET', '/subscriptions/' . urlencode($subscriptionId));
    }

    public static function cancelSubscription(string $subscriptionId): array
    {
        return self::request('DELETE', '/subscriptions/' . urlencode($subscriptionId));
    }

    public static function createBillingPortalSession(string $customerId, string $returnUrl): array
    {
        return self::request('POST', '/billing_portal/sessions', [
            'customer' => $customerId,
            'return_url' => $returnUrl,
        ]);
    }

    /**
     * Verifica a assinatura de um webhook do Stripe (header Stripe-Signature)
     * e retorna o payload decodificado. Lança RuntimeException se inválida.
     */
    public static function verifyWebhookSignature(string $payload, string $signatureHeader): array
    {
        $secret = Config::get('stripe.webhook_secret');
        if (!$secret) {
            throw new RuntimeException('STRIPE_WEBHOOK_SECRET não configurado');
        }

        $parts = [];
        foreach (explode(',', $signatureHeader) as $chunk) {
            [$key, $value] = array_pad(explode('=', trim($chunk), 2), 2, null);
            $parts[$key][] = $value;
        }

        $timestamp = $parts['t'][0] ?? null;
        $signatures = $parts['v1'] ?? [];

        if (!$timestamp || !$signatures) {
            throw new RuntimeException('Assinatura do webhook malformada');
        }

        $expected = hash_hmac('sha256', "{$timestamp}.{$payload}", $secret);

        $valid = false;
        foreach ($signatures as $sig) {
            if (hash_equals($expected, $sig)) {
                $valid = true;
                break;
            }
        }

        if (!$valid) {
            throw new RuntimeException('Falha na verificação da assinatura do webhook');
        }

        // Tolerância de 5 minutos, igual ao padrão do SDK oficial do Stripe.
        if (abs(time() - (int) $timestamp) > 300) {
            throw new RuntimeException('Timestamp do webhook fora da tolerância');
        }

        $decoded = json_decode($payload, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Payload do webhook inválido');
        }

        return $decoded;
    }
}

<?php

/** Equivalente a src/routes/subscriptionRoutes.ts (rotas simples, sem controller dedicado no Node) */
final class SubscriptionController
{
    public static function plans(): void
    {
        try {
            Response::json(SubscriptionService::getAvailablePlans());
        } catch (Throwable $e) {
            error_log('Erro ao buscar planos: ' . $e->getMessage());
            Response::error('Erro interno do servidor', 500);
        }
    }

    public static function currentPlan(array $params): void
    {
        try {
            $plan = SubscriptionService::getCurrentPlan($params['teacherId']);
            if (!$plan) {
                Response::error('Professor não encontrado', 404);
            }
            Response::json($plan);
        } catch (Throwable $e) {
            error_log('Erro ao buscar plano atual: ' . $e->getMessage());
            Response::error('Erro interno do servidor', 500);
        }
    }

    public static function canCreateClassroom(array $params): void
    {
        try {
            Response::json(['canCreate' => SubscriptionService::canCreateClassroom($params['teacherId'])]);
        } catch (Throwable $e) {
            error_log('Erro ao verificar limite de turmas: ' . $e->getMessage());
            Response::error('Erro interno do servidor', 500);
        }
    }

    public static function canAddStudent(array $params): void
    {
        try {
            Response::json(['canAdd' => SubscriptionService::canAddStudent($params['teacherId'])]);
        } catch (Throwable $e) {
            error_log('Erro ao verificar limite de alunos: ' . $e->getMessage());
            Response::error('Erro interno do servidor', 500);
        }
    }

    public static function hasFeature(array $params): void
    {
        try {
            Response::json(['hasAccess' => SubscriptionService::hasFeatureAccess($params['teacherId'], $params['feature'])]);
        } catch (Throwable $e) {
            error_log('Erro ao verificar acesso à funcionalidade: ' . $e->getMessage());
            Response::error('Erro interno do servidor', 500);
        }
    }

    public static function create(): void
    {
        $body = Helpers::body();
        $teacherId = $body['teacherId'] ?? null;
        $planType = $body['planType'] ?? null;
        $stripeCustomerId = $body['stripeCustomerId'] ?? null;
        $stripeSubscriptionId = $body['stripeSubscriptionId'] ?? null;

        if (!$teacherId || !$planType) {
            Response::error('teacherId e planType são obrigatórios', 400);
        }
        if (!in_array($planType, ['GRATUITO', 'PRO', 'ESCOLA'], true)) {
            Response::error('Tipo de plano inválido', 400);
        }

        try {
            $subscription = SubscriptionService::createSubscription($teacherId, $planType, $stripeCustomerId, $stripeSubscriptionId);
            Response::json($subscription, 201);
        } catch (Throwable $e) {
            error_log('Erro ao criar assinatura: ' . $e->getMessage());
            Response::error('Erro interno do servidor', 500);
        }
    }

    public static function cancel(array $params): void
    {
        try {
            SubscriptionService::cancelSubscription($params['teacherId']);
            Response::json(['message' => 'Assinatura cancelada com sucesso']);
        } catch (Throwable $e) {
            error_log('Erro ao cancelar assinatura: ' . $e->getMessage());
            Response::error('Erro interno do servidor', 500);
        }
    }
}

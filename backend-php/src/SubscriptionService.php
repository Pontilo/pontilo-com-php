<?php

/** Equivalente a src/services/subscriptionService.ts */
final class SubscriptionService
{
    public static function canCreateClassroom(string $teacherId): bool
    {
        $pdo = Database::pdo();
        $teacher = self::teacherWithSubscription($teacherId);
        if (!$teacher) {
            return false;
        }

        $stmt = $pdo->prepare('SELECT COUNT(*) AS c FROM classrooms WHERE teacher_id = :id');
        $stmt->execute(['id' => $teacherId]);
        $classroomCount = (int) $stmt->fetch()['c'];

        if (!$teacher['subscription'] || $teacher['subscription_status'] !== 'ACTIVE') {
            return $classroomCount < 10; // Plano gratuito temporário: 10 turmas
        }

        $max = $teacher['subscription']['max_classrooms'];
        return $max === null || $classroomCount < $max;
    }

    public static function canAddStudent(string $teacherId): bool
    {
        $pdo = Database::pdo();
        $teacher = self::teacherWithSubscription($teacherId);
        if (!$teacher) {
            return false;
        }

        $stmt = $pdo->prepare('
            SELECT COUNT(*) AS c FROM students s
            JOIN classrooms c ON c.id = s.classroom_id
            WHERE c.teacher_id = :id
        ');
        $stmt->execute(['id' => $teacherId]);
        $totalStudents = (int) $stmt->fetch()['c'];

        if (!$teacher['subscription'] || $teacher['subscription_status'] !== 'ACTIVE') {
            return $totalStudents < 500; // Plano gratuito temporário: 500 alunos
        }

        $max = $teacher['subscription']['max_students'];
        return $max === null || $totalStudents < $max;
    }

    public static function hasFeatureAccess(string $teacherId, string $feature): bool
    {
        $teacher = self::teacherWithSubscription($teacherId);
        if (!$teacher) {
            return false;
        }

        if (!$teacher['subscription'] || $teacher['subscription_status'] !== 'ACTIVE') {
            return in_array($feature, ['basic_points', 'basic_avatars', 'simple_ranking'], true);
        }

        $features = json_decode($teacher['subscription']['features'] ?? '[]', true) ?: [];
        return in_array($feature, $features, true);
    }

    public static function getCurrentPlan(string $teacherId): ?array
    {
        $teacher = self::teacherWithSubscription($teacherId);
        if (!$teacher) {
            return null;
        }

        if (!$teacher['subscription'] || $teacher['subscription_status'] !== 'ACTIVE') {
            return self::planByType('GRATUITO');
        }

        return self::mapPlanRow($teacher['subscription']);
    }

    public static function createSubscription(string $teacherId, string $planType, ?string $stripeCustomerId, ?string $stripeSubscriptionId): array
    {
        $pdo = Database::pdo();
        $planStmt = $pdo->prepare('SELECT * FROM plans WHERE type = :type');
        $planStmt->execute(['type' => $planType]);
        $plan = $planStmt->fetch();
        if (!$plan) {
            throw new RuntimeException('Plano não encontrado');
        }

        $existingStmt = $pdo->prepare('SELECT * FROM subscriptions WHERE teacher_id = :teacher_id');
        $existingStmt->execute(['teacher_id' => $teacherId]);
        $existing = $existingStmt->fetch();

        $periodStart = Helpers::nowDateTime();
        $periodEnd = date('Y-m-d H:i:s.v', strtotime('+30 days'));

        if ($existing) {
            $stmt = $pdo->prepare('
                UPDATE subscriptions SET plan_id = :plan_id, stripe_customer_id = :stripe_customer_id,
                    stripe_subscription_id = :stripe_subscription_id, status = "ACTIVE",
                    current_period_start = :start, current_period_end = :end
                WHERE teacher_id = :teacher_id
            ');
            $stmt->execute([
                'plan_id' => $plan['id'], 'stripe_customer_id' => $stripeCustomerId,
                'stripe_subscription_id' => $stripeSubscriptionId, 'start' => $periodStart,
                'end' => $periodEnd, 'teacher_id' => $teacherId,
            ]);

            $result = $pdo->prepare('SELECT * FROM subscriptions WHERE teacher_id = :teacher_id');
            $result->execute(['teacher_id' => $teacherId]);
            return $result->fetch();
        }

        $id = Id::generate();
        $stmt = $pdo->prepare('
            INSERT INTO subscriptions (id, teacher_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_start, current_period_end)
            VALUES (:id, :teacher_id, :plan_id, :stripe_customer_id, :stripe_subscription_id, "ACTIVE", :start, :end)
        ');
        $stmt->execute([
            'id' => $id, 'teacher_id' => $teacherId, 'plan_id' => $plan['id'],
            'stripe_customer_id' => $stripeCustomerId, 'stripe_subscription_id' => $stripeSubscriptionId,
            'start' => $periodStart, 'end' => $periodEnd,
        ]);

        $pdo->prepare('UPDATE teachers SET plan_type = :plan_type, subscription_status = "ACTIVE" WHERE id = :id')
            ->execute(['plan_type' => $planType, 'id' => $teacherId]);

        $result = $pdo->prepare('SELECT * FROM subscriptions WHERE id = :id');
        $result->execute(['id' => $id]);
        return $result->fetch();
    }

    public static function cancelSubscription(string $teacherId): void
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id FROM subscriptions WHERE teacher_id = :teacher_id');
        $stmt->execute(['teacher_id' => $teacherId]);
        if (!$stmt->fetch()) {
            throw new RuntimeException('Assinatura não encontrada');
        }

        $pdo->prepare('UPDATE subscriptions SET cancel_at_period_end = 1, status = "CANCELED" WHERE teacher_id = :teacher_id')
            ->execute(['teacher_id' => $teacherId]);

        $pdo->prepare('UPDATE teachers SET plan_type = "GRATUITO", subscription_status = "INACTIVE" WHERE id = :id')
            ->execute(['id' => $teacherId]);
    }

    public static function getAvailablePlans(): array
    {
        $stmt = Database::pdo()->query('SELECT * FROM plans WHERE is_active = 1 ORDER BY price ASC');
        return array_map([self::class, 'mapPlanRow'], $stmt->fetchAll());
    }

    public static function mapPlanRow(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'type' => $row['type'],
            'price' => (float) $row['price'],
            'currency' => $row['currency'],
            'interval' => $row['billing_interval'],
            'maxStudents' => $row['max_students'] !== null ? (int) $row['max_students'] : null,
            'maxClassrooms' => $row['max_classrooms'] !== null ? (int) $row['max_classrooms'] : null,
            'features' => json_decode($row['features'] ?? '[]', true) ?: [],
            'isActive' => (bool) $row['is_active'],
        ];
    }

    private static function planByType(string $type): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM plans WHERE type = :type');
        $stmt->execute(['type' => $type]);
        $row = $stmt->fetch();
        return $row ? self::mapPlanRow($row) : null;
    }

    /**
     * Retorna o professor com a assinatura + plano atual embutidos, no
     * formato interno usado pelos metodos acima (chaves de tabela, nao
     * camelCase -- convertido para o formato de resposta so em mapPlanRow).
     */
    private static function teacherWithSubscription(string $teacherId): ?array
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM teachers WHERE id = :id');
        $stmt->execute(['id' => $teacherId]);
        $teacher = $stmt->fetch();
        if (!$teacher) {
            return null;
        }

        $subStmt = $pdo->prepare('
            SELECT s.*, p.max_students, p.max_classrooms, p.features, p.name AS plan_name, p.type AS plan_type_value,
                   p.price, p.currency, p.billing_interval, p.is_active, p.id AS plan_row_id
            FROM subscriptions s JOIN plans p ON p.id = s.plan_id
            WHERE s.teacher_id = :teacher_id
        ');
        $subStmt->execute(['teacher_id' => $teacherId]);
        $sub = $subStmt->fetch();

        $subscription = null;
        if ($sub) {
            $subscription = [
                'id' => $sub['plan_row_id'],
                'name' => $sub['plan_name'],
                'type' => $sub['plan_type_value'],
                'price' => $sub['price'],
                'currency' => $sub['currency'],
                'billing_interval' => $sub['billing_interval'],
                'max_students' => $sub['max_students'] !== null ? (int) $sub['max_students'] : null,
                'max_classrooms' => $sub['max_classrooms'] !== null ? (int) $sub['max_classrooms'] : null,
                'features' => $sub['features'],
                'is_active' => $sub['is_active'],
            ];
        }

        return [
            'id' => $teacher['id'],
            'subscription_status' => $teacher['subscription_status'],
            'subscription' => $subscription,
        ];
    }
}

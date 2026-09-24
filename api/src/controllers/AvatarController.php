<?php

/** Equivalente a src/controllers/avatarController.ts */
final class AvatarController
{
    public static function listItems(): void
    {
        $stmt = Database::pdo()->query('SELECT * FROM avatar_items');
        Response::json(array_map([self::class, 'mapItem'], $stmt->fetchAll()));
    }

    public static function unlock(): void
    {
        $student = Auth::requireStudent();
        $studentId = $student['id'];
        $body = Helpers::body();
        $avatarItemId = $body['avatarItemId'] ?? null;

        $pdo = Database::pdo();

        $stmt = $pdo->prepare('SELECT * FROM students WHERE id = :id');
        $stmt->execute(['id' => $studentId]);
        $studentRow = $stmt->fetch();

        $stmt = $pdo->prepare('SELECT * FROM avatar_items WHERE id = :id');
        $stmt->execute(['id' => $avatarItemId]);
        $item = $stmt->fetch();

        if (!$studentRow || !$item) {
            Response::error('Aluno ou item não encontrado', 404);
        }
        if ((int) $studentRow['avatar_points'] < (int) $item['cost_points']) {
            Response::error('Pontos de avatar insuficientes', 400);
        }

        $stmt = $pdo->prepare('SELECT 1 FROM student_avatar_items WHERE student_id = :student_id AND avatar_item_id = :item_id');
        $stmt->execute(['student_id' => $studentId, 'item_id' => $avatarItemId]);
        if ($stmt->fetch()) {
            Response::error('Item já desbloqueado', 409);
        }

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare('UPDATE students SET avatar_points = avatar_points - :cost WHERE id = :id');
            $stmt->execute(['cost' => $item['cost_points'], 'id' => $studentId]);

            $stmt = $pdo->prepare('INSERT INTO student_avatar_items (student_id, avatar_item_id) VALUES (:student_id, :item_id)');
            $stmt->execute(['student_id' => $studentId, 'item_id' => $avatarItemId]);

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            error_log('unlockAvatarItem failed: ' . $e->getMessage());
            Response::error('Erro ao desbloquear item', 500);
        }

        Response::json(['success' => true]);
    }

    public static function listUnlocked(): void
    {
        $student = Auth::requireStudent();
        $pdo = Database::pdo();

        $stmt = $pdo->prepare('SELECT id FROM students WHERE id = :id');
        $stmt->execute(['id' => $student['id']]);
        if (!$stmt->fetch()) {
            Response::error('Aluno não encontrado', 404);
        }

        $stmt = $pdo->prepare('
            SELECT ai.* FROM student_avatar_items sai
            JOIN avatar_items ai ON ai.id = sai.avatar_item_id
            WHERE sai.student_id = :student_id
        ');
        $stmt->execute(['student_id' => $student['id']]);

        Response::json(array_map([self::class, 'mapItem'], $stmt->fetchAll()));
    }

    public static function getConfig(): void
    {
        $student = Auth::requireStudent();
        $stmt = Database::pdo()->prepare('SELECT config FROM student_avatar_configs WHERE student_id = :id');
        $stmt->execute(['id' => $student['id']]);
        $row = $stmt->fetch();

        Response::json($row ? json_decode($row['config'], true) : new stdClass());
    }

    public static function saveConfig(): void
    {
        $student = Auth::requireStudent();
        $body = Helpers::body();
        $config = $body['config'] ?? null;

        $stmt = Database::pdo()->prepare('
            INSERT INTO student_avatar_configs (student_id, config) VALUES (:student_id, :config)
            ON DUPLICATE KEY UPDATE config = VALUES(config)
        ');
        $stmt->execute(['student_id' => $student['id'], 'config' => json_encode($config, JSON_UNESCAPED_UNICODE)]);

        Response::json($config);
    }

    /**
     * NOTA: replica fielmente o backend Node -- esta rota nao possui NENHUM
     * middleware de autenticacao (qualquer pessoa pode somar/subtrair pontos
     * de avatar de qualquer aluno pelo ID). Ver MIGRATION_NOTES.md.
     */
    public static function addPoints(array $params): void
    {
        $body = Helpers::body();
        $amount = $body['amount'] ?? 0;

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('UPDATE students SET avatar_points = avatar_points + :amount WHERE id = :id');
        $stmt->execute(['amount' => $amount, 'id' => $params['studentId']]);

        $stmt = $pdo->prepare('SELECT avatar_points FROM students WHERE id = :id');
        $stmt->execute(['id' => $params['studentId']]);
        $row = $stmt->fetch();

        Response::json(['avatarPoints' => $row ? (int) $row['avatar_points'] : null]);
    }

    public static function mapItem(array $row): array
    {
        return [
            'id' => $row['id'],
            'type' => $row['type'],
            'value' => $row['value'],
            'displayName' => $row['display_name'],
            'costPoints' => (int) $row['cost_points'],
            'isDefault' => (bool) $row['is_default'],
            'createdAt' => $row['created_at'],
        ];
    }
}

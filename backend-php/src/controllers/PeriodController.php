<?php

/** Equivalente a src/controllers/periodController.ts */
final class PeriodController
{
    public static function create(): void
    {
        $user = Auth::requireTeacher();
        $teacherId = Auth::teacherId($user);
        $body = Helpers::body();

        $name = $body['name'] ?? null;
        $type = $body['type'] ?? null;
        $number = $body['number'] ?? null;
        $description = $body['description'] ?? null;
        $startDate = $body['startDate'] ?? null;
        $endDate = $body['endDate'] ?? null;
        $active = array_key_exists('active', $body) ? (bool) $body['active'] : true;

        if (!$name || !$startDate || !$endDate || !$type || !$number) {
            Response::error('name, type, number, startDate e endDate são obrigatórios', 400);
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id FROM teachers WHERE id = :id');
        $stmt->execute(['id' => $teacherId]);
        if (!$stmt->fetch()) {
            Response::error('Professor não encontrado', 404);
        }

        $id = Id::generate();
        $stmt = $pdo->prepare('
            INSERT INTO periods (id, name, type, number, description, teacher_id, start_date, end_date, active)
            VALUES (:id, :name, :type, :number, :description, :teacher_id, :start_date, :end_date, :active)
        ');
        $stmt->execute([
            'id' => $id,
            'name' => $name,
            'type' => $type,
            'number' => (int) $number,
            'description' => $description,
            'teacher_id' => $teacherId,
            'start_date' => date('Y-m-d H:i:s.v', strtotime($startDate)),
            'end_date' => date('Y-m-d H:i:s.v', strtotime($endDate)),
            'active' => $active ? 1 : 0,
        ]);

        $stmt = $pdo->prepare('SELECT * FROM periods WHERE id = :id');
        $stmt->execute(['id' => $id]);

        Response::json(self::mapPeriod($stmt->fetch()), 201);
    }

    public static function list(): void
    {
        $user = Auth::requireTeacher();
        $teacherId = Auth::teacherId($user);

        $stmt = Database::pdo()->prepare('SELECT * FROM periods WHERE teacher_id = :teacher_id ORDER BY start_date DESC');
        $stmt->execute(['teacher_id' => $teacherId]);

        Response::json(array_map([self::class, 'mapPeriod'], $stmt->fetchAll()));
    }

    public static function update(array $params): void
    {
        $user = Auth::requireTeacher();
        $teacherId = Auth::teacherId($user);
        $body = Helpers::body();

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM periods WHERE id = :id');
        $stmt->execute(['id' => $params['id']]);
        $current = $stmt->fetch();

        if (!$current) {
            Response::error('Período não encontrado', 404);
        }
        if ($current['teacher_id'] !== $teacherId) {
            Response::error('Acesso negado', 403);
        }

        $stmt = $pdo->prepare('
            UPDATE periods SET
                name = :name,
                type = :type,
                number = :number,
                description = :description,
                start_date = :start_date,
                end_date = :end_date,
                active = :active
            WHERE id = :id
        ');
        $stmt->execute([
            'name' => $body['name'] ?? $current['name'],
            'type' => $body['type'] ?? $current['type'],
            'number' => isset($body['number']) ? (int) $body['number'] : $current['number'],
            'description' => $body['description'] ?? $current['description'],
            'start_date' => isset($body['startDate']) ? date('Y-m-d H:i:s.v', strtotime($body['startDate'])) : $current['start_date'],
            'end_date' => isset($body['endDate']) ? date('Y-m-d H:i:s.v', strtotime($body['endDate'])) : $current['end_date'],
            'active' => array_key_exists('active', $body) ? ((bool) $body['active'] ? 1 : 0) : $current['active'],
            'id' => $params['id'],
        ]);

        $stmt = $pdo->prepare('SELECT * FROM periods WHERE id = :id');
        $stmt->execute(['id' => $params['id']]);

        Response::json(self::mapPeriod($stmt->fetch()));
    }

    public static function mapPeriod(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'type' => $row['type'],
            'number' => (int) $row['number'],
            'description' => $row['description'],
            'teacherId' => $row['teacher_id'],
            'startDate' => $row['start_date'],
            'endDate' => $row['end_date'],
            'active' => (bool) $row['active'],
            'createdAt' => $row['created_at'],
        ];
    }
}

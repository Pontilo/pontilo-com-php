<?php

/** Equivalente a src/controllers/pointController.ts */
final class PointController
{
    public static function create(array $params): void
    {
        $user = Auth::requireToken();
        $teacherId = Auth::teacherId($user);
        $body = Helpers::body();

        $studentId = $params['studentId'] ?? ($body['studentId'] ?? null);
        $value = $body['value'] ?? null;
        $reason = $body['reason'] ?? null;
        $type = $body['type'] ?? 'heart';

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('
            SELECT s.id FROM students s
            JOIN classrooms c ON c.id = s.classroom_id
            WHERE s.id = :id AND c.teacher_id = :teacher_id
        ');
        $stmt->execute(['id' => $studentId, 'teacher_id' => $teacherId]);
        if (!$stmt->fetch()) {
            Response::error('Student not found or access denied', 404);
        }

        $id = Id::generate();

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare('INSERT INTO points (id, value, reason, type, student_id) VALUES (:id, :value, :reason, :type, :student_id)');
            $stmt->execute(['id' => $id, 'value' => $value, 'reason' => $reason, 'type' => $type, 'student_id' => $studentId]);

            $stmt = $pdo->prepare('UPDATE students SET avatar_points = avatar_points + :value WHERE id = :id');
            $stmt->execute(['value' => $value, 'id' => $studentId]);

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            error_log('createPoint failed: ' . $e->getMessage());
            Response::error('Failed to create point', 500);
        }

        $stmt = $pdo->prepare('SELECT * FROM points WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $point = $stmt->fetch();

        $stmt = $pdo->prepare('SELECT avatar_points FROM students WHERE id = :id');
        $stmt->execute(['id' => $studentId]);
        $avatarPoints = (int) $stmt->fetch()['avatar_points'];

        Response::json([
            'point' => self::mapPoint($point),
            'avatarPoints' => $avatarPoints,
        ], 201);
    }

    public static function listByStudent(array $params): void
    {
        $user = Auth::requireToken();
        $teacherId = Auth::teacherId($user);
        $studentId = $params['studentId'];

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('
            SELECT s.id FROM students s
            JOIN classrooms c ON c.id = s.classroom_id
            WHERE s.id = :id AND c.teacher_id = :teacher_id
        ');
        $stmt->execute(['id' => $studentId, 'teacher_id' => $teacherId]);
        if (!$stmt->fetch()) {
            Response::error('Access denied', 403);
        }

        $periodId = $_GET['periodId'] ?? null;
        $semesterId = $_GET['semesterId'] ?? null;
        $range = Helpers::periodRange($periodId, $semesterId);

        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;

        $start = $range['start'] ?? null;
        $end = $range['end'] ?? null;

        if ($from !== null) {
            $fromDate = strtotime($from);
            if ($fromDate === false) {
                Response::error('Invalid "from" date format. Use ISO string.', 400);
            }
            $start = date('Y-m-d H:i:s.v', $fromDate);
        }

        if ($to !== null) {
            $toDate = strtotime($to);
            if ($toDate === false) {
                Response::error('Invalid "to" date format. Use ISO string.', 400);
            }
            $end = date('Y-m-d H:i:s.v', $toDate);
        }

        $sql = 'SELECT * FROM points WHERE student_id = :student_id';
        $bindings = ['student_id' => $studentId];
        if ($start !== null) {
            $sql .= ' AND created_at >= :start';
            $bindings['start'] = $start;
        }
        if ($end !== null) {
            $sql .= ' AND created_at <= :end';
            $bindings['end'] = $end;
        }
        $sql .= ' ORDER BY created_at DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($bindings);

        Response::json(array_map([self::class, 'mapPoint'], $stmt->fetchAll()));
    }

    public static function update(array $params): void
    {
        $user = Auth::requireToken();
        $teacherId = Auth::teacherId($user);
        $body = Helpers::body();
        $value = $body['value'] ?? null;
        $reason = $body['reason'] ?? null;
        $type = $body['type'] ?? null;

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('
            SELECT p.*, c.teacher_id AS classroom_teacher_id
            FROM points p
            JOIN students s ON s.id = p.student_id
            JOIN classrooms c ON c.id = s.classroom_id
            WHERE p.id = :id
        ');
        $stmt->execute(['id' => $params['id']]);
        $current = $stmt->fetch();

        if (!$current) {
            Response::error('Point not found', 404);
        }
        if ($current['classroom_teacher_id'] !== $teacherId) {
            Response::error('Access denied', 403);
        }

        $pointDifference = (int) $value - (int) $current['value'];

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare('UPDATE points SET value = :value, reason = :reason, type = :type WHERE id = :id');
            $stmt->execute(['value' => $value, 'reason' => $reason, 'type' => $type, 'id' => $params['id']]);

            $stmt = $pdo->prepare('UPDATE students SET avatar_points = avatar_points + :diff WHERE id = :id');
            $stmt->execute(['diff' => $pointDifference, 'id' => $current['student_id']]);

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            error_log('updatePoint failed: ' . $e->getMessage());
            Response::error('Failed to update point', 500);
        }

        $stmt = $pdo->prepare('SELECT * FROM points WHERE id = :id');
        $stmt->execute(['id' => $params['id']]);
        $point = $stmt->fetch();

        $stmt = $pdo->prepare('SELECT avatar_points FROM students WHERE id = :id');
        $stmt->execute(['id' => $current['student_id']]);
        $avatarPoints = (int) $stmt->fetch()['avatar_points'];

        Response::json([
            'point' => self::mapPoint($point),
            'avatarPoints' => $avatarPoints,
        ]);
    }

    public static function delete(array $params): void
    {
        $user = Auth::requireToken();
        $teacherId = Auth::teacherId($user);

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('
            SELECT p.*, c.teacher_id AS classroom_teacher_id
            FROM points p
            JOIN students s ON s.id = p.student_id
            JOIN classrooms c ON c.id = s.classroom_id
            WHERE p.id = :id
        ');
        $stmt->execute(['id' => $params['id']]);
        $point = $stmt->fetch();

        if (!$point) {
            Response::error('Point not found', 404);
        }
        if ($point['classroom_teacher_id'] !== $teacherId) {
            Response::error('Access denied', 403);
        }

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare('DELETE FROM points WHERE id = :id');
            $stmt->execute(['id' => $params['id']]);

            $stmt = $pdo->prepare('UPDATE students SET avatar_points = avatar_points - :value WHERE id = :id');
            $stmt->execute(['value' => $point['value'], 'id' => $point['student_id']]);

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            error_log('deletePoint failed: ' . $e->getMessage());
            Response::error('Failed to delete point', 500);
        }

        Response::noContent();
    }

    public static function mapPoint(array $row): array
    {
        return [
            'id' => $row['id'],
            'value' => (int) $row['value'],
            'type' => $row['type'],
            'reason' => $row['reason'],
            'studentId' => $row['student_id'],
            'createdAt' => $row['created_at'],
        ];
    }
}

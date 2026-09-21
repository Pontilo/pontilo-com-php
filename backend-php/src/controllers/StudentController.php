<?php

/** Equivalente a src/controllers/studentController.ts */
final class StudentController
{
    private const DEFAULT_AVATAR_CONFIG = [
        'avatarStyle' => 'Circle',
        'topType' => 'ShortHairShortFlat',
        'accessoriesType' => 'Blank',
        'hairColor' => 'BrownDark',
        'facialHairType' => 'Blank',
        'clotheType' => 'ShirtCrewNeck',
        'clotheColor' => 'Blue03',
        'eyeType' => 'Default',
        'eyebrowType' => 'Default',
        'mouthType' => 'Smile',
        'skinColor' => 'Light',
    ];

    private const DEFAULT_AVATAR_ITEM_IDS = [
        'seed-avatarstyle-circle',
        'seed-toptype-shorthairshortflat',
        'seed-accessoriestype-blank',
        'seed-facialhairtype-blank',
        'seed-clothetype-shirtcrewneck',
        'seed-clothecolor-blue03',
        'seed-eyetype-default',
        'seed-eyebrowtype-default',
        'seed-mouthtype-smile',
        'seed-skincolor-light',
        'seed-haircolor-browndark',
    ];

    public static function create(): void
    {
        $user = Auth::requireToken();
        $teacherId = Auth::teacherId($user);
        $body = Helpers::body();
        $name = $body['name'] ?? null;
        $code = $body['code'] ?? null;
        $classroomId = $body['classroomId'] ?? null;

        $pdo = Database::pdo();

        $stmt = $pdo->prepare('SELECT id FROM classrooms WHERE id = :id AND teacher_id = :teacher_id');
        $stmt->execute(['id' => $classroomId, 'teacher_id' => $teacherId]);
        if (!$stmt->fetch()) {
            Response::error('Turma não encontrada ou sem permissão', 403);
        }

        $stmt = $pdo->prepare('SELECT id FROM students WHERE code = :code');
        $stmt->execute(['code' => $code]);
        if ($stmt->fetch()) {
            Response::error('Code already in use.', 400);
        }

        $id = Id::generate();

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare('INSERT INTO students (id, name, code, classroom_id) VALUES (:id, :name, :code, :classroom_id)');
            $stmt->execute(['id' => $id, 'name' => $name, 'code' => $code, 'classroom_id' => $classroomId]);

            $stmt = $pdo->prepare('INSERT INTO student_avatar_configs (student_id, config) VALUES (:student_id, :config)');
            $stmt->execute(['student_id' => $id, 'config' => json_encode(self::DEFAULT_AVATAR_CONFIG, JSON_UNESCAPED_UNICODE)]);

            $itemStmt = $pdo->prepare('INSERT INTO student_avatar_items (student_id, avatar_item_id) VALUES (:student_id, :avatar_item_id)');
            foreach (self::DEFAULT_AVATAR_ITEM_IDS as $itemId) {
                $itemStmt->execute(['student_id' => $id, 'avatar_item_id' => $itemId]);
            }

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            error_log('createStudent failed: ' . $e->getMessage());
            Response::error('Internal server error', 500);
        }

        $stmt = $pdo->prepare('SELECT * FROM students WHERE id = :id');
        $stmt->execute(['id' => $id]);

        Response::json(self::mapStudent($stmt->fetch()), 201);
    }

    public static function list(): void
    {
        $user = Auth::requireToken();
        $teacherId = Auth::teacherId($user);
        if (!$teacherId || ($user['type'] ?? null) !== 'teacher') {
            Response::error('Acesso negado', 403);
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('
            SELECT s.*, c.id AS c_id, c.name AS c_name, c.teacher_id AS c_teacher_id, c.created_at AS c_created_at
            FROM students s
            JOIN classrooms c ON c.id = s.classroom_id
            WHERE c.teacher_id = :teacher_id
        ');
        $stmt->execute(['teacher_id' => $teacherId]);
        $rows = $stmt->fetchAll();

        $pointsStmt = $pdo->prepare('SELECT id, value, type, reason, created_at FROM points WHERE student_id = :student_id');

        $result = array_map(function ($row) use ($pointsStmt) {
            $mapped = self::mapStudent($row);
            $mapped['classroom'] = [
                'id' => $row['c_id'],
                'name' => $row['c_name'],
                'teacherId' => $row['c_teacher_id'],
                'createdAt' => $row['c_created_at'],
            ];
            $pointsStmt->execute(['student_id' => $row['id']]);
            $mapped['points'] = array_map([self::class, 'mapPoint'], $pointsStmt->fetchAll());
            return $mapped;
        }, $rows);

        Response::json($result);
    }

    public static function listByClassroom(array $params): void
    {
        $user = Auth::requireToken();
        $teacherId = Auth::teacherId($user);

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id FROM classrooms WHERE id = :id AND teacher_id = :teacher_id');
        $stmt->execute(['id' => $params['id'], 'teacher_id' => $teacherId]);
        if (!$stmt->fetch()) {
            Response::error('Turma não encontrada ou sem permissão', 403);
        }

        $stmt = $pdo->prepare('SELECT * FROM students WHERE classroom_id = :classroom_id');
        $stmt->execute(['classroom_id' => $params['id']]);
        $students = $stmt->fetchAll();

        $pointsStmt = $pdo->prepare('SELECT id, value, type, reason, created_at FROM points WHERE student_id = :student_id');

        $result = array_map(function ($student) use ($pointsStmt) {
            $mapped = self::mapStudent($student);
            $pointsStmt->execute(['student_id' => $student['id']]);
            $mapped['points'] = array_map([self::class, 'mapPoint'], $pointsStmt->fetchAll());
            return $mapped;
        }, $students);

        Response::json($result);
    }

    public static function update(array $params): void
    {
        $user = Auth::requireToken();
        $teacherId = Auth::teacherId($user);
        $body = Helpers::body();

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('
            SELECT s.* FROM students s
            JOIN classrooms c ON c.id = s.classroom_id
            WHERE s.id = :id AND c.teacher_id = :teacher_id
        ');
        $stmt->execute(['id' => $params['id'], 'teacher_id' => $teacherId]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::error('Aluno não encontrado ou sem permissão', 404);
        }

        $classroomId = $body['classroomId'] ?? null;
        if ($classroomId && $classroomId !== $existing['classroom_id']) {
            $stmt = $pdo->prepare('SELECT id FROM classrooms WHERE id = :id AND teacher_id = :teacher_id');
            $stmt->execute(['id' => $classroomId, 'teacher_id' => $teacherId]);
            if (!$stmt->fetch()) {
                Response::error('Nova turma inválida ou sem permissão', 403);
            }
        }

        $stmt = $pdo->prepare('UPDATE students SET name = :name, code = :code, classroom_id = :classroom_id WHERE id = :id');
        $stmt->execute([
            'name' => $body['name'] ?? $existing['name'],
            'code' => $body['code'] ?? $existing['code'],
            'classroom_id' => $classroomId ?: $existing['classroom_id'],
            'id' => $params['id'],
        ]);

        $stmt = $pdo->prepare('SELECT * FROM students WHERE id = :id');
        $stmt->execute(['id' => $params['id']]);

        Response::json(self::mapStudent($stmt->fetch()));
    }

    public static function updatePassword(array $params): void
    {
        Auth::requireToken();
        $body = Helpers::body();

        $stmt = Database::pdo()->prepare('UPDATE students SET password = :password WHERE id = :id');
        $stmt->execute(['password' => $body['password'] ?? null, 'id' => $params['id']]);

        Response::json(['message' => 'Senha atualizada com sucesso']);
    }

    /**
     * NOTA: replica fielmente o backend Node -- senha do aluno eh guardada em
     * texto puro e comparada com "===" (sem hash). Ver MIGRATION_NOTES.md.
     */
    public static function updateOwnPassword(): void
    {
        $student = Auth::requireStudent();
        $body = Helpers::body();
        $currentPassword = $body['currentPassword'] ?? null;
        $newPassword = $body['newPassword'] ?? null;

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM students WHERE id = :id');
        $stmt->execute(['id' => $student['id']]);
        $current = $stmt->fetch();

        if (!$current) {
            Response::error('Aluno não encontrado', 404);
        }

        if ($currentPassword !== $current['password']) {
            Response::error('Senha atual incorreta', 401);
        }

        $stmt = $pdo->prepare('UPDATE students SET password = :password WHERE id = :id');
        $stmt->execute(['password' => $newPassword, 'id' => $student['id']]);

        Response::json(['message' => 'Senha atualizada com sucesso']);
    }

    public static function delete(array $params): void
    {
        Auth::requireToken();
        $pdo = Database::pdo();

        // Limpeza explicita (alem do ON DELETE CASCADE do schema) para manter
        // o mesmo padrao defensivo do backend Node original.
        $pdo->prepare('DELETE FROM points WHERE student_id = :id')->execute(['id' => $params['id']]);
        $pdo->prepare('DELETE FROM student_avatar_items WHERE student_id = :id')->execute(['id' => $params['id']]);
        $pdo->prepare('DELETE FROM student_avatar_configs WHERE student_id = :id')->execute(['id' => $params['id']]);
        $pdo->prepare('DELETE FROM students WHERE id = :id')->execute(['id' => $params['id']]);

        Response::noContent();
    }

    public static function getByCode(array $params): void
    {
        Auth::requireToken();

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM students WHERE code = :code');
        $stmt->execute(['code' => $params['code']]);
        $student = $stmt->fetch();

        if (!$student) {
            Response::error('Estudante não encontrado', 404);
        }

        $classroomStmt = $pdo->prepare('SELECT * FROM classrooms WHERE id = :id');
        $classroomStmt->execute(['id' => $student['classroom_id']]);

        $pointsStmt = $pdo->prepare('SELECT id, value, type, reason, created_at FROM points WHERE student_id = :student_id');
        $pointsStmt->execute(['student_id' => $student['id']]);

        $result = self::mapStudent($student);
        $result['classroom'] = ClassroomController::mapClassroom($classroomStmt->fetch());
        $result['points'] = array_map([self::class, 'mapPoint'], $pointsStmt->fetchAll());

        Response::json($result);
    }

    public static function mapStudent(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'code' => $row['code'],
            'classroomId' => $row['classroom_id'],
            'avatarPoints' => (int) $row['avatar_points'],
            'createdAt' => $row['created_at'],
        ];
    }

    public static function mapPoint(array $row): array
    {
        return [
            'id' => $row['id'],
            'value' => (int) $row['value'],
            'type' => $row['type'],
            'reason' => $row['reason'],
            'createdAt' => $row['created_at'],
        ];
    }
}

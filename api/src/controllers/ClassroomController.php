<?php

/** Equivalente a src/controllers/classroomController.ts */
final class ClassroomController
{
    public static function create(): void
    {
        $user = Auth::requireToken();
        $body = Helpers::body();
        $name = $body['name'] ?? null;
        $teacherId = Auth::teacherId($user);

        if (!$name) {
            Response::error('name é obrigatório', 400);
        }
        if (!$teacherId || ($user['type'] ?? null) !== 'teacher') {
            Response::error('Apenas professor autenticado pode criar turma', 403);
        }

        $id = Id::generate();
        $stmt = Database::pdo()->prepare('INSERT INTO classrooms (id, name, teacher_id) VALUES (:id, :name, :teacher_id)');
        $stmt->execute(['id' => $id, 'name' => $name, 'teacher_id' => $teacherId]);

        $stmt = Database::pdo()->prepare('SELECT * FROM classrooms WHERE id = :id');
        $stmt->execute(['id' => $id]);

        Response::json(self::mapClassroom($stmt->fetch()), 201);
    }

    public static function list(): void
    {
        $user = Auth::requireToken();
        $teacherId = Auth::teacherId($user);
        if (!$teacherId || ($user['type'] ?? null) !== 'teacher') {
            Response::error('Acesso negado', 403);
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM classrooms WHERE teacher_id = :teacher_id');
        $stmt->execute(['teacher_id' => $teacherId]);
        $classrooms = $stmt->fetchAll();

        $teacherStmt = $pdo->prepare('SELECT id, name, email, plan_type, subscription_status, created_at FROM teachers WHERE id = :id');
        $teacherStmt->execute(['id' => $teacherId]);
        $teacher = $teacherStmt->fetch();

        $studentsStmt = $pdo->prepare('SELECT * FROM students WHERE classroom_id = :classroom_id');

        $result = array_map(function ($classroom) use ($studentsStmt, $teacher) {
            $studentsStmt->execute(['classroom_id' => $classroom['id']]);
            $mapped = self::mapClassroom($classroom);
            $mapped['teacher'] = self::mapTeacher($teacher);
            $mapped['students'] = array_map([self::class, 'mapStudent'], $studentsStmt->fetchAll());
            return $mapped;
        }, $classrooms);

        Response::json($result);
    }

    public static function update(array $params): void
    {
        $user = Auth::requireToken();
        $teacherId = Auth::teacherId($user);
        $body = Helpers::body();

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM classrooms WHERE id = :id AND teacher_id = :teacher_id');
        $stmt->execute(['id' => $params['id'], 'teacher_id' => $teacherId]);
        if (!$stmt->fetch()) {
            Response::error('Turma não encontrada ou sem permissão', 404);
        }

        $stmt = $pdo->prepare('UPDATE classrooms SET name = :name WHERE id = :id');
        $stmt->execute(['name' => $body['name'] ?? null, 'id' => $params['id']]);

        $stmt = $pdo->prepare('SELECT * FROM classrooms WHERE id = :id');
        $stmt->execute(['id' => $params['id']]);

        Response::json(self::mapClassroom($stmt->fetch()));
    }

    public static function delete(array $params): void
    {
        $user = Auth::requireToken();
        $teacherId = Auth::teacherId($user);

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id FROM classrooms WHERE id = :id AND teacher_id = :teacher_id');
        $stmt->execute(['id' => $params['id'], 'teacher_id' => $teacherId]);
        if (!$stmt->fetch()) {
            Response::error('Turma não encontrada ou sem permissão', 404);
        }

        $stmt = $pdo->prepare('DELETE FROM classrooms WHERE id = :id');
        $stmt->execute(['id' => $params['id']]);

        Response::noContent();
    }

    public static function getById(array $params): void
    {
        $user = Auth::requireToken();
        $teacherId = Auth::teacherId($user);

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM classrooms WHERE id = :id');
        $stmt->execute(['id' => $params['id']]);
        $classroom = $stmt->fetch();

        if (!$classroom) {
            Response::error('Turma não encontrada', 404);
        }

        // NOTA: replica fielmente o backend Node original -- essa checagem só
        // bloqueia quando o token é de professor (user.type === 'teacher') e
        // dono diferente; um token de aluno autenticado passa livremente por
        // aqui mesmo sem ser da turma. Ver MIGRATION_NOTES.md.
        if (($user['type'] ?? null) === 'teacher' && $classroom['teacher_id'] !== $teacherId) {
            Response::error('Acesso negado', 403);
        }

        $teacherStmt = $pdo->prepare('SELECT id, name, email, plan_type, subscription_status, created_at FROM teachers WHERE id = :id');
        $teacherStmt->execute(['id' => $classroom['teacher_id']]);
        $teacher = $teacherStmt->fetch();

        $studentsStmt = $pdo->prepare('SELECT * FROM students WHERE classroom_id = :classroom_id');
        $studentsStmt->execute(['classroom_id' => $classroom['id']]);

        $pointsStmt = $pdo->prepare('SELECT value FROM points WHERE student_id = :student_id');
        $countStmt = $pdo->prepare('SELECT COUNT(*) AS c FROM points WHERE student_id = :student_id');

        $students = array_map(function ($student) use ($pointsStmt, $countStmt) {
            $pointsStmt->execute(['student_id' => $student['id']]);
            $total = array_sum(array_column($pointsStmt->fetchAll(), 'value'));

            $countStmt->execute(['student_id' => $student['id']]);
            $count = (int) $countStmt->fetch()['c'];

            $mapped = self::mapStudent($student);
            $mapped['totalPoints'] = $total;
            $mapped['pointsCount'] = $count;
            return $mapped;
        }, $studentsStmt->fetchAll());

        $result = self::mapClassroom($classroom);
        $result['teacher'] = self::mapTeacher($teacher);
        $result['students'] = $students;

        Response::json($result);
    }

    public static function getByTeacher(array $params): void
    {
        $user = Auth::requireToken();
        $loggedInTeacherId = Auth::teacherId($user);
        $teacherId = $params['teacherId'];

        if (($user['type'] ?? null) === 'teacher' && $teacherId !== $loggedInTeacherId) {
            Response::error('Acesso negado', 403);
        }

        $periodId = $_GET['periodId'] ?? null;
        $semesterId = $_GET['semesterId'] ?? null;
        $range = Helpers::periodRange($periodId, $semesterId);

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM classrooms WHERE teacher_id = :teacher_id');
        $stmt->execute(['teacher_id' => $teacherId]);
        $classrooms = $stmt->fetchAll();

        $studentsStmt = $pdo->prepare('SELECT * FROM students WHERE classroom_id = :classroom_id');

        // NOTA: o backend Node original computava "totalPoints" a partir de
        // apenas o ULTIMO ponto (take: 1) em vez da soma real dos pontos do
        // periodo -- um bug real (nao uma regra de negocio), corrigido aqui
        // a pedido explicito do usuario (consumido pelo app mobile para
        // ranking de alunos). Ver MIGRATION_NOTES.md.
        $pointsSql = 'SELECT value, type, reason, created_at FROM points WHERE student_id = :student_id';
        $pointsParams = [];
        if ($range) {
            $pointsSql .= ' AND created_at BETWEEN :start AND :end';
            $pointsParams = ['start' => $range['start'], 'end' => $range['end']];
        }
        $pointsSql .= ' ORDER BY created_at DESC';
        $pointsStmt = $pdo->prepare($pointsSql);

        $result = array_map(function ($classroom) use ($studentsStmt, $pointsStmt, $pointsParams) {
            $studentsStmt->execute(['classroom_id' => $classroom['id']]);
            $students = array_map(function ($student) use ($pointsStmt, $pointsParams) {
                $pointsStmt->execute(array_merge(['student_id' => $student['id']], $pointsParams));
                $points = $pointsStmt->fetchAll();
                $lastPoint = $points[0] ?? null;

                $mapped = self::mapStudent($student);
                $mapped['totalPoints'] = array_sum(array_column($points, 'value'));
                $mapped['pointsCount'] = count($points);
                $mapped['lastPoint'] = $lastPoint ? [
                    'value' => (int) $lastPoint['value'],
                    'type' => $lastPoint['type'],
                    'reason' => $lastPoint['reason'],
                    'createdAt' => $lastPoint['created_at'],
                ] : null;
                return $mapped;
            }, $studentsStmt->fetchAll());

            $mapped = self::mapClassroom($classroom);
            $mapped['students'] = $students;
            return $mapped;
        }, $classrooms);

        Response::json($result);
    }

    public static function mapClassroom(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'teacherId' => $row['teacher_id'],
            'createdAt' => $row['created_at'],
        ];
    }

    public static function mapTeacher(?array $row): ?array
    {
        if (!$row) {
            return null;
        }
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'planType' => $row['plan_type'],
            'subscriptionStatus' => $row['subscription_status'],
            'createdAt' => $row['created_at'],
        ];
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
}

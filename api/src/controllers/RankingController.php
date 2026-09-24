<?php

/** Equivalente a src/controllers/rankingController.ts */
final class RankingController
{
    public static function teacherLogin(): void
    {
        $body = Helpers::body();
        $email = $body['email'] ?? null;
        $password = $body['password'] ?? null;

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM teachers WHERE email = :email');
        $stmt->execute(['email' => $email]);
        $teacher = $stmt->fetch();

        if (!$teacher) {
            Response::error('Professor não encontrado', 404);
        }
        if (!password_verify((string) $password, $teacher['password'])) {
            Response::error('Senha inválida', 401);
        }

        $stmt = $pdo->prepare('
            SELECT c.id, c.name, c.created_at, (SELECT COUNT(*) FROM students s WHERE s.classroom_id = c.id) AS student_count
            FROM classrooms c WHERE c.teacher_id = :teacher_id
        ');
        $stmt->execute(['teacher_id' => $teacher['id']]);
        $classrooms = array_map(fn($c) => [
            'id' => $c['id'],
            'name' => $c['name'],
            'createdAt' => $c['created_at'],
            '_count' => ['students' => (int) $c['student_count']],
        ], $stmt->fetchAll());

        $token = Jwt::sign([
            'teacherId' => $teacher['id'],
            'email' => $teacher['email'],
            'type' => 'teacher',
        ], Config::get('jwt_secret'), '24h');

        Response::json([
            'success' => true,
            'teacher' => [
                'id' => $teacher['id'],
                'name' => $teacher['name'],
                'email' => $teacher['email'],
                'classrooms' => $classrooms,
            ],
            'token' => $token,
        ]);
    }

    public static function classroomRanking(array $params): void
    {
        $user = Auth::requireTeacher();
        $teacherId = Auth::teacherId($user);

        $range = Helpers::periodRange($_GET['periodId'] ?? null, $_GET['semesterId'] ?? null);

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM classrooms WHERE id = :id AND teacher_id = :teacher_id');
        $stmt->execute(['id' => $params['classroomId'], 'teacher_id' => $teacherId]);
        $classroom = $stmt->fetch();

        if (!$classroom) {
            Response::error('Turma não encontrada ou não pertence ao professor', 404);
        }

        // Formato fiel ao getClassroomRanking original: points e a lista bruta
        // de registros (nao um numero), avatarConfig fica aninhado em
        // { config: {...} }, igual ao "include" do Prisma.
        $pdo2 = Database::pdo();
        $studentsStmt = $pdo2->prepare('SELECT * FROM students WHERE classroom_id = :classroom_id');
        $studentsStmt->execute(['classroom_id' => $classroom['id']]);
        $configStmt = $pdo2->prepare('SELECT config FROM student_avatar_configs WHERE student_id = :id');

        $pointsSql = 'SELECT id, value, type, reason, student_id, created_at FROM points WHERE student_id = :student_id';
        if ($range) {
            $pointsSql .= ' AND created_at BETWEEN :start AND :end';
        }
        $pointsFullStmt = $pdo2->prepare($pointsSql);

        $students = array_map(function ($s) use ($range, $configStmt, $pointsFullStmt) {
            $bindings = ['student_id' => $s['id']];
            if ($range) {
                $bindings['start'] = $range['start'];
                $bindings['end'] = $range['end'];
            }
            $pointsFullStmt->execute($bindings);
            $points = array_map(fn($p) => [
                'id' => $p['id'],
                'value' => (int) $p['value'],
                'type' => $p['type'],
                'reason' => $p['reason'],
                'studentId' => $p['student_id'],
                'createdAt' => $p['created_at'],
            ], $pointsFullStmt->fetchAll());
            $totalPoints = array_sum(array_column($points, 'value'));
            $configStmt->execute(['id' => $s['id']]);
            $configRow = $configStmt->fetch();

            return [
                'id' => $s['id'],
                'name' => $s['name'],
                'points' => $points,
                'code' => $s['code'],
                'avatarPoints' => (int) $s['avatar_points'],
                'avatarConfig' => ['config' => $configRow ? json_decode($configRow['config'], true) : new stdClass()],
                'totalPoints' => $totalPoints,
            ];
        }, $studentsStmt->fetchAll());

        usort($students, fn($a, $b) => $b['totalPoints'] <=> $a['totalPoints']);

        Response::json([
            'success' => true,
            'classroom' => [
                'id' => $classroom['id'],
                'name' => $classroom['name'],
                'students' => $students,
            ],
        ]);
    }

    public static function studentLogin(): void
    {
        $body = Helpers::body();
        $code = $body['code'] ?? null;
        $password = $body['password'] ?? null;
        $range = Helpers::periodRange($body['periodId'] ?? null, $body['semesterId'] ?? null);

        $student = self::findStudentByCode($code);
        if (!$student) {
            Response::error('Aluno não encontrado', 404);
        }
        if ((string) $password !== (string) $student['password']) {
            Response::error('Senha inválida', 401);
        }

        Response::json(self::buildStudentSessionResponse($student, $range));
    }

    public static function refreshStudentLogin(): void
    {
        $body = Helpers::body();
        $code = $body['code'] ?? null;
        $range = Helpers::periodRange($body['periodId'] ?? null, $body['semesterId'] ?? null);

        $student = self::findStudentByCode($code);
        if (!$student) {
            Response::error('Aluno não encontrado', 404);
        }

        Response::json(self::buildStudentSessionResponse($student, $range));
    }

    public static function validateStudentToken(): void
    {
        $tokenPayload = Auth::requireStudent();
        $range = Helpers::periodRange($_GET['periodId'] ?? null, $_GET['semesterId'] ?? null);

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM students WHERE id = :id');
        $stmt->execute(['id' => $tokenPayload['id']]);
        $student = $stmt->fetch();

        if (!$student) {
            Response::error('Aluno não encontrado', 404);
        }

        Response::json(self::buildStudentSessionResponse($student, $range));
    }

    /**
     * Usado por app/ranking/pontos/page.tsx ("Visualizar Pontos do Aluno").
     * NOTA: essa rota tinha um mock no Next.js original que nunca chamava o
     * backend real e devolvia pontos 100% aleatorios (ver historico em
     * MIGRATION_NOTES.md) -- alem de gerar dados falsos, o mock nem devolvia
     * student.name/student.classroom/classroom.teacher que a tela usa,
     * quebrando a pagina com TypeError. Substituido por dados reais do aluno
     * autenticado. O filtro de "trimestre" mapeia para uma janela de meses do
     * ano corrente (nao ha um campo trimestre real no schema); "discipline"
     * e aceito por compatibilidade com o formulario mas nao filtra nada, pois
     * points nao tem uma coluna de disciplina.
     */
    public static function getStudentFromClassroom(): void
    {
        $tokenPayload = Auth::requireStudent();

        $body = Helpers::body();
        $quarter = $body['quarter'] ?? null;
        $discipline = $body['discipline'] ?? null;

        if (!$quarter || !$discipline) {
            Response::error('Parâmetros obrigatórios: quarter, discipline', 400);
        }
        if (!in_array((int) $quarter, [1, 2, 3, 4], true)) {
            Response::error('Trimestre deve ser 1, 2, 3 ou 4', 400);
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM students WHERE id = :id');
        $stmt->execute(['id' => $tokenPayload['id']]);
        $student = $stmt->fetch();
        if (!$student) {
            Response::error('Aluno não encontrado', 404);
        }

        $classroomStmt = $pdo->prepare('SELECT * FROM classrooms WHERE id = :id');
        $classroomStmt->execute(['id' => $student['classroom_id']]);
        $classroom = $classroomStmt->fetch();

        $teacherStmt = $pdo->prepare('SELECT id, name, email, created_at FROM teachers WHERE id = :id');
        $teacherStmt->execute(['id' => $classroom['teacher_id']]);
        $teacher = $teacherStmt->fetch();

        $quarterMonths = [1 => [1, 2, 3], 2 => [4, 5, 6], 3 => [7, 8, 9], 4 => [10, 11, 12]];
        $months = $quarterMonths[(int) $quarter];
        $year = (int) date('Y');
        $start = sprintf('%04d-%02d-01 00:00:00', $year, $months[0]);
        $endMonth = $months[count($months) - 1];
        $endDay = (int) (new DateTime(sprintf('%04d-%02d-01', $year, $endMonth)))->format('t');
        $end = sprintf('%04d-%02d-%02d 23:59:59', $year, $endMonth, $endDay);

        $pointsStmt = $pdo->prepare('SELECT id, value, type, reason, created_at FROM points WHERE student_id = :student_id AND created_at BETWEEN :start AND :end ORDER BY created_at DESC');
        $pointsStmt->execute(['student_id' => $student['id'], 'start' => $start, 'end' => $end]);
        $points = array_map(fn($p) => [
            'id' => $p['id'],
            'value' => (int) $p['value'],
            'type' => $p['type'],
            'reason' => $p['reason'],
            'createdAt' => $p['created_at'],
        ], $pointsStmt->fetchAll());

        $pointsByType = ['heart' => 0, 'star' => 0, 'trophy' => 0];
        foreach ($points as $p) {
            $pointsByType[$p['type']] = ($pointsByType[$p['type']] ?? 0) + $p['value'];
        }
        $totalPoints = array_sum(array_column($points, 'value'));

        Response::json([
            'classroom' => [
                'id' => $classroom['id'],
                'name' => $classroom['name'],
                'teacher' => [
                    'id' => $teacher['id'],
                    'name' => $teacher['name'],
                    'email' => $teacher['email'],
                    'createdAt' => $teacher['created_at'],
                ],
            ],
            'student' => [
                'id' => $student['id'],
                'name' => $student['name'],
                'code' => $student['code'],
                'classroomId' => $student['classroom_id'],
                'avatarPoints' => (int) $student['avatar_points'],
                'createdAt' => $student['created_at'],
                'classroom' => [
                    'id' => $classroom['id'],
                    'name' => $classroom['name'],
                    'teacherId' => $classroom['teacher_id'],
                    'createdAt' => $classroom['created_at'],
                ],
                'points' => $points,
                'totalPoints' => $totalPoints,
                'pointsCount' => count($points),
                'pointsByType' => $pointsByType,
            ],
        ]);
    }

    private static function findStudentByCode(?string $code): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM students WHERE code = :code');
        $stmt->execute(['code' => $code]);
        $student = $stmt->fetch();
        return $student ?: null;
    }

    private static function buildStudentSessionResponse(array $student, ?array $range): array
    {
        $pdo = Database::pdo();

        $points = self::studentPoints($student['id'], $range);
        $pointsByType = [];
        foreach ($points as $p) {
            $type = $p['type'] ?: 'heart';
            $pointsByType[$type] = ($pointsByType[$type] ?? 0) + $p['value'];
        }
        $totalPoints = array_sum($pointsByType);

        $configStmt = $pdo->prepare('SELECT config FROM student_avatar_configs WHERE student_id = :id');
        $configStmt->execute(['id' => $student['id']]);
        $configRow = $configStmt->fetch();
        $avatarConfig = $configRow ? json_decode($configRow['config'], true) : new stdClass();

        $classroomStmt = $pdo->prepare('SELECT * FROM classrooms WHERE id = :id');
        $classroomStmt->execute(['id' => $student['classroom_id']]);
        $classroom = $classroomStmt->fetch();

        $ranking = self::studentsWithTotals($student['classroom_id'], $range);
        usort($ranking, function ($a, $b) {
            $diff = $b['points'] <=> $a['points'];
            return $diff !== 0 ? $diff : strcmp($a['name'], $b['name']);
        });
        $ranking = array_values(array_map(fn($s, $i) => ['position' => $i + 1, 'student' => $s], $ranking, array_keys($ranking)));

        $token = Jwt::sign([
            'id' => $student['id'],
            'code' => $student['code'],
            'name' => $student['name'],
            'classroomId' => $student['classroom_id'],
            'type' => 'student',
        ], Config::get('jwt_secret'), '7d');

        return [
            'token' => $token,
            'student' => [
                'id' => $student['id'],
                'name' => $student['name'],
                'points' => $totalPoints,
                'code' => $student['code'],
                'pointsByType' => $pointsByType,
                'avatarPoints' => (int) $student['avatar_points'],
                'avatarConfig' => $avatarConfig,
                'needsPasswordUpdate' => $student['password'] === '123',
                'classroom' => ['id' => $classroom['id'], 'name' => $classroom['name']],
            ],
            'ranking' => $ranking,
        ];
    }

    /**
     * Retorna todos os alunos de uma turma com pontos totais/por tipo e
     * avatarConfig, no formato usado pelo ranking (aluno e professor).
     */
    private static function studentsWithTotals(string $classroomId, ?array $range): array
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM students WHERE classroom_id = :classroom_id');
        $stmt->execute(['classroom_id' => $classroomId]);
        $students = $stmt->fetchAll();

        $configStmt = $pdo->prepare('SELECT config FROM student_avatar_configs WHERE student_id = :id');

        return array_map(function ($s) use ($range, $configStmt) {
            $points = self::studentPoints($s['id'], $range);
            $byType = [];
            foreach ($points as $p) {
                $type = $p['type'] ?: 'heart';
                $byType[$type] = ($byType[$type] ?? 0) + $p['value'];
            }
            $total = array_sum(array_column($points, 'value'));

            $configStmt->execute(['id' => $s['id']]);
            $configRow = $configStmt->fetch();

            return [
                'id' => $s['id'],
                'name' => $s['name'],
                'code' => $s['code'],
                'points' => $total,
                'totalPoints' => $total,
                'avatarPoints' => (int) $s['avatar_points'],
                'pointsByType' => $byType,
                'avatarConfig' => $configRow ? json_decode($configRow['config'], true) : new stdClass(),
            ];
        }, $students);
    }

    private static function studentPoints(string $studentId, ?array $range): array
    {
        $sql = 'SELECT value, type, reason, created_at FROM points WHERE student_id = :student_id';
        $bindings = ['student_id' => $studentId];
        if ($range) {
            $sql .= ' AND created_at BETWEEN :start AND :end';
            $bindings['start'] = $range['start'];
            $bindings['end'] = $range['end'];
        }
        $stmt = Database::pdo()->prepare($sql);
        $stmt->execute($bindings);
        return array_map(fn($p) => ['value' => (int) $p['value'], 'type' => $p['type'], 'reason' => $p['reason'], 'createdAt' => $p['created_at']], $stmt->fetchAll());
    }
}

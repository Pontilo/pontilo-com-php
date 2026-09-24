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
     * Equivalente ao endpoint mock de app/api/ranking/getStudentFromClassroom/route.ts
     * do frontend Next.js. NOTA IMPORTANTE: o backend Express original tem uma rota real
     * "POST /ranking/getStudentFromClassroom" (busca aluno por nome+turma), mas em
     * producao ela nunca era alcancada -- o proxy do Next.js interceptava o mesmo
     * caminho "/api/ranking/getStudentFromClassroom" e respondia com dados 100%
     * aleatorios/mockados (usados por app/ranking/pontos/page.tsx), sem nunca chamar
     * o backend real. Esse mock e o comportamento realmente visto pelos usuarios hoje,
     * entao e o que preservamos aqui. Ver MIGRATION_NOTES.md.
     */
    public static function getStudentFromClassroomMock(): void
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/^Bearer\s+.+$/i', trim($authHeader))) {
            Response::error('Token de autorização necessário', 401);
        }

        $body = Helpers::body();
        $studentCode = $body['studentCode'] ?? null;
        $quarter = $body['quarter'] ?? null;
        $discipline = $body['discipline'] ?? null;

        if (!$studentCode || !$quarter || !$discipline) {
            Response::error('Parâmetros obrigatórios: studentCode, quarter, discipline', 400);
        }
        if (!in_array((int) $quarter, [1, 2, 3, 4], true)) {
            Response::error('Trimestre deve ser 1, 2, 3 ou 4', 400);
        }

        $points = self::generateFilteredPoints((int) $quarter, (string) $discipline);
        $totalPoints = array_sum(array_column($points, 'value'));
        $pointsByType = ['heart' => 0, 'star' => 0, 'trophy' => 0];
        foreach ($points as $p) {
            $pointsByType[$p['type']] = ($pointsByType[$p['type']] ?? 0) + $p['value'];
        }

        Response::json([
            'student' => [
                'code' => $studentCode,
                'points' => $points,
                'totalPoints' => $totalPoints,
                'pointsCount' => count($points),
                'pointsByType' => $pointsByType,
            ],
        ]);
    }

    private static function generateFilteredPoints(int $quarter, string $discipline): array
    {
        $disciplines = [
            'MATEMATICA' => 'Matemática', 'PORTUGUES' => 'Português', 'HISTORIA' => 'História',
            'GEOGRAFIA' => 'Geografia', 'CIENCIAS' => 'Ciências', 'INGLES' => 'Inglês',
            'EDUCACAO_FISICA' => 'Educação Física', 'ARTES' => 'Artes', 'FILOSOFIA' => 'Filosofia',
            'SOCIOLOGIA' => 'Sociologia',
        ];
        $disciplineName = $disciplines[$discipline] ?? $discipline;

        $reasons = [
            "Excelente participação em {$disciplineName}", "Atividade de {$disciplineName} bem executada",
            "Prova de {$disciplineName} - nota máxima", "Trabalho em grupo de {$disciplineName}",
            "Apresentação de {$disciplineName}", "Exercício de {$disciplineName} correto",
            "Lição de casa de {$disciplineName}", "Projeto de {$disciplineName} criativo",
            "Pesquisa de {$disciplineName} completa", "Seminário de {$disciplineName} excelente",
        ];

        $types = ['heart', 'star', 'trophy'];
        $pointsCount = random_int(3, 10);
        $points = [];

        $quarterMonths = [1 => [0, 1, 2], 2 => [3, 4, 5], 3 => [6, 7, 8], 4 => [9, 10, 11]];
        $months = $quarterMonths[$quarter] ?? [0, 1, 2];
        $year = 2025;

        for ($i = 0; $i < $pointsCount; $i++) {
            $month = $months[array_rand($months)];
            $day = random_int(1, 28);
            $hour = random_int(8, 19);
            $minute = random_int(0, 59);
            $date = (new DateTime())->setDate($year, $month + 1, $day)->setTime($hour, $minute);

            $points[] = [
                'id' => 'cmd' . (int) (microtime(true) * 1000) . $i . substr(md5((string) mt_rand()), 0, 9),
                'value' => random_int(1, 5),
                'type' => $types[array_rand($types)],
                'reason' => $reasons[array_rand($reasons)],
                'createdAt' => $date->format('c'),
            ];
        }

        usort($points, fn($a, $b) => strcmp($b['createdAt'], $a['createdAt']));

        return $points;
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

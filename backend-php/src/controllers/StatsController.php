<?php

/** Equivalente a src/controllers/statsController.ts */
final class StatsController
{
    public static function teacherStats(array $params): void
    {
        $user = Auth::requireToken();
        $loggedInTeacherId = Auth::teacherId($user);
        $teacherId = $params['teacherId'];

        if (($user['type'] ?? null) === 'teacher' && $teacherId !== $loggedInTeacherId) {
            Response::error('Acesso negado', 403);
        }

        $range = Helpers::periodRange($_GET['periodId'] ?? null, $_GET['semesterId'] ?? null);
        if (!$range) {
            $range = ['start' => date('Y-m-d H:i:s.v', strtotime('-7 days')), 'end' => null];
        }

        $classrooms = self::classroomsWithPoints($teacherId, $range);

        $totalStudents = 0;
        $totalPoints = 0;
        $recentActivity = 0;
        $recentPoints = [];
        $studentTotals = [];

        foreach ($classrooms as $classroom) {
            foreach ($classroom['students'] as $student) {
                $totalStudents++;
                $studentTotal = array_sum(array_column($student['points'], 'value'));
                $totalPoints += $studentTotal;
                $studentTotals[$student['id']] = array_merge($student, ['totalPoints' => $studentTotal]);

                foreach ($student['points'] as $point) {
                    $recentActivity += $point['value'];
                    $recentPoints[] = [
                        'id' => $point['id'],
                        'studentId' => $student['id'],
                        'studentName' => $student['name'],
                        'value' => $point['value'],
                        'type' => $point['type'],
                        'reason' => $point['reason'],
                        'createdAt' => $point['createdAt'],
                    ];
                }
            }
        }

        $topStudents = array_values($studentTotals);
        usort($topStudents, fn($a, $b) => $b['totalPoints'] <=> $a['totalPoints']);
        $topStudents = array_slice($topStudents, 0, 3);

        usort($recentPoints, fn($a, $b) => strcmp($b['createdAt'], $a['createdAt']));
        $recentPoints = array_slice($recentPoints, 0, 5);

        Response::json([
            'stats' => [
                'classrooms' => count($classrooms),
                'students' => $totalStudents,
                'points' => $totalPoints,
                'recentActivity' => $recentActivity,
            ],
            'topStudents' => $topStudents,
            'recentPoints' => $recentPoints,
        ]);
    }

    public static function dashboardOverview(): void
    {
        $user = Auth::requireTeacher();
        $teacherId = Auth::teacherId($user);

        $range = Helpers::periodRange($_GET['periodId'] ?? null, $_GET['semesterId'] ?? null);
        $rangeDays = isset($_GET['days']) && (int) $_GET['days'] > 0 ? (int) $_GET['days'] : 7;
        $trendStart = $range['start'] ?? date('Y-m-d H:i:s.v', strtotime("-{$rangeDays} days"));

        $classrooms = self::classroomsWithPoints($teacherId, $range ?? ['start' => $trendStart, 'end' => null]);

        $totalStudents = 0;
        $totalPoints = 0;
        $recentActivity = 0;
        $pointsByType = [];
        $topStudentsAcc = [];
        $classroomTotals = [];
        $trendMap = [];

        foreach ($classrooms as $classroom) {
            $classroomPoints = 0;
            foreach ($classroom['students'] as $student) {
                $totalStudents++;
                $studentTotal = array_sum(array_column($student['points'], 'value'));
                $totalPoints += $studentTotal;
                $classroomPoints += $studentTotal;

                $topStudentsAcc[] = [
                    'id' => $student['id'],
                    'name' => $student['name'],
                    'classroomId' => $classroom['id'],
                    'classroomName' => $classroom['name'],
                    'totalPoints' => $studentTotal,
                ];

                foreach ($student['points'] as $point) {
                    $recentActivity += $point['value'];
                    $type = $point['type'] ?: 'heart';
                    $pointsByType[$type] = ($pointsByType[$type] ?? 0) + $point['value'];
                    $key = Helpers::dateKey($point['createdAt']);
                    $trendMap[$key] = ($trendMap[$key] ?? 0) + $point['value'];
                }
            }
            $classroomTotals[] = [
                'classroomId' => $classroom['id'],
                'classroomName' => $classroom['name'],
                'totalPoints' => $classroomPoints,
                'students' => count($classroom['students']),
            ];
        }

        usort($topStudentsAcc, fn($a, $b) => $b['totalPoints'] <=> $a['totalPoints']);
        $topStudents = array_slice($topStudentsAcc, 0, 5);

        usort($classroomTotals, fn($a, $b) => $b['totalPoints'] <=> $a['totalPoints']);
        $topClassrooms = array_slice($classroomTotals, 0, 5);

        $trendSeries = self::buildTrendSeries($trendMap, $rangeDays);

        $pdo = Database::pdo();
        $periodsStmt = $pdo->prepare('SELECT * FROM periods WHERE teacher_id = :teacher_id ORDER BY start_date DESC');
        $periodsStmt->execute(['teacher_id' => $teacherId]);
        $periods = array_map([PeriodController::class, 'mapPeriod'], $periodsStmt->fetchAll());

        $teacherStmt = $pdo->prepare('SELECT * FROM teachers WHERE id = :id');
        $teacherStmt->execute(['id' => $teacherId]);
        $teacher = $teacherStmt->fetch();

        $planName = 'Gratuito';
        $subscriptionStatus = $teacher['subscription_status'] ?? 'INACTIVE';
        if ($teacher && $teacher['plan_type']) {
            $planStmt = $pdo->prepare('SELECT name FROM plans WHERE type = :type');
            $planStmt->execute(['type' => $teacher['plan_type']]);
            $plan = $planStmt->fetch();
            if ($plan) {
                $planName = $plan['name'];
            }
        }

        Response::json([
            'filters' => [
                'periodId' => ($_GET['periodId'] ?? $_GET['semesterId'] ?? null),
                'days' => $rangeDays,
            ],
            'summary' => [
                'classrooms' => count($classrooms),
                'students' => $totalStudents,
                'points' => $totalPoints,
                'recentActivity' => $recentActivity,
            ],
            'distribution' => ['pointsByType' => (object) $pointsByType],
            'topStudents' => $topStudents,
            'topClassrooms' => $topClassrooms,
            'activityTrend' => $trendSeries,
            'periods' => $periods,
            'subscription' => ['plan' => $planName, 'status' => $subscriptionStatus],
        ]);
    }

    public static function classroomReport(array $params): void
    {
        $user = Auth::requireTeacher();
        $teacherId = Auth::teacherId($user);
        $classroomId = $params['classroomId'];

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM classrooms WHERE id = :id');
        $stmt->execute(['id' => $classroomId]);
        $classroom = $stmt->fetch();

        if (!$classroom || $classroom['teacher_id'] !== $teacherId) {
            Response::error('Turma não encontrada ou não pertence ao professor', 404);
        }

        $range = Helpers::periodRange($_GET['periodId'] ?? null, $_GET['semesterId'] ?? null);
        $rangeDays = isset($_GET['days']) && (int) $_GET['days'] > 0 ? (int) $_GET['days'] : 30;
        $trendStart = $range['start'] ?? date('Y-m-d H:i:s.v', strtotime("-{$rangeDays} days"));
        $effectiveRange = $range ?? ['start' => $trendStart, 'end' => null];

        $studentsStmt = $pdo->prepare('SELECT * FROM students WHERE classroom_id = :classroom_id');
        $studentsStmt->execute(['classroom_id' => $classroomId]);
        $students = $studentsStmt->fetchAll();

        $pointsByType = [];
        $studentsReport = [];
        $reasonsCount = [];
        $trendMap = [];

        foreach ($students as $s) {
            $points = self::pointsInRange($s['id'], $effectiveRange);
            $total = array_sum(array_column($points, 'value'));
            $count = count($points);
            usort($points, fn($a, $b) => strcmp($b['createdAt'], $a['createdAt']));
            $last = $points[0] ?? null;

            foreach ($points as $p) {
                $type = $p['type'] ?: 'heart';
                $pointsByType[$type] = ($pointsByType[$type] ?? 0) + $p['value'];
                if ($p['reason']) {
                    $reasonsCount[$p['reason']] = ($reasonsCount[$p['reason']] ?? 0) + 1;
                }
                $key = Helpers::dateKey($p['createdAt']);
                $trendMap[$key] = ($trendMap[$key] ?? 0) + $p['value'];
            }

            $studentsReport[] = [
                'id' => $s['id'],
                'name' => $s['name'],
                'code' => $s['code'],
                'totalPoints' => $total,
                'pointsCount' => $count,
                'lastPoint' => $last ? ['value' => $last['value'], 'type' => $last['type'], 'reason' => $last['reason'], 'createdAt' => $last['createdAt']] : null,
            ];
        }

        $totalPoints = array_sum(array_column($studentsReport, 'totalPoints'));
        $avgPerStudent = count($studentsReport) ? (int) round($totalPoints / count($studentsReport)) : 0;

        $topStudent = null;
        if ($studentsReport) {
            $sorted = $studentsReport;
            usort($sorted, fn($a, $b) => $b['totalPoints'] <=> $a['totalPoints']);
            $topStudent = $sorted[0];
        }

        arsort($reasonsCount);
        $topReasons = [];
        $i = 0;
        foreach ($reasonsCount as $reason => $count) {
            if ($i++ >= 5) break;
            $topReasons[] = ['reason' => $reason, 'count' => $count];
        }

        $trendSeries = self::buildTrendSeries($trendMap, $rangeDays);

        Response::json([
            'classroom' => ['id' => $classroom['id'], 'name' => $classroom['name']],
            'summary' => [
                'students' => count($students),
                'points' => $totalPoints,
                'avgPerStudent' => $avgPerStudent,
                'topStudent' => $topStudent,
            ],
            'distribution' => ['pointsByType' => (object) $pointsByType],
            'students' => $studentsReport,
            'topReasons' => $topReasons,
            'timeline' => $trendSeries,
        ]);
    }

    public static function studentReport(array $params): void
    {
        $user = Auth::requireTeacher();
        $teacherId = Auth::teacherId($user);
        $studentId = $params['studentId'];

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('
            SELECT s.*, c.teacher_id AS classroom_teacher_id, c.id AS c_id, c.name AS c_name
            FROM students s JOIN classrooms c ON c.id = s.classroom_id
            WHERE s.id = :id
        ');
        $stmt->execute(['id' => $studentId]);
        $student = $stmt->fetch();

        if (!$student || $student['classroom_teacher_id'] !== $teacherId) {
            Response::error('Aluno não encontrado ou não pertence ao professor', 404);
        }

        $range = Helpers::periodRange($_GET['periodId'] ?? null, $_GET['semesterId'] ?? null);
        $rangeDays = isset($_GET['days']) && (int) $_GET['days'] > 0 ? (int) $_GET['days'] : 30;
        $trendStart = $range['start'] ?? date('Y-m-d H:i:s.v', strtotime("-{$rangeDays} days"));
        $effectiveRange = $range ?? ['start' => $trendStart, 'end' => null];

        $classmatesStmt = $pdo->prepare('SELECT id, name FROM students WHERE classroom_id = :classroom_id');
        $classmatesStmt->execute(['classroom_id' => $student['classroom_id']]);
        $classmates = $classmatesStmt->fetchAll();

        $classTotals = [];
        foreach ($classmates as $cm) {
            $points = self::pointsInRange($cm['id'], $effectiveRange);
            $classTotals[] = ['id' => $cm['id'], 'name' => $cm['name'], 'total' => array_sum(array_column($points, 'value'))];
        }
        usort($classTotals, fn($a, $b) => $b['total'] <=> $a['total']);
        $position = 0;
        foreach ($classTotals as $idx => $ct) {
            if ($ct['id'] === $studentId) {
                $position = $idx + 1;
                break;
            }
        }
        $classAvg = count($classTotals) ? (int) round(array_sum(array_column($classTotals, 'total')) / count($classTotals)) : 0;

        $points = self::pointsInRange($studentId, $effectiveRange);
        $pointsByType = [];
        foreach ($points as $p) {
            $type = $p['type'] ?: 'heart';
            $pointsByType[$type] = ($pointsByType[$type] ?? 0) + $p['value'];
        }
        $totalPoints = array_sum(array_column($points, 'value'));

        $trendMap = [];
        foreach ($points as $p) {
            $key = Helpers::dateKey($p['createdAt']);
            $trendMap[$key] = ($trendMap[$key] ?? 0) + $p['value'];
        }
        $trendSeries = self::buildTrendSeries($trendMap, $rangeDays);

        $recentPoints = $points;
        usort($recentPoints, fn($a, $b) => strcmp($b['createdAt'], $a['createdAt']));
        $recentPoints = array_slice($recentPoints, 0, 10);

        Response::json([
            'student' => [
                'id' => $student['id'],
                'name' => $student['name'],
                'code' => $student['code'],
                'classroom' => ['id' => $student['c_id'], 'name' => $student['c_name']],
            ],
            'summary' => [
                'points' => $totalPoints,
                'pointsByType' => (object) $pointsByType,
                'position' => $position,
                'classAvg' => $classAvg,
            ],
            'timeline' => $trendSeries,
            'recentPoints' => $recentPoints,
        ]);
    }

    public static function pointsReport(): void
    {
        $user = Auth::requireTeacher();
        $teacherId = Auth::teacherId($user);

        $range = Helpers::periodRange($_GET['periodId'] ?? null, $_GET['semesterId'] ?? null);
        $rangeDays = isset($_GET['days']) && (int) $_GET['days'] > 0 ? (int) $_GET['days'] : 30;
        $trendStart = $range['start'] ?? date('Y-m-d H:i:s.v', strtotime("-{$rangeDays} days"));
        $effectiveRange = $range ?? ['start' => $trendStart, 'end' => null];

        $classrooms = self::classroomsWithPoints($teacherId, $effectiveRange);

        $pointsByType = [];
        $pointsByClassroom = [];
        $reasonsCount = [];
        $trendMap = [];

        foreach ($classrooms as $classroom) {
            $classroomPoints = 0;
            foreach ($classroom['students'] as $student) {
                foreach ($student['points'] as $p) {
                    $type = $p['type'] ?: 'heart';
                    $pointsByType[$type] = ($pointsByType[$type] ?? 0) + $p['value'];
                    $classroomPoints += $p['value'];
                    if ($p['reason']) {
                        $reasonsCount[$p['reason']] = ($reasonsCount[$p['reason']] ?? 0) + 1;
                    }
                    $key = Helpers::dateKey($p['createdAt']);
                    $trendMap[$key] = ($trendMap[$key] ?? 0) + $p['value'];
                }
            }
            $pointsByClassroom[] = [
                'classroomId' => $classroom['id'],
                'classroomName' => $classroom['name'],
                'totalPoints' => $classroomPoints,
            ];
        }

        $totalPoints = array_sum(array_column($pointsByClassroom, 'totalPoints'));

        arsort($reasonsCount);
        $topReasons = [];
        $i = 0;
        foreach ($reasonsCount as $reason => $count) {
            if ($i++ >= 10) break;
            $topReasons[] = ['reason' => $reason, 'count' => $count];
        }

        $topClassrooms = $pointsByClassroom;
        usort($topClassrooms, fn($a, $b) => $b['totalPoints'] <=> $a['totalPoints']);
        $topClassrooms = array_slice($topClassrooms, 0, 5);

        $trendSeries = self::buildTrendSeries($trendMap, $rangeDays);

        Response::json([
            'filters' => ['periodId' => ($_GET['periodId'] ?? $_GET['semesterId'] ?? null), 'days' => $rangeDays],
            'summary' => ['points' => $totalPoints],
            'distribution' => ['pointsByType' => (object) $pointsByType],
            'byClassroom' => $pointsByClassroom,
            'topClassrooms' => $topClassrooms,
            'topReasons' => $topReasons,
            'timeline' => $trendSeries,
        ]);
    }

    /** Busca turmas + alunos + pontos (no intervalo) de um professor, de uma vez. */
    private static function classroomsWithPoints(string $teacherId, ?array $range): array
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT * FROM classrooms WHERE teacher_id = :teacher_id');
        $stmt->execute(['teacher_id' => $teacherId]);
        $classrooms = $stmt->fetchAll();

        $studentsStmt = $pdo->prepare('SELECT * FROM students WHERE classroom_id = :classroom_id');

        return array_map(function ($c) use ($studentsStmt, $range) {
            $studentsStmt->execute(['classroom_id' => $c['id']]);
            $students = array_map(function ($s) use ($range) {
                return [
                    'id' => $s['id'],
                    'name' => $s['name'],
                    'points' => self::pointsInRange($s['id'], $range),
                ];
            }, $studentsStmt->fetchAll());

            return ['id' => $c['id'], 'name' => $c['name'], 'students' => $students];
        }, $classrooms);
    }

    private static function pointsInRange(string $studentId, ?array $range): array
    {
        $sql = 'SELECT id, value, type, reason, created_at FROM points WHERE student_id = :student_id';
        $bindings = ['student_id' => $studentId];
        if ($range) {
            if (!empty($range['start'])) {
                $sql .= ' AND created_at >= :start';
                $bindings['start'] = $range['start'];
            }
            if (!empty($range['end'])) {
                $sql .= ' AND created_at <= :end';
                $bindings['end'] = $range['end'];
            }
        }
        $stmt = Database::pdo()->prepare($sql);
        $stmt->execute($bindings);

        return array_map(fn($p) => [
            'id' => $p['id'],
            'value' => (int) $p['value'],
            'type' => $p['type'],
            'reason' => $p['reason'],
            'createdAt' => $p['created_at'],
        ], $stmt->fetchAll());
    }

    private static function buildTrendSeries(array $trendMap, int $rangeDays): array
    {
        $series = [];
        for ($i = 0; $i < $rangeDays; $i++) {
            $d = new DateTime();
            $d->modify('-' . ($rangeDays - 1 - $i) . ' days');
            $key = $d->format('Y-m-d');
            $series[] = ['date' => $key, 'points' => $trendMap[$key] ?? 0];
        }
        return $series;
    }
}

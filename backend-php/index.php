<?php

/**
 * Front controller da API do App Pontos. Todas as requisicoes para /api/*
 * chegam aqui (ver .htaccess) e sao despachadas pelo Router.
 *
 * Equivalente a src/index.ts do backend Node original.
 */

declare(strict_types=1);

require __DIR__ . '/src/Config.php';
require __DIR__ . '/src/Response.php';
require __DIR__ . '/src/Database.php';
require __DIR__ . '/src/Id.php';
require __DIR__ . '/src/Jwt.php';
require __DIR__ . '/src/Auth.php';
require __DIR__ . '/src/Helpers.php';
require __DIR__ . '/src/Router.php';
require __DIR__ . '/src/StripeClient.php';
require __DIR__ . '/src/SubscriptionService.php';
require __DIR__ . '/src/controllers/AuthController.php';
require __DIR__ . '/src/controllers/TeacherController.php';
require __DIR__ . '/src/controllers/ClassroomController.php';
require __DIR__ . '/src/controllers/StudentController.php';
require __DIR__ . '/src/controllers/PointController.php';
require __DIR__ . '/src/controllers/StatsController.php';
require __DIR__ . '/src/controllers/RankingController.php';
require __DIR__ . '/src/controllers/AvatarController.php';
require __DIR__ . '/src/controllers/PeriodController.php';
require __DIR__ . '/src/controllers/SubscriptionController.php';
require __DIR__ . '/src/controllers/PaymentController.php';

if (Config::get('env') !== 'production') {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
}

// --- CORS ---
$corsOrigins = array_filter(array_map('trim', explode(',', (string) Config::get('cors_origins', ''))));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && (empty($corsOrigins) || in_array($origin, $corsOrigins, true))) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Webhook do Stripe precisa do corpo RAW (ja tratado direto em PaymentController::webhook
// via php://input, entao nao ha necessidade de um parse especial aqui como no Express).

set_exception_handler(function (Throwable $e) {
    error_log('Unhandled exception: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
    Response::error('Erro interno do servidor', 500);
});

// --- Determina o caminho relativo a raiz da API (remove o diretorio base do script) ---
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';

if ($scriptDir !== '/' && str_starts_with($requestPath, $scriptDir)) {
    $requestPath = substr($requestPath, strlen($scriptDir));
}

$method = $_SERVER['REQUEST_METHOD'];
$router = new Router();

// Health / diagnóstico
$router->get('/health', function () {
    Response::json(['status' => 'ok']);
});
$router->get('/db-test', function () {
    $checks = [
        'php_version' => PHP_VERSION,
        'php_version_ok' => version_compare(PHP_VERSION, '8.0.0', '>='),
        'ext_pdo_mysql' => extension_loaded('pdo_mysql'),
        'ext_curl' => extension_loaded('curl'),
        'ext_json' => extension_loaded('json'),
    ];

    try {
        Database::pdo()->query('SELECT 1');
        $checks['database'] = 'connected';
        Response::json(['status' => 'ok'] + $checks);
    } catch (Throwable $e) {
        $checks['database'] = 'disconnected';
        $checks['message'] = $e->getMessage();
        Response::json(['status' => 'error'] + $checks, 500);
    }
});

// Auth
$router->post('/login', fn() => AuthController::login());
$router->post('/auth/teacher/register', fn() => AuthController::register());

// Teachers
$router->post('/teachers', fn() => TeacherController::create());
$router->get('/teachers', fn() => TeacherController::list());
$router->get('/teachers/:teacherId/classrooms', fn($p) => ClassroomController::getByTeacher($p));

// Classrooms
$router->post('/classrooms', fn() => ClassroomController::create());
$router->get('/classrooms', fn() => ClassroomController::list());
$router->put('/classrooms/:id', fn($p) => ClassroomController::update($p));
$router->delete('/classrooms/:id', fn($p) => ClassroomController::delete($p));
$router->get('/classrooms/:id', fn($p) => ClassroomController::getById($p));
$router->get('/classrooms/:id/students', fn($p) => StudentController::listByClassroom($p));

// Students
$router->post('/students', fn() => StudentController::create());
$router->get('/students', fn() => StudentController::list());
$router->put('/students/:id', fn($p) => StudentController::update($p));
$router->put('/students/:id/password', fn($p) => StudentController::updatePassword($p));
$router->delete('/students/:id', fn($p) => StudentController::delete($p));
$router->get('/students/:code', fn($p) => StudentController::getByCode($p));

// Points
$router->post('/points', fn() => PointController::create([]));
$router->post('/students/:studentId/points', fn($p) => PointController::create($p));
$router->get('/students/:studentId/points', fn($p) => PointController::listByStudent($p));
$router->put('/points/:id', fn($p) => PointController::update($p));
$router->delete('/points/:id', fn($p) => PointController::delete($p));

// Stats / relatórios
$router->get('/stats/:teacherId', fn($p) => StatsController::teacherStats($p));
$router->get('/dashboard/overview', fn() => StatsController::dashboardOverview());
$router->get('/reports/classroom/:classroomId', fn($p) => StatsController::classroomReport($p));
$router->get('/reports/student/:studentId', fn($p) => StatsController::studentReport($p));
$router->get('/reports/points', fn() => StatsController::pointsReport());

// Ranking
$router->post('/ranking/login', fn() => RankingController::studentLogin());
$router->post('/ranking/refreshlogin', fn() => RankingController::refreshStudentLogin());
$router->get('/ranking/validate', fn() => RankingController::validateStudentToken());
$router->put('/ranking/update-password', fn() => StudentController::updateOwnPassword());
$router->post('/ranking/getStudentFromClassroom', fn() => RankingController::getStudentFromClassroom());
$router->post('/ranking/teacher/login', fn() => RankingController::teacherLogin());
$router->get('/ranking/classroom/:classroomId', fn($p) => RankingController::classroomRanking($p));

// Avatar
$router->get('/avatar-items', fn() => AvatarController::listItems());
$router->post('/students/avatar/unlock', fn() => AvatarController::unlock());
$router->get('/students/avatar/unlocked', fn() => AvatarController::listUnlocked());
$router->get('/students/avatar/config', fn() => AvatarController::getConfig());
$router->post('/students/avatar/config', fn() => AvatarController::saveConfig());
$router->post('/students/:studentId/avatar/add-points', fn($p) => AvatarController::addPoints($p));

// Subscription
$router->get('/subscription/plans', fn() => SubscriptionController::plans());
$router->get('/subscription/current-plan/:teacherId', fn($p) => SubscriptionController::currentPlan($p));
$router->get('/subscription/can-create-classroom/:teacherId', fn($p) => SubscriptionController::canCreateClassroom($p));
$router->get('/subscription/can-add-student/:teacherId', fn($p) => SubscriptionController::canAddStudent($p));
$router->get('/subscription/has-feature/:teacherId/:feature', fn($p) => SubscriptionController::hasFeature($p));
$router->post('/subscription/create', fn() => SubscriptionController::create());
$router->post('/subscription/cancel/:teacherId', fn($p) => SubscriptionController::cancel($p));

// Payment (Stripe)
$router->post('/payment/create-checkout-session', fn() => PaymentController::createCheckoutSession());
$router->post('/payment/webhook', fn() => PaymentController::webhook());
$router->post('/payment/create-customer-portal', fn() => PaymentController::createCustomerPortal());

// Periods
$router->post('/periods', fn() => PeriodController::create());
$router->get('/periods', fn() => PeriodController::list());
$router->put('/periods/:id', fn($p) => PeriodController::update($p));

$router->dispatch($method, $requestPath);

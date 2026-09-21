<?php
/**
 * Copie este arquivo para "config.php" (mesma pasta) e preencha com os dados
 * reais do ambiente. "config.php" NUNCA deve ser commitado (veja .gitignore).
 */

return [
    // --- Banco de dados MySQL (fornecido pela Locaweb) ---
    'db' => [
        'host'     => getenv('DB_HOST') ?: '127.0.0.1',
        'port'     => getenv('DB_PORT') ?: '3306',
        'database' => getenv('DB_NAME') ?: 'apppontos',
        'user'     => getenv('DB_USER') ?: 'root',
        'password' => getenv('DB_PASSWORD') ?: '',
        'charset'  => 'utf8mb4',
    ],

    // --- Autenticação (JWT) ---
    // Gere um valor aleatório longo, por exemplo com: php -r "echo bin2hex(random_bytes(32));"
    'jwt_secret' => getenv('JWT_SECRET') ?: 'change-me-in-production',

    // --- CORS ---
    // Domínios que podem chamar a API a partir do navegador, separados por vírgula.
    // Em produção (frontend e API no mesmo domínio) normalmente não é nem necessário,
    // mas fica disponível para desenvolvimento local (frontend em outra porta) ou
    // para acessar a API de outro domínio.
    'cors_origins' => getenv('CORS_ORIGINS') ?: 'http://localhost:3001',

    // --- URL pública do frontend (usada para montar links de retorno do Stripe) ---
    'frontend_url' => getenv('FRONTEND_URL') ?: 'https://apppontos.com.br',

    // --- Stripe ---
    'stripe' => [
        'secret_key'      => getenv('STRIPE_SECRET_KEY') ?: '',
        'publishable_key' => getenv('STRIPE_PUBLISHABLE_KEY') ?: '',
        'webhook_secret'  => getenv('STRIPE_WEBHOOK_SECRET') ?: '',
    ],

    // --- Ambiente ---
    // 'production' desativa a exibição de erros PHP na tela.
    'env' => getenv('APP_ENV') ?: 'production',
];

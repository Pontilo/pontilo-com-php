<?php

/** Equivalente a src/controllers/authController.ts */
final class AuthController
{
    public static function login(): void
    {
        $body = Helpers::body();
        $email = $body['email'] ?? null;
        $password = $body['password'] ?? null;

        $stmt = Database::pdo()->prepare('SELECT * FROM teachers WHERE email = :email');
        $stmt->execute(['email' => $email]);
        $teacher = $stmt->fetch();

        if (!$teacher || !password_verify((string) $password, $teacher['password'])) {
            Response::error('Invalid email or password', 401);
        }

        $token = Jwt::sign([
            'id' => $teacher['id'],
            'teacherId' => $teacher['id'],
            'email' => $teacher['email'],
            'type' => 'teacher',
        ], Config::get('jwt_secret'), '7d');

        Response::json([
            'token' => $token,
            'teacher' => ['id' => $teacher['id'], 'name' => $teacher['name'], 'email' => $teacher['email']],
        ]);
    }

    public static function register(): void
    {
        $body = Helpers::body();
        $name = $body['name'] ?? null;
        $email = $body['email'] ?? null;
        $password = $body['password'] ?? null;

        if (!$name || !$email || !$password) {
            Response::error('name, email e password são obrigatórios', 400);
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id FROM teachers WHERE email = :email');
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch()) {
            Response::error('Email já cadastrado', 400);
        }

        $id = Id::generate();
        $hashed = password_hash((string) $password, PASSWORD_BCRYPT);

        $stmt = $pdo->prepare('INSERT INTO teachers (id, name, email, password) VALUES (:id, :name, :email, :password)');
        $stmt->execute(['id' => $id, 'name' => $name, 'email' => $email, 'password' => $hashed]);

        $token = Jwt::sign([
            'id' => $id,
            'email' => $email,
            'type' => 'teacher',
        ], Config::get('jwt_secret'), '7d');

        Response::json([
            'token' => $token,
            'teacher' => ['id' => $id, 'name' => $name, 'email' => $email],
        ], 201);
    }
}

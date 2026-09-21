<?php

/** Equivalente a src/controllers/teacherController.ts */
final class TeacherController
{
    public static function create(): void
    {
        $body = Helpers::body();
        $name = $body['name'] ?? null;
        $email = $body['email'] ?? null;
        $password = $body['password'] ?? null;

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id FROM teachers WHERE email = :email');
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch()) {
            Response::error('Email already registered.', 400);
        }

        $id = Id::generate();
        $hashed = password_hash((string) $password, PASSWORD_BCRYPT);

        $stmt = $pdo->prepare('INSERT INTO teachers (id, name, email, password) VALUES (:id, :name, :email, :password)');
        $stmt->execute(['id' => $id, 'name' => $name, 'email' => $email, 'password' => $hashed]);

        $stmt = $pdo->prepare('SELECT id, name, email, plan_type, subscription_status, created_at FROM teachers WHERE id = :id');
        $stmt->execute(['id' => $id]);

        Response::json($stmt->fetch(), 201);
    }

    public static function list(): void
    {
        Auth::requireToken();
        $stmt = Database::pdo()->query('SELECT id, name, email, plan_type, subscription_status, created_at FROM teachers');
        Response::json($stmt->fetchAll());
    }
}

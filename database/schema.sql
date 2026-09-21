-- App Pontos — schema MySQL (Locaweb / hospedagem compartilhada)
-- Convertido do schema Prisma (PostgreSQL) original do Pontilo-Backend.
--
-- Decisoes de conversao / diferencas em relacao ao Postgres original:
--   - IDs: cuid() do Prisma -> VARCHAR(30), gerados pela aplicacao (mesmo formato de string,
--     nao ha "tipo cuid" nativo em MySQL). Dados migrados devem manter os IDs originais.
--   - DateTime -> DATETIME(3) (precisao de milissegundos, equivalente ao timestamp do Postgres).
--   - Json (Prisma) -> JSON nativo do MySQL (5.7+/8.0/MariaDB 10.2+).
--   - Float (Plan.price / Payment.amount) -> DECIMAL(10,2), mais adequado para valores
--     monetarios; nao altera nenhuma regra de negocio, so evita erros de arredondamento.
--   - Enums do Prisma -> ENUM nativo do MySQL com os mesmos valores.
--   - charset utf8mb4 / collation utf8mb4_unicode_ci em todas as tabelas (acentos, emojis).
--
-- Inconsistencia encontrada no codigo original e resolvida aqui (ver README.md):
--   O controller deleteStudent (Node) apaga os Points do aluno manualmente, mas NUNCA
--   limpa StudentAvatarItem/StudentAvatarConfig antes de deletar o Student. Como todo
--   aluno criado via createStudent sempre ganha avatarConfig + varios avatarItems, uma
--   FK "ON DELETE RESTRICT" nessas duas tabelas quebraria TODA exclusao de aluno em
--   producao. Resolvido usando "ON DELETE CASCADE" nessas duas relacoes (comportamento
--   coerente com a intencao do sistema: excluir aluno remove todos os dados dele).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Teacher
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
  id                  VARCHAR(30)  NOT NULL,
  name                VARCHAR(255) NOT NULL,
  email               VARCHAR(255) NOT NULL,
  password            VARCHAR(255) NOT NULL,
  plan_type           ENUM('GRATUITO','PRO','ESCOLA') NOT NULL DEFAULT 'GRATUITO',
  subscription_status ENUM('INACTIVE','ACTIVE','PAST_DUE','CANCELED','UNPAID') NOT NULL DEFAULT 'INACTIVE',
  created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_teachers_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Classroom
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classrooms (
  id         VARCHAR(30)  NOT NULL,
  name       VARCHAR(255) NOT NULL,
  teacher_id VARCHAR(30)  NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_classrooms_teacher (teacher_id),
  CONSTRAINT fk_classrooms_teacher FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Student
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  id            VARCHAR(30)  NOT NULL,
  name          VARCHAR(255) NOT NULL,
  code          VARCHAR(100) NOT NULL,
  password      VARCHAR(255) NOT NULL DEFAULT '123',
  classroom_id  VARCHAR(30)  NOT NULL,
  avatar_points INT NOT NULL DEFAULT 0,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_students_code (code),
  KEY idx_students_classroom (classroom_id),
  CONSTRAINT fk_students_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Point
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS points (
  id         VARCHAR(30)  NOT NULL,
  value      INT NOT NULL,
  type       VARCHAR(50) NOT NULL DEFAULT 'heart',
  reason     TEXT NULL,
  student_id VARCHAR(30) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_points_student (student_id),
  KEY idx_points_created_at (created_at),
  CONSTRAINT fk_points_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Period
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS periods (
  id          VARCHAR(30)  NOT NULL,
  name        VARCHAR(255) NOT NULL,
  type        VARCHAR(50)  NOT NULL,
  number      INT NOT NULL,
  description TEXT NULL,
  teacher_id  VARCHAR(30) NOT NULL,
  start_date  DATETIME(3) NOT NULL,
  end_date    DATETIME(3) NOT NULL,
  active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_periods_teacher (teacher_id),
  CONSTRAINT fk_periods_teacher FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- AvatarItem (catalogo)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS avatar_items (
  id           VARCHAR(60)  NOT NULL,
  type         VARCHAR(50)  NOT NULL,
  value        VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NULL,
  cost_points  INT NOT NULL,
  is_default   TINYINT(1) NOT NULL DEFAULT 0,
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- StudentAvatarItem (N:N Student <-> AvatarItem)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_avatar_items (
  student_id     VARCHAR(30) NOT NULL,
  avatar_item_id VARCHAR(60) NOT NULL,
  unlocked_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (student_id, avatar_item_id),
  KEY idx_sai_item (avatar_item_id),
  CONSTRAINT fk_sai_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  CONSTRAINT fk_sai_item FOREIGN KEY (avatar_item_id) REFERENCES avatar_items (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- StudentAvatarConfig (1:1 Student)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_avatar_configs (
  student_id VARCHAR(30) NOT NULL,
  config     JSON NOT NULL,
  PRIMARY KEY (student_id),
  CONSTRAINT fk_sac_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Plan
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
  id             VARCHAR(30)  NOT NULL,
  name           VARCHAR(100) NOT NULL,
  type           ENUM('GRATUITO','PRO','ESCOLA') NOT NULL,
  price          DECIMAL(10,2) NOT NULL,
  currency       VARCHAR(10) NOT NULL DEFAULT 'BRL',
  billing_interval VARCHAR(20) NOT NULL DEFAULT 'month',
  max_students   INT NULL,
  max_classrooms INT NULL,
  features       JSON NOT NULL,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_plans_name (name),
  UNIQUE KEY uq_plans_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Subscription (1:1 Teacher)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      VARCHAR(30) NOT NULL,
  teacher_id              VARCHAR(30) NOT NULL,
  plan_id                 VARCHAR(30) NOT NULL,
  stripe_customer_id      VARCHAR(255) NULL,
  stripe_subscription_id  VARCHAR(255) NULL,
  status                  ENUM('INACTIVE','ACTIVE','PAST_DUE','CANCELED','UNPAID') NOT NULL DEFAULT 'INACTIVE',
  current_period_start    DATETIME(3) NULL,
  current_period_end      DATETIME(3) NULL,
  cancel_at_period_end    TINYINT(1) NOT NULL DEFAULT 0,
  created_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_subscriptions_teacher (teacher_id),
  KEY idx_subscriptions_plan (plan_id),
  CONSTRAINT fk_subscriptions_teacher FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE,
  CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Payment
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id                VARCHAR(30) NOT NULL,
  subscription_id   VARCHAR(30) NOT NULL,
  stripe_payment_id VARCHAR(255) NULL,
  amount            DECIMAL(10,2) NOT NULL,
  currency          VARCHAR(10) NOT NULL DEFAULT 'BRL',
  status            ENUM('PENDING','COMPLETED','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  paid_at           DATETIME(3) NULL,
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_payments_subscription (subscription_id),
  CONSTRAINT fk_payments_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

# App Pontos

Sistema de gamificação educacional (pontos, avatares, rankings e turmas)
para professores e alunos. Domínio de produção:
[https://apppontos.com.br](https://apppontos.com.br).

> Este projeto foi migrado de uma stack Node.js/Express/Prisma/PostgreSQL
> (rodando em Docker) para **PHP + MySQL**, para rodar em hospedagem
> compartilhada (Locaweb), sem depender de Docker ou Node.js em produção.
> Veja [`MIGRATION_NOTES.md`](./MIGRATION_NOTES.md) para o detalhe de cada
> decisão e inconsistência encontrada durante a migração.

## Arquitetura

```
React/Next.js (export estático)
        ↓  fetch("/api/...")
API PHP (backend-php/)
        ↓  PDO
MySQL
```

- **Frontend**: `pontilo-dashboard/` — Next.js 15 (App Router) + TypeScript
  + Tailwind, compilado como site 100% estático (`output: 'export'`). Não
  há servidor Node em produção — o build gera HTML/CSS/JS puros.
- **Backend**: `backend-php/` — PHP puro (sem framework, sem Composer),
  PDO + MySQL com prepared statements, JWT próprio (HS256), roteador
  simples. Reproduz a mesma API REST do backend Node original
  (`/api/login`, `/api/students`, `/api/ranking/...`, etc.) para que o
  frontend precisasse de alterações mínimas.
- **Banco**: MySQL da própria hospedagem (`database/schema.sql` +
  `database/seed.sql`).

## Estrutura do projeto

```
pontilo-com-php/               (repositório)
├── pontilo-dashboard/        # Frontend Next.js (App Router)
├── backend-php/              # API PHP (backend de produção)
├── database/
│   ├── schema.sql            # Estrutura das tabelas (MySQL)
│   └── seed.sql              # Planos + catálogo de itens de avatar
├── MIGRATION_NOTES.md         # Decisões da migração Node/Prisma → PHP/MySQL
├── DEPLOY_AUDIT.md            # Auditoria de compatibilidade com hospedagem compartilhada
├── DEPLOY.md                  # Passo a passo de publicação (SSH + Git)
└── README.md
```

## Desenvolvimento local

### Pré-requisitos
- Node.js 18+ e npm (só para o frontend)
- PHP 8.1+ com extensões `pdo_mysql`, `curl`, `json` (padrão em qualquer
  instalação PHP)
- MySQL (local, XAMPP/Laragon, ou um contêiner avulso — não é necessário
  Docker Compose)

### 1. Banco de dados

Crie um banco MySQL e rode os scripts:

```bash
mysql -u root -p -e "CREATE DATABASE apppontos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root -p apppontos < database/schema.sql
mysql -u root -p apppontos < database/seed.sql
```

### 2. Backend PHP

```bash
cd backend-php
cp config.example.php config.php
# edite config.php com os dados do MySQL local e um JWT_SECRET qualquer
php -S localhost:8000 index.php
```

Teste rapidamente:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/db-test
```

### 3. Frontend

```bash
cd pontilo-dashboard
npm install
echo "NEXT_PUBLIC_PONTILO_BACKEND_URL=http://localhost:8000/api" > .env.local
npm run dev
# http://localhost:3001
```

## Build de produção (frontend)

```bash
cd pontilo-dashboard
npm run build
```

Isso gera a pasta `out/` com todo o site estático (HTML/CSS/JS), pronta
para ser copiada para `public_html/` na hospedagem.

## Publicando na Locaweb

Estrutura final esperada em `public_html/`:

```
public_html/
├── index.html, _next/, ...   # conteúdo de out/ (frontend)
├── .htaccess                  # já incluso em out/ (vem de public/.htaccess)
└── api/                       # conteúdo de backend-php/
    ├── index.php
    ├── .htaccess
    ├── config.php              # criado manualmente no servidor (não versionado)
    └── src/
```

Passo a passo:

1. **Frontend**: rode `npm run build` e envie todo o conteúdo de
   `pontilo-dashboard/out/` (via FTP/SSH) para a raiz de `public_html/`.
2. **Backend**: envie todo o conteúdo de `backend-php/` para
   `public_html/api/`.
3. No servidor, copie `api/config.example.php` para `api/config.php` e
   preencha com os dados reais:
   - Host/usuário/senha/nome do banco MySQL fornecidos pela Locaweb
   - Um `jwt_secret` aleatório e longo (gere localmente com
     `php -r "echo bin2hex(random_bytes(32));"` e cole o resultado)
   - `frontend_url` = `https://apppontos.com.br`
   - Chaves do Stripe (se o plano premium estiver em uso)
4. No painel da Locaweb, crie o banco MySQL e rode `database/schema.sql`
   seguido de `database/seed.sql` (via phpMyAdmin, por exemplo).
5. Acesse `https://apppontos.com.br/api/health` e
   `https://apppontos.com.br/api/db-test` para confirmar que a API está no
   ar e conectada ao banco.
6. Acesse `https://apppontos.com.br` e teste o login de professor/aluno.

### Configuração do `.htaccess`

- `public_html/.htaccess` (vem de `pontilo-dashboard/public/.htaccess`):
  cuida de cache dos assets estáticos e garante que `/api/` nunca seja
  reescrito pelo Apache.
- `public_html/api/.htaccess` (vem de `backend-php/.htaccess`): encaminha
  toda requisição para `api/index.php`, que faz o roteamento interno da
  API, e bloqueia o acesso direto a `config.php`.

### Configuração das credenciais do banco

Nunca são colocadas no código-fonte. Ficam em `backend-php/config.php`
(arquivo local ao servidor, fora do controle de versão — veja
`backend-php/.gitignore`), copiado a partir de `config.example.php`. O
mesmo arquivo também centraliza `JWT_SECRET`, `CORS_ORIGINS`,
`FRONTEND_URL` e as chaves do Stripe.

### Webhook do Stripe

Configure no painel do Stripe a URL
`https://apppontos.com.br/api/payment/webhook` e cole o "signing secret"
gerado em `stripe_webhook_secret` no `config.php`.

## Testando depois da publicação

| O que testar        | Como                                                    |
|----------------------|----------------------------------------------------------|
| PHP → MySQL           | `GET /api/health` e `GET /api/db-test`                   |
| React → API → MySQL   | Fazer login (professor ou aluno) pela interface publicada |
| Rotas da API           | Ver a lista completa em `backend-php/index.php`          |

## Banco de dados

Ver `database/schema.sql` para a estrutura completa (11 tabelas) e
`MIGRATION_NOTES.md` para as diferenças em relação ao schema Prisma/Postgres
original (tipos, FKs, decisões sobre inconsistências encontradas no código
original).

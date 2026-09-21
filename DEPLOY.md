# Deploy — Locaweb via SSH + Git

Repo: `https://github.com/alexandretimachado/pontilo-dashboard.git`
Estratégia: branch `deploy` contém exatamente o conteúdo de `public_html/`
(gerado a partir de `deploy/` local). `public_html` no servidor é um clone
dessa branch.

## Local — gerar e publicar o build (sempre antes de cada deploy)

```bash
cd pontilo-dashboard
npm run build
cd ..

rm -rf deploy && mkdir -p deploy/api
cp -r pontilo-dashboard/out/. deploy/
cp -r backend-php/. deploy/api/ && rm -f deploy/api/.gitignore

cd deploy
git init -q
git add -A
git commit -q -m "deploy $(date +%Y-%m-%d_%H-%M)"
git remote add origin https://github.com/alexandretimachado/pontilo-dashboard.git 2>/dev/null || true
git push -f origin HEAD:deploy
cd ..
```

## Servidor — primeira vez

```bash
ssh usuario@apppontos.com.br
cd public_html
rm -rf * .[!.]*          # limpa o conteúdo padrão da hospedagem

git init
git remote add origin https://github.com/alexandretimachado/pontilo-dashboard.git
git fetch origin deploy
git checkout -f deploy

cp api/config.example.php api/config.php
nano api/config.php      # preencher DB_HOST/DB_NAME/DB_USER/DB_PASSWORD, jwt_secret, stripe
```

Banco de dados (uma única vez):

```bash
mysql -u SEU_USUARIO -p SEU_BANCO < database/schema.sql
mysql -u SEU_USUARIO -p SEU_BANCO < database/seed.sql
```

(se `mysql` client não estiver disponível via SSH, rode os dois arquivos
pelo phpMyAdmin do painel Locaweb)

Testar:

```bash
curl -s https://apppontos.com.br/api/health
curl -s https://apppontos.com.br/api/db-test
```

## Servidor — próximas atualizações

```bash
ssh usuario@apppontos.com.br
cd public_html
git fetch origin deploy
git reset --hard origin/deploy
```

`api/config.php` não é versionado (fica de fora do `git reset --hard`,
permanece intacto). Se o schema mudar, rode o `.sql` novo manualmente.

## Stripe

Painel Stripe → Webhooks → adicionar endpoint:
`https://apppontos.com.br/api/payment/webhook`
Copiar o "signing secret" gerado para `stripe.webhook_secret` em
`api/config.php`.

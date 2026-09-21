Você está trabalhando na migração completa de um sistema existente.

IMPORTANTE: antes de alterar qualquer código, analise todo o projeto atual, incluindo frontend, backend, banco/schema, rotas, regras de negócio, autenticação, componentes, serviços e configurações. O objetivo é preservar o comportamento atual do sistema, alterando apenas o que for necessário para adequá-lo ao novo ambiente.

# NOVO NOME DO SISTEMA

O sistema passa a se chamar:

App Pontos

O domínio de produção será:

https://apppontos.com.br

Não utilize mais nomes antigos do projeto na interface, títulos, textos ou novos arquivos quando isso puder ser atualizado sem quebrar funcionalidades.

# CENÁRIO ATUAL

O projeto atual é composto por:

- Frontend React
- Vite
- TypeScript
- Backend Node.js
- API
- Prisma
- Banco de dados atualmente utilizado pelo Prisma
- Docker / Docker Compose

O projeto foi desenvolvido considerando um ambiente onde Node.js e Docker podem executar no servidor.

# NOVO AMBIENTE DE PRODUÇÃO

O sistema será hospedado em uma hospedagem compartilhada da Locaweb.

O ambiente de produção NÃO terá:

- Docker
- Docker Compose
- Node.js executando como backend
- Prisma executando no servidor

O ambiente possui:

- PHP
- Apache/web server
- MySQL Server
- FTP
- SSH
- hospedagem de arquivos
- domínio https://apppontos.com.br

O PHP já foi testado diretamente na hospedagem e está funcionando.

Um arquivo PHP simples colocado em:

public_html/teste.php

foi acessado com sucesso através de:

https://apppontos.com.br/teste.php

Portanto, o backend de produção deverá ser migrado para PHP.

# OBJETIVO

Migrar o projeto atual para:

Frontend:
React + Vite + TypeScript

Backend:
PHP

Banco:
MySQL Server da própria hospedagem Locaweb

Arquitetura final:

React/Vite
    ↓
API PHP
    ↓
MySQL

O frontend deve continuar sendo essencialmente o mesmo sistema atual.

A maior mudança deve acontecer no backend e na camada de persistência.

# FRONTEND

Preserve o frontend atual sempre que possível.

Não faça uma reescrita desnecessária do React.

Mantenha:

- React
- TypeScript
- Vite
- componentes existentes
- layout
- estilos
- Tailwind, caso já esteja sendo utilizado
- navegação
- telas
- formulários
- validações
- experiência do usuário
- regras de apresentação
- chamadas da API, adaptando somente as URLs/formato quando necessário

O frontend continuará sendo desenvolvido localmente com Node/npm normalmente.

IMPORTANTE:

Node.js continuará podendo ser utilizado no ambiente de desenvolvimento.

O fato de o servidor de produção não possuir Node.js NÃO significa que o frontend precise ser convertido para outra tecnologia.

O frontend deverá continuar sendo compilado normalmente:

npm run build

e o conteúdo de:

dist/

será publicado na hospedagem.

# BACKEND

O backend Node.js atual deverá ser migrado para PHP.

Analise primeiro toda a implementação atual e identifique:

- rotas
- controllers
- services
- middlewares
- autenticação
- autorização
- validações
- regras de negócio
- consultas ao banco
- transações
- tratamento de erros
- uploads
- geração de arquivos
- integrações
- variáveis de ambiente
- qualquer outra funcionalidade existente

Depois implemente os equivalentes em PHP.

Não tente simplesmente traduzir linha por linha o código JavaScript.

A implementação PHP deve ser idiomática e adequada para hospedagem compartilhada.

# BANCO DE DADOS

O banco de produção será:

MySQL Server

fornecido pela própria hospedagem.

O Prisma não será utilizado em produção.

Substitua a camada Prisma por uma solução apropriada para PHP + MySQL.

Preferencialmente utilize:

PDO + MySQL

com:

- prepared statements
- parâmetros
- tratamento adequado de exceções
- transações quando necessárias
- prevenção contra SQL Injection

Não coloque credenciais reais do banco diretamente no código.

Crie uma configuração adequada para as credenciais, por exemplo através de arquivo de configuração separado ou variáveis de ambiente, conforme o que for mais compatível com a hospedagem.

# MIGRAÇÃO DO BANCO

Analise o schema atual do Prisma e todas as relações existentes.

Crie a estrutura equivalente em MySQL.

Preserve:

- tabelas
- campos
- tipos compatíveis
- chaves primárias
- chaves estrangeiras
- índices
- relacionamentos
- constraints
- valores padrão
- regras de integridade

Faça as adaptações necessárias devido às diferenças entre o banco atual e MySQL.

Gere também scripts SQL para criação/migração do banco, de forma que eu possa executar o banco MySQL da Locaweb.

Não destrua dados existentes sem necessidade.

Se houver diferenças ou incompatibilidades entre o modelo atual e MySQL, documente-as e escolha uma solução coerente com as regras de negócio existentes.

# API

Mantenha a API REST atual sempre que possível.

Se atualmente existir algo como:

GET /api/usuarios
POST /api/usuarios
PUT /api/usuarios/:id
DELETE /api/usuarios/:id

procure manter os mesmos conceitos e URLs.

Caso a implementação atual dependa de recursos específicos do Express, adapte para PHP.

O frontend deve precisar de poucas alterações.

Se necessário, utilize .htaccess para permitir URLs amigáveis e encaminhamento das requisições para o PHP.

Evite criar uma arquitetura excessivamente complexa.

O objetivo é que o sistema seja simples de publicar e manter em uma hospedagem compartilhada.

# AUTENTICAÇÃO E SESSÃO

Analise cuidadosamente como a autenticação funciona atualmente.

Preserve:

- login
- logout
- usuários
- permissões
- proteção de rotas
- expiração de sessão/token
- recuperação de autenticação
- demais regras existentes

Se a arquitetura atual utilizar JWT e isso continuar sendo necessário, implemente o equivalente em PHP.

Porém, se o sistema puder funcionar adequadamente com sessão PHP, considere essa alternativa, principalmente porque frontend e backend estarão no mesmo domínio.

Não altere a regra de autenticação simplesmente por preferência técnica. Preserve o comportamento atual sempre que possível.

# DOCKER

Docker não deverá fazer parte da arquitetura de produção.

Pode manter arquivos Docker apenas se forem úteis para desenvolvimento local, mas isso não é obrigatório.

Se os arquivos Docker atuais ficarem obsoletos após a migração, você pode removê-los ou substituí-los por uma configuração de desenvolvimento mais simples.

O objetivo é que a produção não dependa de Docker.

# NODE.JS

Não remova Node.js do frontend.

Node.js continuará sendo utilizado para:

- desenvolvimento do React
- npm
- Vite
- build do frontend

Porém:

NÃO deve existir dependência de Node.js para executar o backend em produção.

# ESTRUTURA DO PROJETO

Você pode escolher a melhor estrutura.

Pode:

1. alterar a estrutura atual;

ou

2. criar novas pastas;

ou

3. separar frontend e backend em diretórios independentes.

Não existe obrigação de preservar a estrutura atual se ela não fizer sentido para a nova arquitetura.

Uma estrutura possível seria:

App Pontos/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
│
├── backend/
│   ├── api/
│   ├── config/
│   ├── services/
│   ├── middleware/
│   ├── database/
│   └── ...
│
├── database/
│   └── mysql.sql
│
└── README.md

Mas você pode escolher uma estrutura melhor depois de analisar o projeto.

# PRODUÇÃO

A publicação deverá ser compatível com a seguinte estrutura conceitual:

public_html/
├── index.html
├── assets/
├── api/
│   └── ...
└── .htaccess

O React será compilado para arquivos estáticos.

O PHP será executado pelo servidor web.

O MySQL será o banco de dados.

Não deve ser necessário executar comandos como:

npm start
node server.js
docker compose up
docker-compose up

na hospedagem de produção.

# CONFIGURAÇÃO

Crie uma configuração de produção adequada.

Não deixe:

- senha do banco
- usuário do banco
- host do banco
- secrets
- tokens
- chaves privadas

hardcoded no código-fonte.

Crie um arquivo/configuração apropriado para eu preencher com os dados fornecidos pela Locaweb.

# COMPATIBILIDADE

Tenha em mente que estamos em uma hospedagem compartilhada.

Evite depender de:

- processos persistentes
- workers permanentes
- Docker
- Redis
- filas que necessitem de daemon
- serviços externos desnecessários
- extensões PHP incomuns
- acesso root
- configurações que eu não possa alterar na hospedagem

Prefira recursos comuns de PHP + Apache + MySQL.

# QUALIDADE DA MIGRAÇÃO

Não faça uma migração superficial.

Antes de começar:

1. Analise o projeto inteiro.
2. Entenda as funcionalidades existentes.
3. Mapeie frontend → API → banco.
4. Identifique todas as dependências do Node.
5. Identifique todas as dependências do Prisma.
6. Identifique todas as tabelas e relacionamentos.
7. Identifique autenticação e autorização.
8. Identifique possíveis problemas ou inconsistências.

Depois:

9. Planeje a migração.
10. Implemente o backend PHP.
11. Migre o banco para MySQL.
12. Adapte o frontend somente onde necessário.
13. Remova dependências desnecessárias do backend.
14. Crie scripts/configurações para publicação.
15. Teste todas as funcionalidades possíveis.

# IMPORTANTE SOBRE REGRAS DE NEGÓCIO

Não altere regras de negócio simplesmente porque a implementação antiga parece diferente do que você faria hoje.

A prioridade é:

1. preservar o comportamento atual;
2. preservar os dados;
3. preservar as regras de negócio;
4. preservar a experiência do usuário;
5. adaptar a implementação à nova tecnologia.

Se encontrar uma inconsistência clara no código atual, não simplesmente ignore.

Documente a inconsistência e escolha uma solução coerente com o comportamento esperado do sistema.

# TESTES

Crie ou adapte testes sempre que isso for viável.

Além disso, crie uma forma simples de testar:

PHP → MySQL

e:

React → API PHP → MySQL

O sistema deve permitir verificar facilmente se a conexão com o banco está funcionando após a publicação.

# DOCUMENTAÇÃO

Atualize o README.md explicando:

- arquitetura atual
- como executar frontend localmente
- como executar/testar o backend localmente
- configuração do MySQL
- estrutura do banco
- como gerar o build do React
- como publicar na Locaweb
- configuração necessária no servidor
- configuração do .htaccess
- configuração das credenciais do banco
- como testar a API depois da publicação

# REGRA PRINCIPAL

NÃO comece simplesmente alterando arquivos.

Primeiro analise o projeto inteiro e apresente:

1. diagnóstico da arquitetura atual;
2. lista das funcionalidades encontradas;
3. dependências que precisam ser substituídas;
4. estrutura de banco atual;
5. plano de migração Node/Prisma → PHP/MySQL;
6. proposta de nova estrutura de pastas;
7. possíveis riscos ou incompatibilidades.

Depois disso, execute a migração.

Você tem liberdade para modificar completamente a estrutura interna do projeto se isso resultar em uma solução mais simples, robusta e adequada à hospedagem compartilhada.

O resultado final deve ser um sistema chamado App Pontos, com:

React + Vite + TypeScript
        ↓
PHP
        ↓
MySQL

sem necessidade de Node.js ou Docker no servidor de produção.
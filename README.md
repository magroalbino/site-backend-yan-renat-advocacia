# Backend - Site de Advocacia Yan & Renat

Backend do site de advocacia Yan Renat Advocacia e Consultoria, desenvolvido para gerenciar artigos jurídicos, curtidas e comentários com sistema de autorização. Construído com **Node.js**, **Express** e **MongoDB**, configurado para deploy na **Vercel**.

## Funcionalidades

- **Artigos jurídicos**: listagem, busca por slug, curtidas e descurtidas (operações atômicas)
- **Comentários**: criação com token de autor, listagem por artigo e exclusão autorizada
- **Autorização de exclusão**: apenas o autor do comentário (via token) ou o admin (via API key) podem deletar
- **Validação e sanitização**: todos os inputs são validados e sanitizados contra XSS
- **Rate limiting**: proteção contra abuso com limites por janela de tempo
- **Conexão resiliente**: middleware de reconexão automática para ambientes serverless

## Tecnologias

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/) (MongoDB ODM)
- [express-validator](https://express-validator.github.io/docs/) (validação e sanitização)
- [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) (rate limiting)
- [uuid](https://github.com/uuidjs/uuid) (geração de tokens de autor)
- [cors](https://github.com/expressjs/cors)
- [dotenv](https://github.com/motdotla/dotenv)

## Estrutura do Projeto

```
.
├── src/
│   ├── config/
│   │   └── database.js       # Wrapper de conexão com MongoDB
│   └── models/
│       ├── Artigo.js          # Schema: titulo, slug, descricao, conteudo, autor, data, curtidas
│       └── Comentario.js      # Schema: slug, nome, texto, data, autorToken, ip
├── app.js                     # App Express com rotas, validação, rate limit e CORS
├── server.js                  # Entry point com graceful shutdown
├── seed.js                    # Script para popular o banco com artigos de exemplo
├── resetDB.js                 # Script para resetar curtidas e comentários
├── vercel.json                # Configuração de deploy na Vercel
└── package.json
```

## Configuração Local

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/magroalbino/site-backend-yan-renat-advocacia.git
   cd site-backend-yan-renat-advocacia
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**

   Crie um arquivo `.env` na raiz do projeto:
   ```env
   MONGODB_URI=sua_uri_do_mongodb
   ADMIN_API_KEY=uma_chave_secreta_forte
   PORT=3000
   ```

   Para gerar uma chave de admin segura:
   ```bash
   openssl rand -hex 32
   ```

4. **Inicie o servidor:**
   ```bash
   npm start
   ```
   O servidor estará rodando em `http://localhost:3000`.

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `MONGODB_URI` | Sim | URI de conexão com o MongoDB |
| `ADMIN_API_KEY` | Sim | Chave secreta para autenticação de admin |
| `PORT` | Não | Porta do servidor (padrão: 3000) |

## Rotas da API

### Artigos

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/artigos` | Lista todos os artigos ordenados por data |
| `GET` | `/api/artigos/:slug` | Retorna um artigo pelo slug |
| `POST` | `/api/artigos/:id/curtir` | Incrementa curtidas do artigo |
| `POST` | `/api/artigos/:id/descurtir` | Decrementa curtidas (mínimo 0) |

### Comentários

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/comentarios/:slug` | Lista comentários de um artigo |
| `POST` | `/api/comentarios/:slug` | Cria um comentário (retorna `autorToken`) |
| `DELETE` | `/api/comentarios/:id` | Exclui um comentário (requer autorização) |

### Sistema

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/health` | Health check com status do banco |
| `GET` | `/` | Página de documentação visual da API |

## Autorização de Comentários

### Criando um comentário

O endpoint `POST /api/comentarios/:slug` retorna um `autorToken` junto com o comentário criado. O frontend deve guardar esse token (ex: `localStorage`) para permitir a exclusão futura.

```json
// Resposta do POST /api/comentarios/:slug
{
  "comment": { "_id": "...", "nome": "João", "texto": "Ótimo artigo!", "data": "..." },
  "autorToken": "uuid-gerado-pelo-backend"
}
```

### Excluindo um comentário

Envie uma das seguintes headers na requisição `DELETE /api/comentarios/:id`:

- **Como autor**: `x-autor-token: <token recebido na criação>`
- **Como admin**: `x-admin-key: <ADMIN_API_KEY>`

Sem um desses headers válidos, a exclusão retorna erro `401` ou `403`.

## Rate Limiting

| Tipo | Limite | Janela |
|---|---|---|
| Geral (todas as rotas) | 100 requisições | 15 minutos |
| Escrita (curtir, comentar) | 30 requisições | 15 minutos |

## Deploy na Vercel

O projeto está configurado para deploy automático na Vercel ao fazer push para `main`.

Configure as variáveis de ambiente no painel da Vercel em **Settings > Environment Variables**:
- `MONGODB_URI`
- `ADMIN_API_KEY`

---

Desenvolvido para o site de advocacia Yan Renat Advocacia e Consultoria.

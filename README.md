# Backend - Site de Advocacia Yan Renat Advocacia e Consultoria

Backend do site de advocacia Yan Renat Advocacia e Consultoria. Gerencia artigos juridicos, curtidas, comentarios com autenticacao por token, busca textual e CRUD administrativo. Construido com **Node.js**, **Express** e **MongoDB**, configurado para deploy na **Vercel**.

## Funcionalidades

- **Artigos juridicos**: listagem paginada, busca por slug, busca textual por palavras-chave
- **Curtidas**: operacoes atomicas que previnem valores negativos
- **Comentarios**: criacao com token de autor, listagem paginada e exclusao autorizada
- **Autorizacao de exclusao**: apenas o autor (via token) ou o admin (via API key) podem deletar comentarios
- **CRUD administrativo**: criar, editar e deletar artigos protegidos por API key
- **Seguranca**: Helmet (headers HTTP), validacao/sanitizacao de inputs, rate limiting, CORS restritivo
- **Busca textual**: indice de texto em portugues com pesos por campo (titulo > descricao > conteudo)
- **Paginacao**: todos os endpoints de listagem suportam `?page=1&limit=20`

## Tecnologias

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/) (MongoDB ODM)
- [Helmet](https://helmetjs.github.io/) (headers de seguranca HTTP)
- [express-validator](https://express-validator.github.io/docs/) (validacao e sanitizacao)
- [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) (rate limiting)
- [cors](https://github.com/expressjs/cors)
- [dotenv](https://github.com/motdotla/dotenv)

## Estrutura do Projeto

```
.
├── src/
│   ├── config/
│   │   └── database.js          # Wrapper de conexao com MongoDB
│   ├── middleware/
│   │   ├── auth.js              # Verificacao de admin (API key)
│   │   ├── connectDB.js         # Middleware de conexao MongoDB
│   │   └── validate.js          # Middleware de validacao de inputs
│   ├── models/
│   │   ├── Artigo.js            # Schema com indice de texto para busca
│   │   └── Comentario.js        # Schema com autorToken e indices compostos
│   └── routes/
│       ├── artigos.js           # Rotas publicas + CRUD admin
│       └── comentarios.js       # Criacao com token, exclusao autorizada
├── app.js                       # Configuracao Express, CORS, Helmet, montagem de rotas
├── server.js                    # Entry point com graceful shutdown
├── seed.js                      # Script para popular o banco com artigos de exemplo
├── resetDB.js                   # Script para resetar curtidas e comentarios
├── vercel.json                  # Configuracao de deploy na Vercel
└── package.json
```

## Configuracao Local

1. **Clone o repositorio:**
   ```bash
   git clone https://github.com/magroalbino/site-backend-yan-renat-advocacia.git
   cd site-backend-yan-renat-advocacia
   ```

2. **Instale as dependencias:**
   ```bash
   npm install
   ```

3. **Configure as variaveis de ambiente:**

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

## Variaveis de Ambiente

| Variavel | Obrigatoria | Descricao |
|---|---|---|
| `MONGODB_URI` | Sim | URI de conexao com o MongoDB |
| `ADMIN_API_KEY` | Sim | Chave secreta para autenticacao de admin |
| `PORT` | Nao | Porta do servidor (padrao: 3000) |

## Rotas da API

### Artigos (publico)

| Metodo | Rota | Descricao |
|---|---|---|
| `GET` | `/api/artigos?page=1&limit=20` | Lista artigos com paginacao |
| `GET` | `/api/artigos/buscar?q=palavra` | Busca textual por palavras-chave |
| `GET` | `/api/artigos/:slug` | Retorna um artigo pelo slug |
| `POST` | `/api/artigos/:id/curtir` | Incrementa curtidas |
| `POST` | `/api/artigos/:id/descurtir` | Decrementa curtidas (minimo 0) |

### Artigos (admin - requer header `x-admin-key`)

| Metodo | Rota | Descricao |
|---|---|---|
| `POST` | `/api/artigos` | Cria um novo artigo |
| `PUT` | `/api/artigos/:id` | Atualiza um artigo existente |
| `DELETE` | `/api/artigos/:id` | Remove um artigo |

### Comentarios

| Metodo | Rota | Descricao |
|---|---|---|
| `GET` | `/api/comentarios/:slug?page=1&limit=50` | Lista comentarios com paginacao |
| `POST` | `/api/comentarios/:slug` | Cria comentario (retorna `autorToken`) |
| `DELETE` | `/api/comentarios/:id` | Exclui comentario (requer autorizacao) |

### Sistema

| Metodo | Rota | Descricao |
|---|---|---|
| `GET` | `/api/health` | Health check com status do banco |
| `GET` | `/` | Pagina de documentacao visual da API |

## Autorizacao de Comentarios

### Criando um comentario

O endpoint `POST /api/comentarios/:slug` retorna um `autorToken` junto com o comentario. O frontend deve guardar esse token (ex: `localStorage`) para permitir a exclusao futura.

```json
{
  "comment": { "_id": "...", "nome": "Joao", "texto": "Otimo artigo!", "data": "..." },
  "autorToken": "uuid-gerado-pelo-backend"
}
```

### Excluindo um comentario

O endpoint `DELETE /api/comentarios/:id` aceita autorizacao de duas formas:

**Como autor** (token recebido na criacao):
- Header: `x-autor-token: <token>`
- OU body: `{ "autorToken": "<token>" }`

**Como admin** (chave do servidor):
- Header: `x-admin-key: <ADMIN_API_KEY>`

Sem autorizacao valida, a exclusao retorna erro `401` ou `403`.

Comentarios antigos (criados antes do sistema de tokens) so podem ser excluidos pelo admin.

### Exemplo no frontend

```js
// Criar comentario e guardar token
const res = await fetch(`${API}/api/comentarios/${slug}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nome, texto })
});
const data = await res.json();
localStorage.setItem(`comment_token_${data.comment._id}`, data.autorToken);

// Excluir comentario com token
await fetch(`${API}/api/comentarios/${id}`, {
  method: 'DELETE',
  headers: { 'x-autor-token': localStorage.getItem(`comment_token_${id}`) }
});
```

## Administracao de Artigos

Rotas protegidas por API key. Envie o header `x-admin-key` em todas as requisicoes admin.

```bash
# Criar artigo
curl -X POST https://seu-backend.vercel.app/api/artigos \
  -H "Content-Type: application/json" \
  -H "x-admin-key: SUA_CHAVE" \
  -d '{"titulo":"Titulo","slug":"titulo-slug","descricao":"Desc","conteudo":"Conteudo completo"}'

# Editar artigo
curl -X PUT https://seu-backend.vercel.app/api/artigos/ID_DO_ARTIGO \
  -H "Content-Type: application/json" \
  -H "x-admin-key: SUA_CHAVE" \
  -d '{"titulo":"Novo titulo"}'

# Deletar artigo
curl -X DELETE https://seu-backend.vercel.app/api/artigos/ID_DO_ARTIGO \
  -H "x-admin-key: SUA_CHAVE"
```

## Rate Limiting

| Tipo | Limite | Janela |
|---|---|---|
| Geral (todas as rotas) | 100 requisicoes | 15 minutos |
| Escrita (curtir, comentar) | 30 requisicoes | 15 minutos |

## Seguranca

- **Helmet**: headers HTTP de seguranca (X-Content-Type-Options, X-Frame-Options, etc.)
- **CORS restritivo**: apenas origens permitidas
- **Validacao**: todos os inputs validados com express-validator
- **Sanitizacao**: `.escape()` em nome e texto de comentarios contra XSS
- **Rate limiting**: protecao contra abuso em endpoints de escrita
- **Erros seguros**: mensagens genericas para o cliente, detalhes no console do servidor
- **Payload limitado**: body maximo de 100kb

## Deploy na Vercel

O projeto esta configurado para deploy automatico na Vercel ao fazer push para `main`.

Configure as variaveis de ambiente no painel da Vercel em **Settings > Environment Variables**:
- `MONGODB_URI`
- `ADMIN_API_KEY`

---

Desenvolvido para o site de advocacia Yan Renat Advocacia e Consultoria.

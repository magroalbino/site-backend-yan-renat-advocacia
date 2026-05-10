# Backend - Site de Advocacia Yan & Renat

Este é o backend do site de advocacia Yan & Renat, desenvolvido para gerenciar artigos jurídicos e comentários. A aplicação foi construída com **Node.js**, **Express** e **MongoDB**, e está configurada para deploy na **Vercel** como Serverless Functions.

## 🚀 Funcionalidades

- **Gerenciamento de Artigos**: API para listagem e visualização de artigos jurídicos.
- **Sistema de Comentários**: Permite que usuários deixem comentários em artigos específicos.
- **Interface Integrada**: Serve arquivos estáticos para a interface administrativa/visualização.
- **Conexão Resiliente**: Middleware para garantir conexão com o banco de dados em ambientes serverless.

## 🛠️ Tecnologias Utilizadas

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/) (MongoDB ODM)
- [CORS](https://github.com/expressjs/cors)
- [Express Validator](https://express-validator.github.io/docs/)

## 📁 Estrutura do Projeto

```text
.
├── public/             # Arquivos estáticos (HTML, CSS, JS, Imagens)
├── src/
│   ├── config/         # Configurações (Banco de dados)
│   ├── middleware/     # Middlewares (Conexão DB, etc)
│   ├── models/         # Modelos do Mongoose (Artigo, Comentario)
│   ├── routes/         # Definição das rotas da API
│   └── app.js          # Configuração principal do Express
├── server.js           # Ponto de entrada (Local e Vercel)
├── vercel.json         # Configuração de deploy na Vercel
└── package.json        # Dependências e scripts
```

## ⚙️ Configuração Local

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
   Crie um arquivo `.env` na raiz do projeto e adicione sua URI do MongoDB:
   ```env
   MONGODB_URI=sua_uri_do_mongodb
   PORT=3000
   ```

4. **Inicie o servidor:**
   ```bash
   npm start
   ```
   O servidor estará rodando em `http://localhost:3000`.

## 🌐 Deploy na Vercel

O projeto já está configurado para a Vercel. Ao realizar o push para a branch `main`, o deploy será automático.

**Importante**: Lembre-se de configurar a variável de ambiente `MONGODB_URI` no painel da Vercel em *Settings > Environment Variables*.

## 🛣️ Rotas da API

### Artigos
- `GET /api/artigos`: Lista todos os artigos.
- `GET /api/artigos/:slug`: Retorna os detalhes de um artigo específico.

### Comentários
- `GET /api/comentarios/:slug`: Lista os comentários de um artigo.
- `POST /api/comentarios/:slug`: Adiciona um novo comentário a um artigo.

---
Desenvolvido para o site de advocacia Yan & Renat.

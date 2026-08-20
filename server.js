// ====================== BACKEND (API REST) ======================
// Node.js + Express. Guarda os contatos na memória do servidor.
//
// Como rodar:
//   1) npm install express cors
//   2) node server.js
//   3) a API fica em http://localhost:3000

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());          // permite que o frontend (outra "origem") acesse a API
app.use(express.json());  // faz o Express entender o corpo (body) das requisições em JSON

// "Banco de dados" fake: só um array na memória do servidor.
let contatos = [
  { id: 1, nome: "Maria Silva", email: "maria@email.com", telefone: "(11) 99999-0001" },
  { id: 2, nome: "João Souza", email: "joao@email.com", telefone: "(11) 99999-0002" }
];
let proximoId = 3;

// -------- GET: listar todos os contatos --------
app.get("/contatos", (req, res) => {
  res.json(contatos);
});

// -------- POST: criar um contato novo --------
app.post("/contatos", (req, res) => {
  const { nome, email, telefone } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: "O nome é obrigatório." });
  }

  const novo = { id: proximoId++, nome, email: email || "", telefone: telefone || "" };
  contatos.push(novo);

  res.status(201).json(novo); // 201 = criado com sucesso
});

// -------- PUT: atualizar um contato existente --------
app.put("/contatos/:id", (req, res) => {
  const id = Number(req.params.id);
  const contato = contatos.find(c => c.id === id);

  if (!contato) {
    return res.status(404).json({ erro: "Contato não encontrado." });
  }

  const { nome, email, telefone } = req.body;
  if (nome !== undefined) contato.nome = nome;
  if (email !== undefined) contato.email = email;
  if (telefone !== undefined) contato.telefone = telefone;

  res.json(contato);
});

// -------- DELETE: excluir um contato --------
app.delete("/contatos/:id", (req, res) => {
  const id = Number(req.params.id);
  const existe = contatos.some(c => c.id === id);

  if (!existe) {
    return res.status(404).json({ erro: "Contato não encontrado." });
  }

  contatos = contatos.filter(c => c.id !== id);
  res.status(204).end(); // 204 = deu certo, sem conteúdo pra devolver
});

app.listen(3000, () => {
  console.log("API rodando em http://localhost:3000");
});
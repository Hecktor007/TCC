const express = require("express");
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// Para receber dados via POST (JSON ou urlencoded)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

// Conectando ao banco de dados SQLite
const db = new sqlite3.Database('chamada.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err.message);
  } else {
    console.log('Conectado ao banco SQLite.');
  }
});

// Rota para servir a página inicial (login.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota para criar a tabela "usuarios" (executar uma única vez)
app.get('/cadastro', (req, res) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      cpf TEXT NOT NULL UNIQUE CHECK(length(cpf) = 11),
      senha TEXT NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(sql, (err) => {
    if (err) {
      res.status(500).send('Erro ao criar a tabela: ' + err.message);
    } else {
      res.send('Tabela "usuarios" criada ou já existe!');
    }
  });
});

// Rota POST para cadastrar um novo usuário
app.post('/cadastrar', (req, res) => {
  const { nome, email, cpf, senha } = req.body;

  if (!nome || !email || !cpf || !senha) {
    return res.status(400).send('Todos os campos são obrigatórios.');
  }

  // Inserir usuário no banco
  const sql = `INSERT INTO usuarios (nome, email, cpf, senha) VALUES (?, ?, ?, ?)`;
  db.run(sql, [nome, email, cpf, senha], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).send('Email ou CPF já cadastrado.');
      }
      return res.status(500).send('Erro ao cadastrar usuário: ' + err.message);
    }
    res.send(`Usuário ${nome} cadastrado com sucesso! ID: ${this.lastID}`);
  });
});

// Rota para login
app.post('/login', (req, res) => {
  const { cpf } = req.body;

  if (!cpf || cpf.length !== 11) {
    return res.status(400).send('CPF inválido.');
  }

  const sql = `SELECT * FROM usuarios WHERE cpf = ?`;

  db.get(sql, [cpf], (err, row) => {
    if (err) {
      return res.status(500).send('Erro no servidor.');
    }
    if (!row) {
      return res.status(401).send('Usuário não encontrado. Faça cadastro primeiro.');
    }
    // Se quiser validar senha, pode adicionar aqui (por enquanto só CPF)
    res.send('Login realizado com sucesso!');
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});

// Inicia servidor na porta 3000
app.listen(3000, () => console.log("Servidor rodando na porta 3000"));

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
  res.sendFile(path.join(__dirname, 'public', 'selecao_perfil.html'));
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

// Rota para verificar se professor já tem senha
app.post('/verificar-professor', (req, res) => {
  const { cpf } = req.body;

  if (!cpf || cpf.length !== 11) {
    return res.status(400).json({ 
      error: true,
      message: 'CPF inválido. Deve conter 11 dígitos.' 
    });
  }

  db.get(
    'SELECT id FROM professores WHERE cpf = ? AND senha IS NOT NULL',
    [cpf],
    (err, row) => {
      if (err) {
        return res.status(500).json({ 
          error: true,
          message: 'Erro no servidor.' 
        });
      }
      
      res.json({
        temSenha: !!row,
        message: row ? 'Professor encontrado' : 'Professor precisa criar senha'
      });
    }
  );
});

// Rota para criar senha do professor
app.post('/criar-senha-professor', (req, res) => {
  const { cpf, senha } = req.body;

  if (!cpf || cpf.length !== 11 || !senha || senha.length < 6) {
    return res.status(400).json({ 
      success: false,
      message: 'CPF inválido ou senha muito curta (mínimo 6 caracteres).' 
    });
  }

  // Verificar se o CPF existe no sistema acadêmico
  db.get(
    'SELECT id FROM professores WHERE cpf = ?',
    [cpf],
    (err, row) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          message: 'Erro no servidor.' 
        });
      }
      
      if (!row) {
        return res.status(404).json({ 
          success: false,
          message: 'CPF não encontrado no sistema acadêmico.' 
        });
      }

      // Atualizar senha do professor
      db.run(
        'UPDATE professores SET senha = ? WHERE cpf = ?',
        [senha, cpf],
        function(err) {
          if (err) {
            return res.status(500).json({ 
              success: false,
              message: 'Erro ao criar senha.' 
            });
          }
          
          res.json({ 
            success: true,
            message: 'Senha criada com sucesso!' 
          });
        }
      );
    }
  );
});

// Rota para login do professor (atualizada)
app.post('/login-professor', (req, res) => {
  const { cpf, senha } = req.body;

  if (!cpf || cpf.length !== 11 || !senha) {
    return res.status(400).json({ 
      success: false,
      message: 'CPF e senha são obrigatórios.' 
    });
  }

  db.get(
    `SELECT id, nome, email, disciplina, matricula 
     FROM professores 
     WHERE cpf = ? AND senha = ?`,
    [cpf, senha],
    (err, row) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          message: 'Erro no servidor.' 
        });
      }
      
      if (!row) {
        return res.status(401).json({ 
          success: false,
          message: 'CPF ou senha incorretos.' 
        });
      }
      
      res.json({
        success: true,
        message: 'Login realizado com sucesso!',
        professor: row
      });
    }
  );
});

// Rota para criar tabela de professores (executar uma vez)
app.get('/criar-tabela-professores', (req, res) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS professores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT,
      cpf TEXT NOT NULL UNIQUE CHECK(length(cpf) = 11),
      senha TEXT,
      disciplina TEXT,
      matricula TEXT,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(sql, (err) => {
    if (err) {
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao criar tabela: ' + err.message 
      });
    } else {
      // Inserir alguns professores de exemplo (apenas para desenvolvimento)
      const professoresExemplo = [
        ['Ana Silva', 'ana@escola.com', '11122233344', 'senha123', 'Matemática', '12345'],
        ['Carlos Oliveira', 'carlos@escola.com', '22233344455', 'senha123', 'Português', '23456'],
        ['Mariana Santos', 'mariana@escola.com', '33344455566', null, 'História', '34567']
      ];

      let inseridos = 0;
      professoresExemplo.forEach(prof => {
        db.run(
          `INSERT OR IGNORE INTO professores 
          (nome, email, cpf, senha, disciplina, matricula) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          prof,
          function(err) {
            if (err) console.error('Erro ao inserir professor:', err);
            inseridos++;
            
            if (inseridos === professoresExemplo.length) {
              res.json({ 
                success: true, 
                message: 'Tabela "professores" criada com dados de exemplo!' 
              });
            }
          }
        );
      });
    }
  });
});

// Inicia servidor na porta 3000
app.listen(3000, () => console.log("Servidor rodando na porta 3000"));

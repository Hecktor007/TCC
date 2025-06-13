const express = require("express");
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();


app.use(express.static(path.join(__dirname, 'public')));
// Conectando ao banco de dados SQLite
const db = new sqlite3.Database('chamada.db')



app.get("/",(req, res) =>{
res.sendFile(path.join(__dirname, 'public', 'login.html'));

} )


 app.get('/cadrasto', (req, res) => {
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


  // Executar o comando SQL para criar a tabela
  db.run(sql, (err) => {
    if (err) {
      res.send('Erro ao criar a tabela:', err.message);

    } else {
     res.send('Tabela "usuarios" criada ou já existe!');

    }
  });
});


app.get('/cadastrar', (req, res)=> { 
console.log(req.body);


  res.send("ok")
})

app.listen(3000, console.log("rodando"))


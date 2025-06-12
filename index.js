const express = require("express");
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();


app.use(express.static(path.join(__dirname, 'public')));


app.get("/",(req, res) =>{
res.sendFile(path.join(__dirname, 'public', 'login.html'));

} )


 app.get('/cadrasto.html', (req, res) => {
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
})



app.listen(3000, console.log("rodando"))


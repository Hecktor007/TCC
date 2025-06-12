const express = require("express");
const app = express();

app.get("/",(req, res) =>{
res.send("hellow wold")

} )


app.listen(3000, console.log("rodando"))
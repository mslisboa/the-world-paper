var express = require('express')
var app = express()
const mysql = require('./db')
const { rotas } = require('./routes')

app.use(express.json()) // Permite tratar requisições com informações no formato JSON

app.use(express.urlencoded({extended: false}))
app.set("view engine", "ejs")

app.use('/', rotas)
app.use('/:title', rotas)
app.use('/edit/:doi', rotas)

app.listen(3000, () => {
    console.log('SERVIDOR ATIVO, ACESSE http://localhost:3000')
})
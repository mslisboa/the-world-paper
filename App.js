var express = require('express')
var app = express()
const mysql = require('./db')
const { rotas } = require('./routes')

app.use(express.urlencoded({extended: false}))
app.set("view engine", "ejs")

app.use('/', rotas)
app.use('/:title', rotas)

app.listen(3000, () => {
    console.log('SERVIDOR ATIVO, ACESSE http://localhost:3000')
})
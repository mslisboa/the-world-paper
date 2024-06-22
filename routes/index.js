const express = require('express')
const rotas = express.Router()
const mysql = require('../db')

rotas.get('/', async (req, res) => {
    const rows = await mysql.selectAll()
    res.render("index.ejs", {dados: rows})
})

rotas.get('/:title', async (req, res) => {
    const title = req.params.title;
    const rows = await mysql.selectByTitle(title)
    if(rows) {
        res.status(200).send(rows)
        return
    }

    res.status(404).send('Erro')
    //res.render("index.ejs", {dados: rows})
})

module.exports = {rotas}
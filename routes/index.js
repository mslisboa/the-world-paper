const express = require('express')
const rotas = express.Router()
const mysql = require('../db')

rotas.get('/', async (req, res) => {
    const rows = await mysql.selectAll()
    res.render("index.ejs", {dados: rows})
})

module.exports = {rotas}
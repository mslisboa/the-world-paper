const express = require('express')
const rotas = express.Router()
const mysql = require('../db')

rotas.get('/', async (req, res) => {
    const rows = await mysql.selectAll()
    res.render("index.ejs", {dados: rows})
})

rotas.get('/:title', async (req, res) => {
    const title = req.params.title
    const rows = await mysql.selectByTitle(title)

    res.render("index.ejs", {dados: rows})
})

rotas.get('/edit/:doi', async (req, res) => {
    const doi = req.params.doi
    const rows = await mysql.selectByDoi(doi)

    res.render("edit.ejs", {dados: rows})
})

module.exports = {rotas}
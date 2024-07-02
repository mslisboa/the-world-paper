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

rotas.get('/delete/:doi', async (req, res) => {
    const doi = req.params.doi
    const rows = await mysql.selectByDoi(doi)

    res.render("delete.ejs", {dados: rows})
})

rotas.get('/add/article', (req, res) => {
    res.render("add.ejs")
})

rotas.post('/add/insert', async (req, res) => {
    const data = req.body
    const message = await mysql.insertArticle(data)

    if(message === 'Deu certo') {
        res.status(200).redirect('/')
    } else {
        res.status(500).send('Falha na tentativa de inserção. Redirecionando para a página inicial...')

        // Redireciona para a página inicial após 3 segundos
        setTimeout(() => {
            res.redirect('/')
        }, 3000)
    }
})

rotas.delete('/delete/del/:doi', async (req, res) => {
    const doi = req.params.doi
    await mysql.deleteByDoi(doi)

    res.status(200).send('Fim')
})

rotas.put('/edit/update', async (req, res) => {
    const dados = req.body
    await mysql.updateArticle(dados)

    res.status(200).send('Fim')
})

module.exports = {rotas}
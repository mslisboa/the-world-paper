const express = require('express')
const rotas = express.Router()
const mysql = require('../db')

rotas.get('/', async (req, res) => {
    const rows = await mysql.selectAll()
    res.render("index.ejs", {dados: rows})
})

rotas.get('/:title', async (req, res) => {
    var title = req.params.title

    if(title === '1' || title === '2' || title === '3') {
        title = Number(title)
    }

    const rows = await mysql.selectByTitle(title)

    res.render("index.ejs", {dados: rows})
})

rotas.get('/article/:doi', async (req, res) => {
    const doi = req.params.doi
    const rows = await mysql.selectByDoi(doi)

    res.render("article.ejs", {dados: rows})
})

rotas.get('/edit/:doi', async (req, res) => {
    const doi = req.params.doi
    const rows = await mysql.selectByDoi(doi)

    console.log(rows)
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
        res.status(200)
    } else {
        res.status(500).send(message)
    }
})

rotas.delete('/delete/del/:doi', async (req, res) => {
    const doi = req.params.doi
    const message = await mysql.deleteByDoi(doi)

    if(message === 'Deu certo') {
        console.log(message)
        res.status(200).redirect('/')
    } else {
        console.log(message)
        res.status(500).send('Falha na tentativa de inserção. Redirecionando para a página inicial...')

        // Redireciona para a página inicial após 3 segundos
        setTimeout(() => {
            res.redirect('/')
        }, 3000)
    }
})

rotas.put('/edit/update', async (req, res) => {
    const dados = req.body
    const message = await mysql.updateArticle(dados)

    if(message === 'Deu Certo') {
        res.status(200).send(message)
    } else {
        res.status(500).send(message)
    }
})

module.exports = {rotas}
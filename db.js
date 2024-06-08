const mysql = require('mysql2/promise')

const dbConfig = {
    host:'localhost',
    user:'root',
    password:'admin',
    database:'theworldpaper'
}

const conectar = async () => {
    return await mysql.createConnection(dbConfig)
}

const selectAll = async (nomeTabela) => {
    const con = await conectar()

    try {
        const [rows, fields] = await con.execute(
            'SELECT * FROM artigo ORDER BY data_pub DESC LIMIT 5;'
        )
        console.log(rows)
        return rows
    } catch (error) {
        console.log('Erro ao realizar a consulta SELECT:', error)
    } finally {
        await con.end()
    }
}

module.exports = {selectAll}

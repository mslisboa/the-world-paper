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

const selectAll = async () => {
    const con = await conectar()

    try {
        const [rows, fields] = await con.execute(
            `SELECT
                a.doi,
                a.titulo,
                a.data_pub,
                au.nome as nome_autor,
                au.lattes
            FROM
                artigo a
            JOIN
                artigo_autor aa ON a.doi = aa.doi
            JOIN
                autor au ON aa.id_autor = au.id_autor
            ORDER BY
                data_pub DESC
            LIMIT 5;`
        )

        console.log(rows)
        return rows
    } catch (error) {
        console.log('Erro ao realizar a consulta SELECT:', error)
    } finally {
        await con.end()
    }
}

const selectByTitle = async (name) => {
    const con = await conectar()

    try {
        const sql = `
            SELECT
                a.doi,
                a.titulo,
                a.data_pub,
                au.nome as nome_autor,
                au.lattes
            FROM
                artigo a
            JOIN
                artigo_autor aa ON a.doi = aa.doi
            JOIN
                autor au ON aa.id_autor = au.id_autor
            WHERE
                titulo LIKE ?
            ORDER BY
                data_pub DESC;
            `
        const [rows, fields] = await con.execute(sql, [`%${name}%`])
        
        console.log(rows)
        return rows
    } catch (error) {
        console.log('Erro ao realizar a consulta SELECT: ', error)
    } finally {
        await con.end()
    }
}

module.exports = {selectAll, selectByTitle}

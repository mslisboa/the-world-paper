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
        console.log(
            'Erro ao realizar a consulta SELECT pelo titulo: ',
            error
        )
    } finally {
        await con.end()
    }
}

const selectByDoi = async (doi) => {
    const con = await conectar()

    try {
        const sql = `
        SELECT
            a.titulo,
            a.abstract,
            a.data_pub,
            au.nome AS autor_nome,
            au.area_atuacao,
            au.lattes,
            aa.tipo_contribuicao,
            aa.porcentagem_contribuicao,
            aa.ordem_autoria,
            af.nome AS afiliacao_nome,
            af.endereco,
            GROUP_CONCAT(DISTINCT r.nome) AS revistas,
            GROUP_CONCAT(DISTINCT pc.palavra) AS palavras_chave
        FROM
            artigo a
        JOIN
            artigo_autor aa ON a.doi = aa.doi
        JOIN
            autor au ON aa.id_autor = au.id_autor
        LEFT JOIN
            autor_afiliacao af_au ON au.id_autor = af_au.id_autor
        LEFT JOIN
            afiliacao af ON af_au.id_afiliacao = af.id_afiliacao
        LEFT JOIN
            artigo_palavra_chave apc ON a.doi = apc.doi
        LEFT JOIN
            palavra_chave pc ON apc.id_palavra = pc.id_palavra
        LEFT JOIN
            revista r ON a.id_revista = r.id_revista
        WHERE
            a.doi LIKE ?
        GROUP BY 
			a.titulo, a.abstract, a.data_pub, au.nome, au.area_atuacao, au.lattes, aa.tipo_contribuicao, 
			aa.porcentagem_contribuicao, aa.ordem_autoria, af.nome, af.endereco;
        `

        const [rows, fields] = await con.execute(sql, [`${doi}%`])
        console.log(rows)
        return rows
    } catch (error) {
        console.log(
            'Erro ao realizar a consulta SELECT pelo doi: ',
            error
        )
    } finally {
        await con.end()
    }
}

module.exports = {selectAll, selectByTitle, selectByDoi}

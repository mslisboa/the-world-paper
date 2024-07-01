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
            LIMIT 6;`
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

const insertArticle = async (data) => {
    const con = await conectar()
    const autores = data.autores
    const palavras_chave = data.palavras_chave
    const afiliacoes = data.afiliacao
    var result_autor = undefined

    try {
        await con.beginTransaction();

        // Inserir na tabela artigo
        await con.execute(
            'INSERT INTO artigo (doi, titulo, abstract, id_revista, data_pub) VALUES (?, ?, ?, ?, ?)', 
            [data.doi, data.titulo, data.abstract, data.id_revista, data.data_pub]
        );

        // Inserir na tabela autor
        for (const autor of autores) {
            [result_autor] = await con.execute(
                'INSERT INTO autor (nome, area_atuacao, lattes) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE nome=VALUES(nome), area_atuacao=VALUES(area_atuacao), lattes=VALUES(lattes)', 
                [autor.nome, autor.area_atuacao, autor.lattes]
            );
            await con.execute(
                'INSERT INTO artigo_autor (doi, id_autor, tipo_contribuicao, porcentagem_contribuicao, ordem_autoria) VALUES (?, ?, ?, ?, ?)', 
                [data.doi, result_autor.insertId, autor.tipo_contribuicao, autor.porcentagem_contribuicao, autor.ordem_autoria]
            );
        }

        // Inserir na tabela afiliacao
        for (const afiliacao of afiliacoes) {
            var [result] = await con.execute(
                'INSERT INTO afiliacao (nome, endereco) VALUES (?, ?) ON DUPLICATE KEY UPDATE nome=VALUES(nome), endereco=VALUES(endereco)', 
                [afiliacao.nome, afiliacao.endereco]
            );
            await con.execute(
                'INSERT INTO autor_afiliacao (id_autor, id_afiliacao) VALUES (?, ?) ON DUPLICATE KEY UPDATE id_autor=VALUES(id_autor), id_afiliacao=VALUES(id_afiliacao)', 
                [result_autor.insertId, result.insertId]
            );
        }

        // Inserir na tabela palavra_chave
        for (const palavra of palavras_chave) {
            var [result] = await con.execute(
                'INSERT INTO palavra_chave (palavra) VALUES (?) ON DUPLICATE KEY UPDATE palavra=VALUES(palavra)', 
                [palavra.palavra]
            );
            await con.execute(
                'INSERT INTO artigo_palavra_chave (doi, id_palavra) VALUES (?, ?) ON DUPLICATE KEY UPDATE doi=VALUES(doi), id_palavra=VALUES(id_palavra)', 
                [data.doi, result.insertId]
            );
        }

        await con.commit();
        return 'Deu certo'
    } catch (error) {
        return 'deu errado: ' + error
    } finally {
        await con.end()
    }
}

module.exports = {selectAll, selectByTitle, selectByDoi, insertArticle}

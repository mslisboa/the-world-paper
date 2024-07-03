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
            LIMIT 10;`
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
        if(typeof name === "string") {
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
        } else {
            var sql = `
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
                `
            switch (name) {
                case 1:
                    sql += `
                        ORDER BY
                            a.titulo;
                    `
                    console.log(sql)

                    const [rows_titulo, fields_titulo] = await con.execute(sql)

                    console.log(rows_titulo)
                    return rows_titulo

                case 2:
                    sql += `
                        ORDER BY
                            au.nome;
                    `
                    const [rows_nome, fields_nome] = await con.execute(sql)
                    console.log(rows_nome)
                    return rows_nome
            
                default:
                    sql += `
                        ORDER BY
                            data_pub DESC;
                    `
                    const [rows_data, fields_data] = await con.execute(sql)
                    console.log(rows_data)
                    return rows_data
            }
        }        
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
            a.doi,
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
			a.doi, a.titulo, a.abstract, a.data_pub, au.nome, au.area_atuacao, au.lattes, aa.tipo_contribuicao, 
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

const deleteByDoi = async (doi) => {  
    let con = await conectar()

    try {
        await con.beginTransaction()

        // Exclui as referências nas tabelas de junção
        await con.execute('DELETE FROM artigo_autor WHERE doi LIKE ?', [`${doi}%`])
        await con.execute('DELETE FROM artigo_palavra_chave WHERE doi LIKE ?', [`${doi}%`])
        
        // Exclui o artigo da tabela principal
        await con.execute('DELETE FROM artigo WHERE doi LIKE ?', [`${doi}%`])

        // Exclui referências órfãs na tabela de junção autor_afiliacao
        await con.execute('DELETE FROM autor_afiliacao WHERE id_autor NOT IN (SELECT id_autor FROM artigo_autor)');

        // Exclui autores que não estão mais associados a nenhum artigo
        await con.execute('DELETE FROM autor WHERE id_autor NOT IN (SELECT id_autor FROM artigo_autor)');

        // Exclui afiliações que não estão mais associadas a nenhum autor
        await con.execute('DELETE FROM afiliacao WHERE id_afiliacao NOT IN (SELECT id_afiliacao FROM autor_afiliacao)');

        // Exclui palavras-chave que não estão mais associadas a nenhum artigo
        await con.execute('DELETE FROM palavra_chave WHERE id_palavra NOT IN (SELECT id_palavra FROM artigo_palavra_chave)');
        
        await con.commit()

        return 'Deu certo'
    } catch (error) {
        return 'Deu errado: ' + error
    } finally {
        await con.end()
    }
}

const updateArticle = async (dados) => {
    const autores = dados.autores
    const afiliacao = dados.afiliacao
    const palavras_chave = dados.palavras_chave
    var autorId = undefined
    const con = await conectar();

    try {
        // Começa uma transação
        await con.beginTransaction();

        // Atualiza o artigo
        await con.execute(`
            UPDATE artigo
            SET titulo = ?, abstract = ?, data_pub = ?, id_revista = ?
            WHERE doi = ?
        `, [dados.titulo, dados.abstract, dados.data_pub, dados.id_revista, dados.doi]);

        // Atualiza as tabelas de junção
        // Exclui as entradas antigas nas tabelas de junção
        await con.execute('DELETE FROM artigo_autor WHERE doi = ?', [dados.doi]);
        await con.execute('DELETE FROM artigo_palavra_chave WHERE doi = ?', [dados.doi]);

        // Insere novas entradas nas tabelas de junção
        for (const autor of autores) {
            const [result] = await con.execute(`
                INSERT INTO autor (nome, area_atuacao, lattes)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE nome = VALUES(nome), area_atuacao = VALUES(area_atuacao), lattes = VALUES(lattes)
            `, [autor.nome, autor.area_atuacao, autor.lattes]);

            autorId = result.insertId || (await con.execute('SELECT id_autor FROM autor WHERE lattes = ?', [autor.lattes]))[0][0].id_autor;

            await con.execute(`
                INSERT INTO artigo_autor (doi, id_autor, tipo_contribuicao, porcentagem_contribuicao, ordem_autoria)
                VALUES (?, ?, ?, ?, ?)
            `, [dados.doi, autorId, autor.tipo_contribuicao, autor.porcentagem_contribuicao, autor.ordem_autoria]);
        }

        for (const aff of afiliacao) {
            const [result] = await con.execute(`
                INSERT INTO afiliacao (nome, endereco)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE nome = VALUES(nome), endereco = VALUES(endereco)
            `, [aff.nome, aff.endereco]);

            const afiliacaoId = result.insertId || (await con.execute('SELECT id_afiliacao FROM afiliacao WHERE nome = ?', [aff.nome]))[0][0].id_afiliacao;

            await con.execute(`
                INSERT INTO autor_afiliacao (id_autor, id_afiliacao)
                VALUES (?, ?)
            `, [autorId, afiliacaoId]);
        }

        for (const palavra of palavras_chave) {
            const [result] = await con.execute(`
                INSERT INTO palavra_chave (palavra)
                VALUES (?)
                ON DUPLICATE KEY UPDATE palavra = VALUES(palavra)
            `, [palavra]);

            const palavraId = result.insertId || (await con.execute('SELECT id_palavra FROM palavra_chave WHERE palavra = ?', [palavra]))[0][0].id_palavra;

            await con.execute(`
                INSERT INTO artigo_palavra_chave (doi, id_palavra)
                VALUES (?, ?)
            `, [dados.doi, palavraId]);
        }

        // Comita a transação
        await con.commit();
        return 'Deu Certo'
    } catch (error) {
        return error
    } finally {
        await con.end()
    }
}

module.exports = {
    selectAll,
    selectByTitle,
    selectByDoi,
    insertArticle,
    deleteByDoi,
    updateArticle
}

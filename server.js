/* SERVER.JS */

//*************************************************************************************************************//
//     Título: Configuração Inicial do Servidor
//     Descrição: Inicializa o servidor Express, configura o pool de conexões MySQL, e define middleware 
//                essencial como o suporte para JSON e sessões.
//*************************************************************************************************************//
const express = require('express');
const mysql = require('mysql');
const app = express();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const JavaScriptObfuscator = require('javascript-obfuscator');
const session = require('express-session');

require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

//*************************************************************************************************************//
//     Título: Iniciar o Servidor
//     Descrição: Inicia o servidor na porta especificada nas variáveis de ambiente, logando a ativação para 
//                confirmação de que o servidor está operacional.
//*************************************************************************************************************//
const port = process.env.PORT
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

//*************************************************************************************************************//
//     Título: Roteamento de Script Obfuscado
//     Descrição: Intercepta requisições para script.js, lê o arquivo original, obfusca-o usando 
//                JavaScriptObfuscator para melhorar a segurança e envia o código obfuscado como resposta.
//*************************************************************************************************************//
app.get('/js/script.js', (req, res) => {
    fs.readFile(path.join(__dirname, 'public', 'js', 'script.js'), 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erro ao ler o arquivo');
            return;
        }

        const obfuscatedCode = JavaScriptObfuscator.obfuscate(data, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            numbersToExpressions: true,
            simplify: true,
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayThreshold: 0.75,
        }).getObfuscatedCode();

        res.setHeader('Content-Type', 'application/javascript');
        res.send(obfuscatedCode);
    });
});

//*************************************************************************************************************//
//     Título: Configuração de Middleware
//     Descrição: Configura o middleware para analisar JSON e servir arquivos estáticos, especificando o tipo de 
//                conteúdo para arquivos JavaScript para correta interpretação pelo navegador.
//*************************************************************************************************************//
app.use(express.json());
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'text/javascript');
        }
    }
}));
//*************************************************************************************************************//
//     Título: Configuração de Pool de Conexão MySQL
//     Descrição: Configura um pool de conexões MySQL para gerenciar múltiplas conexões de forma eficiente, usando
//                variáveis de ambiente para segurança das credenciais de conexão.
//*************************************************************************************************************//
const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

console.log(pool._allConnections.length);

//*************************************************************************************************************//
//     Título: Configuração de Sessões Express
//     Descrição: Configura sessões para gerenciar o estado de login dos usuários, usando segurança adicional com
//                variáveis de ambiente para o segredo da sessão.
//*************************************************************************************************************//
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

//*************************************************************************************************************//
//     Título: Roteamento de Login
//     Descrição: Verifica credenciais do usuário, compara a senha com a hash armazenada no banco de dados e 
//                inicia uma sessão em caso de sucesso.
//*************************************************************************************************************//
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    pool.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Usuário ou senha incorretos' });
        }

        const user = results[0];
        const { password: storedHash, salt } = user;

        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

        if (hash === storedHash) {
            const offset = -3;
            const now = new Date();
            now.setHours(now.getHours() + offset);
            const lastLoginTime = now.toISOString().replace('T', ' ').substring(0, 19);

            pool.query('UPDATE users SET last_login_time = ? WHERE username = ?', [lastLoginTime, username], (updateError) => {
                if (updateError) {
                    console.error(updateError);
                }
                req.session.username = user.username;
                req.session.groupUser = user.group_user;
                res.json({ message: 'Login bem-sucedido', user: user, username: user.username });
            });
        } else {
            return res.status(401).json({ error: 'Usuário ou senha incorretos' });
        }
    });
});

//*************************************************************************************************************//
//     Título: Roteamento de Logout
//     Descrição: Encerra a sessão do usuário e redireciona para a página inicial.
//*************************************************************************************************************//
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao destruir a sessão:', err);
            return res.status(500).json({ error: 'Erro ao efetuar logout' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout efetuado com sucesso' });
    });
});

//*************************************************************************************************************//
//     Título: Verificar Necessidade de Nota para Status
//     Descrição: Checa se um determinado botão de status requer uma nota adicional com base no usuário e no
//                grupo. 
//*************************************************************************************************************//
app.get('/status/require-note', (req, res) => {
    const { button } = req.query;
    const groupUser = req.session.groupUser;

    pool.query('SELECT note_status_type FROM status_buttons WHERE buttons = ? AND group_user = ?', [button, groupUser], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar informações do botão' });
        }
        if (results.length > 0) {
            const requireNote = results[0].note_status_type === 1;
            res.json({ requireNote: requireNote });
        } else {
            res.status(404).json({ error: 'Botão não encontrado' });
        }
    });
});

//*************************************************************************************************************//
//     Título: Submeter Nota de Status
//     Descrição: Recebe e salva uma nota associada a um status específico do usuário, garantindo a documentação
//                completa de atividades críticas ou observações importantes.
//*************************************************************************************************************//
app.post('/submit-note', (req, res) => {
    console.log('Requisição recebida:', req.body);
    const { username, buttons, noteText } = req.body;
    const groupUser = req.session.groupUser;
    const offset = -3;
    const now = new Date();
    now.setHours(now.getHours() + offset);
    const noteDate = now.toISOString().slice(0, 19).replace('T', ' ');

    pool.query('INSERT INTO note_status (username, buttons, group_user, note_text, note_date) VALUES (?, ?, ?, ?, ?)', [username, buttons, groupUser, noteText, noteDate], (error) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao salvar o comentário' });
        }
        res.json({ message: 'Comentário salvo com sucesso' });
    });
});

//*************************************************************************************************************//
//     Título: Buscar Botões de Status
//     Descrição: Busca e retorna os botões de status disponíveis para o usuário logado, baseando-se no grupo do 
//                usuário, para garantir que os controles de interface correspondam às permissões do usuário.
//*************************************************************************************************************//
app.get('/status', (req, res) => {
    if (!req.session.username || !req.session.groupUser) {
        return res.status(401).json({ error: 'Não autenticado' });
    }

    const groupUser = req.session.groupUser;

    pool.query('SELECT buttons FROM status_buttons WHERE group_user = ?', [groupUser], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar status' });
        }
        const statusButtons = results.map(row => row.buttons);
        res.json(statusButtons);
    });
});

//*************************************************************************************************************//
//     Título: Atualizar Status do Usuário
//     Descrição: Atualiza o status do usuário no banco de dados, permitindo rastrear e documentar as atividades 
//                do usuário ao longo do tempo.
//*************************************************************************************************************//
app.post('/update_status', (req, res) => {
    console.log('Requisição recebida:', req.body);

    if (!req.session.username) {
        return res.status(401).json({ error: 'Não autenticado' });
    }

    const username = req.session.username;
    const { status, duration } = req.body;
    const date = new Date().toISOString().split('T')[0];

    pool.query('SELECT status FROM status_user WHERE username = ? AND date = ?', [username, date], (selectError, results) => {
        if (selectError) {
            console.error(selectError);
            return res.status(500).send('Erro ao verificar o status existente');
        }

        const durationInt = parseInt(duration, 10);
        if (isNaN(durationInt)) {
            return res.status(400).send('Duração inválida');
        }

        let statuses = {};
        if (results.length > 0) {
            statuses = results[0].status.split(';').reduce((acc, curr) => {
                const [key, val] = curr.split(':');
                acc[key] = parseInt(val, 10) || 0;
                return acc;
            }, {});
        }

        statuses[status] = (statuses[status] || 0) + durationInt;
        const newStatus = Object.entries(statuses).map(([key, val]) => `${key}:${val}`).join(';');

        if (results.length > 0) {
            pool.query('UPDATE status_user SET status = ? WHERE username = ? AND date = ?', [newStatus, username, date], (updateError) => {
                if (updateError) {
                    console.error(updateError);
                    return res.status(500).send('Erro ao atualizar o status');
                }
                res.send('Status atualizado com sucesso');
            });
        } else {
            pool.query('INSERT INTO status_user (username, status, date) VALUES (?, ?, ?)', [username, newStatus, date], (insertError) => {
                if (insertError) {
                    console.error(insertError);
                    return res.status(500).send('Erro ao inserir o status');
                }
                res.send('Status inserido com sucesso');
            });
        }
    });
});

//*************************************************************************************************************//
//     Título: Criação de Grupo
//     Descrição: Possibilita criação de grupo para gerenciamento de status de usuários
//*************************************************************************************************************//
app.post('/create_group', (req, res) => {
    const { group_user } = req.body;

    if (!group_user || typeof group_user !== 'string') {
        return res.status(400).json({ success: false, message: 'Nome do grupo inválido' });
    }

    pool.query('SELECT * FROM group_tasks WHERE LOWER(group_user) = LOWER(?)', [group_user], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Erro ao verificar existência do grupo' });
        }

        if (results.length > 0) {
            return res.status(409).json({ success: false, message: 'Grupo já existe' });
        }

        pool.query('INSERT INTO group_tasks (group_user) VALUES (?)', [group_user], (error) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ success: false, message: 'Erro ao criar o grupo' });
            }
            res.json({ success: true, message: 'Grupo criado com sucesso' });
        });
    });
});

//*************************************************************************************************************//
//     Título: Edição de Grupo
//     Descrição: Permite que seja possível renomear um grupo.
//*************************************************************************************************************//
app.post('/edit_group', (req, res) => {
    const { group_user, new_group_user } = req.body;

    if (!group_user || !new_group_user || typeof group_user !== 'string' || typeof new_group_user !== 'string') {
        return res.status(400).json({ success: false, message: 'Nomes de grupo inválidos' });
    }

    pool.query('SELECT * FROM group_tasks WHERE BINARY group_user = ?', [group_user], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Erro ao verificar existência do grupo' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
        }

        pool.query('SELECT * FROM group_tasks WHERE LOWER(group_user) = LOWER(?) AND BINARY group_user != ?', [new_group_user, group_user], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Erro ao verificar novo nome do grupo' });
            }

            if (results.length > 0) {
                return res.status(409).json({ success: false, message: 'Novo nome de grupo já existe' });
            }

            pool.query('UPDATE group_tasks SET group_user = ? WHERE BINARY group_user = ?', [new_group_user, group_user], (error) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ success: false, message: 'Erro ao renomear o grupo' });
                }
                res.json({ success: true, message: 'Grupo editado com sucesso' });
            });
        });
    });
});

//*************************************************************************************************************//
//     Título: Remoção de Grupo
//     Descrição: Permite que um grupo seja removido do sistema.
//*************************************************************************************************************//
app.post('/delete_group', (req, res) => {
    const { group_user } = req.body;

    if (!group_user || typeof group_user !== 'string') {
        return res.status(400).json({ success: false, message: 'Nome do grupo inválido' });
    }

    pool.query('DELETE FROM group_tasks WHERE LOWER(group_user) = LOWER(?)', [group_user], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Erro ao remover o grupo' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
        }

        res.json({ success: true, message: 'Grupo removido com sucesso' });
    });
});

//*************************************************************************************************************//
//     Título: Busca de Grupos
//     Descrição: Faz a busca dos grupos no Banco de Dados.
//*************************************************************************************************************//
app.get('/get_groups', (req, res) => {
    pool.query('SELECT group_user AS name FROM group_tasks', (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar grupos' });
        }
        res.json(results);
    });
});

//*************************************************************************************************************//
//     Título: Busca de Botões de Status
//     Descrição: Faz a busca dos botões de Status do Grupo no Banco.
//*************************************************************************************************************//
app.get('/get_status_buttons', (req, res) => {
    const groupUser = req.query.group_user;

    if (!groupUser) {
        return res.status(400).json({ error: 'Parâmetro group_user é obrigatório' });
    }

    pool.query('SELECT buttons, note_status_type FROM status_buttons WHERE group_user = ?', [groupUser], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar botões de status' });
        }
        res.json(results);
    });
});

//*************************************************************************************************************//
//     Título: Adiciona Botões de Status do Grupo
//     Descrição: Faz a adição de novo botões de status.
//*************************************************************************************************************//
app.post('/add_status_button', (req, res) => {
    const { group_user, buttons, note_status_type } = req.body;

    if (!group_user || !buttons || note_status_type === undefined) {
        return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }

    pool.query('INSERT INTO status_buttons (buttons, group_user, note_status_type) VALUES (?, ?, ?)', [buttons, group_user, note_status_type], (error) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Erro ao adicionar botão de status' });
        }
        res.json({ success: true, message: 'Botão de status adicionado com sucesso' });
    });
});

//*************************************************************************************************************//
//     Título: Deleta botões de Status do Grupo
//     Descrição: Faz a adição de novo botões de status.
//*************************************************************************************************************//
app.post('/delete_status_button', (req, res) => {
    const { group_user, buttons } = req.body;

    if (!group_user || !buttons) {
        return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }

    pool.query('DELETE FROM status_buttons WHERE group_user = ? AND buttons = ?', [group_user, buttons], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Erro ao remover botão de status' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Botão de status não encontrado' });
        }
        res.json({ success: true, message: 'Botão de status removido com sucesso' });
    });
});

//*************************************************************************************************************//
//     Título: Criar usuário através de Admin
//     Descrição: O Admin consegue criar o usuário inserindo o login, grupo que ele fará parte e a senha.
//*************************************************************************************************************//
app.post('/admin/create_user', (req, res) => {
    const { username, password, group_user, admin_type } = req.body;

    pool.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Erro ao verificar o usuário' });
        }

        if (results.length > 0) {
            return res.status(409).json({ success: false, message: 'Nome de usuário já existe' });
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

        pool.query('INSERT INTO users (username, group_user, admin_type, password, salt) VALUES (?, ?, ?, ?, ?)', [username, group_user, 0, hashedPassword, salt], (error) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ success: false, message: 'Erro ao salvar o usuário' });
            }
            res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso' });
        });
    });
});

//*************************************************************************************************************//
//     Título: Obter usuários.
//     Descrição: Essa função permite que retorne uma lista de usuários do banco.
//*************************************************************************************************************//
app.get('/admin/get_users', (req, res) => {
    pool.query('SELECT username FROM users', (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar usuários' });
        }
        res.json(results);
    });
});

//*************************************************************************************************************//
//     Título: Retorna dados de usuário
//     Descrição: Permite obter dados dos usuários como grupo, nome de usuário e função de admin.
//*************************************************************************************************************//
app.get('/admin/get_user_data', (req, res) => {
    const username = req.query.username;

    pool.query('SELECT username, group_user, admin_type FROM users WHERE username = ?', [username], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(results[0]);
    });
});

//*************************************************************************************************************//
//     Título: Edição do usuário
//     Descrição: Essa função permite editar a senha do usuário, grupos do usuário e alterar a função de admin.
//*************************************************************************************************************//
app.post('/admin/edit_user', (req, res) => {
    const { username, password, group_user, admin_type } = req.body;

    pool.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Erro ao buscar o usuário' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        let updateFields = {
            group_user: group_user,
            admin_type: admin_type
        };

        if (password) {
            const salt = crypto.randomBytes(16).toString('hex');
            const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
            updateFields.password = hashedPassword;
            updateFields.salt = salt;
        }

        const fields = Object.keys(updateFields).map(field => `${field} = ?`).join(', ');
        const values = Object.values(updateFields);
        values.push(username);

        const sql = `UPDATE users SET ${fields} WHERE username = ?`;

        pool.query(sql, values, (error) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ success: false, message: 'Erro ao atualizar o usuário' });
            }
            res.json({ success: true, message: 'Usuário atualizado com sucesso' });
        });
    });
});

//*************************************************************************************************************//
//     Título: Deletar usuário.
//     Descrição: Essa função permite que você consiga deletar o usuário.
//*************************************************************************************************************//
app.post('/admin/delete_user', (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, message: 'Nome de usuário inválido' });
    }

    if (req.session.username === username) {
        return res.status(400).json({ success: false, message: 'Você não pode deletar o usuário atualmente logado' });
    }

    pool.query('DELETE FROM users WHERE username = ?', [username], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Erro ao remover o usuário' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        res.json({ success: true, message: 'Usuário removido com sucesso' });
    });
});

// **************************************************************************************************** //
//     Título: Obter Usuários por Grupo
//     Descrição: Retorna a lista de usuários pertencentes a um grupo específico.
// **************************************************************************************************** //
app.get('/get_users_by_group', (req, res) => {
    const groupUser = req.query.group_user;

    if (!groupUser) {
        return res.status(400).json({ error: 'Parâmetro group_user é obrigatório' });
    }

    pool.query('SELECT username FROM users WHERE group_user = ?', [groupUser], (error, results) => {
        if (error) {
            console.error('Erro ao buscar usuários do grupo:', error);
            return res.status(500).json({ error: 'Erro ao buscar usuários' });
        }
        res.json(results);
    });
});

// **************************************************************************************************** //
//     Título: Criar Nova Tarefa
//     Descrição: Permite que um usuário crie uma nova tarefa com os detalhes fornecidos.
// **************************************************************************************************** //
app.post('/tasks/create', (req, res) => {
    const { summary, description, assignee, group_user } = req.body;
    const creator = req.session.username;

    if (!creator) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const taskData = {
        summary,
        description,
        assignee: assignee || null,
        group_user,
        creator
    };

    pool.query('INSERT INTO tasks SET ?', taskData, (error, results) => {
        if (error) {
            console.error('Erro ao criar tarefa:', error);
            return res.status(500).json({ error: 'Erro ao criar tarefa' });
        }
        res.json({ message: 'Tarefa criada com sucesso', taskId: results.insertId });
    });
});

// **************************************************************************************************** //
//     Título: Listar Tarefas
//     Descrição: Retorna todas as tarefas disponíveis para o grupo do usuário.
// **************************************************************************************************** //
app.get('/tasks', (req, res) => {
    const groupUser = req.session.groupUser;

    if (!groupUser) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    pool.query('SELECT * FROM tasks WHERE group_user = ?', [groupUser], (error, results) => {
        if (error) {
            console.error('Erro ao buscar tarefas:', error);
            return res.status(500).json({ error: 'Erro ao buscar tarefas' });
        }
        res.json(results);
    });
});



// **************************************************************************************************** //
//     Título: Atualizar Status da Tarefa
//     Descrição: Atualiza o status de uma tarefa específica.
// **************************************************************************************************** //
app.post('/tasks/update_status', (req, res) => {
    const { taskId, status } = req.body;
    const username = req.session.username;

    if (!username) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    pool.query('SELECT * FROM tasks WHERE id = ?', [taskId], (error, results) => {
        if (error) {
            console.error('Erro ao buscar tarefa:', error);
            return res.status(500).json({ error: 'Erro ao buscar tarefa' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Tarefa não encontrada' });
        }

        const task = results[0];

        if (task.assignee !== username) {
            return res.status(403).json({ error: 'Usuário não autorizado' });
        }

        pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId], (updateError) => {
            if (updateError) {
                console.error('Erro ao atualizar status da tarefa:', updateError);
                return res.status(500).json({ error: 'Erro ao atualizar tarefa' });
            }
            res.json({ message: 'Status da tarefa atualizado com sucesso' });
        });
    });
});

// **************************************************************************************************** //
//     Título: Atualizar Tempo da Tarefa
//     Descrição: Atualiza o tempo e status de uma tarefa específica.
// **************************************************************************************************** //
app.post('/tasks/update_time', (req, res) => {
    const { taskId, duration } = req.body;
    const username = req.session.username;

    if (!username) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    pool.query('SELECT * FROM tasks WHERE id = ?', [taskId], (error, results) => {
        if (error) {
            console.error('Erro ao buscar tarefa:', error);
            return res.status(500).json({ error: 'Erro ao buscar tarefa' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Tarefa não encontrada' });
        }

        const task = results[0];

        if (task.assignee !== username) {
            return res.status(403).json({ error: 'Usuário não autorizado' });
        }

        const newTime = (task.time || 0) + parseInt(duration);

        pool.query('UPDATE tasks SET time = ? WHERE id = ?', [newTime, taskId], (updateError) => {
            if (updateError) {
                console.error('Erro ao atualizar tarefa:', updateError);
                return res.status(500).json({ error: 'Erro ao atualizar tarefa' });
            }
            res.json({ message: 'Tarefa atualizada com sucesso' });
        });
    });
});

// **************************************************************************************************** //
//     Título: Obter Tarefas do Usuário
//     Descrição: Retorna as tarefas atribuídas ao usuário logado.
// **************************************************************************************************** //
app.get('/tasks/user', (req, res) => {
    const username = req.session.username;

    if (!username) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    pool.query('SELECT * FROM tasks WHERE assignee = ? AND status != "Done"', [username], (error, results) => {
        if (error) {
            console.error('Erro ao buscar tarefas do usuário:', error);
            return res.status(500).json({ error: 'Erro ao buscar tarefas' });
        }
        res.json(results);
    });
});

// **************************************************************************************************** //
//     Título: Ponto - Iniciar dia
//     Descrição: Verifica se o usuário já iniciou o dia.
// **************************************************************************************************** //
app.get('/check_start_time', (req, res) => {
    const username = req.session.username;
    const date = new Date().toISOString().split('T')[0];

    pool.query('SELECT start_time FROM user_shifts WHERE username = ? AND date = ?', [username, date], (error, results) => {
        if (error) {
            console.error('Erro ao verificar start_time:', error);
            return res.status(500).json({ error: 'Erro ao verificar start_time' });
        }

        if (results.length > 0 && results[0].start_time) {
            res.json({ startTimeExists: true });
        } else {
            res.json({ startTimeExists: false });
        }
    });
});

app.post('/register_start_time', (req, res) => {
    const username = req.session.username;
    const date = new Date().toISOString().split('T')[0];
    const startTime = new Date().toTimeString().split(' ')[0];

    pool.query('SELECT id FROM user_shifts WHERE username = ? AND date = ?', [username, date], (error, results) => {
        if (error) {
            console.error('Erro ao verificar start_time:', error);
            return res.status(500).json({ success: false, message: 'Erro ao verificar start_time' });
        }

        if (results.length > 0) {
            const shiftId = results[0].id;
            pool.query('UPDATE user_shifts SET start_time = ? WHERE id = ?', [startTime, shiftId], (updateError) => {
                if (updateError) {
                    console.error('Erro ao atualizar start_time:', updateError);
                    return res.status(500).json({ success: false, message: 'Erro ao atualizar start_time' });
                }
                res.json({ success: true, message: 'Horário de início atualizado com sucesso.' });
            });
        } else {
            pool.query(
                'INSERT INTO user_shifts (username, date, start_time) VALUES (?, ?, ?)',
                [username, date, startTime],
                (insertError) => {
                    if (insertError) {
                        console.error('Erro ao registrar start_time:', insertError);
                        return res.status(500).json({ success: false, message: 'Erro ao registrar start_time' });
                    }
                    res.json({ success: true, message: 'Horário de início registrado com sucesso.' });
                }
            );
        }
    });
});

app.post('/register_break_start', (req, res) => {
    const username = req.session.username;
    const date = new Date().toISOString().split('T')[0];
    const breakStartTime = new Date().toTimeString().split(' ')[0];

    pool.query('SELECT break_start, break_end FROM user_shifts WHERE username = ? AND date = ?', [username, date], (error, results) => {
        if (error) {
            console.error('Erro ao verificar status do intervalo:', error);
            return res.status(500).json({ success: false, message: 'Erro ao verificar status do intervalo' });
        }

        if (results.length > 0) {
            const shift = results[0];

            if (!shift.break_start) {
                pool.query('UPDATE user_shifts SET break_start = ? WHERE username = ? AND date = ?', [breakStartTime, username, date], (updateError) => {
                    if (updateError) {
                        console.error('Erro ao registrar break_start:', updateError);
                        return res.status(500).json({ success: false, message: 'Erro ao registrar break_start' });
                    }
                    return res.json({ success: true, message: 'Início do intervalo registrado com sucesso.' });
                });
            } else {
                return res.json({ success: false, message: 'Você já registrou o início do intervalo hoje.' });
            }
        } else {
            pool.query('INSERT INTO user_shifts (username, date, break_start) VALUES (?, ?, ?)', [username, date, breakStartTime], (insertError) => {
                if (insertError) {
                    console.error('Erro ao inserir break_start:', insertError);
                    return res.status(500).json({ success: false, message: 'Erro ao inserir break_start' });
                }
                return res.json({ success: true, message: 'Início do intervalo registrado com sucesso.' });
            });
        }
    });
});


app.get('/check_break_end', (req, res) => {
    const username = req.session.username;
    const date = new Date().toISOString().split('T')[0];

    pool.query('SELECT break_start, break_end FROM user_shifts WHERE username = ? AND date = ?', [username, date], (error, results) => {
        if (error) {
            console.error('Erro ao verificar break_end:', error);
            return res.status(500).json({ error: 'Erro ao verificar break_end' });
        }

        if (results.length > 0 && results[0].break_start && !results[0].break_end) {
            res.json({ shouldSetBreakEnd: true });
        } else {
            res.json({ shouldSetBreakEnd: false });
        }
    });
});

app.post('/register_break_end', (req, res) => {
    const username = req.session.username;
    const date = new Date().toISOString().split('T')[0];
    const breakEndTime = new Date().toTimeString().split(' ')[0];

    pool.query('SELECT * FROM user_shifts WHERE username = ? AND date = ?', [username, date], (error, results) => {
        if (error) {
            console.error('Erro ao registrar break_end:', error);
            return res.status(500).json({ success: false, message: 'Erro ao registrar break_end' });
        }

        if (results.length > 0) {
            const shift = results[0];
            if (shift.break_start && !shift.break_end) {
                pool.query('UPDATE user_shifts SET break_end = ? WHERE id = ?', [breakEndTime, shift.id], (err) => {
                    if (err) {
                        console.error('Erro ao atualizar break_end:', err);
                        return res.status(500).json({ success: false, message: 'Erro ao atualizar break_end' });
                    }
                    res.json({ success: true });
                });
            } else {
                res.json({ success: false, message: 'Não é possível registrar break_end. Verifique se break_start está registrado e break_end não está registrado.' });
            }
        } else {
            res.json({ success: false, message: 'Nenhum registro encontrado para registrar break_end.' });
        }
    });
});

app.post('/register_end_time', (req, res) => {
    const username = req.session.username;
    const date = new Date().toISOString().split('T')[0];
    const endTime = new Date().toTimeString().split(' ')[0];

    pool.query('SELECT id FROM user_shifts WHERE username = ? AND date = ?', [username, date], (error, results) => {
        if (error) {
            console.error('Erro ao verificar end_time:', error);
            return res.status(500).json({ success: false, message: 'Erro ao verificar end_time' });
        }

        if (results.length > 0) {
            const shiftId = results[0].id;
            pool.query('UPDATE user_shifts SET end_time = ? WHERE id = ?', [endTime, shiftId], (updateError) => {
                if (updateError) {
                    console.error('Erro ao atualizar end_time:', updateError);
                    return res.status(500).json({ success: false, message: 'Erro ao atualizar end_time' });
                }
                res.json({ success: true});
            });
        } else {
            pool.query(
                'INSERT INTO user_shifts (username, date, end_time) VALUES (?, ?, ?)',
                [username, date, endTime],
                (insertError) => {
                    if (insertError) {
                        console.error('Erro ao registrar end_time:', insertError);
                        return res.status(500).json({ success: false, message: 'Erro ao registrar end_time' });
                    }
                    res.json({ success: true});
                }
            );
        }
    });
});

// **************************************************************************************************** //
//     Título: Ponto no Modo Usuário
//     Descrição: Usuário abre janela do Ponto Relógio e obtem informações de suas jornadas.
// **************************************************************************************************** //
app.get('/user_shifts', (req, res) => {
    const username = req.session.username;
  
    if (!username) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
  
    pool.query('SELECT date, start_time, break_start, break_end, end_time FROM user_shifts WHERE username = ? ORDER BY date DESC', [username], (error, results) => {
      if (error) {
        console.error('Erro ao buscar turnos do usuário:', error);
        return res.status(500).json({ error: 'Erro ao buscar turnos' });
      }
      res.json(results);
    });
  });
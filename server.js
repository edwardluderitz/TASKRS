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
app.get('/script.js', (req, res) => {
    fs.readFile(path.join(__dirname, 'public', 'script.js'), 'utf8', (err, data) => {
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
            stringArrayThreshold: 0.75
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
//     Título: Roteamento de Registro de Usuário
//     Descrição: Manipula pedidos de registro, verificando a existência do usuário, criptografando a senha e
//                inserindo o novo usuário no banco de dados.
//*************************************************************************************************************//
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const groupUser = 'Suporte';
    const adminType = 1;

    pool.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao verificar o usuário' });
        }

        if (results.length > 0) {
            return res.status(409).json({ error: 'Nome de usuário já existe' });
        }

        const salt = crypto.randomBytes(16).toString('hex');

        const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

        pool.query('INSERT INTO users (username, group_user, admin_type, password, salt) VALUES (?, ?, ?, ?, ?)', [username, 'Suporte', 1, hashedPassword, salt], (error) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ error: 'Erro ao salvar o usuário' });
            }
            res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
        });
    });
});

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
            return console.error(err);
        }
        res.redirect('/');
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
/* SERVER.JS */

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

const port = process.env.PORT

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


app.use(express.json());
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'text/javascript');
        }
    }
}));

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

console.log(pool._allConnections.length);


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

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        pool.query('INSERT INTO users (username, group_user, admin_type, password) VALUES (?, ?, ?, ?)', [username, groupUser, adminType, hashedPassword], (error) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ error: 'Erro ao salvar o usuário' });
            }
            res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
        });
    });
});


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }));
  

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, hashedPassword], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        if (results.length > 0) {
            const offset = -3;
            const now = new Date();
            now.setHours(now.getHours() + offset);
            const lastLoginTime = now.toISOString().replace('T', ' ').substring(0, 19);
            pool.query('UPDATE users SET last_login_time = ? WHERE username = ?', [lastLoginTime, username], (updateError) => {
                if (updateError) {
                    console.error(updateError);
                }
                req.session.username = username;
                res.json({ message: 'Login bem-sucedido', user: results[0], username: username });
            });
        } else {
            return res.status(401).json({ error: 'Usuário ou senha incorretos' });
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.error(err);
        }
        res.redirect('/');
    });
});

app.post('/update_status', (req, res) => {
    console.log('Requisição recebida:', req.body);

    if (!req.session.username) {
        return res.status(401).json({ error: 'Não autenticado' });
    }

    const username = req.session.username;
    const {status, duration} = req.body;
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

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

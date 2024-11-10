/* MAIN.JS */

const { app, BrowserWindow, ipcMain } = require('electron');
const expressApp = require('./server.js');
const path = require('path');

let mainWindow;

//*************************************************************************************************************//
//     Título: Criação da Janela do Aplicativo
//     Descrição: Configura e cria uma nova janela do navegador utilizando o Electron, definindo preferências de 
//                segurança e carregamento de conteúdo inicial antes de carregar a URL principal.
//*************************************************************************************************************//
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 300,
        height: 400,
        minWidth: 300,
        minHeight: 400,
        resizable: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    const loadingHTML = `
    <html>
    <head>
        <style>
            body, html {
                margin: 0;
                padding: 0;
                overflow: hidden;
            }

            #loading {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                width: 100vw;
            }

            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(0, 0, 0, 0.1);
                border-top: 4px solid #4299e1;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                }

                @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }
        </style>
    </head>
        <body>
            <div id="loading">
                <div class="spinner"></div>
            </div>
        </body>
    </html>`;

    mainWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(loadingHTML)}`);

    mainWindow.webContents.once('did-finish-load', () => {
        setTimeout(() => {
            mainWindow.loadURL('http://localhost:3000');
        }, 500);

    });

    mainWindow.setMenu(null);
}

//*************************************************************************************************************//
//     Título: Configuração do IPC para Alternância de Janela Sempre no Topo
//     Descrição: Configura o IPC Main para ouvir eventos de alternância, permitindo ajustar a janela do 
//                aplicativo para permanecer sempre no topo conforme solicitado pelo processo de renderização.
//*************************************************************************************************************//
ipcMain.on('toggle-always-on-top', (event, shouldSetAlwaysOnTop) => {
    mainWindow.setAlwaysOnTop(shouldSetAlwaysOnTop);
});


//*************************************************************************************************************//
//     Título: Inicialização e Gerenciamento do Ciclo de Vida do Aplicativo
//     Descrição: Configura os manipuladores de eventos para o ciclo de vida do aplicativo, incluindo o carregamento
//                inicial da janela, tratamento do fechamento de todas as janelas e reativação do aplicativo.
//*************************************************************************************************************//
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

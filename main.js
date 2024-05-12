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
        width: 240,
        height: 300,
        minWidth: 240, 
        minHeight: 300, 
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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css">
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

            .fas.fa-spinner.fa-spin {
                font-size: 2rem;
                color: #4299e1;
            }
        </style>
    </head>
        <body>
            <div id="loading">
                <i class="fas fa-spinner fa-spin"></i>
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

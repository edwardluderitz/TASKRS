/* SCRIPT.JS */

document.addEventListener('DOMContentLoaded', () => {
  createLoginContainer();
  let startTime;
  let currentStatus = '';
  let loggedInUsername = '';

  const appContainer = document.getElementById('app-container');
  const loginContainer = document.getElementById('login-container');

  //*************************************************************************************************************//
  //     Título: Criar Contêiner de Login
  //     Descrição: Cria o contêiner de login e o formulário associado dinamicamente no carregamento da página. 
  //                Esta função garante que o usuário possa inserir suas credenciais para autenticação.
  //*************************************************************************************************************//
  function createLoginContainer() {
    const loginContainer = document.createElement('div');
    loginContainer.id = 'login-container';
    loginContainer.className = 'flex items-center justify-center min-h-screen';
    loginContainer.innerHTML = `
        <div class="w-full max-w-xs">
            <form id="login-form" class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div class="mb-4">
                    <input
                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="text" id="username" placeholder="Usuário" required>
                </div>
                <div class="mb-6">
                    <input
                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                        type="password" id="password" placeholder="Senha" required>
                </div>
                <div class="flex flex-col space-y-2">
                    <button
                        class="buttons-open bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        type="submit">
                        Entrar
                    </button>
                    <a href="#" id="show-register-form"
                        class="buttons-open self-center inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
                        Cadastre-se
                    </a>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(loginContainer);

    const loginForm = document.getElementById('login-form');
    const registerBtn = document.getElementById('show-register-form');

    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      loginUser();
    });

    registerBtn.addEventListener('click', function () {
      showRegisterForm();
    });
  }

  //*************************************************************************************************************//
  //     Título: Remover Contêiner de Login
  //     Descrição: Remove o contêiner de login do DOM, utilizado após o login bem-sucedido ou para transição para
  //                a tela de registro.
  //*************************************************************************************************************//
  function removeLoginContainer() {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) {
      loginContainer.remove();
    }
  }

  //*************************************************************************************************************//
  //     Título: Tratar Submissão de Login
  //     Descrição: Manipula a submissão do formulário de login, enviando os dados do usuário para o servidor e 
  //                processando a resposta para redirecionar ou mostrar erros.
  //*************************************************************************************************************//

  function loginUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    showLoading();

    fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then(response => response.json())
      .then(data => {
        hideLoading();
        if (!data.user) {
          showDialog('Erro no login: ' + (data.error || 'Usuário ou senha incorretos'));
          loginContainer.style.display = 'flex';
          return;
        }
        removeLoginContainer();
        loggedInUsername = data.username;
        if (data.user.admin_type === 0) {
          createSelectionScreen();
        } else {
          loadUserInterface();
        }
      })
      .catch(error => {
        hideLoading();
        console.error('Erro no login:', error);
        showDialog('Erro no login: ' + error);
      });
  }


  //*************************************************************************************************************//
  //     Título: Mostrar Formulário de Registro
  //     Descrição: Exibe o formulário de registro para novos usuários, escondendo o formulário de login e 
  //                preparando o ambiente para a entrada de novos dados de usuário.
  //*************************************************************************************************************//
  function showRegisterForm() {
    loginContainer.style.display = 'none';
    appContainer.style.display = 'flex';
    appContainer.style.flexDirection = 'column';
    appContainer.style.alignItems = 'center';
    appContainer.style.justifyContent = 'center';
    appContainer.style.height = '100vh';

    const registerContainer = document.createElement('div');
    registerContainer.id = 'register-container';
    registerContainer.className = 'flex items-center justify-center';
    registerContainer.innerHTML = `
      <div class="w-full max-w-xs">
        <form id="register-form" class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div class="mb-4">
            <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" id="register-username" placeholder="Usuário" required />
          </div>
          <div class="mb-4">
            <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="password" id="register-password" placeholder="Senha" required />
          </div>
          <div class="mb-4">
            <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="password" id="confirm-password" placeholder="Confirme a Senha" required />
          </div>
          <div class="flex flex-col space-y-4">
            <button type="submit" class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
              Cadastrar
            </button>
            <button type="button" id="back-to-login" class="w-full text-blue-500 hover:text-blue-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
              Voltar
            </button>
          </div>
        </form>
      </div>
    `;

    appContainer.appendChild(registerContainer);

    document.getElementById('back-to-login').addEventListener('click', function () {
      appContainer.removeChild(registerContainer);
      appContainer.innerHTML = '';
      appContainer.style.cssText = '';
      appContainer.style.display = 'none';
      loginContainer.style.display = 'flex';
    });

    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const username = document.getElementById('register-username').value;
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (password !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
      }

      const userData = {
        username: username,
        password: password,
      };

      fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => {
              throw new Error(data.error);
            });
          }
          return response.json();
        })
        .then(data => {
          showDialog('Registro concluído com sucesso!');
          const registerContainer = document.getElementById('register-container');
          appContainer.removeChild(registerContainer);
          loginContainer.style.display = 'flex';
          appContainer.innerHTML = '';
          appContainer.style.cssText = '';
          appContainer.style.display = 'none';
        })
        .catch(error => {
          console.error('Erro no registro:', error);
          showDialog('Erro no registro:' + error);
        });
    });

  }

  //*************************************************************************************************************//
  //     Título: Criar Tela de Seleção de Modo
  //     Descrição: Cria uma tela de seleção onde o usuário pode escolher entre Modo Usuário e Modo Administrador.
  //                Esta tela permite transições adequadas entre diferentes interfaces baseadas no tipo de usuário.
  //*************************************************************************************************************//
  function createSelectionScreen() {
    const selectionScreen = document.createElement('div');
    selectionScreen.style.display = 'block';
    selectionScreen.id = 'selectionScreen';
    selectionScreen.className = 'modal';
    selectionScreen.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Escolha o Modo</h2>
      <button id="userModeBtn">Modo Usuário</button>
      <button id="adminModeBtn">Modo Admin</button>
    </div>
    `;

    document.body.appendChild(selectionScreen);

    document.getElementById('userModeBtn').addEventListener('click', function () {
      loadUserInterface();
    });

    document.getElementById('adminModeBtn').addEventListener('click', function () {
      loadAdminInterface();
    });
  }

  //*************************************************************************************************************//
  //     Título: Remover Tela de Seleção de Modo
  //     Descrição: Remove a tela de seleção de modo do DOM para limpar a interface e preparar para carregar a 
  //                interface específica do usuário ou do administrador.
  //*************************************************************************************************************//
  function removeSelectionScreen() {
    const selectionScreen = document.getElementById('selectionScreen');
    if (selectionScreen) {
      selectionScreen.remove();
    }
  }

  //*************************************************************************************************************//
  //     Título: Carregar Interface de Administração
  //     Descrição: Prepara e exibe a interface do administrador, que inclui funcionalidades específicas como 
  //                visualização de indicadores, adição de usuários, grupos e funcionalidades de reset de senha.
  //*************************************************************************************************************//
  function loadAdminInterface() {
    removeSelectionScreen();
    appContainer.innerHTML = '';
    appContainer.style.display = 'block';


    const adminTitle = document.createElement('h2');
    adminTitle.textContent = 'Painel de Administração';
    appContainer.appendChild(adminTitle);


    const userIndicatorButton = createAdminButton('Indicadores dos Usuários', viewUserIndicators);
    const addUserButton = createAdminButton('Adicionar Novo Usuário', addNewUser);
    const addGroupButton = createAdminButton('Adicionar Grupo', addGroup);
    const resetPasswordButton = createAdminButton('Resetar Senha', resetPassword);

    appContainer.appendChild(userIndicatorButton);
    appContainer.appendChild(addUserButton);
    appContainer.appendChild(addGroupButton);
    appContainer.appendChild(resetPasswordButton);
  }

  //*************************************************************************************************************//
  //     Título: Criar Botão de Administração
  //     Descrição: Cria botões dinamicamente para a interface do administrador, associando funções específicas a 
  //                cada botão para permitir a execução de tarefas administrativas.
  //*************************************************************************************************************//
  function createAdminButton(buttonText, onClickFunction) {
    const button = document.createElement('button');
    button.textContent = buttonText;
    button.addEventListener('click', onClickFunction);
    return button;
  }

  //*************************************************************************************************************//
  //     Título: Visualizar Indicadores dos Usuários
  //     Descrição: Função para logar a ação de visualizar indicadores dos usuários, parte das ferramentas 
  //                administrativas para monitoramento e gestão de usuário.
  //*************************************************************************************************************//
  function viewUserIndicators() {
    console.log('Visualizando indicadores dos usuários');
  }

  //*************************************************************************************************************//
  //     Título: Adicionar Novo Usuário
  //     Descrição: Permite ao administrador adicionar um novo usuário ao sistema, uma parte crítica das 
  //                funcionalidades de gestão de usuários.
  //*************************************************************************************************************//
  function addNewUser() {
    console.log('Adicionando um novo usuário');
  }

  //*************************************************************************************************************//
  //     Título: Adicionar Grupo
  //     Descrição: Fornece funcionalidade para criar novos grupos de usuários, facilitando a organização e 
  //                gerenciamento por parte dos administradores.
  //*************************************************************************************************************//
  function addGroup() {
    console.log('Adicionando um grupo');
  }

  //*************************************************************************************************************//
  //     Título: Resetar Senha
  //     Descrição: Oferece ao administrador a capacidade de resetar senhas de usuários, um elemento essencial para 
  //                a manutenção da segurança e assistência ao usuário.
  //*************************************************************************************************************//
  function resetPassword() {
    console.log('Resetando senha');
  }

  //*************************************************************************************************************//
  //     Título: Animação de Carregamento
  //     Descrição: Essas funções habilitam e desabilitam a animação de carregamento no centro da página.
  //*************************************************************************************************************//
  function showLoading() {
    document.getElementById('loading').classList.remove('hidden')
    document.getElementById('loading').classList.add('loading-display');
  }

  function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('loading').classList.remove('loading-display')
  }

  //*************************************************************************************************************//
  //     Título: Carregar a Interface Principal do Usuário
  //     Descrição: Faz a busca no banco de dados dos status de trabalho deste usuário usando o usuário logado para
  //                posteriormente realizar o carregamento na página dos botões.
  //*************************************************************************************************************//
  function loadUserInterface() {
    showLoading();
    removeSelectionScreen();

    const navbar = document.createElement('div');
    navbar.innerHTML = `
    <div class="bg-gray-800 text-white p-4">
      <div class="container flex justify-between items-center">
        <div class="dropdown">
          <button id="dropdownMenuButton" class="dropdown-button">☰</button>
          <div id="dropdownMenu" class="dropdown-menu hidden">
            <a href="#" id="ponto" class="dropdown-item">Ponto</a>
            <a href="#" id="tarefas" class="dropdown-item">Tarefas</a>
            <a href="#" id="configuracoes" class="dropdown-item">Configurações</a>
            <div class="separator"></div>
            <a href="#" id="logout" class="dropdown-item">Logout</a>
          </div>
        </div>
      </div>
    </div>
  `;
    appContainer.appendChild(navbar);

    const mainSection = document.createElement('section');
    mainSection.id = 'main-section';
    mainSection.className = 'main-section';
    appContainer.appendChild(mainSection);

    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'button-container';
    buttonContainer.className = 'button-container';
    mainSection.appendChild(buttonContainer);

    const dropdownButton = document.getElementById('dropdownMenuButton');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const pontoButton = document.getElementById('ponto');
    const tarefasButton = document.getElementById('tarefas');
    const configuracoesButton = document.getElementById('configuracoes');
    const logoutButton = document.getElementById('logout');

    dropdownButton.addEventListener('click', () => {
      dropdownMenu.classList.toggle('hidden');
    });

    window.addEventListener('click', function (e) {
      if (!dropdownButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.add('hidden');
      }
    });

    logoutButton.addEventListener('click', () => {
      createLoginContainer();
      loginContainer.style.display = 'flex';
      appContainer.innerHTML = '';
      appContainer.style.cssText = '';
      appContainer.style.display = 'none';

    });

    pontoButton.addEventListener('click', () => {
      alert('Ponto clicked');
    });

    tarefasButton.addEventListener('click', () => {
      alert('Tarefas clicked');
    });

    configuracoesButton.addEventListener('click', () => {
      alert('Configurações clicked');
    });

    fetch('/status')
      .then(response => response.json())
      .then(statusButtons => {
        hideLoading();
        addButtonsToButtonContainer(statusButtons);
        appContainer.style.display = 'block';
        loginContainer.style.display = 'none';
      })
      .catch(error => console.error('Erro ao buscar status:', error));
  }

  //*************************************************************************************************************//
  //     Título: Adicionar Botões ao Contêiner da Aplicação
  //     Descrição: Adiciona os botões de status ao contêiner da aplicação, configurando a visibilidade e a 
  //                interatividade dos botões dentro do contexto da interface do usuário.
  //*************************************************************************************************************//
  function addButtonsToButtonContainer(statusNames) {
    const container = document.getElementById('button-container');
    container.innerHTML = '';

    statusNames.forEach(statusName => {
      container.appendChild(createStatusButton(statusName));
    });

    container.appendChild(document.createElement('div')).classList.add('border-t', 'mt-1');
    container.appendChild(createAlwaysOnTopButton());

    setupStatusButtonEvents();
    setupAlwaysOnTopButtonEvent();
  }

  //*************************************************************************************************************//
  //     Título: Criar Botão de Status
  //     Descrição: Cria dinamicamente um botão para cada status de trabalho fornecido pelo servidor, configurando
  //                a classe CSS adequada e o texto.
  //*************************************************************************************************************//
  function createStatusButton(statusName) {
    const button = document.createElement('button');
    button.classList.add('status-btn', 'w-full', 'text-center', 'pl-2', 'pr-4', 'py-1', 'rounded-md', 'font-semibold');
    button.innerText = statusName;
    return button;
  }

  //*************************************************************************************************************//
  //     Título: Configurar Eventos dos Botões de Status
  //     Descrição: Adiciona eventos aos botões de status para gerenciar a seleção e atualização de status, 
  //                incluindo o cálculo da duração e a interação com a API do servidor para atualização do status 
  //                e submissão de comentários quando necessário.
  //*************************************************************************************************************//
  function setupStatusButtonEvents() {
    const statusButtons = document.querySelectorAll('.status-btn');
  
    statusButtons.forEach(button => {
      button.addEventListener('click', function () {
        if (this.classList.contains('selected')) {
          return;
        }
  
        if (!startTime) {
          startTime = new Date();
        } else {
          const endTime = new Date();
          const duration = Math.round((endTime - startTime) / 1000);
  
          if (isNaN(duration)) {
            console.error('Duração calculada é NaN');
            return;
          }
  
          if (currentStatus !== '') {
            const statusData = {
              username: loggedInUsername,
              status: currentStatus,
              duration: duration
            };
  
            fetch('/update_status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(statusData),
            })
              .then(response => {
                if (!response.ok) {
                  throw new Error('Erro na resposta do servidor');
                }
                return response.text();
              })
              .then(text => console.log(text))
              .catch(error => console.error('Erro ao atualizar status:', error));
          }
  
          startTime = new Date();
        }
  
        currentStatus = this.innerText;
  
        disableAllStatusButtons();
  
        statusButtons.forEach(btn => btn.classList.remove('selected'));
        this.classList.add('selected');
  
        const statusName = this.innerText;
        fetch(`/status/require-note?button=${encodeURIComponent(statusName)}`)
          .then(response => response.json())
          .then(data => {
            if (data.requireNote) {
              requestNoteAndSubmit(statusName);
            } else {
              enableAllStatusButtons();
            }
          })
          .catch(error => {
            console.error('Erro ao verificar a necessidade de comentário:', error);
            enableAllStatusButtons();
          });
      });
    });
  }
  
  //*************************************************************************************************************//
  //     Título: Solicitar Nota e Submeter
  //     Descrição: Função para solicitar um comentário e submetê-lo. Continua solicitando até que um comentário 
  //                válido seja inserido.
  //*************************************************************************************************************//
  function requestNoteAndSubmit(statusName) {
    let noteText;
    do {
      noteText = prompt("Este status requer um comentário. Por favor, insira seu comentário:");
    } while (!noteText);
  
    const noteData = {
      username: loggedInUsername,
      buttons: statusName,
      noteText: noteText
    };
  
    fetch('/submit-note', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao submeter o comentário');
      }
      console.log('Comentário submetido com sucesso');
    })
    .catch(error => console.error('Erro:', error));
  
    enableAllStatusButtons();
  }
  
  //*************************************************************************************************************//
  //     Título: Desabilitar Todos os Botões de Status
  //     Descrição: Desabilita todos os botões de status para evitar múltiplas seleções enquanto se aguarda 
  //                uma ação do usuário.
  //*************************************************************************************************************//
  function disableAllStatusButtons() {
    const statusButtons = document.querySelectorAll('.status-btn');
    statusButtons.forEach(button => {
      button.disabled = true;
    });
  }
  
  //*************************************************************************************************************//
  //     Título: Habilitar Todos os Botões de Status
  //     Descrição: Habilita todos os botões de status após a ação do usuário ser concluída.
  //*************************************************************************************************************//
  function enableAllStatusButtons() {
    const statusButtons = document.querySelectorAll('.status-btn');
    statusButtons.forEach(button => {
      button.disabled = false;
    });
  }

  //*************************************************************************************************************//
  //     Título: Botão Sempre no Topo
  //     Descrição: Esse botão serve para que mantenha a aplicação acima de qualquer coisa quando clicado.
  //*************************************************************************************************************//
  function createAlwaysOnTopButton() {
    const button = document.createElement('button');
    button.classList.add('always-on-top-btn', 'w-full', 'text-center', 'pl-2', 'pr-4', 'py-1', 'rounded-md', 'font-semibold');
    button.innerText = 'Always on top';
    return button;
  }

  function setupAlwaysOnTopButtonEvent() {
    const alwaysOnTopButton = document.querySelector('.always-on-top-btn');
    alwaysOnTopButton.addEventListener('click', function () {
      const shouldSetAlwaysOnTop = this.classList.toggle('toggle-on');
      window.electron.ipcRenderer.send('toggle-always-on-top', shouldSetAlwaysOnTop);
    });
  }

  //*************************************************************************************************************//
  //     Título: Habilitar e desabilitar caixas de diálogo 
  //     Descrição: Habilitar a caixa de Diálogo no HTML para aparecer com a mensagem designada
  //     nas instruções das funções.
  //*************************************************************************************************************//
  function showDialog(message) {
    const dialog = document.getElementById('custom-dialog');
    const messageElement = document.getElementById('dialog-message');
    messageElement.textContent = message;
    dialog.classList.remove('hidden');
  }

  function closeDialog() {
    const dialog = document.getElementById('custom-dialog');
    dialog.classList.add('hidden');
  }
  document.getElementById('close-dialog').addEventListener('click', closeDialog);
});
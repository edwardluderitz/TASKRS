/* SCRIPT.JS */

document.addEventListener('DOMContentLoaded', () => {
  createLoginContainer();
  const loginForm = document.getElementById('login-form');
  const appContainer = document.getElementById('app-container');
  const loginContainer = document.getElementById('login-container');
  const registerBtn = document.getElementById('show-register-form');

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
  }

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
function createAdminButton(buttonText, onClickFunction) {
  const button = document.createElement('button');
  button.textContent = buttonText;
  button.addEventListener('click', onClickFunction);
  return button;
}
function viewUserIndicators() {
  console.log('Visualizando indicadores dos usuários');
}

function addNewUser() {
  console.log('Adicionando um novo usuário');
}

function addGroup() {
  console.log('Adicionando um grupo');
}

function resetPassword() {
  console.log('Resetando senha');
}
  function removeLoginContainer() {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) {
      loginContainer.remove();
    }
  }
  
  function removeSelectionScreen() {
    const selectionScreen = document.getElementById('selectionScreen');
    if (selectionScreen) {
      selectionScreen.remove();
    }
  }

  let startTime;
  let currentStatus = '';
  let loggedInUsername = '';

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
      appContainer.style.display = 'none';
      appContainer.removeChild(registerContainer);
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
        })
        .catch(error => {
          console.error('Erro no registro:', error);
          showDialog('Erro no registro:' + error);
        });
    });

  }
  registerBtn.addEventListener('click', showRegisterForm);

  function showLoading() {
    document.getElementById('loading').classList.remove('hiddens')
    document.getElementById('loading').classList.add('loading-display');
  }

  function hideLoading() {
    document.getElementById('loading').classList.add('hiddens');
    document.getElementById('loading').classList.remove('loading-display')
  }

  function createStatusButton(statusName) {
    const button = document.createElement('button');
    button.classList.add('status-btn', 'w-full', 'text-left', 'pl-2', 'pr-4', 'py-1', 'rounded-md', 'font-semibold');
    button.innerText = statusName;
    return button;
  }

  function createAlwaysOnTopButton() {
    const button = document.createElement('button');
    button.classList.add('always-on-top-btn', 'w-full', 'text-left', 'pl-2', 'pr-4', 'py-1', 'rounded-md', 'font-semibold');
    button.innerText = 'Always on top';
    return button;
  }

  function setupStatusButtonEvents() {
    const statusButtons = document.querySelectorAll('.status-btn');

    statusButtons.forEach(button => {
      button.addEventListener('click', function () {
        if (this.classList.contains('selected')) {
          console.log('Este status já está selecionado.');
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

        statusButtons.forEach(btn => btn.classList.remove('selected'));
        this.classList.add('selected');

        const statusName = this.innerText;
        fetch(`/status/require-note?button=${encodeURIComponent(statusName)}`)
          .then(response => response.json())
          .then(data => {
            if (data.requireNote) {
              const noteText = prompt("Este status requer um comentário. Por favor, insira seu comentário:");
              if (noteText) {
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
              }
            }
          })
          .catch(error => console.error('Erro ao verificar a necessidade de comentário:', error));
      });
    });
  }


  function showDialog(message) {
    const dialog = document.getElementById('custom-dialog');
    const messageElement = document.getElementById('dialog-message');
    messageElement.textContent = message;
    dialog.classList.remove('hiddens');
  }


  function closeDialog() {
    const dialog = document.getElementById('custom-dialog');
    dialog.classList.add('hiddens');
  }

  document.getElementById('close-dialog').addEventListener('click', closeDialog);


  function setupAlwaysOnTopButtonEvent() {
    const alwaysOnTopButton = document.querySelector('.always-on-top-btn');
    alwaysOnTopButton.addEventListener('click', function () {
      const shouldSetAlwaysOnTop = this.classList.toggle('toggle-on');
      window.electron.ipcRenderer.send('toggle-always-on-top', shouldSetAlwaysOnTop);
    });
  }

  function addButtonsToAppContainer(statusNames) {
    const container = document.createElement('div');
    container.classList.add('w-40', 'rounded-md', 'shadow-lg', 'p-2', 'bg-white');

    statusNames.forEach(statusName => {
      container.appendChild(createStatusButton(statusName));
    });

    container.appendChild(document.createElement('div')).classList.add('border-t', 'mt-1');
    container.appendChild(createAlwaysOnTopButton());

    appContainer.appendChild(container);
    setupStatusButtonEvents();
    setupAlwaysOnTopButtonEvent();
  }

  function loadUserInterface() {
    showLoading();
    removeSelectionScreen();
    fetch('/status')
      .then(response => response.json())
      .then(statusButtons => {
        hideLoading();
        addButtonsToAppContainer(statusButtons);
        appContainer.style.display = 'block';
        loginContainer.style.display = 'none';
      })
      .catch(error => console.error('Erro ao buscar status:', error));
  }

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    showLoading();
    loginContainer.style.display = 'none';

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password}),
    })
      .then(response => response.json())
      .then(data => {
        hideLoading();
        removeLoginContainer();
        loggedInUsername = data.username;
        if (data.user.admin_type === 1) {
          createSelectionScreen();
        } else {
          loadUserInterface();
        }
      })
      .catch(error => {
        hideLoading();
        console.error('Erro no login:', error);
        showDialog('Erro no login:' + error);
      });
  });
});
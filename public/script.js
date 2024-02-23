/* SCRIPT.JS */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const appContainer = document.getElementById('app-container');
  const loginContainer = document.getElementById('login-container');
  const registerBtn = document.getElementById('show-register-form');
  const selectionScreen = document.getElementById('selectionScreen');


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

      let hashedPassword;
      if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await window.crypto.subtle.digest('SHA-256', data);
        hashedPassword = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        hashedPassword = CryptoJS.SHA256(password).toString();
      }

      const userData = {
        username: username,
        password: hashedPassword,
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

  document.getElementById('userModeBtn').addEventListener('click', function () {
    document.getElementById('selectionScreen').style.display = 'none';
    loadUserInterface();
  });

  document.getElementById('adminModeBtn').addEventListener('click', function () {
    document.getElementById('selectionScreen').style.display = 'none';
  });

  function loadUserInterface() {
    showLoading();
    fetch('/status')
      .then(response => response.json())
      .then(statusButtons => {
        hideLoading();
        addButtonsToAppContainer(statusButtons);
        appContainer.style.display = 'block';
        selectionScreen.style.display = 'none';
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
    const hashedPassword = CryptoJS.SHA256(password).toString();

    fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: hashedPassword }),
    })
      .then(response => response.json())
      .then(data => {
        hideLoading();
        loggedInUsername = data.username;
        if (data.user.admin_type === 1) {
          selectionScreen.style.display = 'block';
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
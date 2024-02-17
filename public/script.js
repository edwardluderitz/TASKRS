document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const appContainer = document.getElementById('app-container');
  const loginContainer = document.getElementById('login-container');

  let startTime;
  let currentStatus = '';

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
        button.addEventListener('click', function() {
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
                        username: 'edlouder',
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
        });
    });
}

  function setupAlwaysOnTopButtonEvent() {
    const alwaysOnTopButton = document.querySelector('.always-on-top-btn');
    alwaysOnTopButton.addEventListener('click', function() {
      this.classList.toggle('toggle-on');
    });
  }

  function addButtonsToAppContainer() {
    const statusNames = ['Online', 'Ausente', 'Invisivel'];
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

  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'edlouder' && password === '123') {
      loginContainer.style.display = 'none';
      addButtonsToAppContainer();
      appContainer.style.display = 'block';
    } else {
      alert('Usuário ou senha incorretos!');
    }
  });
});

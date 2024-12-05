/* SCRIPT.JS */

document.addEventListener('DOMContentLoaded', () => {
  createLoginContainer();
  let startTime;
  let currentStatus = '';
  let loggedInUsername = '';
  let startTimeRegistered = false;
  let breakEndRegistered = false;

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
          <h2>TASKRS</h2>
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
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(loginContainer);

    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      loginUser();
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

  async function loginUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    removeLoginContainer();
    showLoading();

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      hideLoading();

      if (!data.user) {
        showDialog('Erro no login: ' + (data.error || 'Usuário ou senha incorretos'));
        createLoginContainer();
        return;
      }

      removeLoginContainer();
      loggedInUsername = data.username;
      if (data.user.admin_type === 1) {
        createSelectionScreen();
      } else {
        loadUserInterface();
      }
    } catch (error) {
      hideLoading();
      createLoginContainer();
      console.error('Erro no login:', error);
      showDialog('Erro no login: ' + error);
    }
  }


  //*************************************************************************************************************//
  //     Título: Criar Tela de Seleção de Modo
  //     Descrição: Cria uma tela de seleção onde o usuário pode escolher entre Modo Usuário e Modo Administrador.
  //                Esta tela permite transições adequadas entre diferentes interfaces baseadas no tipo de usuário.
  //*************************************************************************************************************//
  function createSelectionScreen() {
    const selectionScreen = document.createElement('div');
    selectionScreen.style.display = 'flex';
    selectionScreen.id = 'selectionScreen';
    selectionScreen.className = 'modal';
    selectionScreen.innerHTML = `
      <div class="modal-content flex flex-col items-center justify-center p-4 rounded shadow-lg bg-white">
        <button id="userModeBtn" class="mode-btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2">Modo Usuário</button>
        <button id="adminModeBtn" class="mode-btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Modo Admin</button>
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

    const navbar = document.createElement('div');
    navbar.className = 'bg-gray-800 text-white p-2';
    navbar.innerHTML = `
      <div class="container flex justify-start items-center">
        <div class="dropdown">
          <button id="dropdownMenuButton" class="dropdown-button">☰</button>
          <div id="dropdownMenu" class="dropdown-menu hidden">
            <a href="#" id="logout" class="dropdown-item">Logout</a>
          </div>
        </div>
        <div class="ml-4 text-lg font-bold">Painel de Administração</div>
      </div>
    `;
    appContainer.appendChild(navbar);

    const adminContainer = document.createElement('div');
    adminContainer.className = 'admin-container';

    const userManagerButton = createAdminButton('Gerenciamento de Usuários', userManager);
    const groupManagerButton = createAdminButton('Gerenciamento de Grupos', groupManager);

    adminContainer.appendChild(userManagerButton);
    adminContainer.appendChild(groupManagerButton);

    appContainer.appendChild(adminContainer);

    const dropdownButton = document.getElementById('dropdownMenuButton');
    const dropdownMenu = document.getElementById('dropdownMenu');
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
  }

  //*************************************************************************************************************//
  //     Título: Criar Botão de Administração
  //     Descrição: Cria botões dinamicamente para a interface do administrador, associando funções específicas a 
  //                cada botão para permitir a execução de tarefas administrativas.
  //*************************************************************************************************************//
  function createAdminButton(buttonText, onClickFunction) {
    const button = document.createElement('button');
    button.className = 'admin-button';
    button.textContent = buttonText;
    button.addEventListener('click', onClickFunction);
    return button;
  }

  //*************************************************************************************************************//
  //     Título: Cria página de Gerenciamento de Usuários
  //     Descrição: Cria página com botões para cadastrar usuário e editar usuário.
  //*************************************************************************************************************//
  function userManager() {
    const adminContainer = document.querySelector('.admin-container');
    adminContainer.innerHTML = '';

    const createUserButton = createAdminButton('Cadastrar Usuário', createUser);
    const editUserButton = createAdminButton('Editar Usuário', editUser);

    adminContainer.appendChild(createUserButton);
    adminContainer.appendChild(editUserButton);

    const backButton = createAdminButton('Voltar', loadAdminInterface);
    adminContainer.appendChild(backButton);
  }

  //*************************************************************************************************************//
  //     Título: Página para adicionar Novo Usuário
  //     Descrição: Cria página de Adição de usuário, permitindo inserir o nome do usuário, senha e 
  //                confirmação de senha.
  //*************************************************************************************************************//
  function createUser() {
    const adminContainer = document.querySelector('.admin-container');
    adminContainer.innerHTML = `
      <form id="create-user-form">
        <div class="mb-4">
          <input
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text" id="new-username" placeholder="Nome do Usuário" required />
        </div>
        <div class="mb-4">
          <input
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="password" id="new-password" placeholder="Senha" required />
        </div>
        <div class="mb-4">
          <input
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="password" id="confirm-new-password" placeholder="Confirme a Senha" required />
        </div>
        <div class="mb-4">
          <label for="group-select" class="block text-gray-700 text-sm font-bold mb-2">Grupo do Usuário:</label>
          <select id="group-select" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <!-- Grupos serão carregados aqui -->
          </select>
        </div>
        <div class="flex space-x-2">
          <button type="submit" class="admin-button flex-1">Cadastrar</button>
          <button type="button" id="back-button" class="admin-button flex-1">Voltar</button>
        </div>
      </form>
    `;

    fetchGroupsForUserForm();

    document.getElementById('create-user-form').addEventListener('submit', function (event) {
      event.preventDefault();
      submitNewUser();
    });

    document.getElementById('back-button').addEventListener('click', userManager);
  }

  //*************************************************************************************************************//
  //     Título: Busca de Grupos
  //     Descrição: Faz a busca de grupos no banco para seleção na criação de usuário.
  //*************************************************************************************************************//
  function fetchGroupsForUserForm() {
    fetch('/get_groups')
      .then(response => response.json())
      .then(groups => {
        const groupSelect = document.getElementById('group-select');
        groupSelect.innerHTML = '';
        groups.forEach(group => {
          const option = document.createElement('option');
          option.value = group.name;
          option.textContent = group.name;
          groupSelect.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Erro ao buscar grupos:', error);
        showDialog('Erro ao carregar grupos. Por favor, tente novamente mais tarde.');
      });
  }

  //*************************************************************************************************************//
  //     Título: Submissão da criação de usuário
  //     Descrição: Faz o envio dos dados do novo usuário para a API.
  //*************************************************************************************************************//
  function submitNewUser() {
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    const groupUser = document.getElementById('group-select').value;

    if (!username || !password || !confirmPassword) {
      showDialog('Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      showDialog('As senhas não coincidem.');
      return;
    }

    const userData = {
      username: username,
      password: password,
      group_user: groupUser
    };

    fetch('/admin/create_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showDialog('Usuário cadastrado com sucesso.');
          userManager();
        } else {
          showDialog('Erro ao cadastrar usuário: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Erro ao cadastrar usuário:', error);
        showDialog('Erro ao cadastrar usuário. Por favor, tente novamente mais tarde.');
      });
  }

  //*************************************************************************************************************//
  //     Título: Cria página de Edição de Usuário
  //     Descrição: Nessa página temos um seletor de usuários criados com botão de deletá-lo ao lado, com
  //                possibilidade de editar ou não a senha, ajustar o grupo e torná-lo admin.
  //*************************************************************************************************************//
  function editUser() {
    const adminContainer = document.querySelector('.admin-container');
    adminContainer.innerHTML = `
      <form id="edit-user-form">
        <div class="mb-4 input-group">
          <select id="user-select" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <!-- Usuários serão carregados aqui -->
          </select>
          <button type="button" id="delete-user-button" class="delete-button">&times;</button>
        </div>
        <div class="mb-4">
          <input
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="password" id="edit-password" placeholder="Nova Senha" />
        </div>
        <div class="mb-4">
          <input
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="password" id="confirm-edit-password" placeholder="Confirme a Nova Senha" />
        </div>
        <div class="mb-4">
          <label for="edit-group-select" class="block text-gray-700 text-sm font-bold mb-2">Grupo do Usuário:</label>
          <select id="edit-group-select" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <!-- Grupos serão carregados aqui -->
          </select>
        </div>
        <div class="mb-4 flex items-center">
          <input type="checkbox" id="edit-admin-checkbox" class="mr-2 leading-tight">
          <label for="edit-admin-checkbox">Administrador</label>
        </div>
        <div class="flex space-x-2">
          <button type="submit" class="admin-button flex-1">Salvar Alterações</button>
          <button type="button" id="back-button" class="admin-button flex-1">Voltar</button>
        </div>
      </form>
    `;

    fetchUsersForEditForm();
    fetchGroupsForEditUserForm();

    document.getElementById('edit-user-form').addEventListener('submit', function (event) {
      event.preventDefault();
      submitUserEdits();
    });

    document.getElementById('delete-user-button').addEventListener('click', function () {
      const username = document.getElementById('user-select').value;
      if (!username) {
        showDialog('Por favor, selecione o usuário que deseja remover');
        return;
      }

      showDialog(`Tem certeza que deseja remover o usuário "${username}"?`, function () {
        deleteUser(username);
      });
    });

    document.getElementById('back-button').addEventListener('click', userManager);
  }

  //*************************************************************************************************************//
  //     Título: Deletar usuário
  //     Descrição: Função que permite que o Admin delete um usuário na página de edição de Usuário.
  //*************************************************************************************************************//
  function deleteUser(username) {
    fetch('/admin/delete_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showDialog('Usuário removido com sucesso.');
          editUser();
        } else {
          showDialog('Erro ao remover usuário: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Erro ao remover usuário:', error);
        showDialog('Erro ao remover usuário. Por favor, tente novamente mais tarde.');
      });
  }
  //*************************************************************************************************************//
  //     Título: Buscar usuários na Edição de Usuário
  //     Descrição: Faz a busca de usuários na janela de edição de usuários.
  //*************************************************************************************************************//
  function fetchUsersForEditForm() {
    fetch('/admin/get_users')
      .then(response => response.json())
      .then(users => {
        const userSelect = document.getElementById('user-select');
        userSelect.innerHTML = '';
        users.forEach(user => {
          const option = document.createElement('option');
          option.value = user.username;
          option.textContent = user.username;
          userSelect.appendChild(option);
        });
        userSelect.addEventListener('change', loadUserData);
        if (users.length > 0) {
          loadUserData();
        } else {
          document.getElementById('edit-group-select').innerHTML = '';
          document.getElementById('edit-admin-checkbox').checked = false;
        }
      })
      .catch(error => {
        console.error('Erro ao buscar usuários:', error);
        showDialog('Erro ao carregar usuários. Por favor, tente novamente mais tarde.');
      });
  }

  function fetchGroupsForEditUserForm() {
    fetch('/get_groups')
      .then(response => response.json())
      .then(groups => {
        const groupSelect = document.getElementById('edit-group-select');
        groupSelect.innerHTML = '';
        groups.forEach(group => {
          const option = document.createElement('option');
          option.value = group.name;
          option.textContent = group.name;
          groupSelect.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Erro ao buscar grupos:', error);
        showDialog('Erro ao carregar grupos. Por favor, tente novamente mais tarde.');
      });
  }

  function loadUserData() {
    const username = document.getElementById('user-select').value;

    if (!username) {
      document.getElementById('edit-group-select').value = '';
      document.getElementById('edit-admin-checkbox').checked = false;
      return;
    }

    fetch(`/admin/get_user_data?username=${encodeURIComponent(username)}`)
      .then(response => response.json())
      .then(user => {
        if (user) {
          document.getElementById('edit-group-select').value = user.group_user;
          document.getElementById('edit-admin-checkbox').checked = user.admin_type === 1;
        } else {
          showDialog('Usuário não encontrado.');
        }
      })
      .catch(error => {
        console.error('Erro ao carregar dados do usuário:', error);
        showDialog('Erro ao carregar dados do usuário. Por favor, tente novamente mais tarde.');
      });
  }

  function submitUserEdits() {
    const username = document.getElementById('user-select').value;
    const password = document.getElementById('edit-password').value;
    const confirmPassword = document.getElementById('confirm-edit-password').value;
    const groupUser = document.getElementById('edit-group-select').value;
    const isAdmin = document.getElementById('edit-admin-checkbox').checked ? 1 : 0;

    if (!username) {
      showDialog('Por favor, selecione um usuário.');
      return;
    }

    const userData = {
      username: username,
      group_user: groupUser,
      admin_type: isAdmin
    };

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        showDialog('As senhas não coincidem.');
        return;
      }
      if (!password || !confirmPassword) {
        showDialog('Por favor, preencha ambos os campos de senha.');
        return;
      }
      userData.password = password;
    }

    fetch('/admin/edit_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showDialog('Usuário atualizado com sucesso.');
          userManager();
        } else {
          showDialog('Erro ao atualizar usuário: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Erro ao atualizar usuário:', error);
        showDialog('Erro ao atualizar usuário. Por favor, tente novamente mais tarde.');
      });
  }

  //*************************************************************************************************************//
  //     Título: Página de Gerenciamento de Grupo
  //     Descrição: Fornece funcionalidade para criar novos grupos de usuários e editar os grupos.
  //*************************************************************************************************************//
  function groupManager() {
    const adminContainer = document.querySelector('.admin-container');
    adminContainer.innerHTML = '';

    const createGroupButton = document.createElement('button');
    createGroupButton.textContent = 'Criar Grupo';
    createGroupButton.className = 'admin-button';
    createGroupButton.addEventListener('click', createGroup);

    const editGroupButton = document.createElement('button');
    editGroupButton.textContent = 'Editar Grupo';
    editGroupButton.className = 'admin-button';
    editGroupButton.addEventListener('click', editGroup);

    adminContainer.appendChild(createGroupButton);
    adminContainer.appendChild(editGroupButton);

    const backButton = document.createElement('button');
    backButton.textContent = 'Voltar';
    backButton.className = 'admin-button';
    backButton.addEventListener('click', loadAdminInterface);

    adminContainer.appendChild(backButton);
  }

  //*************************************************************************************************************//
  //     Título: Criação de Grupo
  //     Descrição: Fornece funcionalidade para criar um grupo.
  //*************************************************************************************************************//
  function createGroup() {
    const adminContainer = document.querySelector('.admin-container');
    adminContainer.innerHTML = `
      <form id="create-group-form">
        <div class="mb-4 input-group">
          <input 
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
            type="text" id="new-group-name" placeholder="Nome do Grupo" required />
          <button type="button" id="confirm-add-group" class="confirm-button">&#10003;</button>
        </div>
        <button type="button" id="back-button" class="admin-button">Voltar</button>
      </form>
    `;

    document.getElementById('confirm-add-group').addEventListener('click', function () {
      const groupName = document.getElementById('new-group-name').value.trim();

      if (!groupName) {
        showDialog('Por favor, insira um nome para o grupo');
        return;
      }

      fetch('/create_group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_user: groupName })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            showDialog('Grupo criado com sucesso');
            groupManager();
          } else {
            showDialog('Erro ao criar grupo: ' + data.message);
          }
        })
        .catch(error => {
          console.error('Erro ao criar grupo:', error);
          showDialog('Erro ao criar grupo. Por favor, tente novamente mais tarde.');
        });
    });

    document.getElementById('back-button').addEventListener('click', groupManager);
  }
  //*************************************************************************************************************//
  //     Título: Edição de Grupo
  //     Descrição: Fornece funcionalidade para editar os grupos de usuários, incluindo remoção de grupos e 
  //     inserção de botões de status.
  //*************************************************************************************************************//
  function editGroup() {
    const adminContainer = document.querySelector('.admin-container');
    adminContainer.innerHTML = `
      <form id="edit-group-form">
        <div class="mb-4 input-group">
          <select id="existing-group-select" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <option value="">Selecione um grupo para renomear</option>
          </select>
          <button type="button" id="delete-button" class="delete-button">&times;</button>
        </div>
        <div class="mb-4 input-group">
          <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" id="new-group-name" placeholder="Novo Nome do Grupo" required />
          <button type="button" id="confirm-edit-group" class="confirm-button">&#10003;</button>
        </div>
        <div class="mb-4">
          <label for="status-buttons-select" class="block text-gray-700 text-sm font-bold mb-2">Botões de Status do Grupo:</label>
          <select id="status-buttons-select" multiple class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" size="5">
            <!-- Botões de status serão carregados aqui -->
          </select>
        </div>
        <div class="mb-4 input-group">
          <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" id="new-status-button" placeholder="Nome do Novo Botão de Status" />
          <button type="button" id="confirm-add-status" class="confirm-button">&#10003;</button>
        </div>
        <div class="mb-4 flex items-center">
          <input type="checkbox" id="note-status-type" class="mr-2 leading-tight">
          <label for="note-status-type">Requer Nota</label>
        </div>
        <button type="button" id="back-button" class="admin-button">Voltar</button>
      </form>
    `;

    fetchGroups();

    document.getElementById('existing-group-select').addEventListener('change', function () {
      const groupName = this.value;
      if (groupName) {
        fetchStatusButtons(groupName);
      } else {
        const statusSelect = document.getElementById('status-buttons-select');
        statusSelect.innerHTML = '';
      }
    });

    document.getElementById('confirm-edit-group').addEventListener('click', function () {
      const groupName = document.getElementById('existing-group-select').value.trim();
      const newGroupName = document.getElementById('new-group-name').value.trim();

      if (!groupName) {
        showDialog('Por favor, selecione um grupo para renomear.');
        return;
      }

      if (!newGroupName) {
        showDialog('Por favor, insira o novo nome do grupo.');
        return;
      }

      fetch('/edit_group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_user: groupName, new_group_user: newGroupName })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            showDialog('Grupo renomeado com sucesso.');
            groupManager();
          } else {
            showDialog('Erro ao renomear grupo: ' + data.message);
          }
        })
        .catch(error => {
          console.error('Erro ao renomear grupo:', error);
          showDialog('Erro ao renomear grupo. Por favor, tente novamente mais tarde.');
        });
    });

    document.getElementById('confirm-add-status').addEventListener('click', function () {
      addStatusButton();
    });

    const statusButtonsSelect = document.getElementById('status-buttons-select');
    statusButtonsSelect.addEventListener('dblclick', function () {
      const selectedOption = statusButtonsSelect.options[statusButtonsSelect.selectedIndex];
      if (selectedOption) {
        const statusButtonName = selectedOption.value;
        const groupName = document.getElementById('existing-group-select').value.trim();

        showDialog(`Tem certeza que deseja remover o botão de status "${statusButtonName}" do grupo "${groupName}"?`, function () {
          deleteStatusButton(groupName, statusButtonName);
        });
      }
    });

    document.getElementById('back-button').addEventListener('click', groupManager);

    document.getElementById('delete-button').addEventListener('click', function () {
      const groupName = document.getElementById('existing-group-select').value.trim();

      if (!groupName) {
        showDialog('Por favor, selecione o grupo que deseja remover');
        return;
      }

      showDialog(`Tem certeza que deseja remover o grupo "${groupName}"?`, function () {
        fetch('/delete_group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_user: groupName })
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              showDialog('Grupo removido com sucesso');
              groupManager();
            } else {
              showDialog('Erro ao remover grupo: ' + data.message);
            }
          })
          .catch(error => {
            console.error('Erro ao remover grupo:', error);
            showDialog('Erro ao remover grupo. Por favor, tente novamente mais tarde.');
          });
      });
    });
  }

  async function fetchGroups() {
    try {
      const response = await fetch('/get_groups');
      const groups = await response.json();
      const select = document.getElementById('existing-group-select');
      groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.name;
        option.textContent = group.name;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
    }
  }

  async function fetchStatusButtons(groupName) {
    try {
      const response = await fetch(`/get_status_buttons?group_user=${encodeURIComponent(groupName)}`);
      const statusButtons = await response.json();
      const statusSelect = document.getElementById('status-buttons-select');

      statusSelect.innerHTML = '';

      statusButtons.forEach(button => {
        const option = document.createElement('option');
        option.value = button.buttons;
        option.textContent = button.buttons + (button.note_status_type === 1 ? ' (Requer Nota)' : '');
        statusSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Erro ao buscar botões de status:', error);
      showDialog('Erro ao carregar botões de status.');
      closeDialog();
    }
  }

  function addStatusButton() {
    const groupName = document.getElementById('existing-group-select').value.trim();
    const statusButtonName = document.getElementById('new-status-button').value.trim();
    const noteStatusType = document.getElementById('note-status-type').checked ? 1 : 0;

    if (!groupName || !statusButtonName) {
      showDialog('Por favor, preencha o nome do grupo e do botão de status');
      return;
    }

    fetch('/add_status_button', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        group_user: groupName,
        buttons: statusButtonName,
        note_status_type: noteStatusType
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showDialog('Botão de status adicionado com sucesso');
          document.getElementById('new-status-button').value = '';
          document.getElementById('note-status-type').checked = false;
          fetchStatusButtons(groupName);
        } else {
          showDialog('Erro ao adicionar botão de status: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Erro ao adicionar botão de status:', error);
        showDialog('Erro ao adicionar botão de status. Por favor, tente novamente mais tarde.');
      });
  }

  function deleteStatusButton(groupName, statusButtonName) {
    fetch('/delete_status_button', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        group_user: groupName,
        buttons: statusButtonName
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showDialog('Botão de status removido com sucesso');

          fetchStatusButtons(groupName);
        } else {
          showDialog('Erro ao remover botão de status: ' + data.message);
        }

        closeDialog();
      })
      .catch(error => {
        console.error('Erro ao remover botão de status:', error);
        showDialog('Erro ao remover botão de status. Por favor, tente novamente mais tarde.');

        closeDialog();
      });
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
  async function loadUserInterface() {
    showLoading();
    removeSelectionScreen();

    const navbar = document.createElement('div');
    navbar.innerHTML = `
      <div class="bg-gray-800 text-white p-2">
        <div class="container flex justify-between items-center">
          <div class="dropdown">
            <button id="dropdownMenuButton" class="dropdown-button">☰</button>
            <div id="dropdownMenu" class="dropdown-menu hidden">
              <a href="#" id="ponto" class="dropdown-item">Ponto</a>
              <a href="#" id="intervalo" class="dropdown-item">Intervalo</a>
              <a href="#" id="tarefas" class="dropdown-item">Tarefas</a>
              <div class="separator"></div>
              <a href="#" id="alwaysOnTopButton" class="dropdown-item">Sempre no Topo</a>
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
    const intervaloButton = document.getElementById('intervalo');
    const tarefasButton = document.getElementById('tarefas');
    const logoutButton = document.getElementById('logout');

    dropdownButton.addEventListener('click', () => {
      dropdownMenu.classList.toggle('hidden');
    });

    window.addEventListener('click', function (e) {
      if (!dropdownButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.add('hidden');
      }
    });

    pontoButton.addEventListener('click', () => {
      loadPontoInterface();
      dropdownMenu.classList.add('hidden'); 
    });

    logoutButton.addEventListener('click', handleLogout);
    intervaloButton.addEventListener('click', handleBreakButton);

    tarefasButton.addEventListener('click', () => {
      loadTasksInterface();
      dropdownMenu.classList.add('hidden'); 
    });

    try {
      const response = await fetch('/status');
      const statusButtons = await response.json();
      hideLoading();
      addButtonsToButtonContainer(statusButtons);
      appContainer.style.display = 'block';
      loginContainer.style.display = 'none';
      await checkStartTimeOnLogin();
    } catch (error) {
      hideLoading();
      console.error('Erro ao buscar status:', error);
    }
  }

  async function checkStartTimeOnLogin() {
    try {
      const response = await fetch('/check_start_time', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.startTimeExists) {
        startTimeRegistered = true;
      } else {
        startTimeRegistered = false;
      }
    } catch (error) {
      console.error('Erro ao verificar start_time:', error);
      startTimeRegistered = false;
    }
  }

  async function handleBreakButton() {
    if (actionInProgress) {
      return;
    }
    actionInProgress = true;

    try {
      const response = await fetch('/register_break_start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.success) {
        showDialog('Início do intervalo registrado com sucesso.');
      } else {
        showDialog(`Aviso: ${data.message}`);
      }
    } catch (error) {
      console.error('Erro ao registrar início do intervalo:', error);
      showDialog('Erro ao registrar início do intervalo. Por favor, tente novamente.');
    } finally {
      actionInProgress = false;
    }
  }

  async function checkAndSetStartTime() {
    if (!startTimeRegistered) {
      const registerResponse = await fetch('/register_start_time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const registerData = await registerResponse.json();

      if (!registerData.success) {
        throw new Error(registerData.message);
      } else {
        startTimeRegistered = true;
      }
    }

  }

  async function checkAndSetBreakEnd() {
    const response = await fetch('/check_break_end', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (data.shouldSetBreakEnd) {
      breakEndRegistered = true;
      const registerResponse = await fetch('/register_break_end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const registerData = await registerResponse.json();

      if (!registerData.success) {
        throw new Error(registerData.message);
      } else {
        showDialog('Retorno do intervalo registrado com sucesso.');
      }
    }
  }

  async function registerEndTime() {
    const response = await fetch('/register_end_time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    } else {
      console.log('End time registrado com sucesso.');
    }
  }
  // **************************************************************************************************** //
  //     Título: Logout via navbar no Modo Usuário.
  //     Descrição: Caso o usuário esteja com uma tarefa ou botão de status ativo no momento, ao clicar
  //                no logout, é enviado para o servidor o tempo utilizado na ação setada.
  // **************************************************************************************************** //
  function handleLogout() {
    if (actionInProgress) {
      return;
    }

    actionInProgress = true;

    (async () => {
      try {
        if (startTime && currentStatus) {
          const endTime = new Date();
          const duration = Math.round((endTime - startTime) / 1000);

          if (!isNaN(duration)) {
            await updateStatusOnServer(currentStatus, duration);
          }

          startTime = null;
          currentStatus = '';
        }

        if (taskStartTime && currentTaskId) {
          const endTime = new Date();
          const duration = Math.round((endTime - taskStartTime) / 1000);

          if (!isNaN(duration)) {
            await updateTaskTimeOnServer(currentTaskId, duration);
          }

          taskStartTime = null;
          currentTaskId = null;
        }

        try {
          await registerEndTime();
        } catch (error) {
          console.error('Erro ao registrar end_time:', error);
        }
        loggedInUsername = '';
        startTimeRegistered = false;
        breakEndRegistered = false;
        createLoginContainer();
        loginContainer.style.display = 'flex';
        appContainer.innerHTML = '';
        appContainer.style.cssText = '';
        appContainer.style.display = 'none';

        await fetch('/logout', {
          method: 'GET',
          credentials: 'include'
        });

      } catch (error) {
        console.error('Erro ao processar logout:', error);
        showDialog('Erro ao processar logout. Por favor, tente novamente.');
      } finally {
        actionInProgress = false;
      }
    })();
  }

  // **************************************************************************************************** //
  //     Título: Logout por fechamento da Janela
  //     Descrição: Quando o usuário fecha a aplicação por outros meios (como clicar no "X"), 
  //                o aplicativo registra o status ou tarefa selecionados no momento, envia essas
  //                informações ao  servidor e só então permite que a aplicação seja encerrada.                
  // **************************************************************************************************** //
  window.electron.ipcRenderer.on('app-close', async () => {
    if (!loggedInUsername) {
      window.electron.ipcRenderer.send('app-closed');
      return;
    }

    if (actionInProgress) return;

    actionInProgress = true;

    try {
      if (startTime && currentStatus) {
        const endTime = new Date();
        const duration = Math.round((endTime - startTime) / 1000);

        if (!isNaN(duration) && duration > 0) {
          await updateStatusOnServer(currentStatus, duration);
        }

        startTime = null;
        currentStatus = '';
      }

      if (taskStartTime && currentTaskId) {
        const endTime = new Date();
        const duration = Math.round((endTime - taskStartTime) / 1000);

        if (!isNaN(duration) && duration > 0) {
          await updateTaskTimeOnServer(currentTaskId, duration);
        }

        taskStartTime = null;
        currentTaskId = null;
      }

      await registerEndTime();
      startTimeRegistered = false;
      breakEndRegistered = false;
      await fetch('/logout', { method: 'GET', credentials: 'include' });

      window.electron.ipcRenderer.send('app-closed');
    } catch (error) {
      console.error('Erro ao processar fechamento da aplicação:', error);
      showDialog('Erro ao fechar a aplicação. Por favor, tente novamente.');
    } finally {
      actionInProgress = false;
    }
  });

  // **************************************************************************************************** //
  //     Título: Carregar Interface de Tarefas
  //     Descrição: Exibe a interface de tarefas com a lista de tarefas e opção para criar novas.
  // **************************************************************************************************** //
  function loadTasksInterface() {
    const tasksModal = document.createElement('div');
    tasksModal.id = 'tasks-modal';
    tasksModal.className = 'modal';

    tasksModal.innerHTML = `
        <div class="modal-content">
            <span id="close-tasks-modal" class="close-button">&times;</span>
            <button id="create-task-button" class="task-button">Criar Tarefa</button>
            <div id="tasks-container"></div>
        </div>
    `;

    document.body.appendChild(tasksModal);

    document.getElementById('close-tasks-modal').addEventListener('click', closeTasksModal);
    document.getElementById('create-task-button').addEventListener('click', showCreateTaskForm);

    fetchUserTasks();
  }

  function closeTasksModal() {
    const tasksModal = document.getElementById('tasks-modal');
    if (tasksModal) {
      tasksModal.remove();
    }
  }

  // **************************************************************************************************** //
  //     Título: Exibir Formulário de Criação de Tarefa
  //     Descrição: Mostra o formulário para o usuário criar uma nova tarefa.
  // **************************************************************************************************** //
  function showCreateTaskForm() {
    const createTaskModal = document.createElement('div');
    createTaskModal.id = 'create-task-modal';
    createTaskModal.className = 'modal';

    createTaskModal.innerHTML = `
        <div class="modal-content">
            <span id="close-create-task-modal" class="close-button">&times;</span>
            <form id="create-task-form">
                <div class="mb-4">
                    <input type="text" id="task-summary" placeholder="Resumo da Tarefa" required class="input-field">
                </div>
                <div class="mb-4">
                    <textarea id="task-description" placeholder="Descrição da Tarefa" class="input-field"></textarea>
                </div>
                <div class="mb-4">
                    <label for="task-group">Grupo:</label>
                    <select id="task-group" class="input-field">
                        <!-- Grupos serão carregados aqui -->
                    </select>
                </div>
                <div class="mb-4">
                    <label for="task-assignee">Responsável:</label>
                    <select id="task-assignee" class="input-field">
                        <option value="">Selecione um usuário</option>
                        <!-- Usuários serão carregados aqui -->
                    </select>
                </div>
                <div class="flex space-x-2">
                    <button type="submit" class="admin-button flex-1">Criar Tarefa</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(createTaskModal);

    fetchGroupsForTaskForm();

    document.getElementById('create-task-form').addEventListener('submit', function (event) {
      event.preventDefault();
      submitNewTask();
    });

    document.getElementById('close-create-task-modal').addEventListener('click', closeCreateTaskModal);
  }

  function closeCreateTaskModal() {
    const createTaskModal = document.getElementById('create-task-modal');
    if (createTaskModal) {
      createTaskModal.remove();
    }
  }

  // **************************************************************************************************** //
  //     Título: Carregar Grupos para Formulário de Tarefas
  //     Descrição: Busca os grupos do banco de dados e popula o seletor no formulário.
  // **************************************************************************************************** //
  function fetchGroupsForTaskForm() {
    fetch('/get_groups')
      .then(response => response.json())
      .then(groups => {
        const groupSelect = document.getElementById('task-group');
        groupSelect.innerHTML = '';
        groups.forEach(group => {
          const option = document.createElement('option');
          option.value = group.name;
          option.textContent = group.name;
          groupSelect.appendChild(option);
        });

        groupSelect.addEventListener('change', function () {
          const selectedGroup = this.value;
          fetchUsersByGroup(selectedGroup);
        });

        if (groups.length > 0) {
          fetchUsersByGroup(groups[0].name);
        }
      })
      .catch(error => {
        console.error('Erro ao buscar grupos:', error);
        showDialog('Erro ao carregar grupos. Por favor, tente novamente mais tarde.');
      });
  }

  // **************************************************************************************************** //
  //     Título: Carregar Usuários por Grupo
  //     Descrição: Busca os usuários do grupo selecionado e popula o seletor de responsáveis.
  // **************************************************************************************************** //
  function fetchUsersByGroup(groupName) {
    fetch(`/get_users_by_group?group_user=${encodeURIComponent(groupName)}`)
      .then(response => response.json())
      .then(users => {
        const assigneeSelect = document.getElementById('task-assignee');
        assigneeSelect.innerHTML = '<option value="">Selecione um usuário</option>';
        users.forEach(user => {
          const option = document.createElement('option');
          option.value = user.username;
          option.textContent = user.username;
          assigneeSelect.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Erro ao buscar usuários do grupo:', error);
        showDialog('Erro ao carregar usuários. Por favor, tente novamente mais tarde.');
      });
  }

  // **************************************************************************************************** //
  //     Título: Submeter Nova Tarefa
  //     Descrição: Envia os dados da nova tarefa para o servidor e trata a resposta.
  // **************************************************************************************************** //
  function submitNewTask() {
    const summary = document.getElementById('task-summary').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const assignee = document.getElementById('task-assignee').value;
    const groupUser = document.getElementById('task-group').value;

    if (!summary || !groupUser || !assignee) {
      showDialog('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const taskData = {
      summary,
      description,
      assignee,
      group_user: groupUser
    };

    fetch('/tasks/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    })
      .then(response => response.json())
      .then(data => {
        if (data.message) {
          closeCreateTaskModal();
          fetchUserTasks();
        } else {
          showDialog('Erro ao criar tarefa: ' + data.error);
        }
      })
      .catch(error => {
        console.error('Erro ao criar tarefa:', error);
        showDialog('Erro ao criar tarefa. Por favor, tente novamente mais tarde.');
      });
  }

  // **************************************************************************************************** //
  //     Título: Buscar Tarefas do Usuário
  //     Descrição: Busca as tarefas atribuídas ao usuário logado e as exibe na interface.
  // **************************************************************************************************** //
  function fetchUserTasks() {
    fetch('/tasks/user')
      .then(response => response.json())
      .then(tasks => {
        const tasksContainer = document.getElementById('tasks-container');

        if (!tasksContainer) {
          return;
        }
        tasksContainer.innerHTML = '';

        if (tasks.length === 0) {
          tasksContainer.textContent = 'Nenhuma tarefa atribuída.';
          return;
        }

        tasks.forEach(task => {
          const taskElement = document.createElement('div');
          taskElement.className = 'task-item';

          let startButtonText = 'Iniciar Tarefa';
          let startButtonDisabled = false;

          if (currentTaskId === task.id && taskStartTime !== null) {
            startButtonText = 'Selecionado';
            startButtonDisabled = true;
          } else if (task.status === 'In Progress') {
            startButtonText = 'Continuar Tarefa';
            startButtonDisabled = false;
          }

          taskElement.innerHTML = `
            <h3>${task.summary}</h3>
            <p>${task.description}</p>
            <p>Status: ${task.status}</p>
            <div class="task-buttons">
              <button class="start-task-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${startButtonDisabled ? 'disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50' : ''}" data-task-id="${task.id}" ${startButtonDisabled ? 'disabled' : ''}>${startButtonText}</button>
              <button class="end-task-button" data-task-id="${task.id}">Encerrar</button>
            </div>
          `;
          tasksContainer.appendChild(taskElement);
        });

        const startTaskButtons = document.querySelectorAll('.start-task-button');
        startTaskButtons.forEach(button => {
          button.addEventListener('click', function () {
            const taskId = parseInt(this.getAttribute('data-task-id'), 10);

            if (this.textContent === 'Iniciar Tarefa' || this.textContent === 'Continuar Tarefa') {
              startTaskTimer(taskId);
              this.disabled = true;
              this.classList.add('disabled:bg-gray-400', 'disabled:cursor-not-allowed', 'disabled:opacity-50');
            }
          });
        });

        const endTaskButtons = document.querySelectorAll('.end-task-button');
        endTaskButtons.forEach(button => {
          button.addEventListener('click', function () {
            const taskId = parseInt(this.getAttribute('data-task-id'), 10);
            endTask(taskId);
          });
        });
      })
      .catch(error => {
        console.error('Erro ao buscar tarefas do usuário:', error);
        showDialog('Erro ao carregar tarefas. Por favor, tente novamente mais tarde.');
      });
  }

  // **************************************************************************************************** //
  //     Título: Iniciar Temporizador da Tarefa
  //     Descrição: Inicia a contagem de tempo para a tarefa selecionada, pausando o status atual.
  // **************************************************************************************************** //
  let taskStartTime = null;
  let currentTaskId = null;

  async function startTaskTimer(taskId) {
    if (actionInProgress) {
      showDialog('Já existe uma ação em progresso.');
      return;
    }

    actionInProgress = true;

    try {
      if (!startTimeRegistered) {
        await checkAndSetStartTime();
      }
      if (!breakEndRegistered) {
        await checkAndSetBreakEnd();
      }
      await handlePreviousStatus();
      await handleCurrentTask();

      const statusButtons = document.querySelectorAll('.status-btn');
      statusButtons.forEach(button => button.classList.remove('selected'));

      taskStartTime = new Date();
      currentTaskId = parseInt(taskId, 10);

      await updateTaskStatusOnServer(taskId, 'In Progress');
      await fetchUserTasks();
    } catch (error) {
      console.error('Erro ao iniciar a tarefa:', error);
      showDialog('Erro ao iniciar a tarefa. Por favor, tente novamente.');
    } finally {
      actionInProgress = false;
    }
  }

  // **************************************************************************************************** //
  //     Título: Atualizar Tempo da Tarefa no Servidor
  //     Descrição: Envia o tempo gasto na tarefa para o servidor.
  // **************************************************************************************************** //
  function updateTaskTimeOnServer(taskId, duration) {
    const data = {
      taskId,
      duration
    };

    return fetch('/tasks/update_time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(result => {
        if (result.message) {
          console.log('Tempo da tarefa atualizado com sucesso.');
        } else {
          console.error('Erro ao atualizar tempo da tarefa:', result.error);
        }
      })
      .catch(error => {
        console.error('Erro ao atualizar tempo da tarefa:', error);
      });
  }

  // **************************************************************************************************** //
  //     Título: Atualizar Status da Tarefa no Servidor
  //     Descrição: Envia o status da tarefa para o servidor.
  // **************************************************************************************************** //
  function updateTaskStatusOnServer(taskId, status) {
    const data = {
      taskId,
      status
    };

    return fetch('/tasks/update_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(result => {
        if (result.message) {
          console.log('Status da tarefa atualizado com sucesso.');
        } else {
          console.error('Erro ao atualizar status da tarefa:', result.error);
        }
      })
      .catch(error => {
        console.error('Erro ao atualizar status da tarefa:', error);
      });
  }

  // **************************************************************************************************** //
  //     Título: Encerrar tarefa
  //     Descrição: Encerra a tarefa nas tarefas disponíveis.
  // **************************************************************************************************** //
  function endTask(taskId) {
    if (actionInProgress) {
      showDialog('Já existe uma ação em progresso.');
      return;
    }
    actionInProgress = true;

    if (taskStartTime && currentTaskId === taskId) {
      const endTime = new Date();
      const duration = Math.round((endTime - taskStartTime) / 1000);

      updateTaskTimeOnServer(currentTaskId, duration)
        .then(() => {
          taskStartTime = null;
          currentTaskId = null;
          return updateTaskStatusOnServer(taskId, 'Done');
        })
        .then(() => {
          fetchUserTasks();
        })
        .catch(error => {
          console.error('Erro ao encerrar a tarefa:', error);
          showDialog('Erro ao encerrar a tarefa. Por favor, tente novamente.');
        })
        .finally(() => {
          actionInProgress = false;
        });
    } else {
      updateTaskStatusOnServer(taskId, 'Done')
        .then(() => {
          fetchUserTasks();
        })
        .catch(error => {
          console.error('Erro ao encerrar a tarefa:', error);
          showDialog('Erro ao encerrar a tarefa. Por favor, tente novamente.');
        })
        .finally(() => {
          actionInProgress = false;
        });
    }
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
  let actionInProgress = false;

  function setupStatusButtonEvents() {
    const statusButtons = document.querySelectorAll('.status-btn');

    statusButtons.forEach(button => {
      button.addEventListener('click', async function () {
        if (actionInProgress || this.classList.contains('selected')) {
          return;
        }

        actionInProgress = true;

        const newStatus = this.innerText;

        statusButtons.forEach(btn => btn.classList.remove('selected'));
        this.classList.add('selected');

        try {
          if (!startTimeRegistered) {
            await checkAndSetStartTime();
          }
          if (!breakEndRegistered) {
            await checkAndSetBreakEnd();
          }
          await handlePreviousStatus();

          await handleCurrentTask();

          startTime = new Date();
          currentStatus = newStatus;

          const response = await fetch(`/status/require-note?button=${encodeURIComponent(newStatus)}`);
          const data = await response.json();

          if (data.requireNote) {
            showNoteDialog(newStatus);
          }
        } catch (error) {
          console.error('Erro ao atualizar status ou tarefas:', error);
          showDialog('Erro ao atualizar. Por favor, tente novamente.');
        } finally {
          actionInProgress = false;
        }
      });
    });
  }

  async function handlePreviousStatus() {
    if (startTime && currentStatus) {
      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);

      if (isNaN(duration)) {
        console.error('Duração calculada é NaN');
        return;
      }

      await updateStatusOnServer(currentStatus, duration);
    }
  }

  async function handleCurrentTask() {
    if (taskStartTime && currentTaskId) {
      const endTime = new Date();
      const duration = Math.round((endTime - taskStartTime) / 1000);

      if (!isNaN(duration)) {
        await updateTaskTimeOnServer(currentTaskId, duration);
      }

      taskStartTime = null;
      currentTaskId = null;

      await fetchUserTasks();
    }
  }

  // **************************************************************************************************** //
  //     Título: Atualizar Status no Servidor
  //     Descrição: Envia os dados do status atual para o servidor.
  // **************************************************************************************************** //
  async function updateStatusOnServer(status, duration) {
    const statusData = {
      username: loggedInUsername,
      status: status,
      duration: duration,
    };

    const response = await fetch('/update_status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusData),
    });

    if (!response.ok) {
      throw new Error('Erro na resposta do servidor');
    }

    const text = await response.text();
    console.log(text);
  }

  //*************************************************************************************************************//
  //     Título: Mostrar Diálogo de Nota
  //     Descrição: Esta função exibe um diálogo para adicionar uma nota quando um status que requer um comentário
  //                é selecionado. Se o usuário tentar enviar a nota sem inserir um comentário, uma mensagem de 
  //                diálogo é exibida solicitando o comentário.
  //*************************************************************************************************************//
  let submitInProgress = false;

  function showNoteDialog(statusName) {
    const noteDialog = document.getElementById('note-dialog');
    const submitButton = document.getElementById('submit-note');
    const noteTextArea = document.getElementById('note-text');

    noteDialog.classList.remove('hidden');
    disableAllStatusButtons();

    submitButton.onclick = function () {
      if (submitInProgress) {
        return;
      }
      submitInProgress = true;
      submitButton.disabled = true;

      const noteText = noteTextArea.value.trim();
      if (noteText) {
        const noteData = {
          username: loggedInUsername,
          buttons: statusName,
          noteText: noteText
        };

        (async () => {
          try {
            const response = await fetch('/submit-note', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(noteData),
            });

            if (!response.ok) {
              throw new Error(`Erro: ${response.status} ${response.statusText}`);
            }

            console.log('Comentário submetido com sucesso');
            noteDialog.classList.add('hidden');
            noteTextArea.value = '';
          } catch (error) {
            console.error('Erro:', error);
          } finally {
            enableAllStatusButtons();
            submitInProgress = false;
            submitButton.disabled = false;
            actionInProgress = false;
          }
        })();
      } else {
        showDialog('Por favor, insira um comentário.');
        submitInProgress = false;
        submitButton.disabled = false;
      }
    };
  }

  //*************************************************************************************************************//
  //     Título: Desabilitar Todos os Botões de Status
  //     Descrição: Desabilita todos os botões de status para evitar múltiplas seleções enquanto se aguarda 
  //                uma ação do usuário.
  //*************************************************************************************************************//
  function disableAllStatusButtons() {
    const statusButtons = document.querySelectorAll('.status-btn');
    statusButtons.forEach(button => {
      if (!button.classList.contains('selected')) {
        button.disabled = true;
      }
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
  function setupAlwaysOnTopButtonEvent() {
    const alwaysOnTopButton = document.getElementById('alwaysOnTopButton');
    alwaysOnTopButton.addEventListener('click', function () {
      const shouldSetAlwaysOnTop = this.classList.toggle('toggle-on');
      window.electron.ipcRenderer.send('toggle-always-on-top', shouldSetAlwaysOnTop);
      dropdownMenu.classList.add('hidden'); 
    });
  }

  //*************************************************************************************************************//
  //     Título: Habilitar e desabilitar caixas de diálogo 
  //     Descrição: Habilitar a caixa de Diálogo no HTML para aparecer com a mensagem designada
  //     nas instruções das funções.
  //*************************************************************************************************************//
  function showDialog(message, confirmCallback) {
    const dialog = document.getElementById('custom-dialog');
    const messageElement = document.getElementById('dialog-message');
    const closeDialogButton = document.getElementById('close-dialog');
    const cancelDialogButton = document.getElementById('cancel-dialog');

    messageElement.textContent = message;
    dialog.classList.remove('hidden');

    closeDialogButton.onclick = function () {
      dialog.classList.add('hidden');
      if (typeof confirmCallback === 'function') {
        confirmCallback();
      }
    };

    cancelDialogButton.onclick = function () {
      dialog.classList.add('hidden');
    };
  }

  function closeDialog() {
    const dialog = document.getElementById('custom-dialog');
    dialog.classList.add('hidden');
  }
  document.getElementById('close-dialog').addEventListener('click', closeDialog);
});

function loadPontoInterface() {
  const pontoModal = document.createElement('div');
  pontoModal.id = 'ponto-modal';
  pontoModal.className = 'modal';

  pontoModal.innerHTML = `
    <div class="modal-content" style="max-width: 90%; overflow-x: auto;">
      <span id="close-ponto-modal" class="close-button static-close">&times;</span>
      <div id="ponto-container"></div>
    </div>
  `;

  document.body.appendChild(pontoModal);
  document.getElementById('close-ponto-modal').addEventListener('click', closePontoModal);
  fetchUserShifts();
}

function closePontoModal() {
  document.getElementById('ponto-modal')?.remove();
}

function fetchUserShifts() {
  fetch('/user_shifts')
    .then(response => response.json())
    .then(shifts => {
      const pontoContainer = document.getElementById('ponto-container');
      if (!pontoContainer) return;

      pontoContainer.innerHTML = shifts.length
        ? `
          <table class="ponto-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Entrada</th>
                <th>Ida Intervalo</th>
                <th>Volta Intervalo</th>
                <th>Saída</th>
              </tr>
            </thead>
            <tbody>
              ${shifts.map(shift => `
                <tr>
                  <td>${formatDate(shift.date)}</td>
                  <td>${shift.start_time || '-'}</td>
                  <td>${shift.break_start || '-'}</td>
                  <td>${shift.break_end || '-'}</td>
                  <td>${shift.end_time || '-'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        `
        : 'Nenhum registro de ponto encontrado.';
    })
    .catch(error => {
      console.error('Erro ao buscar pontos do usuário:', error);
      showDialog('Erro ao carregar pontos. Por favor, tente novamente mais tarde.');
    });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
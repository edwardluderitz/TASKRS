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
            <a href="#" id="tarefas" class="dropdown-item">Tarefas</a>
            <a href="#" id="configuracoes" class="dropdown-item">Configurações</a>
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
      showDialog('Ponto clicked');
    });

    tarefasButton.addEventListener('click', () => {
      showDialog('Tarefas clicked');
    });

    configuracoesButton.addEventListener('click', () => {
      showDialog('Configurações clicked');
    });

    try {
      const response = await fetch('/status');
      const statusButtons = await response.json();
      hideLoading();
      addButtonsToButtonContainer(statusButtons);
      appContainer.style.display = 'block';
      loginContainer.style.display = 'none';
    } catch (error) {
      hideLoading();
      console.error('Erro ao buscar status:', error);
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
        disableAllStatusButtons();
  
        const newStatus = this.innerText;
  
        statusButtons.forEach(btn => btn.classList.remove('selected'));
        this.classList.add('selected');
  
        try {
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
  
            startTime = new Date();
          }
  
          currentStatus = newStatus;
  
          const response = await fetch(`/status/require-note?button=${encodeURIComponent(newStatus)}`);
          const data = await response.json();
  
          if (data.requireNote) {
            showNoteDialog(newStatus);
          }
        } catch (error) {
          console.error('Erro ao atualizar status ou verificar necessidade de nota:', error);
          showDialog('Ocorreu um erro. Por favor, tente novamente.');
        } finally {
          enableAllStatusButtons();
          actionInProgress = false;
        }
      });
    });
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
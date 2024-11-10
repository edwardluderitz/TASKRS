# TASKRS: Seu Aliado no Gerenciamento Inteligente de Equipes

TASKRS é uma ferramenta para monitoramento, organização e gestão de atividades em equipes remotas e presenciais. Este projeto utiliza uma interface simples, integrando tecnologias de ponta para garantir eficiência no gerenciamento.

---

## **Tecnologias Utilizadas**
- **Electron**: Framework para criar aplicações desktop multiplataforma usando JavaScript, HTML e CSS.
- **Node.js**: Plataforma para construção do backend, garantindo escalabilidade e performance.
- **Express**: Framework web usado no servidor backend.
- **MySQL**: Banco de dados relacional hospedado em [db4free.net](https://db4free.net/).
- **Tailwind CSS**: Framework CSS utilitário para estilização responsiva.

---

## **Configuração do Ambiente**

### 1. **Pré-requisitos**
- Instale o [Node.js](https://nodejs.org/pt) e o NPM.
- Verifique a versão instalada com:
  ```
  node -v
  npm -v
  ```

### 2. **Clonando o Repositório**
- Verifique a versão instalada com:
  ```
  git clone https://github.com/edwardluderitz/TASKRS.git
  ```

### 3. **Configuração das Variáveis de Ambiente**
- Crie um arquivo .env na raiz do projeto com o seguinte conteúdo:
  ```
  DB_HOST=<IP do Banco de Dados>
  DB_USER=<Usuário do Banco>
  DB_PASSWORD=<Senha do Banco>
  DB_NAME=<Nome do Banco>
  PORT=3000
  SESSION_SECRET=<Chave Secreta>
  ```
### 4. **Instalando Dependências**
- Navegue até o diretório do projeto e execute:
  ```
  npm install
  ```
  
### 5. **Executando a Aplicação**
- Para iniciar como aplicação desktop (Electron):
  ```
  npm start
  ```
- Para iniciar como aplicação web (somente servidor):
  ```
  node server.js
  ```

---

## Principais Arquivos
### **Frontend**
- **index.html**: Página inicial da aplicação, carrega os estilos do Tailwind e a lógica do script.js.
- **script.js**: Gerencia a interface do usuário, incluindo login, seleção de status e interações dinâmicas.
- **output.css**: Gerado automaticamente pelo TailWind CSS conforme edição do style.css com as classes utilitárias.
- **style.css**: Estilos customizados para complementar o Tailwind.

### **Backend**
- **server.js**: Configura o servidor Express, define rotas para login, gerenciamento de status e interações do usuário, além de gerenciar conexões com o banco de dados MySQL.

### **Arquivos Utilitários**
- **main.js**: Arquivo responsável por configurar e gerenciar a janela principal da aplicação. Ele define o ciclo de vida da aplicação, como inicialização, exibição da interface e encerramento.
- **preload.js**: Atua como uma ponte segura entre o processo principal (backend) e o processo de renderização (frontend), permitindo comunicação limitada e protegida entre eles.
- **tailwind.config.js**: Arquivo de configuração para personalização do Tailwind CSS, onde você pode ajustar temas, cores e outros estilos utilitários.

---

## **Observação importante**
- O arquivo script.js é ofuscado ao executar com a ferramenta [JavaScript Obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator) para preservar o sigilo do código e dos dados da aplicação para o usuário, não sendo possível ler via Navegador. Ao empacotar o arquivo para uma aplicação desktop, esse processo de ofuscação deve ser realizado diretamente no arquivo raiz, sem necessidade de tratativas adicionais via código. Será utilizado também o Terser para reduzir o tamanho do arquivo, eliminando dados desnecessários para a execução do código.

---

## **Status do Projeto**
🚧 **Em Desenvolvimento**  

---

## **Contato**

Caso tenha dúvidas ou precise de suporte, entre em contato:

- **Autor**: Edward Lüderitz
- **E-mail**: edluder@gmail.com
- **LinkedIn**: [Edward Lüderitz](https://www.linkedin.com/in/edwardluderitz/)

---

### **Obrigado por usar o TASKRS!**
💡 _Acompanhe, gerencie e otimize sua equipe com facilidade e eficiência!_

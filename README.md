# Valette Barbearia (MVP)

Uma landing page e sistema de agendamentos estático para a Valette Barbearia, usando HTML, CSS, JS + Bootstrap e Netlify Functions para armazenar dados em JSON.

> **Stack:** Static site + Netlify Functions
> **Design:** Retrô, paleta preto/vermelho/branco, tipografia marcante.

---

## 📂 Estrutura do projeto

barbearia-mvp/
├── public/                 # Front-end estático
│   ├── index.html          # Landing page
│   ├── agendamentos.html   # Fluxo de agendamento
│   ├── horarios.html       # Horários de funcionamento
│   ├── clientes.html       # Depoimentos e galeria
│   ├── espaco.html         # Tour pelo espaço + mapa
│   ├── barbeiro.html       # Perfis e avaliações de barbeiros
│   ├── css/                # Styles específicos por página
│   ├── js/                 # Scripts por página + include.js
│   └── assets/             # Imagens, ícones, logos
│       ├── img/
│       └── icons/
│
├── netlify/
│   └── functions/          # Netlify Functions (get/set JSON)
│       ├── getHorarios.js
│       ├── setHorarios.js
│       ├── getAgendamentos.js
│       └── setAgendamentos.js
│
├── netlify.toml            # Configuração de deploy
├── README.md               # Você está aqui 👋
└── .gitignore

---

## 🚀 Como rodar localmente

1. Clone este repositório
   git clone [https://github.com/seu-usuario/barbearia-mvp.git](https://github.com/seu-usuario/barbearia-mvp.git)
   cd barbearia-mvp

2. Instale o Netlify CLI (opcional, mas útil para testar funções)
   npm install -g netlify-cli

3. Inicie o servidor local com suporte a Functions
   netlify dev

   * Site: [http://localhost:8888](http://localhost:8888)
   * Functions: [http://localhost:8888/.netlify/functions/](http://localhost:8888/.netlify/functions/)

4. Abra as páginas no navegador:
   /index.html
   /agendamentos.html
   /horarios.html
   etc.

---

## ☁️ Deploy no Netlify

1. Commit e push no seu GitHub/GitLab/Bitbucket

2. No painel do Netlify clique em **New site from Git**

3. Aponte para este repositório

4. O Netlify detecta automaticamente o `netlify.toml`:

   \[build]
   publish   = "public"
   functions = "netlify/functions"

5. Clique em **Deploy**

6. Pronto! Seu site e suas serverless functions estarão no ar.

---

## 🎨 Design & Customização

* **Paleta de cores**

  * Primária: #b8001f (vermelho)
  * Secundária: #111 (preto) e #fff (branco)

* **Tipografia**

  * Logo/Títulos: Staatliches
  * Texto: Roboto

* **CSS modular**: cada página em css/\*.css

* **Partial header/footer**: incluídos via js/include.js

---

## 🔧 Netlify Functions

* getHorarios.js        – lista horários
* setHorarios.js        – cria/edita horário
* getAgendamentos.js    – lista agendamentos
* setAgendamentos.js    – registra um novo agendamento

**Nota:** Dados armazenados em JSON no filesystem — ideal para MVP, mas considere migrar para um banco de dados em produção.

---

## 📝 Contribuições

1. Abra uma issue ou pull request
2. Siga o padrão de código e arquitetura modular
3. Escreva mensagens de commit claras e descritivas

---

## 📜 Licença

Este projeto está licenciado sob a MIT License. Veja LICENSE para mais detalhes.

---

## 👤 Autor

* **Weberton** – Proprietário e idealizador do MVP
* **Você** – Desenvolvedor(a) e designer do front-end

Obrigado por testar e usar este MVP! Fique à vontade para sugerir melhorias ou abrir issues.

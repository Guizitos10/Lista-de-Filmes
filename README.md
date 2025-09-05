# Lista-de-Filmes

# 🎬 MovieFinder — App em React (OMDb)

Este é um projeto React que consome a **API do OMDb** para buscar filmes, exibir detalhes e permitir que o usuário monte sua lista de favoritos (persistida em `localStorage`).

## 🚀 Funcionalidades

* **Busca de filmes** (título, ano, pôster)
* **Paginação** dos resultados (10 por página)
* **Detalhes do filme** (diretor, elenco, sinopse, avaliação)
* **Lista de favoritos** (adicionar/remover, persistência em localStorage)
* **Tratamento de loading e erros**
* **Configuração de API Key** dentro do app

## 📋 Pré-requisitos

* Node.js (>= 16)
* NPM ou Yarn

## 🛠️ Como rodar o projeto

1. Clone este repositório:

   ```bash
   git clone https://github.com/seuusuario/moviefinder.git
   cd moviefinder
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

   ou

   ```bash
   yarn install
   ```

3. Inicie o servidor de desenvolvimento:

   ```bash
   npm start
   ```

   ou

   ```bash
   yarn start
   ```

4. Abra no navegador:

   ```
   http://localhost:3000
   ```

## 🔑 Configurando a API Key do OMDb

1. Crie uma conta gratuita no site oficial: [OMDb API](https://www.omdbapi.com/apikey.aspx)
2. Copie sua **API Key**.
3. No app, clique em **"Inserir API Key"** no topo e cole a chave.
4. A chave ficará salva em `localStorage`.

## 📦 Build para produção

```bash
npm run build
```

O build ficará disponível na pasta `build/`.

## 🖼️ Tecnologias usadas

* React 18
* Tailwind CSS (estilização)
* OMDb API
* LocalStorage

## 📄 Licença

Este projeto é open-source, você pode usar e modificar livremente.

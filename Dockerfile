# 🏗️ Etapa 1: Build do Frontend (React)
FROM node:18 AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# 🏗️ Etapa 2: Configurar o Backend (Node.js)
FROM node:18 AS backend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
WORKDIR /app/server
EXPOSE 5000
CMD ["node", "server.js"]

# 🚀 Etapa 3: Criar o Contêiner Final e Rodar Ambos
FROM nginx:latest
COPY --from=frontend /app/dist /usr/share/nginx/html
COPY --from=backend /app/server /server
COPY ./nginx.conf /etc/nginx/nginx.conf
EXPOSE 80 5000
CMD ["nginx", "-g", "daemon off;"]

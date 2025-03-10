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

# 🔹 Criando um nginx.conf direto no contêiner
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri /index.html; \
    } \
    location /api/ { \
        proxy_pass http://localhost:5000/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
    } \
}' > /etc/nginx/nginx.conf

EXPOSE 80 5000
CMD ["nginx", "-g", "daemon off;"]

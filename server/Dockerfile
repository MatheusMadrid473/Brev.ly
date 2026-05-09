# Estágio de Build
FROM node:20-alpine AS build

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./
RUN npm install

# Copia o restante dos arquivos e gera o build (dist)
COPY . .
RUN npm run build

# Estágio de Produção (Imagem mais leve)
FROM node:20-alpine

WORKDIR /app

# Copia apenas o necessário do estágio de build
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Expõe a porta que definimos no server.ts
EXPOSE 3333

# Comando para rodar a aplicação
CMD ["node", "dist/server.js"]
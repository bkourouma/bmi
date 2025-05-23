# Utilise une image officielle Node LTS (ex: 20)
FROM node:20

# Crée un répertoire de travail
WORKDIR /app

# Copie package.json et package-lock.json
COPY package*.json ./

# Installe les dépendances
RUN npm install

# Copie tout le code
COPY . .

# Build Tailwind (si tu buildes)
# RUN npm run build

# Expose le port de dev React
EXPOSE 3000

# Lance le serveur de développement
CMD ["npm", "start"]

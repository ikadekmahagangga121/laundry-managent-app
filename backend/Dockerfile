FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* npm-shrinkwrap.json* ./
RUN npm ci --only=production || npm install --only=production
COPY src ./src
COPY .env.example ./.env.example
RUN mkdir -p uploads
ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/app.js"]


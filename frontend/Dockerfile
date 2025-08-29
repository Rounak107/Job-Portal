# frontend/Dockerfile (for Vite)
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM nginx:alpine
# use our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# serve the Vite build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

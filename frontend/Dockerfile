# frontend/Dockerfile
FROM node:22-alpine as build
WORKDIR /app

COPY package*.json ./
# Use legacy peer deps to bypass React 18 conflicts
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

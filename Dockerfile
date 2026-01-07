# ===== Build stage =====
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./
# Pick one of npm/pnpm/yarn. Default here: npm
RUN npm ci

# Copy source
COPY . .

# Build-time env for Vite
# ARG VITE_GOOGLE_MAPS_API_KEY
# ARG VITE_GOOGLE_MAPS_ID
# Pass key as build ARG so Vite can inline it
# ARG VITE_GOOGLE_MAPS_API_KEY
# ARG VITE_GOOGLE_MAPS_ID
# ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
# ENV VITE_GOOGLE_MAPS_ID=$VITE_GOOGLE_MAPS_ID
# We'll use /api as the base because nginx will proxy to the backend
#ARG VITE_API_BASE="/api"
ARG VITE_API_URL

# Make these available to Vite build
# ENV VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}
# ENV VITE_GOOGLE_MAPS_ID=${VITE_GOOGLE_MAPS_ID}
#ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ===== Nginx stage =====
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config with /api proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# simple health endpoint
RUN printf "ok" > /usr/share/nginx/html/healthz

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

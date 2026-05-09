# ── Frontend Dockerfile (Multi-stage build) ──
#
# Stage 1: Build the React app into static files
# Stage 2: Serve those files with Nginx
#
# Why multi-stage?
# The final image only has Nginx + built files (~25MB)
# Instead of Node.js + all node_modules (~500MB)

# ── Stage 1: Build ───────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

# This creates a /app/build folder with HTML, CSS, JS files
RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────
FROM nginx:alpine

# Copy built React files into Nginx's web root
COPY --from=builder /app/build /usr/share/nginx/html

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

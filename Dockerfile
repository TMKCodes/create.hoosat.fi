# Build stage: install dependencies and create the production build.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage: webpack bundles the server and its dependencies into build/server.js,
# so the image only needs the build folder and package.json ("type": "module").
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3070
COPY --from=build /app/package.json ./
COPY --from=build /app/build ./build
# The server writes .nonce into the working directory and refreshes build/public/sitemap.xml.
# data/ holds the dependency check state; mount a volume there so it survives redeploys.
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 3070
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -qO- http://127.0.0.1:3070/api/health || exit 1
CMD ["node", "build/server.js"]

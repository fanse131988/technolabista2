# Image du serveur en ligne TechnoLAB-ISTA (Railway, Fly.io, VPS, Cloud Run…)
FROM node:20-alpine

WORKDIR /app
COPY admin-server/package.json ./package.json
COPY admin-server/server.js ./server.js
COPY index.html ./index.html

ENV NODE_ENV=production \
    PORT=8080 \
    DATA_DIR=/data \
    SITE_FILE=/app/index.html

VOLUME ["/data"]
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1

CMD ["node", "server.js"]

FROM node:22-bookworm-slim

WORKDIR /app

# Child Work installers verify locked packages with curl before installing.
RUN apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

# Seed the root dependency volume in the image. Each Work keeps its own named
# node_modules volume so Linux dependencies never leak into the macOS checkout.
COPY package.json package-lock.json ./
RUN npm ci

EXPOSE 4173

CMD ["npm", "run", "dev", "--", "--port", "4173"]

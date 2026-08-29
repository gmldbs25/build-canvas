FROM node:22-bookworm-slim

WORKDIR /app

# Keep dependency installation in the Linux image. At runtime this directory is
# mounted as a named volume, so macOS never receives a node_modules directory.
COPY package.json package-lock.json ./
RUN npm ci

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# Stage 1: Build Rust WASM
FROM rust:latest as wasm-builder

WORKDIR /app

# Install required system packages
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Add wasm32 target for Rust
RUN rustup target add wasm32-unknown-unknown

# Download wasm-pack binary instead of compiling it
RUN curl -L https://github.com/rustwasm/wasm-pack/releases/download/v0.13.1/wasm-pack-v0.13.1-x86_64-unknown-linux-musl.tar.gz \
  | tar -xz && mv wasm-pack*/wasm-pack /usr/local/bin/

COPY ./src/wasm /app/wasm
RUN cd /app/wasm && wasm-pack build --target web


# Stage 2: Build React App with Vite
FROM node:20 as frontend-builder

WORKDIR /app

# Copy package.json and package-lock.json first to cache npm install
COPY package*.json ./
RUN npm install

# Copy the rest of the files
COPY . .

# Copy generated WASM pkg from previous stage
COPY --from=wasm-builder /app/wasm/pkg ./src/wasm/pkg

RUN npm run build

# Stage 3: Serve static build
FROM node:20-alpine as production

WORKDIR /app
RUN npm install -g serve

COPY --from=frontend-builder /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]

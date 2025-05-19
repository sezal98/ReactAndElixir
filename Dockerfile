FROM hexpm/elixir:1.18.3-erlang-27.3.2-alpine-3.20.6

# Install build dependencies
RUN apk add --no-cache bash git build-base inotify-tools

# Set working directory
WORKDIR /app

# Copy backend code
COPY ./backend /app

# Install Elixir dependencies
RUN mix local.hex --force && \
    mix local.rebar --force && \
    mix deps.get

# Default command
CMD ["mix", "run", "--no-halt"]

import Config

if config_env() == :prod do
  port = String.to_integer(System.get_env("PORT") || "4000")

  config :invideoaibackend, :http_config,
    ip: {0, 0, 0, 0},
    port: port
end

  # If using Plug or your own TCP server, bind to `0.0

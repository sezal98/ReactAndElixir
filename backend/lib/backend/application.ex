Dotenv.load()

defmodule Backend.Application do
  use Application

  def start(_type, _args) do
    port = String.to_integer(System.get_env("PORT") || "4000")
    IO.puts("🚀 Starting server on 0.0.0.0:#{port}")
    
    children = [
      {Finch, name: MyFinch},
      {
        Plug.Cowboy,
        scheme: :http,
        plug: Backend.Router,
        options: [ip: {0, 0, 0, 0}, port: port]
      }
    ]

    opts = [strategy: :one_for_one, name: Backend.Supervisor]
    Supervisor.start_link(children, opts)
  end

end

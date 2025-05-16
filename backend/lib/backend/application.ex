Dotenv.load()

defmodule Backend.Application do
  use Application

  def start(_type, _args) do
    children = [
      {Finch, name: MyFinch},
      {Plug.Cowboy, scheme: :http, plug: Backend.Router, options: [port: 4000]}
    ]

    opts = [strategy: :one_for_one, name: Backend.Supervisor]
    Supervisor.start_link(children, opts)
  end
end

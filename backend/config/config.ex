import Config

config :backend, :openai_api_key, System.get_env("OPENAI_API_KEY")
config :backend, :openai_api_key, System.get_env("OPENAI_API_KEY_SEZAL")


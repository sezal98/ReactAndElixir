defmodule Backend.Router do
  use Plug.Router
  require Logger

  plug Plug.Logger
  plug Plug.Parsers, parsers: [:json], json_decoder: Jason
  plug :match
  plug Corsica, origins: "*", allow_headers: ["content-type"]
  plug :dispatch

  post "/api/shader" do
    %{"prompt" => prompt} = conn.body_params

    Logger.info("Received prompt: #{prompt}")
    shader_code = get_shader_from_llm(prompt)

    send_resp(conn, 200, Jason.encode!(%{shader_code: shader_code}))
  end


  match _ do
    send_resp(conn, 404, "Not found")
  end

  defp get_hardcoded_shader(_prompt) do
    """
    #version 330 core

    out vec4 FragColor;

    void main()
    {
        // Setup the vertices of the cube
        vec3 vertices[8];
        vertices[0] = vec3(-0.5, -0.5, -0.5);
        vertices[1] = vec3( 0.5, -0.5, -0.5);
        vertices[2] = vec3( 0.5,  0.5, -0.5);
        vertices[3] = vec3(-0.5,  0.5, -0.5);
        vertices[4] = vec3(-0.5, -0.5,  0.5);
        vertices[5] = vec3( 0.5, -0.5,  0.5);
        vertices[6] = vec3( 0.5,  0.5,  0.5);
        vertices[7] = vec3(-0.5,  0.5,  0.5);
        
        // Rotate the cube around the Y-axis
        float theta = radians(45.0);
        mat3 rotationMat = mat3(
            vec3(cos(theta), 0.0, sin(theta)),
            vec3(0.0, 1.0, 0.0),
            vec3(-sin(theta), 0.0, cos(theta))
        );

        // Get the normalized fragment position
        vec2 uv = gl_FragCoord.xy / vec2(800.0, 600.0);

        // Rotate the fragment position using the rotation matrix
        vec3 fragPos = vec3(uv - 0.5, 0.0);
        fragPos = rotationMat * fragPos;

        // Map the fragment position to the cube vertices
        float minDist = distance(fragPos, vertices[0]);
        for(int i = 1; i < 8; i++) {
            minDist = min(minDist, distance(fragPos, vertices[i]));
        }

        // Define a color based on the distance to the cube vertices
        vec3 color = vec3(0.0, 0.0, 0.0);
        if(minDist < 0.1) {
            color = vec3(1.0, 1.0, 1.0);
        }

        FragColor = vec4(color, 1.0);
    }
    """
  end

  defp get_shader_from_llm(prompt) do
    api_key = System.get_env("OPENAI_API_KEY_SEZAL")
    Logger.info("API KEY: #{api_key}")

    body = %{
      model: "gpt-3.5-turbo",
      messages: [
        %{
          role: "system",
          content: """
            You are a GLSL shader expert specializing in writing WebGL 1.0-compatible vertex and fragment shaders using GLSL ES 1.00.

            Always assume a 3D scene unless otherwise specified.

            Requirements:
            - Do NOT use any `#version` directive.
            - Use `gl_FragColor` in the fragment shader.
            - Use `attribute` and `varying` (NOT `in` / `out`).
            - Include `precision mediump float;` at the top of the fragment shader.
            - Vertex shaders MUST support 3D rendering using:
              - `attribute vec3 position`
              - `uniform mat4 model`, `view`, and `projection` matrices
              - Use `gl_Position = projection * view * model * vec4(position, 1.0);`
            - Vertex shader should compute and pass `varying` values to the fragment shader (e.g., color, position, lighting)
            - Fragment shaders should consume `varying` data and compute final color with `gl_FragColor`
            - Animation is needed for proper display
            - Always set fragPosition = (model * vec4(position, 1.0)).xyz in the vertex shader to ensure fragment shading reflects real-world position.

            Output must:
            - Be fully WebGL 1.0 compatible
            - Use only syntax and features allowed by GLSL ES 1.00
            - Be formatted as two code blocks: one for the vertex shader, one for the fragment shader

            Avoid:
            - Modern keywords like `layout`, `in`, `out`, or `#version`
            - Optimizations that remove unused variables or reduce readability

            The shaders should visually represent the idea described in the prompt, ideally using lighting, color gradients, or animated transforms.
          """
        },
        %{
          role: "user",
          content: """
            Write both a WebGL 1.0-compatible vertex and fragment shader using GLSL ES 1.00 only. The shaders should be based on this prompt: #{prompt}. 
            Return the output in the following format exactly:
              Vertex Shader: ```glsl  // vertex shader code here ```
              Fragment Shader: ```glsl // fragment shader code here ```
          """
        }
      ]
    }

    headers = [
      {"Authorization", "Bearer #{api_key}"},
      {"Content-Type", "application/json"}
    ]

    case Req.post(
         url: "https://api.openai.com/v1/chat/completions",
         headers: headers,
         json: body
       ) do
      {:ok, response} ->
        # Now it's safe to call this inside the match
        handle_openai_response(response)

      {:error, %Mint.TransportError{reason: :timeout}} ->
        Logger.error("OpenAI API request timed out.")
        "// Error: API timeout"

      {:error, error} ->
        Logger.error("OpenAI API request failed: #{inspect(error)}")
        "// Error: API request failed"
    end
  end

  defp handle_openai_response(response) do
    IO.inspect(response.body, label: "OpenAI Response Body")

    case response.body do
      %{"choices" => [%{"message" => %{"content" => shader_code}} | _]} ->
        shader_code

      _ ->
        "// Error: Unexpected OpenAI response format"
    end
  end
end

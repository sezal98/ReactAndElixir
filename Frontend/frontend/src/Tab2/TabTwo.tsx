import React, { useEffect, useRef, useState } from 'react';

const TabTwo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [description, setDescription] = useState('');
  const [shaderCode, setShaderCode] = useState<string | null>(null);
  const [vertexShaderSource, setVertexShader] = useState("");
  //const vertexShaderSource = "attribute vec3 position;\nattribute vec3 normal;\n\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\n\nvarying vec3 vNormal;\n\nvoid main() {\n  vNormal = normal;\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);\n}";
  //const fragmentShaderSource = "precision mediump float;\nvoid main() {\n  // he color to the fragment\n  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n}";
  const [fragmentShaderSource, setFragmentShader] = useState("");
  const [loading, setLoading] = useState(false);
  //const shaderCodeHardcoded = "precision mediump float;\n\nvarying vec2 v_position;\n\nvoid main() {\n    // Define gradient colors\n    vec3 color1 = vec3(0.9, 0.5, 0.2); // Orange\n    vec3 color2 = vec3(0.2, 0.3, 0.7); // Blue\n    \n    // Calculate background gradient\n    vec3 backgroundColor = mix(color1, color2, v_position.y);\n    \n    // Output final color\n    gl_FragColor = vec4(backgroundColor, 1.0);\n}";
  //const shaderCodeHardcoded = "precision mediump float;\n\nuniform float time;\nuniform vec2 resolution;\n\nvoid main() {\n    // Normalize the coordinates to the range [-1, 1]\n    vec2 uv = gl_FragCoord.xy / resolution - 0.5;\n    \n    // Rotate the cube around the y-axis based on time\n    float angle = time;\n    float c = cos(angle);\n    float s = sin(angle);\n    \n    mat2 rotation = mat2(c, -s, s, c);\n    \n    vec3 cubePosition = vec3(uv, 0.0);\n    cubePosition.xy = rotation * cubePosition.xy;\n    \n    // Calculate the fragment color based on the cube position\n    vec3 color = abs(cubePosition);\n    \n    gl_FragColor = vec4(color, 1.0);\n}";

  const handleGenerateShader = async () => {
    setLoading(true);
    setShaderCode(null);

    try {
      const response = await fetch('http://localhost:4000/api/shader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: description }),
      });

      const data = await response.json();
      const rawShaderFromChatGPT = data.shader_code;
      console.log("Raw Shader from ChatGPT:", rawShaderFromChatGPT);
      extractShaders(rawShaderFromChatGPT);
      setShaderCode(rawShaderFromChatGPT);
    } catch (err) {
      console.error('Error fetching shader:', err);
      setShaderCode('// Error generating shader');
    } finally {
      setLoading(false);
    }
  };

  const extractShaders = (shaderCode: string) => {
      const regex = /```glsl\s*([\s\S]*?)```/g;
      const matches = [...shaderCode.matchAll(regex)];
      console.log("Matches:", matches);

      setVertexShader(matches[0]?.[1] || "invalid vertex shader");
      setFragmentShader(matches[1]?.[1] || "invalid fragment shader");
    }; 

  const renderShader = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);

    let program;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };

    const createProgram = (vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    }

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    program = createProgram(vertexShader, fragmentShader);
    if (!program) return;

    gl.useProgram(program);

    const baseVertices = [
      -1, -1,  1,
      1, -1,  1,
      1,  1,  1,
      -1,  1,  1,
      -1, -1, -1,
      -1,  1, -1,
      1,  1, -1,
      1, -1, -1,
    ];

    const indices = new Uint16Array([
      0, 1, 2,   2, 3, 0,
      4, 5, 6,   6, 7, 4,
      0, 3, 5,   5, 4, 0,
      1, 7, 6,   6, 2, 1,
      3, 2, 6,   6, 5, 3,
      0, 4, 7,   7, 1, 0
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(baseVertices), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);
    console.log('positionLoc:', positionLoc);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const view = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, -6,
      0, 0, 0, 1,
    ]);

    const fov = Math.PI / 4;
    const aspect = canvas.width / canvas.height;
    const near = 0.1;
    const far = 100;
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);

    const projection = new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2 * far * near) * nf, 0
    ]);
    
    const angle = Date.now() * 0.001;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const model = new Float32Array([
      cosA, 0, sinA, 0,
      0,    1, 0,    0,
     -sinA, 0, cosA, 0,
      0,    0, 0,    1,
    ]);

    const modelLoc = gl.getUniformLocation(program, 'model');
    const viewLoc = gl.getUniformLocation(program, 'view');
    const projectionLoc = gl.getUniformLocation(program, 'projection');

    gl.uniformMatrix4fv(modelLoc, false, model);
    gl.uniformMatrix4fv(viewLoc, false, view);
    gl.uniformMatrix4fv(projectionLoc, false, projection);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);    
  };

  const animate = () => {
      renderShader();  
      requestAnimationFrame(animate);
    };

  useEffect(() => {
    console.log("Updated vertexShader:", vertexShaderSource);
    console.log("Updated fragmentShader:", fragmentShaderSource);
    if (!vertexShaderSource || !fragmentShaderSource) return;
    
    animate();

  }, [vertexShaderSource, fragmentShaderSource]);


  return (
    <div className="flex items-center space-y-4 p-4">
      <h2 className="text-xl font-bold text-center">Text-to-Shader</h2>
      <div className="headerClass">
        <input
          type="text"
          className="w-full max-w-xl p-2 border rounded"
          placeholder="Describe your shader (e.g., rotating cube...)"
          value={description}
          onChange={(e) => { 
            setDescription(e.target.value)
          }}
        />

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={handleGenerateShader}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Shader'}
        </button>

        { canvasRef != null && (
          <canvas
            ref={canvasRef}
            width={512}
            height={512}
          />)}
      </div>

      {shaderCode && (
        <div className="w-full max-w-xl">
          <h3 className="text-lg font-semibold mt-4">Shader Code</h3>
          <pre className="bg-gray-100 p-4 text-sm overflow-auto whitespace-pre-wrap">
            {shaderCode}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TabTwo;

let video = document.querySelector("video");
if (video != undefined) {
  let canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  let tempCanvas = document.createElement('canvas');
  tempCanvas.style.visibility = 'hidden';
  if (!canvas)
    alert('Couldn\'t create canvas');
  video.parentElement.appendChild(canvas);
  let gl = canvas.getContext('webgl2');
  if (!gl)
    alert('WebGL not supported');
  let ctx2D = tempCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx2D)
    alert('2D not supported');
  let program = gl.createProgram();
  if (!program)
    alert('Couldn\'t create program');

  //////////// CREATE SHADERS //////////////////
  const vert = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_position * vec2(0.5, -0.5) + 0.5;
  }
  `;
  const frag = `
  precision highp float;
  uniform sampler2D u_video;
  varying vec2 v_texCoord;
  void main() {
    vec4 color = texture2D(u_video, v_texCoord);
    float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    gl_FragColor = vec4(vec3(luma), 1.0);
  }
  `;
  
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fs) {
    alert('Could not create fragment shader');
  }
  gl.shaderSource(fs, frag);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      const errorLog = gl.getShaderInfoLog(fs);
      alert('Fragment shader compilation error:', errorLog);
  }
  
  const vs = gl.createShader(gl.VERTEX_SHADER);
  if (!vs) {
    alert('Could not create vertex shader');
    gl.deleteShader(vs);
  }
  gl.shaderSource(vs, vert);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    const errorLog = gl.getShaderInfoLog(vs);
    alert('Vertex shader compilation error:', errorLog);
  }
  
  gl.attachShader(program, fs);
  gl.attachShader(program, vs);
  gl.linkProgram(program);
  gl.deleteShader(fs);
  gl.deleteShader(vs);

  //////////// CREATE RESOURCES //////////////////
  let positionBuffer = gl.createBuffer();
  let videoTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, videoTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program, "u_video"), 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]), gl.STATIC_DRAW);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, videoTexture);

  const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  function renderFrame() {
    if (!video.paused && !video.ended) {
      canvas.width = video.offsetWidth;
      canvas.height = video.offsetHeight;
      gl.viewport(0.0, 0.0, canvas.width, canvas.height);

      if (tempCanvas.width != canvas.width || tempCanvas.height != canvas.height) {
        gl.bindTexture(gl.TEXTURE_2D, videoTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
      }

      ctx2D.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      const imageData = ctx2D.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const imageArray = new Uint8Array(imageData.data);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, imageArray);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    requestAnimationFrame(renderFrame);
  }

  window.onload = () => {
    renderFrame();
  }
}
const starVertexShader = `
  attribute float size;
  attribute vec3 color;
  attribute float fade;
  varying vec3 vColor;
  varying float vSize;
  varying float vFade;

  void main() {
    vColor = color;
    vSize = size;
    vFade = fade;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  varying float vSize;
  varying float vFade;
  uniform float globalOpacity;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float alpha = (1.0 - (dist / 0.5)) * globalOpacity * vFade;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

const StarPoints = ({
  positionRef,
  colorRef,
  sizeRef,
  fadeRef,
  geometryRef,
  positionAttrRef,
  colorAttrRef,
  sizeAttrRef,
  fadeAttrRef,
  starMaterialRef,
  uniforms,
  maxStars,
}) => {
  return (
    <points renderOrder={1}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          ref={positionAttrRef}
          attach='attributes-position'
          count={maxStars}
          array={positionRef.current}
          itemSize={3}
        />
        <bufferAttribute
          ref={colorAttrRef}
          attach='attributes-color'
          count={maxStars}
          array={colorRef.current}
          itemSize={3}
        />
        <bufferAttribute
          ref={sizeAttrRef}
          attach='attributes-size'
          count={maxStars}
          array={sizeRef.current}
          itemSize={1}
        />
        <bufferAttribute
          ref={fadeAttrRef}
          attach='attributes-fade'
          count={maxStars}
          array={fadeRef.current}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={starMaterialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={uniforms}
        depthTest={false}
        transparent={true}
      />
    </points>
  );
};

export default StarPoints;

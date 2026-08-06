import * as THREE from 'three';

import { useEffect, useRef } from 'react';

const MAX_STARS = 120000;
const MAG_EXPONENT = 1.5;
const MIN_MAG = -1.44;
const MAX_MAG = 6;
const SIZE_SCALE = 20;

const starVertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vSize;

  void main() {
    vColor = color;
    vSize = size;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  varying float vSize;

  void main() {
    // if (vSize <= 0.0) discard;
    vec2 coord = gl_PointCoord - vec2(0.5);
    if (length(coord) > 0.5) discard;
    gl_FragColor = vec4(vColor, 1.0);
  }
`;

const Star3dObjects = ({ stars }) => {
  const positionRef = useRef(null);
  const colorRef = useRef(null);
  const sizeRef = useRef(null);
  const idToIndexRef = useRef(new Map());
  const nextIndexRef = useRef(0);
  const positionAttrRef = useRef();
  const colorAttrRef = useRef();
  const sizeAttrRef = useRef();
  const geometryRef = useRef();

  if (positionRef.current === null) {
    positionRef.current = new Float32Array(MAX_STARS * 3);
  }

  if (colorRef.current === null) {
    colorRef.current = new Float32Array(MAX_STARS * 3);
  }

  if (sizeRef.current === null) {
    sizeRef.current = new Float32Array(MAX_STARS);
  }

  const starColor = (ci) => {
    if (ci === null || ci === undefined) {
      return new THREE.Color('white');
    }

    const t = THREE.MathUtils.clamp((ci + 0.4) / 2.4, 0, 1);

    const stops = [
      { t: 0.0, color: new THREE.Color(0.6, 0.7, 1.0) }, // hot blue
      { t: 0.4, color: new THREE.Color(1.0, 1.0, 1.0) }, // white
      { t: 0.6, color: new THREE.Color(1.0, 0.9, 0.7) }, // yellow-white (Sun-like)
      { t: 1.0, color: new THREE.Color(1.0, 0.5, 0.3) }, // cool red
    ];

    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i].t && t <= stops[i + 1].t) {
        const localT = (t - stops[i].t) / (stops[i + 1].t - stops[i].t);
        return stops[i].color.clone().lerp(stops[i + 1].color, localT);
      }
    }
    return stops[stops.length - 1].color;
  };

  const starSize = (mag) => {
    // Values from sql max: 21, min: -26.7

    if (mag === null || mag === undefined) {
      mag = MAX_MAG;
    }

    return Math.abs((mag - MAX_MAG - 1) / (MIN_MAG - MAX_MAG - 1));
  };

  const starPosition = (decrad, rarad) => {
    const x = Math.cos(decrad) * Math.sin(rarad);
    const y = Math.sin(decrad);
    const z = Math.cos(decrad) * Math.cos(rarad);
    return { x, y, z };
  };

  useEffect(() => {
    const idToIndex = idToIndexRef.current;
    const positions = positionRef.current;
    const colors = colorRef.current;
    const sizes = sizeRef.current;

    let changed = false;

    for (const star of Object.values(stars)) {
      if (idToIndex.has(star.id)) continue;

      const index = nextIndexRef.current;
      if (index >= MAX_STARS) {
        console.warn('Star buffer is full, dropping star', star.id);
        continue;
      }

      const position = starPosition(star.decrad, star.rarad);
      positions[index * 3] = position.x;
      positions[index * 3 + 1] = position.y;
      positions[index * 3 + 2] = position.z;

      const color = starColor(star.ci);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;

      if (star.mag >= 6) {
        sizes[index] = 0;
      } else {
        const normalized = starSize(star.mag);
        const shaped = Math.pow(normalized, MAG_EXPONENT);
        sizes[index] = shaped * SIZE_SCALE;
      }

      idToIndex.set(star.id, index);
      nextIndexRef.current += 1;
      changed = true;
    }

    if (
      changed &&
      positionAttrRef.current &&
      colorAttrRef.current &&
      sizeAttrRef.current &&
      geometryRef.current
    ) {
      positionAttrRef.current.needsUpdate = true;
      colorAttrRef.current.needsUpdate = true;
      sizeAttrRef.current.needsUpdate = true;
      geometryRef.current.setDrawRange(0, nextIndexRef.current);
      geometryRef.current.computeBoundingSphere();
    }
  }, [stars]);

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          ref={positionAttrRef}
          attach='attributes-position'
          count={MAX_STARS}
          array={positionRef.current}
          itemSize={3}
        />
        <bufferAttribute
          ref={colorAttrRef}
          attach='attributes-color'
          count={MAX_STARS}
          array={colorRef.current}
          itemSize={3}
        />
        <bufferAttribute
          ref={sizeAttrRef}
          attach='attributes-size'
          count={MAX_STARS}
          array={sizeRef.current}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
      />
    </points>
  );
};

export default Star3dObjects;

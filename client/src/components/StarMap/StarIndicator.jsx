import * as THREE from 'three';

export const INDICATOR_OUTER_RADIUS = 0.03;

const StarIndicator = ({ indicatorRef }) => {
  return (
    <mesh ref={indicatorRef} renderOrder={2}>
      <ringGeometry args={[0.028, INDICATOR_OUTER_RADIUS, 30]} />
      <meshBasicMaterial
        color='#fff'
        side={THREE.DoubleSide}
        depthTest={false}
        transparent
      />
    </mesh>
  );
};

export default StarIndicator;

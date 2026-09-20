import * as THREE from 'three';

const StarIndicator = ({ indicatorRef }) => {
  return (
    <mesh ref={indicatorRef} renderOrder={2}>
      <ringGeometry args={[0.028, 0.03, 30]} />
      <meshBasicMaterial
        color='#fff'
        side={THREE.DoubleSide}
        depthTest={false}
      />
    </mesh>
  );
};

export default StarIndicator;

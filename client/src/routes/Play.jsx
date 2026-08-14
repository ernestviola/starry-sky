import { useState } from 'react';
import StarMap from '../components/StarMap/index.jsx';

const Play = () => {
  const [hoveredStarId, setHoveredStarId] = useState(null);
  return (
    <div style={{ position: 'relative' }}>
      <form
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          color: 'white',
          zIndex: '10',
        }}
      >
        <button>Start Game</button>
      </form>
      <StarMap
        hoveredStarId={hoveredStarId}
        setHoveredStarId={setHoveredStarId}
      />
    </div>
  );
};

export default Play;

import { useState } from 'react';
import StarMap from '../components/StarMap/index.jsx';

const Play = () => {
  const [hoveredStarId, setHoveredStarId] = useState(null);
  return (
    <StarMap
      hoveredStarId={hoveredStarId}
      setHoveredStarId={setHoveredStarId}
    />
  );
};

export default Play;

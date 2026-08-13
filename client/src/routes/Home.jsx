import { useState } from 'react';
import StarMap from '../components/StarMap/index.jsx';
import StarDetails from '../components/StarDetails/index.jsx';

const Home = () => {
  const [hoveredStarId, setHoveredStarId] = useState(null);

  return (
    <div style={{ position: 'relative' }}>
      <StarMap
        hoveredStarId={hoveredStarId}
        setHoveredStarId={setHoveredStarId}
      />
      <StarDetails hoveredStarId={hoveredStarId} />
    </div>
  );
};

export default Home;

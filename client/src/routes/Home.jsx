import { useState } from 'react';

import StarMap from '../components/StarMap/index.jsx';

const Home = () => {
  const [hoveredStarId, setHoveredStarId] = useState(null);
  return (
    <div>
      <StarMap />
    </div>
  );
};

export default Home;

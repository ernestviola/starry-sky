import { useStarMap } from '../contexts/StarMapContext.jsx';
import StarDetails from '../components/StarDetails/index.jsx';

const Explore = () => {
  const { hoveredStarId } = useStarMap();

  return (
    <div style={{ position: 'relative' }}>
      <title>Explore | Starry Sky</title>
      <StarDetails hoveredStarId={hoveredStarId} />
    </div>
  );
};

export default Explore;

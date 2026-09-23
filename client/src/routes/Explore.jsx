import { useStarMap } from '../contexts/StarMapContext.jsx';
import StarDetails from '../components/StarDetails/index.jsx';

const Explore = () => {
  const { hoveredStarId, selectedStarId, setSelectedStarId } = useStarMap();

  return (
    <div style={{ position: 'relative' }}>
      <title>Explore | Starry Sky</title>
      <StarDetails
        hoveredStarId={hoveredStarId}
        selectedStarId={selectedStarId}
        setSelectedStarId={setSelectedStarId}
      />
    </div>
  );
};

export default Explore;

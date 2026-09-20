import { useCallback, useRef, useState } from 'react';
import { useStarData } from '../../../contexts/StarDataContext.jsx';

const useStarFrameLoader = () => {
  const {
    starsDictionary,
    setStarsDictionary,
    receivedHealpixIds,
    setReceivedHealpixIds,
  } = useStarData();
  const [pendingStars, setPendingStars] = useState([]);
  const knownStarIdsRef = useRef(new Set());

  const loadStarFrames = useCallback(
    async (frames) => {
      try {
        const url = new URL(`${import.meta.env.VITE_STAR_API}api/stars/frame`);
        url.searchParams.append('frames', Array.from(frames).join(','));
        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error('Problems fetching star data.');
        }

        const data = await response.json();

        setReceivedHealpixIds((prev) => new Set([...prev, ...frames]));

        const newStars = data.stars.filter((star) => {
          if (knownStarIdsRef.current.has(star.id)) return false;
          knownStarIdsRef.current.add(star.id);
          return true;
        });

        if (newStars.length > 0) {
          setPendingStars((prev) => [...prev, ...newStars]);
          setStarsDictionary((prev) => {
            const next = { ...prev };
            for (const star of newStars) next[star.id] = star;
            return next;
          });
        }

        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    [setReceivedHealpixIds, setStarsDictionary],
  );

  const consumePendingStars = useCallback((count) => {
    setPendingStars((prev) => prev.slice(count));
  }, []);

  return {
    starsDictionary,
    receivedHealpixIds,
    pendingStars,
    loadStarFrames,
    consumePendingStars,
  };
};

export default useStarFrameLoader;

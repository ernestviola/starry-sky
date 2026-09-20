import { useCallback } from 'react';
import { useStarData } from '../../../contexts/StarDataContext.jsx';

const useConstellationFrameLoader = () => {
  const {
    constellationLinesDictionary,
    setConstellationLinesDictionary,
    receivedConstellationNames,
    setReceivedConstellationNames,
  } = useStarData();

  const loadConstellationFrames = useCallback(
    async (frames) => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_STAR_API}api/constellations/frame`,
        );
        url.searchParams.append('frames', Array.from(frames).join(','));
        url.searchParams.append(
          'receivedConstellationNames',
          Array.from(receivedConstellationNames).join(','),
        );

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error('Problems fetching star data.');
        }

        const data = await response.json();

        setReceivedConstellationNames(
          (prev) => new Set([...prev, ...data.constellations]),
        );

        setConstellationLinesDictionary((prev) => {
          let hasNew = false;
          for (const line of data.constellationLines) {
            if (!prev[line.id]) {
              hasNew = true;
              break;
            }
          }

          if (!hasNew) return prev;
          const next = { ...prev };
          for (const line of data.constellationLines) {
            next[line.id] = line;
          }
          return next;
        });

        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    [
      receivedConstellationNames,
      setConstellationLinesDictionary,
      setReceivedConstellationNames,
    ],
  );

  return { constellationLinesDictionary, loadConstellationFrames };
};

export default useConstellationFrameLoader;

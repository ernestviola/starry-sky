import { useCallback } from 'react';
import { useStarData } from '../../../contexts/StarDataContext.jsx';
import { loadConstellationCatalog } from '../staticCatalog.js';

const fetchConstellationFramesFromApi = async (frames, receivedConstellationNames) => {
  const url = new URL(
    `${import.meta.env.VITE_STAR_API}api/constellations/frame`,
    window.location.origin,
  );
  url.searchParams.append('frames', frames.join(','));
  url.searchParams.append(
    'receivedConstellationNames',
    receivedConstellationNames.join(','),
  );
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Problems fetching constellation data.');
  return response.json();
};

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
        const frameIds = [...frames];
        let visibleNames = [];
        let lines = [];
        try {
          const catalog = await loadConstellationCatalog();
          visibleNames = [...new Set(frameIds.flatMap((frameId) =>
            catalog.constellationsByFrame[frameId] ?? [],
          ))];
          lines = visibleNames.flatMap((name) =>
            catalog.constellationLinesByName[name] ?? [],
          );
        } catch {
          const data = await fetchConstellationFramesFromApi(
            frameIds,
            [...receivedConstellationNames],
          );
          visibleNames = data.constellations;
          lines = data.constellationLines;
        }

        const newNames = visibleNames.filter(
          (name) => !receivedConstellationNames.has(name),
        );
        const newLines = lines.filter((line) => newNames.includes(line.constellationName));

        setReceivedConstellationNames(
          (prev) => new Set([...prev, ...visibleNames]),
        );

        setConstellationLinesDictionary((prev) => {
          let hasNew = false;
          for (const line of newLines) {
            if (!prev[line.id]) {
              hasNew = true;
              break;
            }
          }

          if (!hasNew) return prev;
          const next = { ...prev };
          for (const line of newLines) {
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

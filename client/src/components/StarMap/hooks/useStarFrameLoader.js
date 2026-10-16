import { useCallback, useRef, useState } from 'react';
import { ang2pix_nest, pix2ang_ring } from '@hscmap/healpix';
import { useStarData } from '../../../contexts/StarDataContext.jsx';
import { nside } from '../config.js';
import { loadStarFrameBundle } from '../staticCatalog.js';

const STAR_BUNDLE_NSIDE = 4;

const fetchStarFramesFromApi = async (frames) => {
  const url = new URL(
    `${import.meta.env.VITE_STAR_API}api/stars/frame`,
    window.location.origin,
  );
  url.searchParams.append('frames', frames.join(','));
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Problems fetching star data.');
  const data = await response.json();
  return data.stars;
};

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
        const requestedFrames = new Set(frames);
        const bundleIds = new Set([...requestedFrames].map((frameId) => {
          const { theta, phi } = pix2ang_ring(nside, frameId);
          return ang2pix_nest(STAR_BUNDLE_NSIDE, theta, phi);
        }));
        const loadedFrames = new Set();
        const starsByFrame = new Map();

        await Promise.all(
          [...bundleIds].map(async (bundleId) => {
            try {
              const bundle = await loadStarFrameBundle(bundleId);
              for (const frameId of requestedFrames) {
                if (!Object.hasOwn(bundle.frames, frameId)) continue;
                loadedFrames.add(frameId);
                starsByFrame.set(frameId, bundle.frames[frameId]);
              }
            } catch {
              // Missing or unreadable static bundles are retried through the API below.
            }
          }),
        );

        const missingFrames = [...requestedFrames].filter(
          (frameId) => !loadedFrames.has(frameId),
        );
        if (missingFrames.length > 0) {
          const fallbackStars = await fetchStarFramesFromApi(missingFrames);
          for (const frameId of missingFrames) loadedFrames.add(frameId);
          for (const star of fallbackStars) {
            const frameStars = starsByFrame.get(star.healpixId) ?? [];
            frameStars.push(star);
            starsByFrame.set(star.healpixId, frameStars);
          }
        }

        setReceivedHealpixIds((prev) => new Set([...prev, ...loadedFrames]));

        const loadedStars = [...starsByFrame.values()].flat();

        const newStars = loadedStars.filter((star) => {
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

        return loadedFrames.size === requestedFrames.size;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    [setReceivedHealpixIds, setStarsDictionary],
  );

  const consumePendingStars = useCallback((starIds) => {
    const acknowledgedStarIds = new Set(starIds);
    setPendingStars((prev) => {
      const remaining = prev.filter(
        (star) => !acknowledgedStarIds.has(star.id),
      );
      return remaining.length === prev.length ? prev : remaining;
    });
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

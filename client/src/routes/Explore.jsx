import { useEffect, useRef, useState } from 'react';
import { useStarMap } from '../contexts/StarMapContext.jsx';
import { useStarData } from '../contexts/StarDataContext.jsx';
import StarDetails from '../components/StarDetails/index.jsx';
import starPoint from '../assets/star-point.svg';
import constellationPointSmall from '../assets/constellation-point-small.svg';
import constellationPointLarge from '../assets/constellation-point-large.svg';
import styles from './explore.module.css';

const emptyResults = () => ({ stars: [], constellations: [] });
const emptyMore = () => ({ stars: false, constellations: false });

const apiUrl = (path, query, offset = 0) => {
  const url = new URL(`${import.meta.env.VITE_STAR_API}api/${path}`);
  url.searchParams.set('q', query);
  url.searchParams.set('offset', String(offset));
  return url;
};

const starName = (star) => star.proper || star.bf || star.gl || star.bayer ||
  (star.hip ? `HIP ${star.hip}` : `Star ${star.id}`);

const starMetadata = (star) => {
  const parts = [];
  if (star.proper && star.hip) parts.push(`HIP ${star.hip}`);
  if (star.con) parts.push(star.con);
  if (!parts.length) parts.push(`ID ${star.id}`);
  return parts.join(' · ');
};

const Explore = () => {
  const { hoveredStarId, selectedStarId, setSelectedStarId, setSearchTarget } = useStarMap();
  const { setStarsDictionary } = useStarData();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(emptyResults);
  const [hasMore, setHasMore] = useState(emptyMore);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(null);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedKey, setSelectedKey] = useState(null);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const inputRef = useRef(null);
  const searchPanelRef = useRef(null);
  const resultRefs = useRef([]);
  const requestIdRef = useRef(0);
  const entries = [
    ...results.stars.map((star) => ({ type: 'star', value: star })),
    ...results.constellations.map((constellation) => ({ type: 'constellation', value: constellation })),
  ];
  const hasQuery = Boolean(query.trim());

  useEffect(() => {
    const closeOnOutsidePointer = (event) => {
      if (searchPanelRef.current?.contains(event.target)) return;
      setIsResultsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    };
    const closeOnOutsideFocus = (event) => {
      if (searchPanelRef.current?.contains(event.target)) return;
      setIsResultsOpen(false);
      setActiveIndex(-1);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('focusin', closeOnOutsideFocus);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('focusin', closeOnOutsideFocus);
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    const requestId = ++requestIdRef.current;
    if (!trimmedQuery) {
      setResults(emptyResults());
      setHasMore(emptyMore());
      setIsLoading(false);
      setLoadingMore(null);
      setError('');
      setActiveIndex(-1);
      return undefined;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setResults(emptyResults());
    setHasMore(emptyMore());
    setLoadingMore(null);
    setActiveIndex(-1);
    const timeout = setTimeout(async () => {
      setError('');
      try {
        const [starResponse, constellationResponse] = await Promise.all([
          fetch(apiUrl('stars/search', trimmedQuery), { signal: controller.signal }),
          fetch(apiUrl('constellations/search', trimmedQuery), { signal: controller.signal }),
        ]);
        if (!starResponse.ok || !constellationResponse.ok) throw new Error('Search is unavailable right now.');
        const [starData, constellationData] = await Promise.all([
          starResponse.json(), constellationResponse.json(),
        ]);
        if (requestId !== requestIdRef.current) return;
        setResults({ stars: starData.stars ?? [], constellations: constellationData.constellations ?? [] });
        setHasMore({ stars: Boolean(starData.hasMore), constellations: Boolean(constellationData.hasMore) });
      } catch (searchError) {
        if (searchError.name !== 'AbortError' && requestId === requestIdRef.current) {
          setError('Search is unavailable right now.');
        }
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const loadMore = async (type) => {
    if (loadingMore || !hasMore[type]) return;
    const requestId = requestIdRef.current;
    const trimmedQuery = query.trim();
    setLoadingMore(type);
    setError('');
    try {
      const path = type === 'stars' ? 'stars/search' : 'constellations/search';
      const response = await fetch(apiUrl(path, trimmedQuery, results[type].length));
      if (!response.ok) throw new Error('Could not load more results.');
      const data = await response.json();
      if (requestId !== requestIdRef.current) return;
      setResults((previous) => ({ ...previous, [type]: [...previous[type], ...(data[type] ?? [])] }));
      setHasMore((previous) => ({ ...previous, [type]: Boolean(data.hasMore) }));
    } catch {
      if (requestId === requestIdRef.current) setError('Could not load more results. Please try again.');
    } finally {
      if (requestId === requestIdRef.current) setLoadingMore(null);
    }
  };

  const selectEntry = (entry) => {
    setIsResultsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    if (entry.type === 'star') {
      const star = entry.value;
      setStarsDictionary((previous) => ({ ...previous, [star.id]: star }));
      setSelectedStarId(null);
      setSearchTarget({ type: 'star', id: star.id, name: starName(star), star });
      setSelectedKey(`star-${star.id}`);
      return;
    }

    const constellation = entry.value;
    setSelectedStarId(null);
    setSearchTarget({ type: 'constellation', name: constellation.constellationName, byname: constellation.byname });
    setSelectedKey(`constellation-${constellation.constellationName}`);
  };

  const clearSearch = () => {
    setQuery('');
    setIsResultsOpen(false);
    setActiveIndex(-1);
    setSelectedKey(null);
    setSearchTarget(null);
    setSelectedStarId(null);
    inputRef.current?.focus();
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown' && entries.length) {
      event.preventDefault();
      setIsResultsOpen(true);
      setActiveIndex((index) => (index + 1) % entries.length);
    } else if (event.key === 'ArrowUp' && entries.length) {
      event.preventDefault();
      setIsResultsOpen(true);
      setActiveIndex((index) => (index <= 0 ? entries.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectEntry(entries[activeIndex]);
    } else if (event.key === 'Escape' && isResultsOpen) {
      event.preventDefault();
      setIsResultsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    } else if (event.key === 'Escape' && hasQuery) {
      event.preventDefault();
      clearSearch();
    }
  };

  useEffect(() => {
    if (activeIndex >= 0) resultRefs.current[activeIndex]?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => () => setSearchTarget(null), [setSearchTarget]);

  return (
    <div className={styles.explore}>
      <title>Explore | Starry Sky</title>
      <section ref={searchPanelRef} className={styles.searchPanel} aria-label='Search the star catalog'>
        <label className={styles.visuallyHidden} htmlFor='explore-search'>Search stars and constellations</label>
        <div className={styles.searchControl}>
          <span className={styles.searchIcon} aria-hidden='true' />
          <input
            ref={inputRef}
            id='explore-search'
            type='search'
            value={query}
            onFocus={() => setIsResultsOpen(true)}
            onChange={(event) => { setQuery(event.target.value); setSelectedKey(null); setIsResultsOpen(true); }}
            onKeyDown={handleSearchKeyDown}
            placeholder='Search stars and constellations'
            autoComplete='off'
            role='combobox'
            aria-autocomplete='list'
            aria-controls={hasQuery && isResultsOpen ? 'explore-search-results' : undefined}
            aria-expanded={hasQuery && isResultsOpen}
            aria-activedescendant={isResultsOpen && activeIndex >= 0 ? `explore-result-${activeIndex}` : undefined}
          />
          {hasQuery && (
            <button className={styles.clearButton} type='button' onClick={clearSearch} aria-label='Clear search'>×</button>
          )}
        </div>
        {hasQuery && isResultsOpen && (
          <div className={styles.results} id='explore-search-results' role='listbox' aria-label='Search results' aria-busy={isLoading}>
            {isLoading && <p className={styles.status} role='status'>Searching the full catalog…</p>}
            {error && <p className={styles.status} role='status'>{error}</p>}
            {!isLoading && !error && entries.length === 0 && (
              <p className={styles.status} role='status'>No matching stars or constellations.</p>
            )}
            {results.stars.length > 0 && (
              <div className={styles.resultGroup} role='group' aria-label='Stars'>
                <h2>Stars</h2>
                {results.stars.map((star, index) => {
                  const key = `star-${star.id}`;
                  return (
                    <button
                      ref={(element) => { resultRefs.current[index] = element; }}
                      id={`explore-result-${index}`}
                      key={key}
                      className={`${styles.result} ${selectedKey === key ? styles.selectedResult : ''} ${activeIndex === index ? styles.activeResult : ''}`}
                      type='button'
                      role='option'
                      aria-selected={selectedKey === key}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectEntry({ type: 'star', value: star })}
                    >
                      <span className={styles.resultIcon}><img src={starPoint} alt='' /></span>
                      <span className={styles.resultCopy}><span className={styles.resultName}>{starName(star)}</span><span className={styles.metadata}>{starMetadata(star)}</span></span>
                    </button>
                  );
                })}
                {hasMore.stars && <button className={styles.loadMore} type='button' onClick={() => loadMore('stars')} disabled={Boolean(loadingMore)}>{loadingMore === 'stars' ? 'Loading…' : 'Show more stars'}</button>}
              </div>
            )}
            {results.constellations.length > 0 && (
              <div className={styles.resultGroup} role='group' aria-label='Constellations'>
                <h2>Constellations</h2>
                {results.constellations.map((constellation, index) => {
                  const flatIndex = results.stars.length + index;
                  const key = `constellation-${constellation.constellationName}`;
                  return (
                    <button
                      ref={(element) => { resultRefs.current[flatIndex] = element; }}
                      id={`explore-result-${flatIndex}`}
                      key={key}
                      className={`${styles.result} ${selectedKey === key ? styles.selectedResult : ''} ${activeIndex === flatIndex ? styles.activeResult : ''}`}
                      type='button'
                      role='option'
                      aria-selected={selectedKey === key}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      onClick={() => selectEntry({ type: 'constellation', value: constellation })}
                    >
                      <span className={styles.resultIcon}>
                        <img className={styles.constellationDotOne} src={constellationPointSmall} alt='' />
                        <img className={styles.constellationDotTwo} src={constellationPointLarge} alt='' />
                        <img className={styles.constellationDotThree} src={constellationPointSmall} alt='' />
                      </span>
                      <span className={styles.resultCopy}>
                        <span className={styles.resultName}>{constellation.name || constellation.constellationName}</span>
                        <span className={styles.metadata}>{[constellation.abbreviation, constellation.constellationName !== constellation.name ? constellation.constellationName : constellation.byname].filter(Boolean).join(' · ')}</span>
                      </span>
                    </button>
                  );
                })}
                {hasMore.constellations && <button className={styles.loadMore} type='button' onClick={() => loadMore('constellations')} disabled={Boolean(loadingMore)}>{loadingMore === 'constellations' ? 'Loading…' : 'Show more constellations'}</button>}
              </div>
            )}
          </div>
        )}
      </section>
      <StarDetails hoveredStarId={hoveredStarId} selectedStarId={selectedStarId} setSelectedStarId={setSelectedStarId} />
    </div>
  );
};

export default Explore;

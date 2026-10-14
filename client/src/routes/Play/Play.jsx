import { useRef, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useStarMap } from '../../contexts/StarMapContext.jsx';
import GameTimer from '../../components/PlayRoute/GameTimer/GameTimer.jsx';
import Leaderboard from '../../components/PlayRoute/Leaderboard/Leaderboard.jsx';
import SearchList from '../../components/SearchList/SearchList.jsx';
import HowToPlay from '../../components/PlayRoute/HowToPlay/HowToPlay.jsx';
import styles from './play.module.css';
import useSheetDrag from './useSheetDrag.js';
import GameStart from '../../components/PlayRoute/GameStart/GameStart.jsx';
import SubmitScore from '../../components/PlayRoute/SubmitScore/SubmitScore.jsx';
import { getMotionDuration } from '../../utils/motion.js';

const noopRegisterInteractionHandler = () => () => {};

const Play = () => {
  const { selectedStarId, registerClickHandler,
    registerInteractionHandler = noopRegisterInteractionHandler,
    setStarClickFeedback } = useStarMap();
  // Only the current phase owns a panel and accepts its associated actions.
  const [phase, setPhase] = useState('start');
  const gameStarted = phase === 'playing';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameTotalTime, setGameTotalTime] = useState(null);
  const [gameToken, setGameToken] = useState(null);
  const [gameFinishedToken, setGameFinishedToken] = useState(null);
  const [name, setName] = useState('');
  const [leaderboardId, setLeaderboardId] = useState(null);
  const [starsFoundDictionary, setStarsFoundDictionary] = useState({});
  const [searchListExpanded, setSearchListExpanded] = useState(true);
  const [hasAutoCollapsedSearchList, setHasAutoCollapsedSearchList] = useState(false);
  const {
    panelRef: gamePanelRef,
    bodyRef: gamePanelBodyRef,
    previewRef: gamePanelPreviewRef,
    isMobile: isMobileSheet,
    consumeDragClick,
    headerHandlers,
  } = useSheetDrag({ expanded: searchListExpanded, setExpanded: setSearchListExpanded, visible: gameStarted });
  const dialogGameStartRef = useRef();
  const dialogSubmitScoreRef = useRef();
  const dialogLeaderboardRef = useRef();
  const dialogHowToPlayRef = useRef();
  const requestPendingRef = useRef(false);
  const requestControllerRef = useRef(null);
  const clickFeedbackTimeoutRef = useRef(null);
  const selectionControllersRef = useRef(new Set());
  const pendingStarIdsRef = useRef(new Set());
  const foundStarIdsRef = useRef(new Set());

  useEffect(() => () => {
    requestControllerRef.current?.abort();
    for (const controller of selectionControllersRef.current) controller.abort();
    window.clearTimeout(clickFeedbackTimeoutRef.current);
    setStarClickFeedback?.(null);
  }, [setStarClickFeedback]);

  useEffect(() => {
    const refs = { start: dialogGameStartRef, instructions: dialogHowToPlayRef,
      finishing: dialogSubmitScoreRef, score: dialogSubmitScoreRef,
      leaderboard: dialogLeaderboardRef };
    const dialog = refs[phase]?.current;
    if (dialog && !dialog.open) dialog.show();
  }, [phase]);

  const handleStartGame = async () => {
    if (requestPendingRef.current) return;
    requestPendingRef.current = true;
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_STAR_API}api/game/start`, {
        method: 'POST', signal: controller.signal,
      });
      if (!response.ok) throw new Error('Unable to start the game. Please try again.');
      const data = await response.json();
      const decoded = jwtDecode(data.token);
      if (controller.signal.aborted) return;
      setGameToken(data.token);
      setGameStartTime(decoded.startTime);
      setGameTotalTime(null);
      setGameFinishedToken(null);
      setName('');
      setLeaderboardId(null);
      for (const selectionController of selectionControllersRef.current) selectionController.abort();
      selectionControllersRef.current.clear();
      pendingStarIdsRef.current.clear();
      foundStarIdsRef.current.clear();
      window.clearTimeout(clickFeedbackTimeoutRef.current);
      setStarClickFeedback?.(null);
      setStarsFoundDictionary(Object.fromEntries(decoded.starsToFind.map(star =>
        [star.id, { id: star.id, name: star.proper, found: false }])));
      setSearchListExpanded(true);
      setHasAutoCollapsedSearchList(false);
      setPhase('playing');
    } catch {
      if (!controller.signal.aborted) setError('Unable to start the game. Please try again.');
    } finally {
      requestPendingRef.current = false;
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const finishGame = useCallback(async () => {
    if (requestPendingRef.current) return;
    requestPendingRef.current = true;
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setPhase('finishing');
    setLoading(true);
    setError('');
    window.clearTimeout(clickFeedbackTimeoutRef.current);
    setStarClickFeedback?.(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_STAR_API}api/game/submit`, {
        method: 'POST', headers: { Authorization: `Bearer ${gameToken}` }, signal: controller.signal,
      });
      if (!response.ok) throw new Error('Unable to calculate your time. Please try again.');
      const data = await response.json();
      const decoded = jwtDecode(data.token);
      if (controller.signal.aborted) return;
      setGameTotalTime(decoded.totalTime);
      setGameFinishedToken(data.token);
      setPhase('score');
    } catch {
      if (!controller.signal.aborted) setError('Unable to calculate your time. Please try again.');
    } finally {
      requestPendingRef.current = false;
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [gameToken, setStarClickFeedback]);

  const handleStarClick = useCallback(async (starId = selectedStarId) => {
    if (!gameStarted || starId == null || starsFoundDictionary[starId]?.found || pendingStarIdsRef.current.has(starId)) return;
    const isTargetStar = starsFoundDictionary[starId] !== undefined;
    const duration = getMotionDuration('--duration-slow');
    const showFeedback = (status) => {
      setStarClickFeedback?.({ starId, status, expiresAt: performance.now() + duration, duration });
      window.clearTimeout(clickFeedbackTimeoutRef.current);
      clickFeedbackTimeoutRef.current = window.setTimeout(() => setStarClickFeedback?.(null), duration);
    };
    if (!isTargetStar) {
      showFeedback('incorrect');
      return;
    }
    const controller = new AbortController();
    selectionControllersRef.current.add(controller);
    pendingStarIdsRef.current.add(starId);
    try {
      const response = await fetch(`${import.meta.env.VITE_STAR_API}api/game/select`, {
        method: 'POST', signal: controller.signal,
        headers: { Authorization: `Bearer ${gameToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ starId }),
      });
      if (!response.ok) throw new Error('Unable to check that star. Please try again.');
      const data = await response.json();
      if (controller.signal.aborted) return;
      showFeedback(data.found ? 'correct' : 'incorrect');
      if (data.found) {
        foundStarIdsRef.current.add(String(starId));
        const isFinalStar = Object.values(starsFoundDictionary).every(
          (star) => star.found || foundStarIdsRef.current.has(String(star.id)),
        );
        setStarsFoundDictionary(prev => prev[starId]?.found ? prev : {
          ...prev, [starId]: { ...prev[starId], found: true },
        });
        if (isFinalStar) finishGame();
      }
      setError('');
    } catch {
      if (!controller.signal.aborted) setError('Unable to check that star. Please try again.');
    } finally {
      selectionControllersRef.current.delete(controller);
      pendingStarIdsRef.current.delete(starId);
    }
  }, [finishGame, gameStarted, gameToken, selectedStarId, starsFoundDictionary, setStarClickFeedback]);

  useEffect(() => registerClickHandler(handleStarClick), [registerClickHandler, handleStarClick]);
  useEffect(() => registerInteractionHandler(interaction => {
    if (!isMobileSheet || !gameStarted || hasAutoCollapsedSearchList || !['drag', 'zoom', 'star'].includes(interaction)) return;
    setHasAutoCollapsedSearchList(true);
    setSearchListExpanded(false);
  }), [gameStarted, hasAutoCollapsedSearchList, isMobileSheet, registerInteractionHandler]);

  const handleSubmitName = async event => {
    event.preventDefault();
    if (phase !== 'score' || !gameFinishedToken || requestPendingRef.current) return;
    requestPendingRef.current = true;
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setLoading(true);
    setError('');
    try {
      // Location is optional; a denied or unanswered prompt must not block saving.
      const position = await new Promise(resolve => {
        if (!navigator.geolocation) return resolve(null);
        const timeout = window.setTimeout(() => resolve(null), 5000);
        navigator.geolocation.getCurrentPosition(
          position => { window.clearTimeout(timeout); resolve(position.coords); },
          () => { window.clearTimeout(timeout); resolve(null); },
          { timeout: 5000, maximumAge: 60000 },
        );
      });
      if (controller.signal.aborted) return;
      const response = await fetch(`${import.meta.env.VITE_STAR_API}api/game/submit/name`, {
        method: 'POST', signal: controller.signal,
        headers: { Authorization: `Bearer ${gameFinishedToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), latitude: position?.latitude, longitude: position?.longitude }),
      });
      if (!response.ok) throw new Error('Unable to save your score. Please try again.');
      const data = await response.json();
      if (!data.success) throw new Error('Unable to save your score. Please try again.');
      if (controller.signal.aborted) return;
      setLeaderboardId(data.leaderboardId);
      setPhase('leaderboard');
    } catch {
      if (!controller.signal.aborted) setError('Unable to save your score. Please try again.');
    } finally {
      requestPendingRef.current = false;
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const targetStars = Object.values(starsFoundDictionary);
  const foundStars = targetStars.filter((star) => star.found).length;
  const previewStar = targetStars.find(star => !star.found);
  const toggleSearchList = () => setSearchListExpanded((expanded) => !expanded);


  return (
    <div className={styles.play}>
      <title>Play | Starry Sky</title>

      {phase === 'start' && <GameStart
        dialogGameStartRef={dialogGameStartRef}
        onHowToPlay={() => { setError(''); setPhase('instructions'); }}
        handleStartGame={handleStartGame} loading={loading} error={error}
      />}
      {phase === 'instructions' && <HowToPlay ref={dialogHowToPlayRef} onClose={() => setPhase('start')} />}
      {['finishing', 'score'].includes(phase) && <SubmitScore
        dialogSubmitScoreRef={dialogSubmitScoreRef} handleSubmitName={handleSubmitName}
        setName={setName} name={name} gameTotalTime={gameTotalTime}
        finishing={phase === 'finishing'} loading={loading} error={error} onRetry={finishGame}
      />}
      {phase === 'leaderboard' && <Leaderboard
        ref={dialogLeaderboardRef} leaderboardId={leaderboardId}
        handleStartGame={handleStartGame} starting={loading} startError={error}
      />}
      {gameStarted && (
        <section
          ref={gamePanelRef}
          className={styles.gamePanel}
          aria-label='Game status'
        >
          <div
            className={styles.gamePanelHeader}
            {...headerHandlers}
            role={isMobileSheet ? 'button' : undefined}
            tabIndex={isMobileSheet ? 0 : undefined}
            aria-label={isMobileSheet ? (searchListExpanded ? 'Collapse stars' : 'Expand stars') : undefined}
            aria-controls={isMobileSheet ? 'search-list' : undefined}
            aria-expanded={isMobileSheet ? searchListExpanded : undefined}
            aria-describedby={isMobileSheet && !searchListExpanded && previewStar ? 'star-preview' : undefined}
            onClick={() => {
              if (isMobileSheet && !consumeDragClick()) toggleSearchList();
            }}
            onKeyDown={event => {
              if (isMobileSheet && ['Enter', ' '].includes(event.key)) {
                event.preventDefault();
                toggleSearchList();
              }
            }}
          >
            <span className={styles.grabHandle} aria-hidden='true' />
            <GameTimer startTime={gameStartTime} totalTime={gameTotalTime} showLabel={false} />
            <span className={styles.gamePanelCount}>
              {foundStars}/{targetStars.length}
            </span>
            <div className={styles.gamePanelPreview} aria-hidden={!isMobileSheet || searchListExpanded}>
              <div ref={gamePanelPreviewRef} className={styles.gamePanelPreviewContent}>
                <span id='star-preview'>{previewStar?.name}</span>
              </div>
            </div>
          </div>
          <div
            ref={gamePanelBodyRef}
            className={styles.gamePanelBody}
            inert={!searchListExpanded && isMobileSheet ? true : undefined}
            aria-hidden={!searchListExpanded && isMobileSheet ? true : undefined}
          >
            <div className={styles.gamePanelBodyContent}>
              <SearchList items={starsFoundDictionary} />
            </div>
          </div>
          {error && <p role='alert' className={styles.gameError}>{error}</p>}
        </section>
      )}
    </div>
  );
};

export default Play;

import { useRef, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { BiChevronDown } from 'react-icons/bi';
import { useStarMap } from '../../contexts/StarMapContext.jsx';
import GameTimer from '../../components/PlayRoute/GameTimer/GameTimer.jsx';
import Leaderboard from '../../components/PlayRoute/Leaderboard/Leaderboard.jsx';
import SearchList from '../../components/SearchList/SearchList.jsx';
import HowToPlay from '../../components/PlayRoute/HowToPlay/HowToPlay.jsx';
import styles from './play.module.css';
import useSheetDrag from './useSheetDrag.js';
import GameStart from '../../components/PlayRoute/GameStart/GameStart.jsx';
import SubmitScore from '../../components/PlayRoute/SubmitScore/SubmitScore.jsx';
import dialogStyles from '../../components/PlayRoute/Dialog/dialog.module.css';

const noopRegisterInteractionHandler = () => () => {};

const Play = () => {
  const [loading, setLoading] = useState(false);
  const {
    selectedStarId,
    registerClickHandler,
    registerInteractionHandler = noopRegisterInteractionHandler,
  } = useStarMap();
  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameTotalTime, setGameTotalTime] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameToken, setGameToken] = useState(null);
  const [gameFinishedToken, setGameFinishedToken] = useState(null);
  const [name, setName] = useState('');
  const [leaderboardId, setLeaderboardId] = useState(null);
  const [refreshLeaderboard, setRefreshLeaderboard] = useState(false);
  const [starsFoundDictionary, setStarsFoundDictionary] = useState({});
  const [searchListExpanded, setSearchListExpanded] = useState(true);
  const [hasAutoCollapsedSearchList, setHasAutoCollapsedSearchList] = useState(false);
  const sheet = useSheetDrag({
    expanded: searchListExpanded,
    setExpanded: setSearchListExpanded,
  });

  const dialogGameStartRef = useRef();
  const dialogSubmitScoreRef = useRef();
  const dialogLeaderboardRef = useRef();
  const dialogHowToPlayRef = useRef();

  useEffect(() => {
    const preventEscape = (event) => {
      if (
        event.key === 'Escape' &&
        (dialogGameStartRef.current?.open ||
          dialogSubmitScoreRef.current?.open ||
          dialogLeaderboardRef.current?.open)
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', preventEscape, true);

    return () => {
      window.removeEventListener('keydown', preventEscape, true);
    };
  }, []);

  useEffect(() => {
    dialogGameStartRef.current.show();
    // dialogLeaderboardRef.current.showModal();
  }, []);

  const handleStartGame = async () => {
    try {
      setLoading(true);
      setGameTotalTime(null);
      setGameFinishedToken(null);
      const url = new URL(`${import.meta.env.VITE_STAR_API}api/game/start`);
      const response = await fetch(url.toString(), {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Problems starting the game, please retry.');
      }

      const data = await response.json();
      setGameToken(data.token);

      const decoded = jwtDecode(data.token);

      setGameStartTime(decoded.startTime);

      const starsDictionary = {};
      for (const star of decoded.starsToFind) {
        starsDictionary[star.id] = {
          id: star.id,
          name: star.proper,
          found: false,
        };
      }

      setStarsFoundDictionary(starsDictionary);
      setSearchListExpanded(true);
      setHasAutoCollapsedSearchList(false);
      closeDialog(dialogGameStartRef);
      if (dialogLeaderboardRef.current?.open) {
        closeDialog(dialogLeaderboardRef);
      }
      dialogSubmitScoreRef.current?.close();

      setGameStarted(true);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const checkAllStarsFound = () => {
    const stars = Object.values(starsFoundDictionary);
    return stars.length > 0 && stars.every((star) => star.found);
  };

  const handleStarClick = (starId = selectedStarId) => {
    if (starId !== null && starId !== undefined && starsFoundDictionary[starId] !== undefined) {
      setStarsFoundDictionary((prev) => {
        const starToUpdate = prev[starId];
        starToUpdate.found = true;
        const foundStars = { ...prev, [starId]: starToUpdate };
        return foundStars;
      });
    }
  };

  useEffect(() => {
    return registerClickHandler(handleStarClick);
  }, [registerClickHandler, handleStarClick]);

  useEffect(() => {
    return registerInteractionHandler((interaction) => {
      if (
        !gameStarted ||
        hasAutoCollapsedSearchList ||
        !['drag', 'zoom', 'star'].includes(interaction)
      ) {
        return;
      }
      setHasAutoCollapsedSearchList(true);
      setSearchListExpanded(false);
    });
  }, [gameStarted, hasAutoCollapsedSearchList, registerInteractionHandler]);

  useEffect(() => {
    async function handleStarsFound() {
      if (checkAllStarsFound() && gameStarted) {
        const url = new URL(`${import.meta.env.VITE_STAR_API}api/game/submit`);
        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${gameToken}`,
          },
        });

        const data = await response.json();
        const decoded = jwtDecode(data.token);

        setGameTotalTime(decoded.totalTime);
        setGameFinishedToken(data.token);
        dialogSubmitScoreRef.current.show();
      }
    }

    handleStarsFound();
  }, [starsFoundDictionary]);

  const handleSubmitName = async (e) => {
    e.preventDefault();

    if (!gameFinishedToken) return;

    function geolocationPromise() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported.'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            return;
          },
          (error) => {
            reject(new Error(error));
          },
        );
      });
    }

    let latitude, longitude;

    try {
      const position = await geolocationPromise();
      latitude = position.latitude;
      longitude = position.longitude;
    } catch (error) {
      console.log(error);
    }

    try {
      const url = new URL(
        `${import.meta.env.VITE_STAR_API}api/game/submit/name`,
      );
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gameFinishedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          name,
        }),
      });

      if (!response.ok) {
        throw new Error('Issues submitting the score, try again.');
      }

      const data = await response.json();

      if (data.success) {
        // show the leaderboard and the users position
        setLeaderboardId(data.leaderboardId);

        // close the dialog

        closeDialog(dialogSubmitScoreRef, () => {
          dialogLeaderboardRef.current.show();
          setRefreshLeaderboard(true);
        });
        // show the leaderboard modal
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleHowToPlay = () => {
    closeDialog(dialogGameStartRef, () => {
      dialogHowToPlayRef.current.show();
    });
  };

  const closeDialog = (ref, onClosed) => {
    const dialog = ref.current;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dialog.close();
      onClosed?.();
      return;
    }

    dialog.classList.add(dialogStyles.closing);

    dialog.addEventListener(
      'animationend',
      () => {
        dialog.close();
        dialog.classList.remove(dialogStyles.closing);
        onClosed?.();
      },
      { once: true },
    );
  };

  const targetStars = Object.values(starsFoundDictionary);
  const foundStars = targetStars.filter((star) => star.found).length;
  const firstMissingStar = targetStars.find((star) => !star.found);
  const allStarsFound = targetStars.length > 0 && foundStars === targetStars.length;
  // Stars have no order: the header just names the first unfound star in list order.
  const statusName = allStarsFound ? 'All found' : firstMissingStar?.name ?? '';
  const progressPercent = targetStars.length ? (foundStars / targetStars.length) * 100 : 0;

  const toggleSearchList = () => setSearchListExpanded((expanded) => !expanded);


  return (
    <div className={styles.play}>
      <title>Play | Starry Sky</title>

      <GameStart
        dialogGameStartRef={dialogGameStartRef}
        onHowToPlay={handleHowToPlay}
        handleStartGame={handleStartGame}
      />

      <HowToPlay
        ref={dialogHowToPlayRef}
        onClose={() =>
          closeDialog(dialogHowToPlayRef, () => {
            dialogGameStartRef.current.show();
          })
        }
      />
      <SubmitScore
        dialogSubmitScoreRef={dialogSubmitScoreRef}
        handleSubmitName={handleSubmitName}
        setName={setName}
        gameTotalTime={gameTotalTime}
      />

      <Leaderboard
        ref={dialogLeaderboardRef}
        leaderboardId={leaderboardId}
        handleStartGame={handleStartGame}
        refreshLeaderboard={refreshLeaderboard}
        setRefreshLeaderboard={setRefreshLeaderboard}
      />
      {gameStarted && (
        <section
          ref={sheet.panelRef}
          className={`${styles.gamePanel} ${searchListExpanded ? styles.gamePanelOpen : ''}`}
          aria-label='Game status'
        >
          {/* On mobile the header can be dragged or tapped; the chevron button is the accessible control. */}
          <div className={styles.gamePanelHeader} {...sheet.headerHandlers}>
            <span className={styles.grabHandle} aria-hidden='true' />
            <div className={styles.gamePanelTimer}>
              <span className={styles.gamePanelEyebrow}>TIME</span>
              <GameTimer startTime={gameStartTime} totalTime={gameTotalTime} showLabel={false} />
            </div>
            <span className={styles.gamePanelDivider} aria-hidden='true' />
            <div className={styles.gamePanelStatus}>
              <span className={styles.gamePanelEyebrow}>
                {allStarsFound ? 'COMPLETE' : 'MISSING'}
              </span>
              <strong className={statusName.length > 12 ? styles.gamePanelNameLong : ''}>
                {statusName}
              </strong>
            </div>
            <button
              type='button'
              className={styles.searchListToggle}
              aria-label={searchListExpanded ? 'Collapse stars' : 'Expand stars'}
              aria-controls='search-list'
              aria-expanded={searchListExpanded}
              onClick={() => {
                if (sheet.consumeDragClick()) return;
                toggleSearchList();
              }}
            >
              <BiChevronDown aria-hidden='true' size={24} />
            </button>
            <div className={styles.gamePanelProgress}>
              <span
                className={`${styles.progressBar} ${allStarsFound ? styles.progressComplete : ''}`}
                role='progressbar'
                aria-label='Stars found'
                aria-valuemin='0'
                aria-valuemax={targetStars.length}
                aria-valuenow={foundStars}
              >
                <span style={{ width: `${progressPercent}%` }} />
              </span>
              <span>
                {foundStars}/{targetStars.length} FOUND
              </span>
            </div>
          </div>
          <div
            ref={sheet.bodyRef}
            className={styles.gamePanelBody}
            hidden={!searchListExpanded && !sheet.isMobile}
            inert={!searchListExpanded && sheet.isMobile ? true : undefined}
          >
            <SearchList
              items={starsFoundDictionary}
              expanded={searchListExpanded || sheet.isMobile}
            />
          </div>
        </section>
      )}
    </div>
  );
};

export default Play;

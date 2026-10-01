import { createContext, useCallback, useContext, useRef, useState } from 'react';

const StarMapContext = createContext(null);

export const StarMapProvider = ({ children }) => {
  const [hoveredStarId, setHoveredStarId] = useState(null);
  const [selectedStarId, setSelectedStarId] = useState(null);
  const clickHandler = useRef(() => {});
  const interactionHandler = useRef(() => {});

  const handleClick = useCallback((event) => {
    clickHandler.current(event);
  }, []);

  const handleInteraction = useCallback((interaction) => {
    interactionHandler.current(interaction);
  }, []);

  const registerClickHandler = useCallback((handler) => {
    clickHandler.current = handler;
    return () => {
      if (clickHandler.current === handler) clickHandler.current = () => {};
    };
  }, []);

  const registerInteractionHandler = useCallback((handler) => {
    interactionHandler.current = handler;
    return () => {
      if (interactionHandler.current === handler) interactionHandler.current = () => {};
    };
  }, []);

  return (
    <StarMapContext.Provider
      value={{
        hoveredStarId,
        setHoveredStarId,
        selectedStarId,
        setSelectedStarId,
        handleClick,
        registerClickHandler,
        handleInteraction,
        registerInteractionHandler,
      }}
    >
      {children}
    </StarMapContext.Provider>
  );
};

export const useStarMap = () => useContext(StarMapContext);

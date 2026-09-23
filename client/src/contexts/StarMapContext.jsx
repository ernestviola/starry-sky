import { createContext, useCallback, useContext, useRef, useState } from 'react';

const StarMapContext = createContext(null);

export const StarMapProvider = ({ children }) => {
  const [hoveredStarId, setHoveredStarId] = useState(null);
  const [selectedStarId, setSelectedStarId] = useState(null);
  const clickHandler = useRef(() => {});

  const handleClick = useCallback((event) => {
    clickHandler.current(event);
  }, []);

  const registerClickHandler = useCallback((handler) => {
    clickHandler.current = handler;
    return () => {
      if (clickHandler.current === handler) clickHandler.current = () => {};
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
      }}
    >
      {children}
    </StarMapContext.Provider>
  );
};

export const useStarMap = () => useContext(StarMapContext);

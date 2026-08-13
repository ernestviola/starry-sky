import { createContext, useContext, useState } from 'react';

const StarDataContext = createContext(null);

export const StarDataProvider = ({ children }) => {
  const [starsDictionary, setStarsDictionary] = useState({});

  const [receivedHealpixIds, setReceivedHealpixIds] = useState(new Set());

  const [constellationLinesDictionary, setConstellationLinesDictionary] =
    useState({});
  const [receivedConstellationNames, setReceivedConstellationNames] = useState(
    new Set(),
  );

  const value = {
    starsDictionary,
    setStarsDictionary,
    receivedHealpixIds,
    setReceivedHealpixIds,
    constellationLinesDictionary,
    setConstellationLinesDictionary,
    receivedConstellationNames,
    setReceivedConstellationNames,
  };

  return (
    <StarDataContext.Provider value={value}>
      {children}
    </StarDataContext.Provider>
  );
};

export const useStarData = () => {
  const context = useContext(StarDataContext);
  if (!context) {
    throw new Error('useStarData must be used within a StarDataProvider');
  }
  return context;
};

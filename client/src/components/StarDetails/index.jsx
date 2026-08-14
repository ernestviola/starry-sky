// starId null if there's no star to point to or a starId to search with in the starsDictionary

import { useStarData } from '../../contexts/StarDataContext.jsx';

const StarDetails = ({ hoveredStarId }) => {
  // position next to the mouse x,y either up down left or right depending on where there's space on the screen

  // if the screen is too small then we put the info on the top right
  const { starsDictionary } = useStarData();
  console.log(hoveredStarId);
  console.log(starsDictionary[hoveredStarId]);

  const containerStyles = {
    backgroundColor: '#000',
    color: 'white',
    position: 'absolute',
    top: '20px',
    right: '20px',
    border: '2px solid #460078',
    padding: '1em',
    fontSize: '1.6rem',
  };

  if (hoveredStarId) {
    const starData = starsDictionary[hoveredStarId];
    return (
      <div style={containerStyles}>
        <p>HIP: {starData.hip}</p>
        <p>Name: {starData.proper}</p>
        <p>Mag: {starData.mag}</p>
      </div>
    );
  }
};

export default StarDetails;

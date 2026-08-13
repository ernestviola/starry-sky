// starId null if there's no star to point to or a starId to search with in the starsDictionary

import { useStarData } from '../../contexts/StarDataContext.jsx';
import styles from './starDetails.module.css';

const StarDetails = ({ hoveredStarId }) => {
  // position next to the mouse x,y either up down left or right depending on where there's space on the screen

  // if the screen is too small then we put the info on the top right
  const { starsDictionary } = useStarData();
  console.log(hoveredStarId);
  console.log(starsDictionary[hoveredStarId]);

  if (hoveredStarId) {
    const starData = starsDictionary[hoveredStarId];
    return (
      <div className={styles.starDetailsContainer}>
        <p>HIP: {starData.hip}</p>
        <p>Name: {starData.proper}</p>
      </div>
    );
  }
};

export default StarDetails;

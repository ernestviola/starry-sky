// starId null if there's no star to point to or a starId to search with in the starsDictionary

const StarDetails = (starId, stars) => {
  // position next to the mouse x,y either up down left or right depending on where there's space on the screen

  // if the screen is too small then we put the info on the top right
  if (starId)
    return (
      <div>
        <p>Here is the star information</p>
      </div>
    );
};

export default StarDetails;

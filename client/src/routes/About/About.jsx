import StarMapModel from '../../components/StarMapModel/StarMapModel.jsx';
import styles from './about.module.css';

const About = () => {
  return (
    <div className={styles.about}>
      <title>About | Starry Sky</title>
      <h1>About Starry Sky</h1>
      <p>
        A simulation and game centered around 120,000 of our night skies stars.
      </p>

      <h2>Inspiration</h2>
      <p>
        This project was a remix of one of the tasks from The Odin Project
        specifically{' '}
        <a
          href='https://www.theodinproject.com/lessons/nodejs-where-s-waldo-a-photo-tagging-app'
          target='_blank'
        >
          The Where's Waldo Project
        </a>
        . Not wanting to make the same project everyone else was making and
        always wanting to learn some three js, I settled on a star searching
        game.
      </p>
      <p>
        Something that I think about often whenever I look into the night sky is
        how disappointing it is to not be able to stare up and see and look up
        at the stars. I rightfully blame all of the light pollution, so I wanted
        to build something so that people could see what was possible. So my
        goals with the project were to:
        <ol>
          <li>Get people familiar with their sky.</li>
          <li>Let people compete and attempt glory.</li>
        </ol>
      </p>
      <h2>Challenges</h2>
      <p>
        This project was kind of hard. In all honestly I had no idea how I was
        going to accomplish building the simulation. I knew conceptionally what
        had to be done. A user sits at a center point and is able to rotate
        their camera to view stars placed on a sphere. So I went to seek out
        what was available to me. And found a star data set that I could use.{' '}
        <a href='https://codeberg.org/astronexus/hyg' target='_blank'>
          HYG Stellar Database
        </a>{' '}
        is a collection of star catalogs from Hipparcos, Yale, and Gliese. Read
        more about it at the{' '}
        <a href='https://codeberg.org/astronexus/hyg' target='_blank'>
          source
        </a>
        .
      </p>
      <p>
        I've always wanted to be able to simulate stars in the sky and trying to
        figure out how to do that and to do it efficiently was a challenge.
      </p>
      <StarMapModel />
    </div>
  );
};

export default About;

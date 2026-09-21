import { useEffect, useRef, useState } from 'react';
import declinationDiagram from '../../assets/IMG_4205.jpeg';
import rightAscensionDiagram from '../../assets/IMG_4206.jpeg';
import StarMapModel from '../../components/StarMapModel/StarMapModel.jsx';
import styles from './about.module.css';

const About = () => {
  const [step, setStep] = useState(1);
  const derivation = useRef(null);

  useEffect(() => {
    const sections = derivation.current.querySelectorAll('[data-derivation-step]');
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (active) setStep(Number(active.target.dataset.derivationStep));
      },
      { rootMargin: '-30% 0px -40%', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.about}>
      <title>About | Starry Sky</title>
      <h1>About Starry Sky</h1>
      <p>A simulation and game centered around 120,000 stars in our night sky.</p>

      <h2>Inspiration</h2>
      <p>
        This project was a remix of The Odin Project&apos;s{' '}
        <a
          href='https://www.theodinproject.com/lessons/nodejs-where-s-waldo-a-photo-tagging-app'
          target='_blank'
          rel='noreferrer'
        >
          Where&apos;s Waldo Project
        </a>
        . I wanted to make a star-searching game while learning Three.js.
      </p>

      <h2>From the sky to the simulation</h2>
      <p>
        For hundreds of years, people have mapped stars against an imaginary sphere centered on
        Earth: the celestial sphere. Astronomers describe a star&apos;s position with declination and
        right ascension, similar to latitude and longitude. Declination measures its angle north or
        south of the celestial equator. Right ascension measures eastward from the vernal equinox,
        the direction of the Sun at the March equinox.
      </p>
      <p>
        In this app, the viewer is at the origin and every star lies on a unit celestial sphere. In
        Three.js, Y is vertical, so XZ is the horizontal plane. The walkthrough below derives the
        X, Y, and Z coordinates from declination and right ascension.
      </p>

      <section className={styles.derivation} ref={derivation}>
        <div className={styles.story}>
          <section data-derivation-step='1' className={styles.storyStep}>
            <h3>1. Find Y with declination</h3>
            <p>
              We begin with a right triangle whose hypotenuse is the unit radius, r = 1. The
              vertical side is Y: the star&apos;s distance above or below the XZ plane. That gives us
              y = sin(Dec).
            </p>
          </section>

          <section data-derivation-step='2' className={styles.storyStep}>
            <h3>2. Find the horizontal radius</h3>
            <p>
              The other leg of the declination triangle is the distance from the origin to the
              star&apos;s XZ projection. We call it h. Since r = 1, h = cos(Dec). This is the radius
              used by the right-ascension triangle.
            </p>
          </section>

          <section data-derivation-step='3' className={styles.storyStep}>
            <h3>3. Use right ascension to find X</h3>
            <p>
              Looking down on the XZ plane gives us a second right triangle with h as its
              hypotenuse. Right ascension splits that radius into X and Z, beginning with
              x = h sin(RA).
            </p>
          </section>

          <section data-derivation-step='4' className={styles.storyStep}>
            <h3>4. Find Z</h3>
            <p>
              The adjacent side of the same triangle is z = h cos(RA). We now have all three
              Cartesian coordinates for the star.
            </p>
          </section>

          <section data-derivation-step='5' className={styles.storyStep}>
            <h3>5. Place the star</h3>
            <p>
              Substituting h = cos(Dec) gives the final unit-sphere coordinates. Repeating this
              calculation for every catalog entry places the stars around the viewer.
            </p>
          </section>
        </div>
        <aside className={styles.model}>
          <StarMapModel
            step={step}
            onStepChange={setStep}
            showNavigation={false}
            stacked
          />
        </aside>
      </section>

      <section className={styles.earlyDrafts}>
        <h2>Early drafts</h2>
        <p>
          Here&apos;s some early pen-and-paper work while I was trying to wrap my head around the
          problem. These sketches are where the two right triangles finally became clear.
        </p>
        <div className={styles.notebookDiagrams}>
          <figure>
            <div className={styles.diagramFrame}>
              <img src={declinationDiagram} alt='Early handwritten notes for deriving the coordinates' />
            </div>
            <figcaption>Early attempts to derive the coordinate relationships.</figcaption>
          </figure>
          <figure>
            <div className={styles.diagramFrame}>
              <img src={rightAscensionDiagram} alt='Handwritten sketch of the two right triangles' />
            </div>
            <figcaption>Finding the two triangles hidden in the celestial sphere.</figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
};

export default About;

import { useEffect, useRef, useState } from 'react';
import declinationDiagram from '../../assets/IMG_4205.jpeg';
import rightAscensionDiagram from '../../assets/IMG_4206.jpeg';
import StarMapModel from '../../components/StarMapModel/StarMapModel.jsx';
import styles from './about.module.css';

const About = () => {
  const [step, setStep] = useState(0);
  const walkthrough = useRef(null);

  useEffect(() => {
    const sections = walkthrough.current.querySelectorAll('[data-derivation-step]');
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (active) {
          const activeStep = Number(active.target.dataset.derivationStep);
          setStep(activeStep);
        }
      },
      { rootMargin: '-30% 0px -40%', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const stepClass = (number) =>
    `${styles.storyStep} ${step === number ? styles.activeStep : ''}`;

  return (
    <div className={styles.about}>
      <title>About | Starry Sky</title>
      <h1>About Starry Sky</h1>
      <p>A simulation and game centered around 120,000 stars in our night sky.</p>

      <section className={styles.walkthrough} ref={walkthrough}>
        <div className={styles.modelStage}>
          <StarMapModel
            step={step}
            showControls
            showNavigation={false}
            presentation
          />
        </div>
        <div className={styles.story}>
          <section
            data-derivation-step='0'
            className={styles.storyIntro}
          >
            <div className={styles.introCard}>
              <h2>Inspiration</h2>
              <p>
                I wanted to make people think more about their local constellations and stars.
                Light pollution affects all of us: in cities, it is easy to forget how beautiful
                the night sky can be. Humans once had a much closer relationship with the sky and
                the stories in its constellations. This project is a small way to reconnect with
                that view.
              </p>
              <p>
                The project began as a remix of The Odin Project&apos;s{' '}
                <a
                  href='https://www.theodinproject.com/lessons/nodejs-where-s-waldo-a-photo-tagging-app'
                  target='_blank'
                  rel='noreferrer'
                >
                  Where&apos;s Waldo Project
                </a>
                , combining a star-searching game with a chance to learn Three.js.
              </p>
            </div>
          </section>

          <section data-derivation-step='1' className={stepClass(1)}>
            <div className={styles.stepCard}>
              <h2>1. Find Y with declination</h2>
              <p>
                Astronomers map stars against an imaginary sphere centered on Earth: the celestial
                sphere. In our simulation, the viewer is at the origin and every star lies on a
                unit sphere, so r = 1. Three.js uses Y as vertical and XZ as the horizontal plane.
              </p>
              <p>
                Declination measures the angle north or south of the celestial equator. Its right
                triangle gives the vertical distance: y = sin(Dec).
              </p>
            </div>
          </section>

          <section data-derivation-step='2' className={stepClass(2)}>
            <div className={styles.stepCard}>
              <h2>2. Find the horizontal radius</h2>
              <p>
                The other leg of the declination triangle is the distance from the origin to the
                star&apos;s XZ projection. We call it h. Since r = 1, h = cos(Dec). This is the
                radius used by the right-ascension triangle.
              </p>
            </div>
          </section>

          <section data-derivation-step='3' className={stepClass(3)}>
            <div className={styles.stepCard}>
              <h2>3. Use right ascension to find X</h2>
              <p>
                Looking down on the XZ plane gives us a second right triangle with h as its
                hypotenuse. Right ascension measures eastward from the vernal equinox, the
                direction of the Sun at the March equinox. It gives x = h sin(RA).
              </p>
            </div>
          </section>

          <section data-derivation-step='4' className={stepClass(4)}>
            <div className={styles.stepCard}>
              <h2>4. Find Z</h2>
              <p>
                The adjacent side of the same right-ascension triangle is z = h cos(RA). We now
                have all three Cartesian coordinates for the star.
              </p>
            </div>
          </section>

          <section data-derivation-step='5' className={stepClass(5)}>
            <div className={styles.stepCard}>
              <h2>5. Place the star</h2>
              <p>
                Substituting h = cos(Dec) gives the final unit-sphere coordinates. Repeating this
                calculation for every catalog entry places the stars around the viewer.
              </p>
            </div>
          </section>
        </div>
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

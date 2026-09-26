import { useEffect, useRef, useState } from 'react';
import declinationDiagram from '../../assets/IMG_4205.jpeg';
import rightAscensionDiagram from '../../assets/IMG_4206.jpeg';
import StarMapModel from '../../components/StarMapModel/StarMapModel.jsx';
import styles from './about.module.css';

const About = () => {
  const [step, setStep] = useState(0);
  const [showModelControls, setShowModelControls] = useState(true);
  const walkthrough = useRef(null);

  useEffect(() => {
    const sections = [...walkthrough.current.querySelectorAll('[data-derivation-step]')];

    const updateStep = () => {
      const activationLine = window.innerHeight * 0.25;
      const active = sections.find((section) => {
        const { top, bottom } = section.getBoundingClientRect();
        return top <= activationLine && bottom >= activationLine;
      });

      setShowModelControls(window.innerWidth <= 700 || Boolean(active));
      if (active) setStep(Number(active.dataset.derivationStep));
    };

    updateStep();
    window.addEventListener('scroll', updateStep, { passive: true });
    window.addEventListener('resize', updateStep);
    return () => {
      window.removeEventListener('scroll', updateStep);
      window.removeEventListener('resize', updateStep);
    };
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
            showControls={showModelControls}
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
                So, I&apos;m in the middle of The Odin Project. After leaving tech to travel abroad
                for a year, I decided it was time to upskill, and I&apos;ve always been interested in
                full-stack development.
              </p>
              <p>
                I&apos;m currently working through one of their projects,{' '}
                <a
                  href='https://www.theodinproject.com/lessons/nodejs-where-s-waldo-a-photo-tagging-app'
                  target='_blank'
                  rel='noreferrer'
                >
                  The Where&apos;s Waldo tagging app
                </a>
                . I took the searching aspect of the project and pointed it towards space.
              </p>
              <p>
                I&apos;ve always been interested in space, and I&apos;ve thought for a while now that
                it&apos;s disappointing to be in a city and not be able to look up and observe the
                stars. Light pollution is a major problem, and I wanted to make something that
                reminds people about the beauty of the night sky.
              </p>
              <p>
                Thus, I built Starry Sky: a star-searching app to help people become more familiar
                with what might be invisible, but is always around us.
              </p>
              <h2>Challenges</h2>
              <p>
                I was a bit ambitious with this project. During my initial research, I found the{' '}
                <a href='https://codeberg.org/astronexus/hyg' target='_blank' rel='noreferrer'>
                  HYG Star Database
                </a>
                , which had the exact data I needed for the simulation.
              </p>
              <p>
                Astronomers use an equivalent of latitude and longitude to map the celestial sphere:
                declination and right ascension. With those angles, I had a plan. I would use a
                unit sphere and calculate the x, y, and z coordinates of each star relative to its
                origin.
              </p>
              <p>
                But how was I going to do that? Geometry. You can see me try to figure it out with
                pen and paper before turning the model into my first Three.js project.
              </p>
              <p>
                I won&apos;t lie: I struggled with this. But we got there eventually. Follow along and
                I&apos;ll show you how the good old SOHCAHTOA from high-school mathematics can translate
                angles into points in a Cartesian coordinate system.
              </p>
            </div>
          </section>

          <section data-derivation-step='1' className={stepClass(1)}>
            <div className={styles.stepCard}>
              <h2>1. Find y with declination</h2>
              <p>
                Declination is the angle away from the celestial equator: positive going north and
                negative going south. We&apos;re working with a unit sphere, so the distance from the
                origin to the star is 1, which gives us the hypotenuse of a right triangle.
              </p>
              <p>
                Since we know an angle and one side, we can calculate the side we&apos;re interested in:
                the distance y away from the equator.
              </p>
              <p>
                sin(Dec) = opposite / hypotenuse
                <br />
                sin(Dec) = y / 1
                <br />
                y = sin(Dec)
              </p>
            </div>
          </section>

          <section data-derivation-step='2' className={stepClass(2)}>
            <div className={styles.stepCard}>
              <h2>2. Find the horizontal radius, h</h2>
              <p>
                The other leg of the declination triangle is the distance from the origin to the
                star&apos;s XZ projection. We call it h. Since r = 1, h = cos(Dec). This is the
                radius used by the right-ascension triangle.
              </p>
            </div>
          </section>

          <section data-derivation-step='3' className={stepClass(3)}>
            <div className={styles.stepCard}>
              <h2>3. Use right ascension to find x</h2>
              <p>
                Looking down on the XZ plane gives us a second right triangle with h as its
                hypotenuse. Right ascension measures eastward from the vernal equinox, the
                direction of the Sun at the March equinox. It gives x = h sin(RA).
              </p>
            </div>
          </section>

          <section data-derivation-step='4' className={stepClass(4)}>
            <div className={styles.stepCard}>
              <h2>4. Find z</h2>
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

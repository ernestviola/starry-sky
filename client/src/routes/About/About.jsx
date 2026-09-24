import { useEffect, useRef, useState } from 'react';
import declinationDiagram from '../../assets/IMG_4205.jpeg';
import rightAscensionDiagram from '../../assets/IMG_4206.jpeg';
import StarMapModel from '../../components/StarMapModel/StarMapModel.jsx';
import styles from './about.module.css';

const STEP_LABELS = ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5'];

const About = () => {
  const [step, setStep] = useState(0);
  const [showModelControls, setShowModelControls] = useState(true);
  const [controlsSlots, setControlsSlots] = useState([]);
  const walkthrough = useRef(null);

  useEffect(() => {
    const sections = [...walkthrough.current.querySelectorAll('[data-derivation-step]')];
    const mobileQuery = window.matchMedia('(max-width: 700px)');
    let frame = 0;

    const updateDesktopStep = () => {
      const activationLine = window.innerHeight * 0.25;
      const active = sections.find((section) => {
        const { top, bottom } = section.getBoundingClientRect();
        return top <= activationLine && bottom >= activationLine;
      });

      setShowModelControls(Boolean(active));
      if (active) setStep(Number(active.dataset.derivationStep));
    };

    // Mobile: cards rest at the bottom of the screen, so the active step is the
    // last card whose top has scrolled past the lower activation line. There is
    // no gap between cards, so the step never flickers back to "none".
    const updateMobileStep = () => {
      const viewport = window.innerHeight;
      const activationLine = viewport * 0.8;
      let active = null;
      sections.forEach((section) => {
        if (section.firstElementChild.getBoundingClientRect().top <= activationLine) {
          active = section;
        }
      });

      setShowModelControls(true);
      setStep(active ? Number(active.dataset.derivationStep) : 0);
    };

    const updateStep = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (mobileQuery.matches) updateMobileStep();
        else updateDesktopStep();
      });
    };

    // One step per screen on phones. "proximity" (not "mandatory") so the
    // snap never traps someone reading a card taller than the space below the model.
    const root = document.documentElement;
    const syncSnap = () => {
      root.classList.toggle(styles.snapRoot, mobileQuery.matches);
      setControlsSlots(
        mobileQuery.matches
          ? sections.map((section) => ({
              step: Number(section.dataset.derivationStep),
              element: section.querySelector('[data-controls-slot]'),
            }))
          : [],
      );
    };
    syncSnap();
    mobileQuery.addEventListener?.('change', syncSnap);

    updateStep();
    window.addEventListener('scroll', updateStep, { passive: true });
    window.addEventListener('resize', updateStep);
    return () => {
      cancelAnimationFrame(frame);
      root.classList.remove(styles.snapRoot);
      mobileQuery.removeEventListener?.('change', syncSnap);
      window.removeEventListener('scroll', updateStep);
      window.removeEventListener('resize', updateStep);
    };
  }, []);

  const goToStep = (number) => {
    const section = walkthrough.current.querySelector(`[data-derivation-step="${number}"]`);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const stepClass = (number) =>
    `${styles.storyStep} ${step === number ? styles.activeStep : ''}`;

  return (
    <div className={styles.about}>
      <title>About | Starry Sky</title>
      <h1>About Starry Sky</h1>
      <p>A simulation and game centered around 120,000 stars in our night sky.</p>

      <section className={styles.inspiration}>
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
      </section>

      <section className={styles.walkthrough} ref={walkthrough}>
        <div className={styles.modelStage}>
          <StarMapModel
            step={step}
            showControls={showModelControls}
            showNavigation={false}
            presentation
            controlsTargets={controlsSlots}
          />
          <nav className={styles.stepRail} aria-label='Walkthrough steps'>
            {STEP_LABELS.map((label, index) => (
              <button
                key={label}
                type='button'
                aria-label={label}
                aria-current={step === index + 1 ? 'step' : undefined}
                onClick={() => goToStep(index + 1)}
              >
                <span className={styles.stepDot} />
              </button>
            ))}
          </nav>
        </div>
        <div className={styles.story}>
          <section data-derivation-step='1' className={stepClass(1)}>
            <div className={styles.stepCard}>
              <h2>1. Find y with declination</h2>
              <p>
                Astronomers map stars against an imaginary sphere centered on Earth: the celestial
                sphere. In our simulation, the viewer is at the origin and every star lies on a
                unit sphere, so r = 1. Three.js uses Y as vertical and XZ as the horizontal plane.
              </p>
              <p>
                Declination measures the angle north or south of the celestial equator. Its right
                triangle gives the vertical distance: y = sin(Dec).
              </p>
              <div data-controls-slot='' />
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
              <div data-controls-slot='' />
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
              <div data-controls-slot='' />
            </div>
          </section>

          <section data-derivation-step='4' className={stepClass(4)}>
            <div className={styles.stepCard}>
              <h2>4. Find z</h2>
              <p>
                The adjacent side of the same right-ascension triangle is z = h cos(RA). We now
                have all three Cartesian coordinates for the star.
              </p>
              <div data-controls-slot='' />
            </div>
          </section>

          <section data-derivation-step='5' className={stepClass(5)}>
            <div className={styles.stepCard}>
              <h2>5. Place the star</h2>
              <p>
                Substituting h = cos(Dec) gives the final unit-sphere coordinates. Repeating this
                calculation for every catalog entry places the stars around the viewer.
              </p>
              <div data-controls-slot='' />
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

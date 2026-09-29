import { useEffect, useRef, useState } from 'react';
import declinationDiagram from '../../assets/IMG_4205.jpeg';
import rightAscensionDiagram from '../../assets/IMG_4206.jpeg';
import StarMapModel from '../../components/StarMapModel/StarMapModel.jsx';
import styles from './about.module.css';
import { mobileAngles } from './mobileAngles.js';

const mobileDeclinationCamera = {
  position: [-4.2, 0.7, 1.8],
  target: [0, -0.9, 1.45],
};
const mobileOverheadCamera = {
  position: [0, 3.4, 0.01],
  target: [0, 0, 0],
  offsetY: 0.2,
};
const mobileFinalCamera = {
  position: [0.85, 1.3, 2.6],
  target: [0, 0, 0],
};
const declinationTitles = ['Find y with declination', 'Find the horizontal radius, h'];

const StepCard = ({ children }) => (
  <div className={styles.stepCard}>{children}</div>
);

const AboutWalkthrough = ({ isMobile }) => {
  const [step, setStep] = useState(null);
  const [focusedStep, setFocusedStep] = useState(0);
  const [showControllerPanel, setShowControllerPanel] = useState(false);
  const [controllerStep, setControllerStep] = useState(1);
  const [scrollAngles, setScrollAngles] = useState(() => mobileAngles(0));
  const [controlsContainer, setControlsContainer] = useState(null);
  const [exploring, setExploring] = useState(false);
  const exploreButton = useRef(null);
  const backButton = useRef(null);
  const walkthrough = useRef(null);

  const exitExplore = () => {
    setExploring(false);
    requestAnimationFrame(() => exploreButton.current?.focus());
  };

  useEffect(() => {
    if (!isMobile || !exploring) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    backButton.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') exitExplore();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      root.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobile, exploring]);

  useEffect(() => {
    if (isMobile) {
      const cards = [
        ...walkthrough.current.querySelectorAll(`.${styles.storyStep}`),
      ];
      const stage = walkthrough.current.querySelector(`.${styles.modelStage}`);
      let frame;
      const update = () => {
        const stageRect = stage.getBoundingClientRect();
        const line = 0;
        const current =
          stageRect.top <= 0
            ? cards.findLast(
                (section) => section.getBoundingClientRect().top <= line,
              )
            : null;
        const number = current ? Number(current.dataset.derivationStep) : 0;
        const progress = (section) =>
          Math.max(
            0,
            Math.min(
              1,
              (line - section.getBoundingClientRect().top) /
                section.offsetHeight,
            ),
          );
        setFocusedStep(number);
        setStep(number);
        setScrollAngles(
          mobileAngles(
            number,
            number >= 1 && number <= 4 ? progress(cards[number - 1]) : 0,
          ),
        );
      };
      const schedule = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(update);
      };
      schedule();
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
      };
    }
    const root = document.documentElement;
    const previousSnapType = root.style.scrollSnapType;
    if (!isMobile) root.style.scrollSnapType = 'none';
    const sections = [
      ...walkthrough.current.querySelectorAll('[data-derivation-step]'),
    ];
    const stepCards = sections.filter(
      (section) => section.dataset.derivationStep !== '0',
    );
    let snapEnabled = true;
    let previousScrollY = window.scrollY;
    const updateStep = () => {
      const modelStepLine = window.innerHeight * 0.25;
      const active = sections.find((section) => {
        const { top, bottom } = section.getBoundingClientRect();
        return top <= modelStepLine && bottom >= modelStepLine;
      });

      const focused = sections.findLast(
        (section) =>
          section.getBoundingClientRect().top <= window.innerHeight * 0.5,
      );

      const activeStep = active ? Number(active.dataset.derivationStep) : null;
      const focusedStepNumber = focused
        ? Number(focused.dataset.derivationStep)
        : 0;
      const scrollY = window.scrollY;
      if (!isMobile) {
        if (focusedStepNumber === 0) {
          if (scrollY < previousScrollY) snapEnabled = false;
          if (scrollY > previousScrollY) snapEnabled = true;
        } else snapEnabled = true;
        previousScrollY = scrollY;
        const snapType = snapEnabled ? 'y proximity' : 'none';
        if (root.style.scrollSnapType !== snapType) {
          root.style.scrollSnapType = snapType;
        }
      }
      const viewportHeight = window.innerHeight;
      stepCards.forEach((section, index) => {
        const cardTop = section.firstElementChild.getBoundingClientRect().top;
        const fadeIn =
          (viewportHeight * 0.75 - cardTop) / (viewportHeight * 0.25);
        const fadeOut = cardTop / (viewportHeight * 0.25);
        section.style.setProperty(
          '--reveal',
          Math.max(0, Math.min(1, fadeIn, fadeOut)),
        );
        if (index === stepCards.length - 1) return;
        const nextTop = stepCards[index + 1].getBoundingClientRect().top;

        const progress = Math.max(
          0,
          Math.min(
            1,
            (window.innerHeight - nextTop) / (window.innerHeight * 0.4),
          ),
        );
        section.firstElementChild.style.setProperty(
          '--border-progress',
          progress,
        );
      });
      setFocusedStep(focusedStepNumber);
      const stickyLine = window.innerHeight * 0.25;

      const showController = stepCards.findLast((section) => {
        const card = section.firstElementChild;
        return Math.abs(card.getBoundingClientRect().top - stickyLine) < 1;
      });

      if (showController) {
        setControllerStep(Number(showController.dataset.derivationStep));
      }
      setShowControllerPanel(Boolean(showController));
      if (active) setStep(activeStep);
    };

    updateStep();
    window.addEventListener('scroll', updateStep, { passive: true });
    window.addEventListener('resize', updateStep);
    return () => {
      if (!isMobile) root.style.scrollSnapType = previousSnapType;
      window.removeEventListener('scroll', updateStep);
      window.removeEventListener('resize', updateStep);
    };
  }, [isMobile]);

  const stepClass = (number) =>
    `${styles.storyStep} ${focusedStep === number ? styles.activeStep : ''}`;
  return (
    <div
      className={styles.about}
      data-walkthrough={isMobile ? 'mobile' : 'desktop'}
      data-mode={exploring ? 'explore' : 'walkthrough'}
    >
      <title>About | Starry Sky</title>
      <section className={styles.walkthrough} ref={walkthrough}>
        <div
          className={`${styles.modelStage} ${exploring ? styles.exploringStage : ''}`}
        >
          {isMobile && (focusedStep === 1 || focusedStep === 2) && (
            <div className={styles.mobileSceneInfo}>
              <div className={styles.liveCalculation} aria-label='Live calculation'>
                <span>Dec {Math.round(scrollAngles.declination * 180 / Math.PI)}°</span>
                <span>{focusedStep === 1 ? 'y = sin(Dec)' : 'h = cos(Dec)'}</span>
                <strong>
                  {focusedStep === 1 ? 'y' : 'h'} = {' '}
                  {(focusedStep === 1
                    ? Math.sin(scrollAngles.declination)
                    : Math.cos(scrollAngles.declination)).toFixed(2)}
                </strong>
              </div>
            </div>
          )}
          {isMobile && (focusedStep === 3 || focusedStep === 4) && (
            <div className={styles.overheadSceneInfo}>
              <div className={styles.liveCalculation} aria-label='Live calculation'>
                <span>RA {Math.round(scrollAngles.rightAscension * 180 / Math.PI)}°</span>
                <span>{focusedStep === 3 ? 'x = h sin(RA)' : 'z = h cos(RA)'}</span>
                <strong>
                  {focusedStep === 3 ? 'x' : 'z'} ={' '}
                  {(Math.cos(scrollAngles.declination) * (focusedStep === 3
                    ? Math.sin(scrollAngles.rightAscension)
                    : Math.cos(scrollAngles.rightAscension))).toFixed(2)}
                </strong>
              </div>
            </div>
          )}
          <div
            className={styles.modelFrame}
          >
            <StarMapModel
              step={step}
              controlsStep={isMobile ? step : controllerStep}
              showControls={isMobile ? exploring : showControllerPanel}
              showNavigation={false}
              presentation
              scrollAngles={isMobile && step !== 5 ? scrollAngles : undefined}
              renderControls={isMobile ? exploring : true}
              showWireframeControl={!isMobile}
              controlsContainer={isMobile ? controlsContainer : undefined}
              allowOrbit={!isMobile || exploring}
              declinationCamera={isMobile ? mobileDeclinationCamera : undefined}
              overheadCamera={isMobile ? mobileOverheadCamera : undefined}
              finalCamera={isMobile ? mobileFinalCamera : undefined}
            />
          </div>
          {isMobile && (
            <div className={styles.explorePanel} hidden={!exploring}>
              <button ref={backButton} type='button' onClick={exitExplore}>Back to Place the star</button>
              <div ref={setControlsContainer} />
            </div>
          )}
        </div>
        <div className={styles.story}>
          <section data-derivation-step='0' className={styles.aboutHeader}>
            <h1>About Starry Sky</h1>
            <p>
              A simulation and game centered around 120,000 stars in our night
              sky. <b>Read until the end to see the star model.</b>
            </p>
            <div className={styles.introCard}>
              <h2>Inspiration</h2>
              <p>
                So, I&apos;m in the middle of The Odin Project. After leaving
                tech to travel abroad for a year, I decided it was time to
                upskill, and I&apos;ve always been interested in full-stack
                development.
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
                . I took the searching aspect of the project and pointed it
                towards space.
              </p>
              <p>
                I&apos;ve always been interested in space, and I&apos;ve thought
                for a while now that it&apos;s disappointing to be in a city and
                not be able to look up and observe the stars. Light pollution is
                a major problem, and I wanted to make something that reminds
                people about the beauty of the night sky.
              </p>
              <p>
                Thus, I built Starry Sky: a star-searching app to help people
                become more familiar with what might be invisible, but is always
                around us.
              </p>
              <h2>Challenges</h2>
              <p>
                I was a bit ambitious with this project. During my initial
                research, I found the{' '}
                <a
                  href='https://codeberg.org/astronexus/hyg'
                  target='_blank'
                  rel='noreferrer'
                >
                  HYG Star Database
                </a>
                , which had the exact data I needed for the simulation.
              </p>
              <p>
                Astronomers use an equivalent of latitude and longitude to map
                the celestial sphere: declination and right ascension. With
                those angles, I had a plan. I would use a unit sphere and
                calculate the x, y, and z coordinates of each star relative to
                its origin.
              </p>
              <p>
                But how was I going to do that? Geometry. You can see me try to
                figure it out with pen and paper before turning the model into
                my first Three.js project.
              </p>
              <div className={styles.notebookDiagrams}>
                <figure>
                  <div className={styles.diagramFrame}>
                    <img
                      src={declinationDiagram}
                      alt='Early handwritten notes for deriving the coordinates'
                    />
                  </div>
                  <figcaption>
                    Early attempts to derive the coordinate relationships.
                  </figcaption>
                </figure>
                <figure>
                  <div className={styles.diagramFrame}>
                    <img
                      src={rightAscensionDiagram}
                      alt='Handwritten sketch of the two right triangles'
                    />
                  </div>
                  <figcaption>
                    Finding the two triangles hidden in the celestial sphere.
                  </figcaption>
                </figure>
              </div>
              <p>
                I won&apos;t lie: I struggled with this. But we got there
                eventually. Follow along and I&apos;ll show you how the good old
                SOHCAHTOA from high-school mathematics can translate angles into
                points in a Cartesian coordinate system.
              </p>
            </div>
          </section>

          <section data-derivation-step='1' className={stepClass(1)}>
            <StepCard>
              <h2>{declinationTitles[0]}</h2>
              <p>
                Declination is the angle away from the celestial equator:
                positive going north and negative going south. We&apos;re
                working with a unit sphere, so the distance from the origin to
                the star is 1, which gives us the hypotenuse of a right
                triangle.
              </p>
              <p>
                Since we know an angle and one side, we can calculate the side
                we&apos;re interested in: the distance y away from the equator.
              </p>
              <p className={styles.stepEquation}>
                sin(Dec) = opposite / hypotenuse
                <br />
                sin(Dec) = y / 1
                <br />y = sin(Dec)
              </p>
            </StepCard>
          </section>

          <section data-derivation-step='2' className={stepClass(2)}>
            <StepCard>
              <h2>{declinationTitles[1]}</h2>
              <p>
                The other leg of the declination triangle is the distance from
                the origin to the star&apos;s XZ projection. We call it h. Since
                r = 1, h = cos(Dec). This is the radius used by the
                right-ascension triangle.
              </p>
            </StepCard>
          </section>

          <section data-derivation-step='3' className={stepClass(3)}>
            <StepCard>
              <h2>Use right ascension to find x</h2>
              <p>
                Looking down on the XZ plane gives us a second right triangle
                with h as its hypotenuse. Right ascension measures eastward from
                the vernal equinox, the direction of the Sun at the March
                equinox. It gives x = h sin(RA).
              </p>
            </StepCard>
          </section>

          <section data-derivation-step='4' className={stepClass(4)}>
            <StepCard>
              <h2>Find z</h2>
              <p>
                The adjacent side of the same right-ascension triangle is z = h
                cos(RA). We now have all three Cartesian coordinates for the
                star.
              </p>
            </StepCard>
          </section>

          <section
            data-derivation-step='5'
            className={`${stepClass(5)} ${exploring ? styles.exploringStep : ''}`}
          >
            <StepCard>
              <h2>Place the star</h2>
              <p>
                Substituting h = cos(Dec) gives the final unit-sphere
                coordinates. Repeating this calculation for every catalog entry
                places the stars around the viewer.
              </p>
              {isMobile && (
                <button
                  ref={exploreButton}
                  type='button'
                  className={styles.exploreButton}
                  onClick={() => setExploring(true)}
                >
                  Explore the model
                </button>
              )}
            </StepCard>
          </section>
        </div>
      </section>
    </div>
  );
};

const DesktopAboutWalkthrough = () => <AboutWalkthrough isMobile={false} />;
const MobileAboutWalkthrough = () => <AboutWalkthrough isMobile />;

const About = () => {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 900px)').matches,
  );

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const update = (event) => setIsMobile(event.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isMobile ? <MobileAboutWalkthrough /> : <DesktopAboutWalkthrough />;
};

export default About;

import { useEffect, useRef, useState } from 'react';
import declinationDiagram from '../../assets/IMG_4205.jpeg';
import rightAscensionDiagram from '../../assets/IMG_4206.jpeg';
import StarMapModel from '../../components/StarMapModel/StarMapModel.jsx';
import styles from './about.module.css';
import { mobileAngles } from './mobileAngles.js';
import {
  BiDownArrow,
  BiSolidDownArrow,
  BiUpArrow,
  BiSolidUpArrow,
} from 'react-icons/bi';

const desktopDeclinationCamera = {
  position: [-2.6, 1.4, 1.1],
  target: [0, 0, 0],
};
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
const declinationTitles = [
  'Find y with declination',
  'Find the horizontal radius, h',
];

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
    requestAnimationFrame(() => exploreButton.current?.focus({ preventScroll: true }));
  };

  useEffect(() => {
    if (!exploring) return;
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

  const finalCard = (
    <StepCard>
      <h2>Find z</h2>
      <p>
        The adjacent side of the same right-ascension triangle is z = h
        cos(RA). We now have all three Cartesian coordinates and can
        finally place the star.
      </p>
    </StepCard>
  );

  const stepClass = (number) =>
    `${styles.storyStep} ${focusedStep === number ? styles.activeStep : ''}`;
  return (
    <div
      className={`${styles.about} ${!isMobile && exploring ? styles.desktopExploring : ''}`}
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
              <div
                className={styles.liveCalculation}
                aria-label='Live calculation'
              >
                <span>
                  Dec {Math.round((scrollAngles.declination * 180) / Math.PI)}°
                </span>
                <span>
                  {focusedStep === 1 ? 'y = sin(Dec)' : 'h = cos(Dec)'}
                </span>
                <strong>
                  {focusedStep === 1 ? 'y' : 'h'} ={' '}
                  {(focusedStep === 1
                    ? Math.sin(scrollAngles.declination)
                    : Math.cos(scrollAngles.declination)
                  ).toFixed(2)}
                </strong>
              </div>
            </div>
          )}
          {isMobile && (focusedStep === 3 || focusedStep === 4) && (
            <div className={styles.overheadSceneInfo}>
              <div
                className={styles.liveCalculation}
                aria-label='Live calculation'
              >
                <span>
                  RA {Math.round((scrollAngles.rightAscension * 180) / Math.PI)}
                  °
                </span>
                <span>
                  {focusedStep === 3 ? 'x = h sin(RA)' : 'z = h cos(RA)'}
                </span>
                <strong>
                  {focusedStep === 3 ? 'x' : 'z'} ={' '}
                  {(
                    Math.cos(scrollAngles.declination) *
                    (focusedStep === 3
                      ? Math.sin(scrollAngles.rightAscension)
                      : Math.cos(scrollAngles.rightAscension))
                  ).toFixed(2)}
                </strong>
              </div>
            </div>
          )}
          <div className={styles.modelFrame}>
            <StarMapModel
              step={exploring ? 5 : step}
              controlsStep={exploring ? 5 : isMobile ? step : controllerStep}
              showControls={exploring || (!isMobile && showControllerPanel)}
              showNavigation={false}
              presentation
              scrollAngles={isMobile && step !== 5 ? scrollAngles : undefined}
              renderControls={isMobile ? exploring : exploring || step > 0}
              showWireframeControl={!isMobile}
              controlsContainer={isMobile ? controlsContainer : undefined}
              allowOrbit={exploring}
              declinationCamera={isMobile ? mobileDeclinationCamera : desktopDeclinationCamera}
              overheadCamera={isMobile ? mobileOverheadCamera : undefined}
              finalCamera={isMobile ? mobileFinalCamera : undefined}
            />
          </div>
        </div>
        {isMobile && (
          <div
            className={styles.explorePanel}
            hidden={!exploring}
            ref={setControlsContainer}
          />
        )}
        {!exploring && focusedStep === (isMobile ? 5 : 4) && (
          <button
            ref={exploreButton}
            type='button'
            className={`${styles.desktopExploreAction} ${styles.desktopEntryAction}`}
            onClick={() => setExploring(true)}
          >
            <span>Explore The Model</span>
            <span className={styles.directionArrow} aria-hidden='true'>
              <BiDownArrow className={styles.arrowOutline} />
              <BiSolidDownArrow className={styles.arrowSolid} />
            </span>
          </button>
        )}
        {exploring && (
          <button
            ref={backButton}
            type='button'
            className={`${styles.desktopExploreAction} ${styles.desktopReturnAction}`}
            onClick={exitExplore}
          >
            <span className={styles.directionArrow} aria-hidden='true'>
              <BiUpArrow className={styles.arrowOutline} />
              <BiSolidUpArrow className={styles.arrowSolid} />
            </span>
            <span>Back to Walkthrough</span>
          </button>
        )}
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
                After leaving tech to travel abroad for a year and coming back
                to the industry radically changing, I decided it was time to
                upskill. I’ve always been interested in full stack development,
                so after a bit of searching I found{' '}
                <a
                  href='https://www.theodinproject.com/'
                  target='_blank'
                  rel='noreferrer'
                >
                  The Odin Project
                </a>
                . I&apos;m currently working through one of their projects,{' '}
                <a
                  href='https://www.theodinproject.com/lessons/nodejs-where-s-waldo-a-photo-tagging-app'
                  target='_blank'
                  rel='noreferrer'
                >
                  The Where&apos;s Waldo tagging app
                </a>
                .
              </p>
              <p>
                There were mainly two features that were required from this app:
                a leaderboard to record user scores and object detection via a
                mouse pointer. Having gone through a number of previous projects
                already I decided for this one I wanted to do something
                different.
              </p>
              <p>
                I’ve always loved watching the night sky and trying to guess
                which ones were which, being with friends or family pointing up
                at what I thought was the North Star (Polaris) or guessing at
                which set of stars was the Little Dipper.
              </p>
              <p>
                But being from the city, I don’t get that opportunity often. So
                I thought to myself wouldn’t it be fun to remind people of
                what’s always around them even if it’s not always visible? Thus,
                I created Starry Sky, a way for people to reconnect with the
                stars.
              </p>
              <h2>Challenges</h2>
              <p>
                Admittedly I was a bit ambitious with this project. I knew what
                I wanted, a Three.js simulation where users could explore the
                constellations like they were looking up at them.
              </p>
              <p>
                But first I needed data, I eventually found the{' '}
                <a
                  href='https://codeberg.org/astronexus/hyg'
                  target='_blank'
                  rel='noreferrer'
                >
                  HYG Star Database
                </a>
                , a collection of stars and their attributes combined from three
                different star catalogues (Hipparcos, Yale, and Gliese). I was
                lucky to find that It had exactly what I needed, it contained
                the angles used to calculate the position of the stars in
                relation to the earth on the celestial sphere.
              </p>
              <p>
                Have you ever seen The Truman Show? Well I want you to imagine
                there’s a large dome above you, you can’t see the start or end
                of the dome but the sky is painted on it. In fact imagine the
                dome actually covers the entire earth, in fact that dome no
                longer has walls, and what is a dome with no walls? A sphere!
              </p>
              <p>
                The celestial sphere is essentially that, it’s a construct that
                we created to help us visualize where celestial objects are
                placed in the sky.
              </p>
              <p>
                We can take some angles and use those as directions to get to
                where we should place a celestial object. We call these angles
                the{' '}
                <a
                  href='https://en.wikipedia.org/wiki/Declination'
                  target='_blank'
                  rel='noreferrer'
                >
                  declination
                </a>{' '}
                and{' '}
                <a
                  href='https://en.wikipedia.org/wiki/Right_ascension'
                  target='_blank'
                  rel='noreferrer'
                >
                  right ascension
                </a>
                .
              </p>
              <p>
                So you get how the celestial sphere works now, but here comes
                the first challenge. How do we actually represent these
                celestial objects on a Three.js canvas? Geometry that’s how!
                Below you can see me trying to figure out exactly how to do
                this.
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
                I won&apos;t lie, I struggled with this. But we got there
                eventually! Follow along and I&apos;ll show you how the good old
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
            {finalCard}
          </section>

          {isMobile && (
            <section data-derivation-step='5' className={stepClass(5)} />
          )}
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

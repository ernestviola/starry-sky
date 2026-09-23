import styles from './designSystem.module.css';

const colors = [
  ['Background', 'var(--color-background)', '--color-background'],
  ['Panel', 'var(--color-panel)', '--color-panel'],
  ['Raised panel', 'var(--color-panel-raised)', '--color-panel-raised'],
  ['Primary text', 'var(--color-text-primary)', '--color-text-primary'],
  ['Body text', 'var(--color-text-body)', '--color-text-body'],
  ['Subtle text', 'var(--color-text-subtle)', '--color-text-subtle'],
  ['Accent', 'var(--color-accent)', '--color-accent'],
  ['Border', 'var(--color-border)', '--color-border'],
];

const DesignSystem = () => (
  <div className={styles.page}>
    <title>Design system | Starry Sky</title>
    <header className={styles.intro}>
      <p className={styles.eyebrow}>Starry Sky / Design system</p>
      <h1>Arcade Orbit</h1>
      <p className={styles.lede}>
        A practical reference for the interface layer: cool near-black
        surfaces, violet actions, clear data readouts, and restrained motion.
      </p>
    </header>

    <section className={styles.section}>
      <h2>Color</h2>
      <div className={styles.swatches}>
        {colors.map(([name, value, token]) => (
          <div className={styles.swatch} key={token}>
            <div className={styles.color} style={{ background: value }} />
            <strong>{name}</strong>
            <code>{token}</code>
          </div>
        ))}
      </div>
      <div className={styles.stateRow}>
        <span className={styles.success}>Success</span>
        <span className={styles.warning}>Warning</span>
        <span className={styles.danger}>Danger</span>
        <span className={styles.disabled}>Disabled</span>
      </div>
    </section>

    <section className={styles.section}>
      <h2>Typography</h2>
      <div className={styles.typeSamples}>
        <div><span className={styles.label}>Display / Space Grotesk 700</span><p className={styles.display}>Find your stars.</p></div>
        <div><span className={styles.label}>Body / Inter 400</span><p className={styles.body}>Search a live sky and race the clock to trace real constellations.</p></div>
        <div><span className={styles.label}>Data / Space Mono 400</span><p className={styles.data}>00:42.318 · HIP 79992 · 18.15s</p></div>
      </div>
    </section>

    <section className={styles.section}>
      <h2>Components</h2>
      <div className={styles.componentGrid}>
        <div className={styles.example}>
          <span className={styles.label}>Actions</span>
          <div className={styles.actions}><button>Play now</button><button className={styles.secondary}>View details</button></div>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Card</span>
          <h3>Asuusiha</h3>
          <p className={styles.data}>HIP 79992<br />Mag 3.91</p>
        </div>
        <div className={styles.example}>
          <span className={styles.label}>Spacing</span>
          <div className={styles.spacing}><i /><i /><i /><i /><i /></div>
          <p className={styles.data}>space-1 → space-5</p>
        </div>
      </div>
    </section>

    <section className={styles.section}>
      <h2>Responsive handoff</h2>
      <p className={styles.body}>
        Keep these tokens as the shared source when the mobile system is
        translated. Recompose layouts for touch and smaller screens without
        introducing a second set of colors, type, or spacing values.
      </p>
    </section>
  </div>
);

export default DesignSystem;

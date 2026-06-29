import { Reveal } from "./Reveal";
import styles from "@/styles/Landing.module.css";

const STEPS = [
  {
    num: "01",
    title: "Connect your channel",
    desc: "Sign in with Google and grant YouTube upload access. Setup takes under 30 seconds.",
  },
  {
    num: "02",
    title: "Drop your Short",
    desc: "Drag in an MP4 (up to 200MB). We validate the format and show a live preview.",
  },
  {
    num: "03",
    title: "Add details & publish",
    desc: "Set the title, description, and visibility, then upload straight to YouTube.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className={`${styles.section} ${styles.sectionAlt}`}>
      <div className="container">
        <Reveal className={styles.sectionHead}>
          <span className={styles.eyebrow}>How it works</span>
          <h2 className={styles.sectionTitle}>From file to feed in three steps</h2>
          <p className={styles.sectionSub}>
            No tutorials, no friction. The fastest path from your camera roll to
            your audience.
          </p>
        </Reveal>

        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <Reveal key={s.num} as="div" delay={i * 0.1} className={styles.step}>
              <div className={styles.stepNum}>{s.num}</div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

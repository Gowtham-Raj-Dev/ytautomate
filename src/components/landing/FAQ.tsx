"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "./Reveal";
import { cx } from "@/lib/utils";
import styles from "@/styles/Landing.module.css";

const FAQS = [
  {
    q: "Do I need a YouTube API key?",
    a: "No. You simply sign in with Google and grant upload permission. YT Automate handles the YouTube Data API connection securely on your behalf.",
  },
  {
    q: "What file formats are supported?",
    a: "We currently support MP4 files up to 200MB, optimized for the vertical 9:16 Shorts format. More formats are on the roadmap.",
  },
  {
    q: "Is my YouTube account safe?",
    a: "Yes. We use Google's official OAuth flow and only request the youtube.upload scope. We never store your password, and you can disconnect your channel any time.",
  },
  {
    q: "Can I choose who sees my Short?",
    a: "Absolutely. Every upload lets you pick Public, Unlisted, or Private visibility before publishing.",
  },
  {
    q: "Will it appear as a Short on YouTube?",
    a: "Yes. As long as your video is vertical and under 60 seconds, YouTube classifies it as a Short automatically.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Of course. There are no contracts — upgrade, downgrade, or cancel from your settings whenever you like.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className={`${styles.section} ${styles.sectionAlt}`}>
      <div className="container">
        <Reveal className={styles.sectionHead}>
          <span className={styles.eyebrow}>FAQ</span>
          <h2 className={styles.sectionTitle}>Frequently asked questions</h2>
          <p className={styles.sectionSub}>
            Everything you need to know before getting started.
          </p>
        </Reveal>

        <div className={styles.faqList}>
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 0.04} className={styles.faqItem}>
                <button
                  className={styles.faqQuestion}
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <span className={cx(styles.faqIcon, isOpen && styles.faqIconOpen)} aria-hidden>
                    +
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className={styles.faqAnswerWrap}
                    >
                      <p className={styles.faqAnswer}>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

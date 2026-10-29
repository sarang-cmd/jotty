import { motion, useReducedMotion } from "motion/react";
import { FaqSection } from "./FaqSection.jsx";
import {
  Footer,
  GuidesSection,
  Header,
  HeroSection,
  IdeaSection,
  InstallSection,
  JudgeSection,
  MorningSection,
  PatternsSection,
  PlayerSection,
  PrivacySection,
} from "./sections.jsx";

/**
 * The landing page, rendered by React from the components in sections.jsx.
 * The interactive demos are wired by controller.js after the first commit,
 * because they own their own DOM state and timers.
 */
export function Landing() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <Header />
      <main id="main">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeroSection />
        </motion.div>
        <IdeaSection />
        <JudgeSection />
        <MorningSection />
        <PatternsSection />
        <PlayerSection />
        <PrivacySection />
        <InstallSection />
        <FaqSection />
        <GuidesSection />
      </main>
      <Footer />
    </>
  );
}

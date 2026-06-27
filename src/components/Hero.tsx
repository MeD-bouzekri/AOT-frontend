"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { ArrowRight, CodeXml } from "lucide-react";
import MagneticButton from "./MagneticButton";
import Typewriter from "./Typewriter";

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);

  /* track how far the hero has scrolled out of the viewport */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  /* fade out + slight upward shift as user scrolls past hero (TEXT only) */
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.8], [0, -60]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.97]);


  /* mouse-driven depth parallax: background orbs drift opposite the cursor */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const pxSlow = useSpring(useTransform(mx, [-0.5, 0.5], [25, -25]), {
    stiffness: 60,
    damping: 20,
  });
  const pySlow = useSpring(useTransform(my, [-0.5, 0.5], [25, -25]), {
    stiffness: 60,
    damping: 20,
  });
  const pxFast = useSpring(useTransform(mx, [-0.5, 0.5], [-45, 45]), {
    stiffness: 80,
    damping: 18,
  });
  const pyFast = useSpring(useTransform(my, [-0.5, 0.5], [-45, 45]), {
    stiffness: 80,
    damping: 18,
  });

  const onMouseMove = (e: React.MouseEvent) => {
    mx.set(e.clientX / window.innerWidth - 0.5);
    my.set(e.clientY / window.innerHeight - 0.5);
  };

  return (
    <section
      ref={sectionRef}
      id="platform"
      onMouseMove={onMouseMove}
      className="relative pt-32 pb-24 overflow-hidden flex flex-col justify-center min-h-screen"
    >
      {/* Decorative Grid and Dot Overlays */}
      <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-brand-teal/10 via-transparent to-transparent pointer-events-none" />

      {/* Glowing Ambient Orbs — parallax with cursor for depth */}
      <motion.div
        style={{ x: pxSlow, y: pySlow }}
        className="absolute top-1/4 left-10 w-[350px] h-[350px] rounded-full bg-brand-teal/10 pointer-events-none animate-pulse-subtle blur-[100px]"
      />
      <motion.div
        style={{ x: pxFast, y: pyFast }}
        className="absolute bottom-10 right-10 w-[400px] h-[400px] rounded-full bg-brand-copper/10 pointer-events-none animate-pulse-subtle blur-[80px]"
      />

      {/* Scroll-driven parallax wrapper */}
      <motion.div
        style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full"
      >
        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Text Content Column (Left 6 columns) */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* Headline — colored phrase typed dynamically */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-black text-text-primary leading-[1.1] tracking-tight"
            >
              The Dynamic Adaptive{" "}
              <Typewriter
                words={[
                  "Enterprise Orchestrator.",
                  "Agent Assembler.",
                  "Workflow Brain.",
                  "Decision Engine.",
                ]}
                className="text-gradient-cyan-purple font-display font-semibold tracking-tight inline-block min-h-[1.1em]"
              />
            </motion.h1>

            {/* Subheading — professional, balanced measure */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-text-secondary font-sans text-base sm:text-lg leading-relaxed max-w-xl font-normal tracking-[-0.005em] text-pretty mx-auto lg:mx-0"
            >
              OrchestrAI intelligently assembles specialized agent teams, recalls
              institutional memory, anticipates risks, and orchestrates complex
              multi-department workflows with full traceability.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4"
            >
              <MagneticButton
                href="#cta"
                id="hero-primary-cta"
                className="btn-brutal group"
              >
                <span>Request Early Access</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>

              <a
                href="#features"
                id="hero-secondary-cta"
                className="btn-brutal-ghost group"
              >
                <CodeXml className="w-4 h-4" />
                <span>See How It Works</span>
              </a>
            </motion.div>

            {/* Micro stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-3 gap-6 pt-8 border-t border-brand-border max-w-md w-full text-center lg:text-left mx-auto lg:mx-0"
            >
              <div>
                <span className="text-[10px] text-text-muted font-mono uppercase block">
                  Specialized Agents
                </span>
                <span className="text-xl font-bold text-text-primary mt-1 block">
                  On-Demand
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted font-mono uppercase block">
                  Audit Trail
                </span>
                <span className="text-xl font-bold text-text-primary mt-1 block">
                  100% Traced
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted font-mono uppercase block">
                  Human Control
                </span>
                <span className="text-xl font-bold text-text-primary mt-1 block">
                  Configurable
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right column left empty — the 3D visual is now a persistent
              site-wide background layer (rendered in layout.tsx) that stays
              visible, dimmed in the shadows, while scrolling. */}
          <div className="hidden lg:block lg:col-span-6" aria-hidden="true" />
        </div>
      </motion.div>
    </section>
  );
}

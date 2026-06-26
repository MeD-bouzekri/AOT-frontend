"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Timeline from "@/components/Timeline";
import FeatureGrid from "@/components/FeatureGrid";
import LiquidityVisualizer from "@/components/LiquidityVisualizer";
import CTAForm from "@/components/CTAForm";
import Footer from "@/components/Footer";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {/* Brand Splash Screen Loading Overlay */}
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {/* Sticky Header — always visible so the logo can perform shared transition */}
      <Navbar showSplash={showSplash} />

      {/* Main Page Content — pulls back into view as the splash zooms out.
          Starts slightly scaled-down + faded; settles to 1 when splash ends. */}
      <motion.div
        initial={false}
        animate={{
          opacity: showSplash ? 0 : 1,
          scale: showSplash ? 0.96 : 1,
        }}
        transition={{ duration: 0.7, ease: [0.7, 0, 0.3, 1], delay: showSplash ? 0 : 0.1 }}
        style={{ transformOrigin: "center top" }}
      >
        {/* Main Experience Layout */}
        <main className="flex-1">
          {/* Hero Section + Interactive Routing simulator */}
          <Hero />

          {/* Sprint Timeline Features Showcase */}
          <Timeline />

          {/* Feature Deep Dive Grid */}
          <FeatureGrid />

          {/* Treasury Liquidity Live visualizer */}
          <LiquidityVisualizer />

          {/* Access Sandbox CTA */}
          <CTAForm />
        </main>

        {/* Sleek Footnote and Links */}
        <Footer />
      </motion.div>
    </>
  );
}

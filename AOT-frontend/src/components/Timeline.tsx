"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { Zap, Landmark, CodeXml, Check } from "lucide-react";

interface Milestone {
  version: string;
  tag: string;
  title: string;
  description: string;
  metric: { label: string; value: string };
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  details: string[];
  visualType: "routing" | "treasury" | "code";
  /** optional explainer diagram/image for this step.
      Drop a path here (e.g. "/diagrams/step-01.png") and it replaces the
      code mock with the diagram. Leave undefined to show the mock. */
  image?: string;
}

const milestones: Milestone[] = [
  {
    version: "Step 01",
    tag: "Analyze & Recall",
    title: "Understand the Request, Remember the Past",
    description:
      "A request arrives — an HR onboarding, a procurement order, a finance approval. OrchestrAI parses intent and queries institutional memory for how similar workflows were handled before.",
    metric: { label: "Memory Source", value: "Vector Store" },
    icon: Zap,
    color: "icon-grad-teal",
    details: [
      "Natural-language intent parsing across any department",
      "Vector recall of past workflows, decisions, and outcomes",
      "Policy-as-code loaded and version-pinned for this run",
    ],
    visualType: "routing",
  },
  {
    version: "Step 02",
    tag: "Assemble & Orchestrate",
    title: "Spawn the Right Agents, Run the Graph",
    description:
      "The meta-orchestrator assembles a bespoke team — Validator, Approver, Executor, Reporter — and runs them as a live graph, pausing at configurable human-in-the-loop checkpoints.",
    metric: { label: "Agent Team", value: "Assembled Live" },
    icon: Landmark,
    color: "icon-grad-blue",
    details: [
      "Specialized agents spawned on demand, sized to the task",
      "Branching approval / rejection paths with human checkpoints",
      "Proactive Sentinel flags anomalies before they propagate",
    ],
    visualType: "treasury",
  },
  {
    version: "Step 03",
    tag: "Trace & Govern",
    title: "Full Traceability, Total Accountability",
    description:
      "Every agent decision, approval, and policy check is recorded as an immutable audit trail and streamed to a live visualization — so nothing happens in the dark.",
    metric: { label: "Audit Coverage", value: "100% Traced" },
    icon: CodeXml,
    color: "icon-grad-mix",
    details: [
      "Immutable, end-to-end audit log of every decision",
      "Live workflow graph visualization in real time",
      "Outcome written back to institutional memory for next time",
    ],
    visualType: "code",
  },
];

/* ─── Scroll-pinned Timeline ─── */
export default function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  /* track scroll progress through the tall container */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  /* map progress → milestone index */
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.33) setActiveIndex(0);
    else if (v < 0.66) setActiveIndex(1);
    else setActiveIndex(2);
  });

  /* scrubbed transforms for the right-pane graphic */
  const graphicRotate = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const graphicScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);
  const progressBarWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    /*
     * The outer div is 300vh tall — it provides the scroll runway.
     * The inner sticky wrapper stays pinned to the viewport for the
     * entire duration, giving us Razorpay-style scroll-locked panels.
     */
    <section
      ref={containerRef}
      id="sprint"
      className="relative"
      style={{ height: "300vh" }}
    >
      {/* ── sticky viewport ── */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* ambient glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-brand-cyan/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] rounded-full bg-brand-violet/10 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.04] pointer-events-none" />

        {/* content wrapper */}
        <div className="h-full flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* ── header ── */}
          <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-cyan font-mono px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-4">
              From Request to Resolution, Orchestrated
            </h2>
            <p className="text-gray-400 mt-3 text-sm md:text-base">
              Scroll to follow a request as OrchestrAI analyzes, assembles
              agents, and traces every step end to end.
            </p>

            {/* scroll progress bar */}
            <div className="mt-6 mx-auto max-w-xs h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-brand-violet"
                style={{ width: progressBarWidth }}
              />
            </div>
          </div>

          {/* ── two-column layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start flex-1 max-h-[520px]">
            {/* LEFT — vertical stepper */}
            <div className="lg:col-span-5 space-y-3">
              {milestones.map((item, idx) => {
                const Icon = item.icon;
                const isActive = idx === activeIndex;

                return (
                  <button
                    key={item.version}
                    id={`timeline-step-${idx}`}
                    aria-expanded={isActive}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-500 flex items-start gap-4 relative overflow-hidden ${
                      isActive
                        ? "glass-card border-brand-cyan/30 shadow-lg bg-slate-900/60"
                        : "border-transparent hover:bg-white/[0.02] border-white/5"
                    }`}
                  >
                    {/* active indicator bar */}
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-cyan to-brand-violet"
                      initial={false}
                      animate={{ opacity: isActive ? 1 : 0 }}
                      transition={{ duration: 0.4 }}
                    />

                    {/* icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0 ${
                        isActive
                          ? `${item.color} text-white shadow-md`
                          : "bg-slate-900 text-gray-500 border border-white/5"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-bold tracking-wider transition-colors duration-300 ${
                            isActive ? "text-brand-cyan" : "text-gray-500"
                          }`}
                        >
                          {item.version}
                        </span>
                        <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-gray-400 font-mono">
                          {item.tag}
                        </span>
                      </div>
                      <h3
                        className={`text-sm font-bold mt-1 transition-colors duration-300 ${
                          isActive ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {item.title}
                      </h3>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* RIGHT — detail pane (scrubbed on scroll) */}
            <div className="lg:col-span-7">
              <motion.div
                className="glass-card rounded-3xl border border-white/[0.06] overflow-hidden shadow-2xl relative"
                style={{ scale: graphicScale }}
              >
                {/* rotating background accent */}
                <motion.div
                  className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-brand-cyan/5 blur-[80px] pointer-events-none"
                  style={{ rotate: graphicRotate }}
                />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="p-6 md:p-8 flex flex-col min-h-[380px] lg:min-h-[420px]"
                  >
                    {/* header row */}
                    <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-5 mb-5">
                      <div>
                        <span className="text-xs font-mono font-bold text-brand-cyan">
                          {milestones[activeIndex].version} Update
                        </span>
                        <h4 className="text-lg md:text-xl font-extrabold text-white mt-1">
                          {milestones[activeIndex].title}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-gray-400 font-mono block uppercase">
                          {milestones[activeIndex].metric.label}
                        </span>
                        <span className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-violet">
                          {milestones[activeIndex].metric.value}
                        </span>
                      </div>
                    </div>

                    {/* description */}
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {milestones[activeIndex].description}
                    </p>

                    {/* checklist */}
                    <ul className="mt-5 space-y-2.5">
                      {milestones[activeIndex].details.map((d, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08, duration: 0.3 }}
                          className="flex items-start gap-2 text-xs md:text-sm text-gray-400"
                        >
                          <div className="w-5 h-5 rounded-full bg-brand-cyan/15 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan shrink-0 mt-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                          <span>{d}</span>
                        </motion.li>
                      ))}
                    </ul>

                    {/* visual — diagram image if provided, else the mock */}
                    <div className="mt-auto pt-5 border-t border-white/5">
                      {milestones[activeIndex].image ? (
                        <StepDiagram
                          src={milestones[activeIndex].image as string}
                          alt={`${milestones[activeIndex].title} diagram`}
                        />
                      ) : (
                        <VisualBlock type={milestones[activeIndex].visualType} />
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── explainer diagram frame (drop a real image via milestone.image) ─── */
function StepDiagram({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/5 bg-slate-950/80">
      <Image src={src} alt={alt} fill className="object-contain p-2" sizes="(max-width:1024px) 100vw, 640px" />
    </div>
  );
}

/* ─── inline visual blocks ─── */
function VisualBlock({ type }: { type: "routing" | "treasury" | "code" }) {
  if (type === "routing") {
    return (
      <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-gray-400">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
          <span className="text-white font-bold">REQUEST ANALYZER</span>
          <span className="text-emerald-400">● Intent Parsed</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span>Department: Procurement</span>
            <span className="text-brand-cyan">Matched (0.94)</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Memory recall: 3 similar workflows</span>
            <span>Reused</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Policy set v12 · loaded</span>
            <span>Compliant</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "treasury") {
    return (
      <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] text-gray-400 block font-mono">
            AGENT TEAM ASSEMBLED
          </span>
          <span className="text-sm font-bold text-white">
            5 specialized agents · live
          </span>
        </div>
        <div className="flex space-x-2">
          {["Validator", "Approver", "Executor", "Sentinel"].map((c) => (
            <span
              key={c}
              className="text-[9px] bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-300 font-mono"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 p-4 rounded-xl border border-white/5 font-mono text-xs text-left overflow-x-auto">
      <span className="text-gray-500 block mb-1">
        // Orchestrate an enterprise request
      </span>
      <div className="text-gray-300">
        <span className="text-brand-cyan">const</span> run ={" "}
        <span className="text-brand-cyan">await</span> orchestr.
        <span className="text-purple-400">execute</span>({`{`}
      </div>
      <div className="pl-4 text-gray-300">
        request: <span className="text-amber-300">&quot;onboard_vendor&quot;</span>,
        <br />
        memory: <span className="text-amber-300">true</span>,{" "}
        <span className="text-gray-500">// recall past runs</span>
        <br />
        humanCheckpoints:{" "}
        <span className="text-amber-300">[&quot;approve&quot;]</span>
      </div>
      <div className="text-gray-300">{`});`}</div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  Renderer,
  Camera,
  Transform,
  Program,
  Mesh,
  Sphere,
  Geometry,
  Vec3,
} from "ogl";

/**
 * HeroVisual — OrchestrAI "living workflow graph".
 *
 * A central glowing Meta-Orchestrator brain orb that spawns 6 specialized
 * agent orbs (Validator, Approver, Executor, Reporter, Anomaly Sentinel,
 * Human checkpoint) connected by animated glowing edges that pulse in
 * sequence. Memory particles stream inward toward the brain (institutional
 * memory). Teal→electric-blue palette, glow, scroll + mouse reactive.
 *
 * Perf / a11y (design.md §7): DPR capped, RAF pauses offscreen/hidden,
 * reduced-motion + WebGL-failure -> static CSS fallback.
 */

// agent ring layout (unit positions, scaled at runtime)
const AGENTS = [
  { a: 0.0, r: 2.4, blue: false }, // Validator
  { a: 1.05, r: 2.6, blue: true }, // Approver
  { a: 2.1, r: 2.4, blue: false }, // Executor
  { a: 3.14, r: 2.7, blue: true }, // Reporter
  { a: 4.19, r: 2.4, blue: false }, // Anomaly Sentinel
  { a: 5.24, r: 2.6, blue: true }, // Human checkpoint
];

export default function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFallback(true);
      return;
    }

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      setFallback(true);
      return;
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    const camera = new Camera(gl, { fov: 38 });
    camera.position.set(0, 0, 9);

    const resize = () => {
      const s = container.clientWidth;
      renderer.setSize(s, s);
      camera.perspective({ aspect: 1 });
    };
    resize();
    window.addEventListener("resize", resize);

    const scene = new Transform();

    // scroll energy (0..1)
    const uScroll = { value: 0 };
    const scrollTarget = { v: 0 };
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      scrollTarget.v = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const TEAL: [number, number, number] = [0.227, 0.616, 0.561];
    const BLUE: [number, number, number] = [0.231, 0.51, 0.965]; // #3b82f6

    // ── orb shader: fresnel glow, color per node, pulse phase ──
    const orbVert = /* glsl */ `
      attribute vec3 position; attribute vec3 normal;
      uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix;
      varying vec3 vN; varying vec3 vV;
      void main(){
        vN = normalize((modelViewMatrix * vec4(normal,0.0)).xyz);
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `;
    const orbFrag = /* glsl */ `
      precision highp float;
      varying vec3 vN; varying vec3 vV;
      uniform float uTime; uniform vec3 uColor; uniform float uPhase; uniform float uCore;
      void main(){
        vec3 N=normalize(vN); vec3 V=normalize(vV);
        float fres=pow(1.0-max(dot(N,V),0.0), uCore>0.5 ? 1.4 : 2.2);
        float pulse = 0.55 + 0.45*sin(uTime*2.0 + uPhase);
        vec3 col = uColor * (0.5 + 0.9*fres) + uColor * pulse * 0.35;
        float alpha = mix(0.25, 1.0, fres) + pulse*0.15;
        gl_FragColor = vec4(col, clamp(alpha,0.0,1.0));
      }
    `;
    const mkOrb = (color: [number, number, number], phase: number, core: number) =>
      new Program(gl, {
        vertex: orbVert,
        fragment: orbFrag,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new Vec3(...color) },
          uPhase: { value: phase },
          uCore: { value: core },
        },
        transparent: true,
        cullFace: false,
      });

    // central brain orb (wireframe + solid glow)
    const brainProg = mkOrb(TEAL, 0, 1);
    const brain = new Mesh(gl, {
      geometry: new Sphere(gl, { radius: 1.0, widthSegments: 40, heightSegments: 30 }),
      program: brainProg,
    });
    brain.setParent(scene);
    const brainWireProg = mkOrb([0.3, 0.8, 0.74], 1.5, 0);
    const brainWire = new Mesh(gl, {
      geometry: new Sphere(gl, { radius: 1.25, widthSegments: 22, heightSegments: 16 }),
      program: brainWireProg,
      mode: gl.LINES,
    });
    brainWire.setParent(scene);

    // agent orbs
    const agents = AGENTS.map((ag, i) => {
      const prog = mkOrb(ag.blue ? BLUE : TEAL, i * 0.9, 0);
      const m = new Mesh(gl, {
        geometry: new Sphere(gl, { radius: 0.34, widthSegments: 20, heightSegments: 14 }),
        program: prog,
      });
      m.setParent(scene);
      return { mesh: m, prog, ...ag };
    });

    // ── edges: thin lines brain -> each agent, animated dash glow ──
    const edgeProg = new Program(gl, {
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertex: /* glsl */ `
        attribute vec3 position; attribute float along; attribute float idx;
        uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform float uTime;
        varying float vGlow; varying float vBlue;
        void main(){
          // pulse travels brain->agent, staggered per edge
          float head = fract(uTime*0.35 + idx*0.16);
          float d = abs(along - head);
          vGlow = smoothstep(0.18, 0.0, min(d, 1.0-d));
          vBlue = mod(idx, 2.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragment: /* glsl */ `
        precision highp float; varying float vGlow; varying float vBlue;
        void main(){
          vec3 teal=vec3(0.227,0.616,0.561); vec3 blue=vec3(0.231,0.51,0.965);
          vec3 base = mix(teal, blue, vBlue);
          float a = 0.12 + vGlow*0.9;
          gl_FragColor = vec4(base + vGlow*0.4, a);
        }
      `,
    });
    // build edge geometry (each edge = many segments for the dash glow)
    const SEG = 24;
    const epos = new Float32Array(AGENTS.length * SEG * 3);
    const ealong = new Float32Array(AGENTS.length * SEG);
    const eidx = new Float32Array(AGENTS.length * SEG);
    const edgeMesh = new Mesh(gl, {
      geometry: new Geometry(gl, {
        position: { size: 3, data: epos },
        along: { size: 1, data: ealong },
        idx: { size: 1, data: eidx },
      }),
      program: edgeProg,
      mode: gl.LINES,
    });
    edgeMesh.setParent(scene);

    // ── memory particles streaming inward toward the brain ──
    const MEM = 80;
    const mpos = new Float32Array(MEM * 3);
    const mseed = new Float32Array(MEM);
    for (let i = 0; i < MEM; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3.2 + Math.random() * 2.5;
      mpos[i * 3] = Math.cos(a) * r;
      mpos[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
      mpos[i * 3 + 2] = Math.sin(a) * r;
      mseed[i] = Math.random();
    }
    const memProg = new Program(gl, {
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertex: /* glsl */ `
        attribute vec3 position; attribute float seed;
        uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform float uTime;
        varying float vF;
        void main(){
          // travel from outer position toward origin, recycle
          float t = fract(uTime*0.12 + seed);
          vec3 p = position * (1.0 - t);   // pull inward
          vF = t;
          vec4 mv = modelViewMatrix * vec4(p,1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (10.0 / -mv.z) * (0.5 + t);
        }
      `,
      fragment: /* glsl */ `
        precision highp float; varying float vF;
        void main(){
          vec2 uv=gl_PointCoord-0.5; if(length(uv)>0.5) discard;
          vec3 teal=vec3(0.3,0.8,0.74);
          float a = smoothstep(0.5,0.0,length(uv)) * (0.2 + vF*0.7);
          gl_FragColor=vec4(teal, a);
        }
      `,
    });
    const memMesh = new Mesh(gl, {
      geometry: new Geometry(gl, {
        position: { size: 3, data: mpos },
        seed: { size: 1, data: mseed },
      }),
      program: memProg,
      mode: gl.POINTS,
    });
    memMesh.setParent(scene);

    // mouse parallax
    const targetRot = new Vec3(0, 0, 0);
    const onPointer = (e: PointerEvent) => {
      targetRot.x = (e.clientY / window.innerHeight - 0.5) * 0.4;
      targetRot.y = (e.clientX / window.innerWidth - 0.5) * 0.5;
    };
    window.addEventListener("pointermove", onPointer);

    let visible = true;
    const io = new IntersectionObserver(
      ([en]) => {
        visible = en.isIntersecting;
        if (visible) loop();
      },
      { threshold: 0 }
    );
    io.observe(container);
    const onVis = () => {
      visible = !document.hidden;
      if (visible) loop();
    };
    document.addEventListener("visibilitychange", onVis);

    // recompute edge geometry each frame from live agent positions
    const updateEdges = () => {
      const geo = edgeMesh.geometry;
      const pa = geo.attributes.position.data as Float32Array;
      const al = geo.attributes.along.data as Float32Array;
      const ix = geo.attributes.idx.data as Float32Array;
      let o = 0;
      agents.forEach((ag, ei) => {
        const ex = ag.mesh.position.x;
        const ey = ag.mesh.position.y;
        const ez = ag.mesh.position.z;
        for (let s = 0; s < SEG; s++) {
          // line list: pairs of points along the segment
          const t0 = s / SEG;
          const t1 = (s + 0.92) / SEG;
          const set = (t: number) => {
            pa[o * 3] = ex * t;
            pa[o * 3 + 1] = ey * t;
            pa[o * 3 + 2] = ez * t;
            al[o] = t;
            ix[o] = ei;
            o++;
          };
          set(t0);
          set(t1);
        }
      });
      geo.attributes.position.needsUpdate = true;
      geo.attributes.along.needsUpdate = true;
      geo.attributes.idx.needsUpdate = true;
    };

    let raf = 0;
    let running = false;
    const start = performance.now();
    const loop = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      const frame = (now: number) => {
        if (!visible || document.hidden) {
          running = false;
          return;
        }
        const t = (now - start) / 1000;
        uScroll.value += (scrollTarget.v - uScroll.value) * 0.06;
        const e = uScroll.value;

        brainProg.uniforms.uTime.value = t;
        brainWireProg.uniforms.uTime.value = t;
        edgeProg.uniforms.uTime.value = t;
        memProg.uniforms.uTime.value = t;

        // brain breathes + slow spin
        brain.rotation.y += 0.004;
        brainWire.rotation.y -= 0.006;
        brainWire.rotation.x += 0.002;
        const bs = 1 + 0.05 * Math.sin(t * 1.5) + e * 0.15;
        brain.scale.set(bs, bs, bs);

        // agents orbit + bob, faster on scroll
        agents.forEach((ag, i) => {
          const ang = ag.a + t * (0.25 + e * 0.5);
          ag.mesh.position.set(
            Math.cos(ang) * ag.r,
            Math.sin(t * 0.8 + i) * 0.5,
            Math.sin(ang) * ag.r
          );
          ag.prog.uniforms.uTime.value = t;
        });

        updateEdges();

        scene.rotation.x += (targetRot.x - scene.rotation.x) * 0.04;
        scene.rotation.y += (targetRot.y - scene.rotation.y) * 0.04;
        scene.rotation.y += 0.0012; // slow auto-rotate

        renderer.render({ scene, camera });
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
      if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas);
    };
  }, []);

  return (
    <div className="relative flex aspect-square w-full max-w-lg items-center justify-center">
      {/* enterprise glow bloom */}
      <div className="pointer-events-none absolute h-2/3 w-2/3 rounded-full bg-brand-teal/25 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-8 right-8 h-2/5 w-2/5 rounded-full bg-brand-blue/25 blur-[80px]" />

      {fallback ? (
        <div className="relative h-60 w-60">
          {/* static fallback: brain + agent dots */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-brand-teal to-brand-blue blur-[1px]" />
          </div>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <span
                key={i}
                className={`absolute left-1/2 top-1/2 h-4 w-4 rounded-full ${
                  i % 2 ? "bg-brand-blue" : "bg-brand-teal"
                }`}
                style={{
                  transform: `translate(${Math.cos(a) * 92 - 8}px, ${
                    Math.sin(a) * 92 - 8
                  }px)`,
                }}
              />
            );
          })}
        </div>
      ) : (
        <div ref={ref} className="relative z-10 h-full w-full" aria-hidden="true" />
      )}
    </div>
  );
}

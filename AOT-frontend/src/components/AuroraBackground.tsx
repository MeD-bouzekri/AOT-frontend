"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer, Program, Mesh, Triangle, Vec2 } from "ogl";

/**
 * AuroraBackground
 * Full-viewport WebGL aurora: flowing domain-warped noise in the
 * deep-teal -> copper palette. Reacts subtly to mouse + scroll.
 *
 * Performance / a11y:
 *  - Renders into a single fullscreen triangle (no geometry overhead).
 *  - DPR capped (1.5 desktop, 1 on small screens) to stay at 60fps.
 *  - Pauses RAF when tab hidden or canvas scrolled out of view.
 *  - prefers-reduced-motion or WebGL failure -> static CSS fallback.
 */
export default function AuroraBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setFallback(true);
      return;
    }

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1 : 1.5),
      });
    } catch (e) {
      console.warn("[Aurora] WebGL init failed -> static fallback", e);
      setFallback(true);
      return;
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    if (process.env.NODE_ENV !== "production") {
      console.log("[Aurora] WebGL init OK — rendering");
    }

    const geometry = new Triangle(gl);

    const vertex = /* glsl */ `
      attribute vec2 uv;
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Simplex-ish value noise + fbm domain warp -> aurora ribbons.
    const fragment = /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2  uResolution;
      uniform vec2  uMouse;
      uniform float uScroll;
      uniform float uDark;   // 1.0 dark theme, 0.0 light theme

      // hash + value noise
      float hash(vec2 p){
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float noise(vec2 p){
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
          mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
          u.y);
      }
      float fbm(vec2 p){
        float v = 0.0;
        float a = 0.5;
        for(int i = 0; i < 5; i++){
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main(){
        vec2 uv = vUv;
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 p = uv;
        p.x *= aspect;

        float t = uTime * 0.18;   // faster flow so motion is clearly visible
        // gentle mouse + scroll parallax on the field
        vec2 m = (uMouse - 0.5) * 0.35;
        p += m;
        p.y += uScroll * 0.15;
        // extra drift so the field visibly travels even when idle
        p += vec2(t * 0.15, t * 0.08);

        // domain warp
        vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
        vec2 r = vec2(
          fbm(p + 1.5 * q + vec2(1.7, 9.2) + 0.15 * t),
          fbm(p + 1.5 * q + vec2(8.3, 2.8) - 0.12 * t)
        );
        float f = fbm(p + 1.8 * r);

        // palette: near-black base -> muted teal ribbon -> terracotta highlight
        vec3 base   = vec3(0.027, 0.043, 0.055);   // #070b0e
        vec3 teal   = vec3(0.227, 0.616, 0.561);    // #3a9d8f muted teal
        vec3 tealDp = vec3(0.173, 0.478, 0.435);    // #2c7a6f
        vec3 copper = vec3(0.788, 0.478, 0.306);    // #c97a4e terracotta

        vec3 col = base;
        float ribbon = smoothstep(0.40, 0.80, f);
        col = mix(col, tealDp, ribbon * 0.85);
        col = mix(col, teal, smoothstep(0.55, 0.95, f) * 0.8);
        // sparse terracotta glints where field peaks
        float glint = smoothstep(0.75, 0.97, f) * smoothstep(0.5, 0.8, r.x);
        col = mix(col, copper, glint * 0.85);

        // radial vignette so edges sink into base
        float vig = smoothstep(1.15, 0.25, distance(uv, vec2(0.5)));
        col *= mix(0.55, 1.0, vig);

        // ── LIGHT mode: animated colored ribbons over the light page ──
        // saturated, lighter-tinted teal/copper so drift is clearly visible
        // on a near-white background. Color shifts across the flow field +
        // a slow time pulse so the wash reads as moving.
        vec3 lTeal   = vec3(0.32, 0.74, 0.67);   // brighter teal
        vec3 lCopper = vec3(0.93, 0.62, 0.42);   // warm copper
        float mixAmt = smoothstep(0.3, 0.9, r.y);            // field-driven blend
        vec3 lightCol = mix(lTeal, lCopper, mixAmt);
        // ribbon body + a breathing pulse so motion is obvious
        float pulse = 0.5 + 0.5 * sin(uTime * 0.5 + f * 6.2831);
        float lightEnergy = clamp(ribbon * 1.1 + glint * 1.4, 0.0, 1.0);
        float lightAlpha = lightEnergy * (0.5 + 0.22 * pulse);

        float darkAlpha = 0.9;
        float alpha = mix(lightAlpha, darkAlpha, uDark);
        vec3 outCol = mix(lightCol, col, uDark);
        gl_FragColor = vec4(outCol, alpha);
      }
    `;

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vec2(1, 1) },
        uMouse: { value: new Vec2(0.5, 0.5) },
        uScroll: { value: 0 },
        uDark: {
          value: document.documentElement.classList.contains("dark") ? 1 : 0,
        },
      },
    });

    // react to theme toggling
    const themeObserver = new MutationObserver(() => {
      program.uniforms.uDark.value =
        document.documentElement.classList.contains("dark") ? 1 : 0;
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value.set(w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    // mouse parallax (lerped)
    const target = new Vec2(0.5, 0.5);
    const onPointer = (e: PointerEvent) => {
      target.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    };
    window.addEventListener("pointermove", onPointer);

    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      program.uniforms.uScroll.value = max > 0 ? window.scrollY / max : 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // pause when tab hidden or canvas offscreen
    let visible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) loop();
      },
      { threshold: 0 }
    );
    io.observe(container);

    const onVisibility = () => {
      if (document.hidden) {
        visible = false;
      } else {
        visible = true;
        loop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

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
        program.uniforms.uTime.value = (now - start) / 1000;
        // lerp mouse toward target for smoothness
        const m = program.uniforms.uMouse.value as Vec2;
        m.x += (target.x - m.x) * 0.05;
        m.y += (target.y - m.y) * 0.05;
        renderer.render({ scene: mesh });
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
      if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas);
    };
  }, []);

  if (fallback) {
    return (
      <div
        className="fixed inset-0 -z-0 aurora-fallback pointer-events-none"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1];

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({ children, className, delay = 0, y = 28 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Animates a word in letter by letter, keeping the whole word readable for screen readers. */
export function LetterReveal({ text, className, delay = 0, stagger = 0.05 }) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          aria-hidden
          className="inline-block"
          initial={{ opacity: 0, y: "0.35em", filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: EASE, delay: delay + index * stagger }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </span>
  );
}

/** Pulls its children slightly toward a mouse pointer. */
export function Magnetic({ children, className = "", strength = 0.3 }) {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 220, damping: 16 });
  const y = useSpring(0, { stiffness: 220, damping: 16 });

  const handleMove = (event) => {
    if (event.pointerType !== "mouse") return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className}`}
      style={{ x, y }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  );
}

/** Tilts its children in 3D toward a mouse pointer. */
export function Tilt({ children, className = "", max = 10 }) {
  const ref = useRef(null);
  const rotateX = useSpring(0, { stiffness: 160, damping: 18 });
  const rotateY = useSpring(0, { stiffness: 160, damping: 18 });

  const handleMove = (event) => {
    if (event.pointerType !== "mouse") return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * max * 2);
    rotateX.set(-py * max * 2);
  };

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  );
}

/** Slow-drifting specks of golden dust drawn on a canvas. */
export function Particles({ className = "", count = 60 }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas.getContext("2d");
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    // Drawn in the accent colour token, so the dust follows the theme.
    const accent = getComputedStyle(canvas).getPropertyValue("--color-accent").trim() || "245 184 61";
    let width = 0;
    let height = 0;
    let frame;

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();

    const dots = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -(Math.random() * 0.3 + 0.05),
      alpha: Math.random() * 0.55 + 0.15,
    }));

    const draw = () => {
      context.clearRect(0, 0, width, height);
      for (const dot of dots) {
        dot.x += dot.vx;
        dot.y += dot.vy;
        if (dot.y < -4) {
          dot.y = height + 4;
          dot.x = Math.random() * width;
        }
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        context.fillStyle = `rgb(${accent} / ${dot.alpha})`;
        context.fill();
      }
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [count, reduced]);

  return <canvas ref={ref} aria-hidden className={className} />;
}

/** A ring that trails the mouse and grows over anything clickable. Mouse only. */
export function CursorRing() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 600, damping: 40 });
  const springY = useSpring(y, { stiffness: 600, damping: 40 });
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const handleMove = (event) => {
      if (event.pointerType !== "mouse") return;
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
      setActive(Boolean(event.target.closest?.("a, button, [data-cursor]")));
    };
    const handleLeave = () => setVisible(false);
    window.addEventListener("pointermove", handleMove);
    document.documentElement.addEventListener("pointerleave", handleLeave);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.documentElement.removeEventListener("pointerleave", handleLeave);
    };
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[300] -ml-4 -mt-4 h-8 w-8 rounded-full border border-accent mix-blend-difference"
      style={{ x: springX, y: springY }}
      animate={{ scale: active ? 1.9 : 1, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    />
  );
}

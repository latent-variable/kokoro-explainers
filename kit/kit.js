      // kit/kit.js: the timeline every video shares. A video's own <script> in scenes.html runs
      // after this and may add to `tl`; each element's cue time is its data-at attribute (seconds).
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      tl.to({}, { duration: TOTAL }, 0);

      // The motion settings are theme tokens (themes/<name>/theme.css), which a video's
      // video.json "flair" may override; a section's data-transition or data-camera wins.
      const STYLE = getComputedStyle(document.getElementById("root"));
      const token = (name, fallback) => STYLE.getPropertyValue(name).trim().replace(/^["']|["']$/g, "") || fallback;

      // Seeded, so a video renders the same frames every time (never Math.random), and each
      // video's background moves its own way (SEED comes from its name, or video.json "seed").
      let seedState = SEED >>> 0;
      const rand = () => {
        seedState = (seedState + 0x6d2b79f5) >>> 0;
        let t = seedState;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };

      // Ambient background: a slow drift under every scene.
      const ambient = token("--ambient", "none"), ambientEl = document.getElementById("ambient");
      if (ambient === "glow") {
        // Two glows, kept apart, so the theme's colours never blur into grey where they meet.
        ["--accent", "--accent-2"].forEach((colour, i) => {
          const blob = document.createElement("div");
          blob.className = "blob";
          blob.style.background = `var(${colour})`;
          blob.style.left = `${Math.round(i * 45 + rand() * 25)}%`;
          blob.style.top = `${Math.round(rand() * 55)}%`;
          ambientEl.appendChild(blob);
          tl.to(blob, { x: Math.round((rand() - 0.5) * 700), y: Math.round((rand() - 0.5) * 420), duration: TOTAL, ease: "sine.inOut" }, 0);
        });
      } else if (ambient === "grid" || ambient === "dots") {
        const layer = document.createElement("div");
        layer.className = ambient;
        ambientEl.appendChild(layer);
        tl.fromTo(layer, { x: 0, y: 0 }, { x: -Math.round(60 + rand() * 120), y: -Math.round(30 + rand() * 80), duration: TOTAL, ease: "none" }, 0);
      } else if (ambient !== "none") {
        throw new Error(`unknown --ambient ${ambient}: none, glow, grid or dots`);
      }

      // Progress bar across the top.
      const progress = document.getElementById("progress");
      if (token("--progress", "off") === "on") tl.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: TOTAL, ease: "none" }, 0);
      else gsap.set(progress, { display: "none" });

      // Scenes: each exists only inside its own window (a snapshot does not hide a clip by
      // itself), enters with its transition, leaves with a short fade, and the camera drifts.
      const TRANSITIONS = {
        none: null,
        fade: { opacity: 0 },
        rise: { opacity: 0, y: 40 },
        slide: { opacity: 0, x: 140 },
        zoom: { opacity: 0, scale: 0.94 },
        wipe: { clipPath: "inset(0% 100% 0% 0%)" },
      };
      const SETTLED = { opacity: 1, x: 0, y: 0, scale: 1, clipPath: "inset(0% 0% 0% 0%)" };
      document.querySelectorAll("section.scene").forEach((el) => {
        const inner = el.querySelector(":scope > .inner"), cam = inner.querySelector(":scope > .cam");
        const start = +el.dataset.start, dur = +el.dataset.duration, end = start + dur;
        const kind = el.dataset.transition || token("--transition", "fade");
        if (!(kind in TRANSITIONS)) throw new Error(`unknown transition ${kind}: ${Object.keys(TRANSITIONS).join(", ")}`);
        gsap.set(inner, { opacity: 0 });
        tl.set(inner, { opacity: 1 }, start);
        const from = TRANSITIONS[kind];
        if (from) {
          const settled = Object.fromEntries(Object.keys(from).map((k) => [k, SETTLED[k]]));
          tl.fromTo(inner, { ...from }, { ...settled, duration: Math.min(0.55, dur * 0.12), ease: "power3.out", immediateRender: false }, start);
          // fromTo, not to: parallel render workers seek to any time first, so the start is stated.
          const out = Math.min(0.3, dur * 0.06);
          tl.fromTo(inner, { opacity: 1 }, { opacity: 0, duration: out, ease: "power1.in", immediateRender: false }, end - out);
        }
        tl.set(inner, { opacity: 0 }, end);
        if ((el.dataset.camera || token("--camera", "none")) === "push") {
          tl.fromTo(cam, { scale: 1 }, { scale: 1.04, duration: dur, ease: "none", immediateRender: false }, start);
        }
      });

      // Each element with a cue arrives when the voice reaches its word. data-anim picks how;
      // without one it gets the theme's --entrance.
      const SIMPLE = {
        up: [{ opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }],
        fade: [{ opacity: 0 }, { opacity: 1, duration: 0.5, ease: "none" }],
        pop: [{ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)" }],
        left: [{ opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }],
        right: [{ opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }],
        grow: [{ scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.7, ease: "power2.inOut" }],
        zoom: [{ opacity: 0, scale: 1.35 }, { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out" }],
        blur: [{ opacity: 0, filter: "blur(14px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "power2.out" }],
      };
      // Split an element's text into one span per character, keeping any markup around it.
      const splitChars = (el) => {
        const chars = [];
        const walk = (node) => {
          [...node.childNodes].forEach((child) => {
            if (child.nodeType === 3) {
              const frag = document.createDocumentFragment();
              [...child.textContent].forEach((ch) => {
                if (/\s/.test(ch)) { frag.appendChild(document.createTextNode(ch)); return; }
                const span = document.createElement("span");
                span.textContent = ch;
                frag.appendChild(span);
                chars.push(span);
              });
              child.replaceWith(frag);
            } else if (child.nodeType === 1) walk(child);
          });
        };
        walk(el);
        return chars;
      };
      const SPECIAL = {
        // Typed out, one character at a time.
        type(el, at) {
          const chars = splitChars(el);
          gsap.set(chars, { opacity: 0 });
          tl.to(chars, { opacity: 1, duration: 0.01, stagger: Math.min(0.05, 1.4 / Math.max(1, chars.length)) }, at);
        },
        // SVG lines draw themselves.
        draw(el, at) {
          const shapes = el.matches("path, line, polyline, polygon, circle, rect, ellipse") ? [el] : [...el.querySelectorAll("path, line, polyline, polygon, circle, rect, ellipse")];
          if (!shapes.length) throw new Error("data-anim=\"draw\" needs an SVG with paths or shapes inside");
          shapes.forEach((shape) => {
            const len = Math.ceil(shape.getTotalLength());
            gsap.set(shape, { strokeDasharray: len, strokeDashoffset: len });
            tl.to(shape, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, at);
          });
        },
        // A number counts up from zero, keeping its prefix, suffix, commas and decimals.
        count(el, at) {
          const text = el.textContent, m = text.match(/-?[\d,]*\.?\d+/);
          if (!m) throw new Error(`data-anim="count" needs a number in "${text.trim()}"`);
          const target = parseFloat(m[0].replace(/,/g, "")), places = (m[0].split(".")[1] || "").length;
          const before = text.slice(0, m.index), after = text.slice(m.index + m[0].length);
          const show = (v) => before + v.toLocaleString("en-US", { minimumFractionDigits: places, maximumFractionDigits: places, useGrouping: m[0].includes(",") }) + after;
          const state = { v: 0 };
          el.textContent = show(0);
          gsap.set(el, { opacity: 0 });
          tl.to(el, { opacity: 1, duration: 0.2 }, at);
          tl.to(state, { v: target, duration: 1.1, ease: "power2.out", onUpdate: () => { el.textContent = show(state.v); } }, at);
        },
        // A marker sweeps under the words, below the letters so it never muddies them.
        highlight(el, at) {
          gsap.set(el, {
            backgroundImage: "linear-gradient(var(--accent), var(--accent))",
            backgroundRepeat: "no-repeat", backgroundPosition: "0% 100%", backgroundSize: "0% 12%",
          });
          tl.to(el, { backgroundSize: "100% 12%", duration: 0.6, ease: "power2.out" }, at);
        },
        // Each child arrives in turn.
        stagger(el, at) {
          const kids = [...el.children];
          gsap.set(kids, { opacity: 0, y: 24 });
          tl.to(kids, { opacity: 1, y: 0, duration: 0.45, stagger: 0.14, ease: "power2.out" }, at);
        },
        // Pops in, then beats twice to draw the eye.
        pulse(el, at) {
          gsap.set(el, { opacity: 0, scale: 0.6 });
          tl.to(el, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.8)" }, at);
          tl.to(el, { scale: 1.08, duration: 0.18, yoyo: true, repeat: 3, ease: "sine.inOut" }, at + 0.5);
        },
      };
      const ANIMS = [...Object.keys(SIMPLE), ...Object.keys(SPECIAL)];
      document.querySelectorAll("[data-at]").forEach((el) => {
        const name = el.dataset.anim || token("--entrance", "up"), at = +el.dataset.at;
        if (SPECIAL[name]) return SPECIAL[name](el, at);
        const a = SIMPLE[name];
        if (!a) throw new Error(`unknown data-anim ${name}: one of ${ANIMS.join(", ")}`);
        gsap.set(el, a[0]);
        tl.to(el, a[1], at);
      });

      document.querySelectorAll(".cap span").forEach((c) => {
        const t = +c.parentElement.dataset.start, e = t + +c.parentElement.dataset.duration;
        gsap.set(c, { opacity: 0 });
        tl.to(c, { opacity: 1, duration: 0.15 }, t);
        tl.set(c, { opacity: 0 }, e);
      });

      window.__timelines["main"] = tl;

      // kit/kit.js: the timeline every video shares. A video's own <script> in scenes.html runs
      // after this and may add to `tl`; each element's cue time is its data-at attribute (seconds).
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      tl.to({}, { duration: TOTAL }, 0);

      // A scene's contents exist only inside its own window (a snapshot does not hide a clip by itself).
      document.querySelectorAll("section.scene").forEach((el) => {
        const inner = el.querySelector(":scope > .inner"), start = +el.dataset.start, end = start + +el.dataset.duration;
        gsap.set(inner, { opacity: 0 });
        tl.set(inner, { opacity: 1 }, start);
        tl.set(inner, { opacity: 0 }, end);
      });

      // Each element with a cue arrives when the voice reaches its word. data-anim picks how.
      const ANIM = {
        up: { from: { opacity: 0, y: 28 }, to: { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" } },
        fade: { from: { opacity: 0 }, to: { opacity: 1, duration: 0.5, ease: "none" } },
        pop: { from: { opacity: 0, scale: 0.6 }, to: { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)" } },
        left: { from: { opacity: 0, x: -60 }, to: { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" } },
        right: { from: { opacity: 0, x: 60 }, to: { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" } },
        grow: { from: { scaleX: 0, transformOrigin: "left center" }, to: { scaleX: 1, duration: 0.7, ease: "power2.inOut" } },
      };
      document.querySelectorAll("[data-at]").forEach((el) => {
        const a = ANIM[el.dataset.anim || "up"];
        if (!a) throw new Error(`unknown data-anim ${el.dataset.anim}: one of ${Object.keys(ANIM).join(", ")}`);
        gsap.set(el, a.from);
        tl.to(el, a.to, +el.dataset.at);
      });

      document.querySelectorAll(".cap span").forEach((c) => {
        const t = +c.parentElement.dataset.start, e = t + +c.parentElement.dataset.duration;
        gsap.set(c, { opacity: 0 });
        tl.to(c, { opacity: 1, duration: 0.15 }, t);
        tl.set(c, { opacity: 0 }, e);
      });

      window.__timelines["main"] = tl;

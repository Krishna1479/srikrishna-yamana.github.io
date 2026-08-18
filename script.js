/* =========================================================
   Sri Krishna Yamana — Portfolio interactivity
   All modules are defensive: every DOM lookup is null-checked
   so a missing element never throws and breaks the rest of
   the page's behaviour.
   ========================================================= */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---------------- Footer year ---------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Theme toggle ---------------- */
  (function themeModule() {
    const root = document.documentElement;
    const btn = $("#themeToggle");
    const STORAGE_KEY = "sky-portfolio-theme";

    function applyTheme(theme) {
      if (theme === "dark") root.setAttribute("data-theme", "dark");
      else root.removeAttribute("data-theme");
      if (btn) btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }

    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* storage unavailable */ }

    if (saved === "dark" || saved === "light") {
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }

    if (btn) {
      btn.addEventListener("click", () => {
        const isDark = root.getAttribute("data-theme") === "dark";
        const next = isDark ? "light" : "dark";
        applyTheme(next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore */ }
      });
    }
  })();

  /* ---------------- Mobile menu ---------------- */
  (function mobileMenuModule() {
    const btn = $("#mobileBtn");
    const panel = $("#mobilePanel");
    if (!btn || !panel) return;

    function openMenu() {
      panel.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function closeMenu() {
      panel.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
    function toggleMenu() {
      panel.classList.contains("is-open") ? closeMenu() : openMenu();
    }

    btn.addEventListener("click", toggleMenu);

    // Close when a link inside the panel is clicked
    $$("a", panel).forEach((a) => a.addEventListener("click", closeMenu));

    // Close on backdrop click (click outside the sheet)
    panel.addEventListener("click", (e) => {
      if (e.target === panel) closeMenu();
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("is-open")) {
        closeMenu();
        btn.focus();
      }
    });

    // Close if the viewport grows back into desktop layout
    window.addEventListener("resize", () => {
      if (window.innerWidth > 850 && panel.classList.contains("is-open")) closeMenu();
    });
  })();

  /* ---------------- Scroll progress HUD (top bar) ---------------- */
  (function progressBarModule() {
    const fill = $("#hudFill");
    if (!fill) return;
    let ticking = false;

    function update() {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      const pct = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0;
      fill.style.width = pct.toFixed(1) + "%";
      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  })();

  /* ---------------- Scrollspy: nav links + floating stage HUD ---------------- */
  (function scrollspyModule() {
    const sections = $$("main section[id]");
    const navLinks = $$(".nav-links a[href^='#']");
    const hud = $("#stageHud");
    const hudStage = $("#hudStage");
    const hudLabel = $("#hudLabel");
    if (!sections.length) return;

    const stageNames = {};
    sections.forEach((s, i) => { stageNames[s.id] = String(i + 1).padStart(2, "0"); });
    const total = String(sections.length).padStart(2, "0");

    function setActive(id) {
      navLinks.forEach((a) => {
        const match = a.getAttribute("href") === "#" + id;
        a.classList.toggle("is-active", match);
        if (match) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      if (hud && hudStage && hudLabel) {
        hud.classList.add("is-visible");
        hudStage.textContent = "STAGE " + stageNames[id] + "/" + total;
        hudLabel.textContent = id.toUpperCase();
      }
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(entry.target.id);
          });
        },
        { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
      );
      sections.forEach((s) => observer.observe(s));
    }
  })();

  /* ---------------- Reveal on scroll ---------------- */
  (function revealModule() {
    const items = $$(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach((el) => observer.observe(el));
  })();

  /* ---------------- Count-up stats ---------------- */
  (function countUpModule() {
    const targets = $$("[data-count-to]");
    if (!targets.length) return;

    function animateCount(el) {
      const end = parseFloat(el.getAttribute("data-count-to"));
      const suffix = el.getAttribute("data-suffix") || "";
      if (isNaN(end)) return;
      if (prefersReducedMotion) {
        el.textContent = end + suffix;
        return;
      }
      const duration = 1100;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(end * eased) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = end + suffix;
      }
      requestAnimationFrame(tick);
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      targets.forEach((el) => observer.observe(el));
    } else {
      targets.forEach(animateCount);
    }
  })();

  /* ---------------- Hero live pipeline animation ---------------- */
  (function pipelineAnimModule() {
    const nodes = $$(".flow-node");
    const lineFill = $("#flowLineFill");
    const packet = $("#packet");
    const counterEl = $("#rowsCounter");
    if (!nodes.length) return;

    if (prefersReducedMotion) {
      nodes.forEach((n, i) => n.classList.toggle("highlight", i === 1));
      if (lineFill) lineFill.style.width = "62%";
      return;
    }

    let step = 0;
    const positions = [4, 50, 92]; // approximate % positions of node centers along the line
    const fillTargets = [18, 62, 96];

    function advance() {
      nodes.forEach((n, i) => n.classList.toggle("highlight", i === step));
      if (lineFill) lineFill.style.width = fillTargets[step] + "%";
      if (packet) packet.style.left = positions[step] + "%";
      step = (step + 1) % nodes.length;
    }
    advance();
    let pipelineTimer = setInterval(advance, 2200);

    // Static production metric: keep the displayed figure factual and stable.
    const rowsPerDay = 1284392;
    if (counterEl) counterEl.textContent = "✓ " + rowsPerDay.toLocaleString() + " rows/day";

    // Pause work when tab isn't visible — avoids wasted cycles and battery drain
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearInterval(pipelineTimer);
      } else {
        pipelineTimer = setInterval(advance, 2200);
      }
    });
  })();

  /* ---------------- Experience: auto-computed job duration ---------------- */
  (function durationModule() {
    const jobs = $$(".job[data-start][data-end]");
    if (!jobs.length) return;

    const MONTHS = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };

    function parseMonthYear(str) {
      const parts = str.trim().toLowerCase().split(/\s+/);
      if (parts.length !== 2) return null;
      const m = MONTHS[parts[0].slice(0, 3)];
      const y = parseInt(parts[1], 10);
      if (m === undefined || isNaN(y)) return null;
      return { m, y };
    }

    jobs.forEach((job) => {
      const start = parseMonthYear(job.getAttribute("data-start"));
      const end = job.getAttribute("data-end").toLowerCase() === "present"
        ? { m: new Date().getMonth(), y: new Date().getFullYear() }
        : parseMonthYear(job.getAttribute("data-end"));
      if (!start || !end) return;

      let months = (end.y - start.y) * 12 + (end.m - start.m) + 1;
      if (months < 1) return;

      const years = Math.floor(months / 12);
      const rem = months % 12;
      let label = "";
      if (years > 0) label += years + "y ";
      if (rem > 0 || years === 0) label += rem + "mo";

      const badge = job.querySelector(".job-duration");
      if (badge) badge.textContent = label.trim();
    });
  })();

  /* ---------------- Skills filter ---------------- */
  (function skillsFilterModule() {
    const chips = $$(".filter-chip");
    const cards = $$(".cards .card[data-category]");
    if (!chips.length || !cards.length) return;

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        const filter = chip.getAttribute("data-filter");

        cards.forEach((card) => {
          const cats = (card.getAttribute("data-category") || "").split(" ");
          const show = filter === "all" || cats.includes(filter);
          card.classList.toggle("is-hidden", !show);
        });
      });
    });
  })();

  /* ---------------- Copy to clipboard (contact links) ---------------- */
  (function copyModule() {
    const buttons = $$(".copy-btn");
    if (!buttons.length) return;
    const toast = $("#toast");
    let toastTimer = null;

    function showToast(message) {
      if (!toast) return;
      toast.textContent = "";
      const tick = document.createElement("span");
      tick.className = "tick";
      tick.textContent = "✓";
      toast.appendChild(tick);
      toast.appendChild(document.createTextNode(" " + message));
      toast.classList.add("is-visible");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
    }

    async function copyText(text) {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch (e) { /* fall through to legacy method */ }
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        return true;
      } catch (e) {
        return false;
      }
    }

    buttons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const value = btn.getAttribute("data-copy");
        if (!value) return;
        const ok = await copyText(value);
        showToast(ok ? "Copied " + value : "Copy failed — select manually");
      });
    });
  })();

  /* ---------------- Back to top ---------------- */
  (function backToTopModule() {
    const btn = $("#toTop");
    if (!btn) return;
    let ticking = false;

    function update() {
      btn.classList.toggle("is-visible", window.scrollY > 640);
      ticking = false;
    }
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  })();
})();

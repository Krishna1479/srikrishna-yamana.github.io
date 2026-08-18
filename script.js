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

  /* ---------------- Live experience counter ---------------- */
  (function experienceCounterModule() {
    const totalEl = $("#totalExperience");
    if (!totalEl) return;

    // The public resume provides month/year only, so the first day of the
    // stated start month is used consistently for day-level display.
    const start = new Date(2019, 7, 1); // Aug 1, 2019

    function diffParts(from, to) {
      let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
      const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      cursor.setMonth(cursor.getMonth() + months - 1);
      const days = Math.max(0, Math.floor((to - cursor) / 86400000));
      return { years: Math.floor(months / 12), months: months % 12, days };
    }

    function render() {
      const d = diffParts(start, new Date());
      const parts = [];
      if (d.years) parts.push(d.years + "y");
      parts.push(d.months + "mo");
      parts.push(d.days + "d");
      totalEl.textContent = parts.join(" ");
    }

    render();
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    window.setTimeout(() => {
      render();
      window.setInterval(render, 86400000);
    }, Math.max(1000, nextMidnight - now));
  })();

  /* ---------------- Hero live pipeline animation ---------------- */
  (function pipelineAnimModule() {
    const nodes = $$(".flow-node");
    const lineFill = $("#flowLineFill");
    const packet = $("#packet");
    const counterEl = $("#rowsCounter");
    if (!nodes.length) return;

    let step = 0;

    if (prefersReducedMotion) {
      nodes.forEach((n, i) => n.classList.toggle("highlight", i === 1));
      if (lineFill) lineFill.style.width = "62%";
    }

    const positions = [4, 50, 92]; // approximate % positions of node centers along the line
    const fillTargets = [18, 62, 96];

    function advance() {
      nodes.forEach((n, i) => n.classList.toggle("highlight", i === step));
      if (lineFill) lineFill.style.width = fillTargets[step] + "%";
      if (packet) packet.style.left = positions[step] + "%";
      step = (step + 1) % nodes.length;
    }
    if (!prefersReducedMotion) advance();
    let pipelineTimer = prefersReducedMotion ? null : setInterval(advance, 2200);

    // Keep the visual pipeline metric dynamic, as in the original design.
    let rows = 1284392;
    function updateRows() {
      rows += Math.floor(Math.random() * 140) + 20;
      if (counterEl) counterEl.textContent = "✓ " + rows.toLocaleString() + " rows/day";
    }
    updateRows();
    let rowsTimer = setInterval(updateRows, 1400);

    // Pause work when tab isn't visible — avoids wasted cycles and battery drain
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (pipelineTimer) clearInterval(pipelineTimer);
        clearInterval(rowsTimer);
      } else {
        if (!prefersReducedMotion) pipelineTimer = setInterval(advance, 2200);
        updateRows();
        rowsTimer = setInterval(updateRows, 1400);
      }
    });
  })();

  /* ---------------- Experience: auto-computed job duration ---------------- */
  (function durationModule() {
    const jobs = $$(".job[data-start][data-end]");
    if (!jobs.length) return;

    function parseDate(value) {
      if (!value) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split("-").map(Number);
        return new Date(y, m - 1, d);
      }
      const match = value.trim().match(/^([A-Za-z]{3})\s+(\d{4})$/);
      if (!match) return null;
      const months = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
      const m = months[match[1].toLowerCase()];
      return m === undefined ? null : new Date(Number(match[2]), m, 1);
    }

    function diffParts(from, to) {
      let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
      let cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      cursor.setMonth(cursor.getMonth() + months - 1);
      const days = Math.max(0, Math.floor((to - cursor) / 86400000));
      return { years: Math.floor(months / 12), months: months % 12, days };
    }

    function renderJob(job) {
      const start = parseDate(job.getAttribute("data-start"));
      const endValue = job.getAttribute("data-end");
      const end = endValue && endValue.toLowerCase() === "present" ? new Date() : parseDate(endValue);
      if (!start || !end || end < start) return;

      const d = diffParts(start, end);
      const parts = [];
      if (d.years) parts.push(d.years + "y");
      if (d.months) parts.push(d.months + "mo");
      if (d.days || !parts.length) parts.push(d.days + "d");
      const badge = job.querySelector(".job-duration");
      if (badge) badge.textContent = parts.join(" ");
    }

    function renderAll() { jobs.forEach(renderJob); }
    renderAll();
    const hasPresent = jobs.some((job) => (job.getAttribute("data-end") || "").toLowerCase() === "present");
    if (hasPresent) {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      window.setTimeout(() => {
        renderAll();
        window.setInterval(renderAll, 86400000);
      }, Math.max(1000, nextMidnight - now));
    }
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

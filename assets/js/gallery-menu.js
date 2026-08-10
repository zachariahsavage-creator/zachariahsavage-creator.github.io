/**
 * Gallery header pill menu: smooth open/close. Close runs the open animation in
 * reverse while the bar stays column-layout, then removes --open (avoids tall
 * empty flex line when switching to row mid-transition).
 */
window.setupGalleryBarMenu = function setupGalleryBarMenu(options) {
  const opts = options || {};
  const closeOnOutsideClick = opts.closeOnOutsideClick !== false;
  const titleTogglesMenu = opts.titleTogglesMenu !== false;

  const menuContainer = document.getElementById("gallery-bar-menu");
  const menuTrigger = document.querySelector(".gallery-bar__menu-trigger");
  const menuContent = document.querySelector(".gallery-bar__menu-content");
  if (!menuContainer || !menuTrigger || !menuContent) {
    return {
      closeMenu() {},
      openMenu() {},
      toggleMenu() {},
    };
  }

  const COLLAPSE_CLASS = "gallery-bar__menu-content--collapse";
  const OPEN_CLASS = "gallery-bar__brand--open";
  const COLLAPSE_FALLBACK_MS = 480;
  const frostEl = document.querySelector(".gallery-bar__frost");
  const plateEl = document.querySelector(".gallery-bar__plate");
  const overlayEls = [frostEl, plateEl].filter(Boolean);
  const frostMq =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 768px)")
      : null;

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }

  function overlaysEnabled() {
    if (!overlayEls.length || !frostMq?.matches) return false;
    return (
      document.body.classList.contains("page-home") ||
      document.body.classList.contains("page-full-gallery")
    );
  }

  let overlayRaf = 0;
  let overlayTrackUntil = 0;

  function syncMenuOverlays() {
    if (!overlayEls.length) return;
    if (!overlaysEnabled()) {
      for (const el of overlayEls) {
        el.classList.remove("is-ready");
        el.removeAttribute("style");
      }
      return;
    }
    const rect = menuContainer.getBoundingClientRect();
    const radiusRaw = getComputedStyle(menuContainer).borderRadius;
    const radiusPx = Number.parseFloat(radiusRaw) || 0;
    // Inset the difference/exclusion plate so its anti-aliased rim sits inside the frost
    // and doesn't show as a bright 1px fringe after mix-blend.
    const plateInset = 1;

    for (const el of overlayEls) {
      const inset = el.classList.contains("gallery-bar__plate") ? plateInset : 0;
      const width = Math.max(0, rect.width - inset * 2);
      const height = Math.max(0, rect.height - inset * 2);
      const radius = Math.max(0, radiusPx - inset);
      el.style.top = `${rect.top + inset}px`;
      el.style.left = `${rect.left + inset}px`;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.borderRadius = `${radius}px`;
      el.classList.add("is-ready");
    }
  }

  function scheduleOverlaySync(durationMs) {
    if (!overlaysEnabled()) {
      syncMenuOverlays();
      return;
    }
    const trackFor = typeof durationMs === "number" ? durationMs : 0;
    overlayTrackUntil = Math.max(overlayTrackUntil, performance.now() + trackFor);
    if (overlayRaf) return;
    const tick = (now) => {
      syncMenuOverlays();
      if (now < overlayTrackUntil) {
        overlayRaf = requestAnimationFrame(tick);
      } else {
        overlayRaf = 0;
      }
    };
    overlayRaf = requestAnimationFrame(tick);
  }

  let collapseTimer = null;
  let collapseOnEnd = null;

  function clearCollapseSchedule() {
    if (collapseTimer !== null) {
      clearTimeout(collapseTimer);
      collapseTimer = null;
    }
    if (collapseOnEnd) {
      menuContent.removeEventListener("transitionend", collapseOnEnd);
      collapseOnEnd = null;
    }
  }

  function applyClosedUi() {
    clearCollapseSchedule();
    menuContent.classList.remove(COLLAPSE_CLASS);
    menuContainer.classList.remove(OPEN_CLASS);
    menuTrigger.setAttribute("aria-expanded", "false");
    menuTrigger.setAttribute("aria-label", "Open menu");
    menuContent.setAttribute("aria-hidden", "true");
    scheduleOverlaySync(420);
  }

  function finishCollapseIfNeeded() {
    if (!menuContent.classList.contains(COLLAPSE_CLASS)) return;
    applyClosedUi();
  }

  /** @param {{ instant?: boolean }} [options] Use `{ instant: true }` from in-page hash nav to skip the panel animation. */
  function closeMenu(options) {
    const instant = options && options.instant === true;
    if (!menuContainer.classList.contains(OPEN_CLASS)) return;

    if (instant) {
      clearCollapseSchedule();
      menuContent.classList.remove(COLLAPSE_CLASS);
      applyClosedUi();
      return;
    }

    if (menuContent.classList.contains(COLLAPSE_CLASS)) return;
    if (prefersReducedMotion()) {
      applyClosedUi();
      return;
    }
    menuContent.classList.add(COLLAPSE_CLASS);
    menuTrigger.setAttribute("aria-expanded", "false");
    menuTrigger.setAttribute("aria-label", "Open menu");
    menuContent.setAttribute("aria-hidden", "true");
    scheduleOverlaySync(480);

    collapseOnEnd = (e) => {
      if (e.target !== menuContent || e.propertyName !== "grid-template-rows") return;
      menuContent.removeEventListener("transitionend", collapseOnEnd);
      collapseOnEnd = null;
      if (collapseTimer !== null) {
        clearTimeout(collapseTimer);
        collapseTimer = null;
      }
      finishCollapseIfNeeded();
    };
    menuContent.addEventListener("transitionend", collapseOnEnd);

    collapseTimer = window.setTimeout(() => {
      collapseTimer = null;
      if (collapseOnEnd) {
        menuContent.removeEventListener("transitionend", collapseOnEnd);
        collapseOnEnd = null;
      }
      finishCollapseIfNeeded();
    }, COLLAPSE_FALLBACK_MS);
  }

  function openMenu() {
    clearCollapseSchedule();
    menuContent.classList.remove(COLLAPSE_CLASS);
    menuContainer.classList.add(OPEN_CLASS);
    menuTrigger.setAttribute("aria-expanded", "true");
    menuTrigger.setAttribute("aria-label", "Close menu");
    menuContent.setAttribute("aria-hidden", "false");
    scheduleOverlaySync(420);
  }

  function toggleMenu() {
    if (menuContent.classList.contains(COLLAPSE_CLASS)) {
      clearCollapseSchedule();
      menuContent.classList.remove(COLLAPSE_CLASS);
      menuContainer.classList.add(OPEN_CLASS);
      menuTrigger.setAttribute("aria-expanded", "true");
      menuTrigger.setAttribute("aria-label", "Close menu");
      menuContent.setAttribute("aria-hidden", "false");
      scheduleOverlaySync(420);
      return;
    }
    if (menuContainer.classList.contains(OPEN_CLASS)) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  menuTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  if (titleTogglesMenu) {
    const titleEl = menuContainer.querySelector(".gallery-bar__title");
    titleEl?.addEventListener("click", () => menuTrigger.click());
  }

  if (closeOnOutsideClick) {
    document.addEventListener("click", (event) => {
      if (!menuContainer.classList.contains(OPEN_CLASS)) return;
      if (menuContent.classList.contains(COLLAPSE_CLASS)) return;
      if (menuContainer.contains(event.target)) return;
      closeMenu();
    });
  }

  if (overlayEls.length) {
    scheduleOverlaySync();
    window.addEventListener("resize", () => scheduleOverlaySync(), { passive: true });
    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(() => scheduleOverlaySync());
      ro.observe(menuContainer);
    }
    frostMq?.addEventListener?.("change", () => scheduleOverlaySync());
  }

  return { closeMenu, openMenu, toggleMenu };
};

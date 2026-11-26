/**
 * Gallery header pill menu: smooth open/close via measured pixel heights
 * (avoids janky grid 0fr / competing gap animations).
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

  // Avoid double-binding if setup runs more than once (open then immediate close).
  if (menuContainer.dataset.galleryMenuBound === "1" && menuContainer._galleryMenuApi) {
    return menuContainer._galleryMenuApi;
  }
  menuContainer.dataset.galleryMenuBound = "1";

  const COLLAPSE_CLASS = "gallery-bar__menu-content--collapse";
  const OPEN_CLASS = "gallery-bar__brand--open";
  const COLLAPSE_FALLBACK_MS = 480;
  const frostEl = document.querySelector(".gallery-bar__frost");
  const plateEl = document.querySelector(".gallery-bar__plate");
  const overlayEls = [frostEl, plateEl].filter(Boolean);

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }

  function overlaysEnabled() {
    if (!overlayEls.length) return false;
    return (
      document.body.classList.contains("page-home") ||
      document.body.classList.contains("page-full-gallery")
    );
  }

  let overlayRaf = 0;
  let overlayTrackUntil = 0;

  /**
   * Match frost/plate to the brand using the same fixed top/right + layout
   * offset size the brand itself uses. Avoid getBoundingClientRect → left/top:
   * under root `zoom` (laptop page-scale) Safari reports viewport coords that
   * don't match fixed `top`/`left`, which drifts the pill off the heading.
   */
  function syncMenuOverlays() {
    if (!overlayEls.length) return;
    if (!overlaysEnabled()) {
      for (const el of overlayEls) {
        el.classList.remove("is-ready");
        el.removeAttribute("style");
      }
      return;
    }
    const style = getComputedStyle(menuContainer);
    const top = style.top;
    const right = style.right;
    const width = Math.max(0, Math.round(menuContainer.offsetWidth));
    const height = Math.max(0, Math.round(menuContainer.offsetHeight));
    const radius = style.borderRadius || "0px";

    for (const el of overlayEls) {
      el.style.top = top;
      el.style.right = right;
      el.style.left = "auto";
      el.style.bottom = "auto";
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.borderRadius = radius;
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
  let openOnEnd = null;

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

  function clearOpenSchedule() {
    if (openOnEnd) {
      menuContent.removeEventListener("transitionend", openOnEnd);
      openOnEnd = null;
    }
  }

  function clearPanelHeight() {
    menuContent.style.height = "";
  }

  /**
   * Keep the panel open after the px tween. Switching px → auto while `height`
   * is transitionable makes browsers animate toward 0 (looks like instant close).
   */
  function unlockPanelHeight() {
    menuContent.style.transition = "none";
    menuContent.style.height = "auto";
    void menuContent.offsetHeight;
    menuContent.style.transition = "";
  }

  function measurePanelHeight() {
    // scrollHeight works even while height is 0 (overflow hidden).
    return Math.max(0, Math.ceil(menuContent.scrollHeight));
  }

  function applyClosedUi() {
    clearCollapseSchedule();
    clearOpenSchedule();
    menuContent.classList.remove(COLLAPSE_CLASS);
    menuContainer.classList.remove(OPEN_CLASS);
    clearPanelHeight();
    menuTrigger.setAttribute("aria-expanded", "false");
    menuTrigger.setAttribute("aria-label", "Open menu");
    menuContent.setAttribute("aria-hidden", "true");
    scheduleOverlaySync(120);
  }

  function finishCollapseIfNeeded() {
    if (!menuContent.classList.contains(COLLAPSE_CLASS)) return;
    applyClosedUi();
  }

  function animatePanelTo(targetHeight, onDone) {
    clearOpenSchedule();
    openOnEnd = (e) => {
      if (e.target !== menuContent || e.propertyName !== "height") return;
      menuContent.removeEventListener("transitionend", openOnEnd);
      openOnEnd = null;
      onDone?.();
    };
    menuContent.addEventListener("transitionend", openOnEnd);
    menuContent.style.height = `${Math.max(0, Math.round(targetHeight))}px`;
  }

  /** @param {{ instant?: boolean }} [options] Use `{ instant: true }` from in-page hash nav to skip the panel animation. */
  function closeMenu(options) {
    const instant = options && options.instant === true;
    if (!menuContainer.classList.contains(OPEN_CLASS)) return;

    if (instant) {
      clearCollapseSchedule();
      clearOpenSchedule();
      menuContent.classList.remove(COLLAPSE_CLASS);
      applyClosedUi();
      return;
    }

    if (menuContent.classList.contains(COLLAPSE_CLASS)) return;
    if (prefersReducedMotion()) {
      applyClosedUi();
      return;
    }

    clearOpenSchedule();
    const fromH = Math.round(menuContent.getBoundingClientRect().height);
    menuContent.style.height = `${fromH}px`;
    void menuContent.offsetHeight;

    menuContent.classList.add(COLLAPSE_CLASS);
    menuTrigger.setAttribute("aria-expanded", "false");
    menuTrigger.setAttribute("aria-label", "Open menu");
    menuContent.setAttribute("aria-hidden", "true");
    scheduleOverlaySync(480);

    collapseOnEnd = (e) => {
      if (e.target !== menuContent || e.propertyName !== "height") return;
      menuContent.removeEventListener("transitionend", collapseOnEnd);
      collapseOnEnd = null;
      if (collapseTimer !== null) {
        clearTimeout(collapseTimer);
        collapseTimer = null;
      }
      finishCollapseIfNeeded();
    };
    menuContent.addEventListener("transitionend", collapseOnEnd);
    menuContent.style.height = "0px";

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
    clearOpenSchedule();
    menuContent.classList.remove(COLLAPSE_CLASS);
    menuContainer.classList.add(OPEN_CLASS);
    menuTrigger.setAttribute("aria-expanded", "true");
    menuTrigger.setAttribute("aria-label", "Close menu");
    menuContent.setAttribute("aria-hidden", "false");

    if (prefersReducedMotion()) {
      unlockPanelHeight();
      scheduleOverlaySync(120);
      return;
    }

    // Lock closed before measuring so `height: auto` on --open doesn't flash open.
    menuContent.style.height = "0px";
    const target = measurePanelHeight();
    void menuContent.offsetHeight;
    scheduleOverlaySync(480);
    animatePanelTo(target, () => {
      if (
        menuContainer.classList.contains(OPEN_CLASS) &&
        !menuContent.classList.contains(COLLAPSE_CLASS)
      ) {
        unlockPanelHeight();
      }
      scheduleOverlaySync(80);
    });
  }

  function toggleMenu() {
    if (menuContent.classList.contains(COLLAPSE_CLASS)) {
      // Reverse a mid-close back to open.
      clearCollapseSchedule();
      const current = Math.round(menuContent.getBoundingClientRect().height);
      menuContent.classList.remove(COLLAPSE_CLASS);
      menuContainer.classList.add(OPEN_CLASS);
      menuTrigger.setAttribute("aria-expanded", "true");
      menuTrigger.setAttribute("aria-label", "Close menu");
      menuContent.setAttribute("aria-hidden", "false");
      menuContent.style.height = `${current}px`;
      void menuContent.offsetHeight;
      const target = measurePanelHeight();
      scheduleOverlaySync(480);
      animatePanelTo(target, () => {
        if (
          menuContainer.classList.contains(OPEN_CLASS) &&
          !menuContent.classList.contains(COLLAPSE_CLASS)
        ) {
          unlockPanelHeight();
        }
      });
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

  // Whole closed-pill header row toggles (title, hamburger, and the gap between).
  const brandRow = menuContainer.querySelector(".gallery-bar__brand-row");
  brandRow?.addEventListener("click", (e) => {
    e.stopPropagation();
    // Trigger already handled its own click (and stopped bubbling).
    if (menuTrigger.contains(e.target) || e.target === menuTrigger) return;
    if (!titleTogglesMenu && e.target.closest?.(".gallery-bar__title")) return;
    toggleMenu();
  });

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
  }

  const api = { closeMenu, openMenu, toggleMenu };
  menuContainer._galleryMenuApi = api;
  return api;
};

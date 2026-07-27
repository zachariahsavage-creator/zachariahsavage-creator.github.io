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

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
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
  }

  function toggleMenu() {
    if (menuContent.classList.contains(COLLAPSE_CLASS)) {
      clearCollapseSchedule();
      menuContent.classList.remove(COLLAPSE_CLASS);
      menuContainer.classList.add(OPEN_CLASS);
      menuTrigger.setAttribute("aria-expanded", "true");
      menuTrigger.setAttribute("aria-label", "Close menu");
      menuContent.setAttribute("aria-hidden", "false");
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

  return { closeMenu, openMenu, toggleMenu };
};

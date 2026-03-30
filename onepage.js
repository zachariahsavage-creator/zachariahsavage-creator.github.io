// Single-page experience: home flow, gallery grid, and contact form.

function getFlowItemWidth() {
  const w = window.innerWidth;
  if (w <= 420) return Math.min(200, Math.round(w * 0.72));
  if (w <= 768) return Math.min(248, Math.round(w * 0.58));
  return 288;
}

const mediaItems = [
  "Assets/14.jpg",
  "Assets/4.jpg",
  { type: "video", src: "Assets/0.mp4" },
  "Assets/DSC_0801.jpg",
  "Assets/DSC_1589.jpg",
  { type: "video", src: "Assets/GIF 1.mp4" },
  "Assets/DSC_1781 (1).jpg",
  "Assets/DSC_2065.jpg",
  { type: "video", src: "Assets/GIF 2.mp4" },
  "Assets/DSC_2094.jpg",
  "Assets/DSC_2355 (1).jpg",
  { type: "video", src: "Assets/GIF 3.mp4" },
  "Assets/DSC_2390 (1).jpg",
  "Assets/DSC_2420 (1).jpg",
  { type: "video", src: "Assets/GIF 4.mp4" },
  "Assets/DSC_2575.jpg",
  "Assets/DSC_2582(1).jpg",
  { type: "video", src: "Assets/My movie 29_1_1_1_1_1.mp4" },
  "Assets/DSC_2584 (1).jpg",
  "Assets/DSC_2967.jpg",
  { type: "video", src: "Assets/My movie 5_1_1_1.mp4" },
  "Assets/DSC_3060.jpg",
  "Assets/DSC_3087.jpg",
  { type: "video", src: "Assets/clip 1.mp4" },
  "Assets/DSC_3353.jpg",
  "Assets/DSC_4391.jpg",
  "Assets/DSC_4623.jpg",
  "Assets/DSC_4773.jpg",
  "Assets/DSC_4821.jpg",
  "Assets/DSC_4835.jpg",
  "Assets/DSC_5838_1.jpg",
  "Assets/DSC_6086_1(1).jpg",
  "Assets/DSC_6172_1.jpg",
  "Assets/DSC_6215_1.jpg",
  "Assets/DSC_8186.jpg",
  "Assets/DSC_5325.jpg",
  "Assets/DSC_5573.jpg",
  "Assets/DSC_5983 (1).jpg",
  "Assets/DSC_7165.jpg",
  "Assets/DSC_7270.jpg",
  { type: "video", src: "Assets/My movie 18_1_1_1_1.mp4" },
];

const ROW_IDS = ["row-top", "row-bottom"];
let galleryRowsState = null;
let magneticCursorX = null;
let magneticCursorY = null;
let magneticCursorItem = null;
let lightbox;
let lightboxImage;
let lightboxVideo;
let lightboxCloseBtn;
let lightboxPrevBtn;
let lightboxNextBtn;
let lightboxCurrentIndex = null;
let isMorphingToLightbox = false;

const MAX_HOVER_SCALE = 1.18;
const MAX_NEIGHBOR_SCALE = 1.16;
const MAGNETIC_RADIUS_PX = 320;

function triggerFlowShockwave(epicenter) {
  // Trigger the “color shockwave” cascade for *all* tiles in the home flow
  // based on the tile currently under the cursor.
  if (!epicenter) return;
  if (document.body.dataset.colorShockwave === "true") return;

  const homeGallery = document.querySelector("#home-section .gallery");
  if (!homeGallery) return;

  const items = Array.from(homeGallery.querySelectorAll(".media-item"));
  if (!items.length) return;

  document.body.dataset.colorShockwave = "true";

  const rect0 = epicenter.getBoundingClientRect();
  const x0 = rect0.left + rect0.width / 2;
  const y0 = rect0.top + rect0.height / 2;

  // Also trigger background color shockwave from this epicenter.
  const docEl = document.documentElement;
  const viewportWidth = window.innerWidth || docEl.clientWidth || 1;
  const viewportHeight = window.innerHeight || docEl.clientHeight || 1;
  const waveX = (x0 / viewportWidth) * 100;
  const waveY = (y0 / viewportHeight) * 100;
  docEl.style.setProperty("--gallery-wave-x", waveX + "%");
  docEl.style.setProperty("--gallery-wave-y", waveY + "%");
  document.body.classList.add("gallery-bg-wave--active");

  const ranked = items
    .map((el) => {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const dx = x - x0;
      const dy = y - y0;
      return { el, dist: Math.hypot(dx, dy) };
    })
    .sort((a, b) => a.dist - b.dist);

  const maxDist = ranked[ranked.length - 1]?.dist || 1;
  const totalWaveMs = 900;

  ranked.forEach(({ el, dist }) => {
    const t = maxDist ? dist / maxDist : 0;
    const delay = Math.round(t * totalWaveMs);
    window.setTimeout(() => {
      el.classList.add("media-item--revealed", "media-item--shockwave");
      window.setTimeout(() => el.classList.remove("media-item--shockwave"), 420);
    }, delay);
  });
}

function createMorphLayerFromWrapper(wrapper, item) {
  const rect = wrapper.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  const morph = document.createElement("div");
  morph.className = "morph-layer";
  morph.style.left = `${rect.left}px`;
  morph.style.top = `${rect.top}px`;
  morph.style.width = `${rect.width}px`;
  morph.style.height = `${rect.height}px`;

  let mediaEl;
  if (typeof item === "string") {
    mediaEl = document.createElement("img");
    mediaEl.src = item;
    mediaEl.alt = "";
  } else {
    mediaEl = document.createElement("video");
    mediaEl.src = item.src;
    mediaEl.muted = true;
    mediaEl.loop = true;
    mediaEl.playsInline = true;
    mediaEl.autoplay = true;
  }
  morph.appendChild(mediaEl);
  document.body.appendChild(morph);

  const aspect = rect.width / rect.height || 1;
  const maxWidth = viewportWidth * 0.9;
  const maxHeight = viewportHeight * 0.9;
  let targetWidth = maxWidth;
  let targetHeight = targetWidth / aspect;
  if (targetHeight > maxHeight) {
    targetHeight = maxHeight;
    targetWidth = targetHeight * aspect;
  }
  const targetLeft = (viewportWidth - targetWidth) / 2;
  const targetTop = (viewportHeight - targetHeight) / 2;

  const durationMs = 420;
  morph.style.transition = `left ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    top ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    width ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    height ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    border-radius ${durationMs}ms linear`;

  void morph.offsetWidth;

  morph.style.left = `${targetLeft}px`;
  morph.style.top = `${targetTop}px`;
  morph.style.width = `${targetWidth}px`;
  morph.style.height = `${targetHeight}px`;
  morph.style.borderRadius = "1.1rem";

  return { morph, durationMs };
}

function openLightboxFromIndex(index) {
  if (!lightbox) return;
  const item = mediaItems[index];
  if (!item) return;

  document.querySelectorAll("#gallery-grid video").forEach((v) => {
    try {
      v.pause();
    } catch (_e) {}
  });

  lightboxCurrentIndex = index;
  lightbox.setAttribute("data-state", "open");
  document.documentElement.style.overflow = "hidden";

  if (typeof item === "string") {
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    lightboxVideo.removeAttribute("data-active");
    lightboxImage.src = item;
    lightboxImage.setAttribute("data-active", "true");
  } else {
    lightboxImage.removeAttribute("src");
    lightboxImage.removeAttribute("data-active");
    lightboxVideo.src = item.src;
    lightboxVideo.loop = true;
    lightboxVideo.setAttribute("data-active", "true");
    lightboxVideo.play().catch(() => {});
  }
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.setAttribute("data-state", "closed");
  document.documentElement.style.overflow = "";
  lightboxCurrentIndex = null;

  if (lightboxVideo) {
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    lightboxVideo.removeAttribute("data-active");
  }
  if (lightboxImage) {
    lightboxImage.removeAttribute("src");
    lightboxImage.removeAttribute("data-active");
  }
}

function changeLightboxBy(delta) {
  if (lightboxCurrentIndex === null) return;
  const total = mediaItems.length;
  openLightboxFromIndex((lightboxCurrentIndex + delta + total) % total);
}

function applyMagneticScale() {
  if (!galleryRowsState || magneticCursorX === null || magneticCursorY === null) return;
  const elementAtCursor = document.elementFromPoint(magneticCursorX, magneticCursorY);
  magneticCursorItem = elementAtCursor?.closest(".media-item") || null;

  galleryRowsState.forEach((rowState) => {
    if (!rowState) return;
    rowState.items.forEach((itemState) => {
      const rect = itemState.element.getBoundingClientRect();
      const isUnderCursor = itemState.element === magneticCursorItem;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = isUnderCursor
        ? 0
        : Math.hypot(centerX - magneticCursorX, centerY - magneticCursorY);
      const influence = 1 - Math.min(dist / MAGNETIC_RADIUS_PX, 1);
      let scale = 1 + (MAX_HOVER_SCALE - 1) * influence * influence;
      if (!isUnderCursor && scale > MAX_NEIGHBOR_SCALE) scale = MAX_NEIGHBOR_SCALE;
      itemState.element.style.setProperty("--scale", scale.toFixed(3));
      itemState.element.style.zIndex = "3";
    });
  });

  if (magneticCursorItem) magneticCursorItem.style.zIndex = "10";
}

function attachHoverAndClickBehavior(wrapper, mediaIndex) {
  wrapper.addEventListener("mouseenter", () => {
    const row = wrapper.parentElement;
    if (!row) return;
    const siblings = Array.from(row.querySelectorAll(".media-item"));
    const idx = siblings.indexOf(wrapper);
    siblings.forEach((el, i) => {
      el.classList.remove("media-item--hovered", "media-item--neighbor");
      if (i === idx) el.classList.add("media-item--hovered");
      else if (i === idx - 1 || i === idx + 1) el.classList.add("media-item--neighbor");
    });
  });

  wrapper.addEventListener("click", () => {
    if (typeof mediaIndex !== "number" || isMorphingToLightbox) return;
    const item = mediaItems[mediaIndex];
    if (!item) return;
    isMorphingToLightbox = true;
    const { morph, durationMs } = createMorphLayerFromWrapper(wrapper, item);
    window.setTimeout(() => {
      morph.remove();
      openLightboxFromIndex(mediaIndex);
      isMorphingToLightbox = false;
    }, durationMs + 40);
  });
}

function createFlowMediaElement(item, mediaIndex) {
  const wrapper = document.createElement("div");
  wrapper.className = "media-item";
  wrapper.dataset.mediaIndex = String(mediaIndex);

  if (typeof item === "string") {
    const img = document.createElement("img");
    img.src = item;
    img.alt = "";
    wrapper.appendChild(img);
  } else {
    const video = document.createElement("video");
    video.src = item.src;
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    if (item.src.includes("GIF")) wrapper.classList.add("media-item--gif");
    wrapper.appendChild(video);
  }

  attachHoverAndClickBehavior(wrapper, mediaIndex);
  return wrapper;
}

function setupRows() {
  const rowsState = [];
  ROW_IDS.forEach((id, rowIndex) => {
    const rowElement = document.getElementById(id);
    if (!rowElement) return;
    const itemsForRow = mediaItems
      .map((item, mediaIndex) => ({ item, mediaIndex }))
      .filter(({ mediaIndex }) => (rowIndex === 0 ? mediaIndex % 2 === 0 : mediaIndex % 2 === 1));

    const stateForRow = [];
    itemsForRow.forEach(({ item, mediaIndex }) => {
      const el = createFlowMediaElement(item, mediaIndex);
      rowElement.appendChild(el);
      stateForRow.push({ element: el, x: 0, width: 0 });
    });
    rowsState.push({ rowElement, items: stateForRow });
  });
  return rowsState;
}

function measureAndPosition(rowsState) {
  const viewportWidth = window.innerWidth;
  const spacing = 10;
  const itemW = getFlowItemWidth();
  document.documentElement.style.setProperty("--flow-item-width", `${itemW}px`);

  rowsState.forEach((rowState) => {
    if (!rowState) return;
    let currentX = -viewportWidth;
    rowState.items.forEach((itemState) => {
      itemState.width = itemW;
      itemState.x = currentX;
      itemState.element.style.setProperty("--x", `${itemState.x}px`);
      itemState.element.style.opacity = "1";
      currentX += itemW + spacing;
    });

    const baseItems = rowState.items.slice();
    let lastRight = rowState.items[rowState.items.length - 1].x + itemW;
    const targetRight = viewportWidth + baseItems.length * (itemW + spacing);
    let sequenceOffset = 0;
    while (lastRight < targetRight && baseItems.length) {
      sequenceOffset = (sequenceOffset + 10) % baseItems.length;
      for (let i = 0; i < baseItems.length && lastRight < targetRight; i++) {
        const base = baseItems[(i + sequenceOffset) % baseItems.length];
        const cloneEl = base.element.cloneNode(true);
        rowState.rowElement.appendChild(cloneEl);
        const mediaIndex = Number(base.element.dataset.mediaIndex);
        attachHoverAndClickBehavior(cloneEl, mediaIndex);
        const cloneState = { element: cloneEl, x: currentX, width: itemW };
        cloneEl.style.setProperty("--x", `${currentX}px`);
        rowState.items.push(cloneState);
        currentX += itemW + spacing;
        lastRight = cloneState.x + itemW;
      }
    }
  });
}

function startFlowAnimation(rowsState) {
  let lastTime = performance.now();
  const baseSpeeds = [24, 30];
  let flowDirection = 1;
  let flowMultiplier = 1;

  const leftBtn = document.querySelector(".gallery-flow-arrow--left");
  const rightBtn = document.querySelector(".gallery-flow-arrow--right");
  function bindHold(btn, dir) {
    if (!btn) return;
    const onDown = (e) => {
      e.preventDefault();
      flowDirection = dir;
      flowMultiplier = 7.5;
      btn.setPointerCapture?.(e.pointerId);
    };
    const onUp = () => {
      flowMultiplier = 1;
    };
    btn.addEventListener("pointerdown", onDown);
    btn.addEventListener("pointerup", onUp);
    btn.addEventListener("pointercancel", onUp);
    btn.addEventListener("pointerleave", onUp);
    btn.addEventListener("lostpointercapture", onUp);
  }
  bindHold(leftBtn, 1);
  bindHold(rightBtn, -1);

  window.addEventListener("keydown", (event) => {
    if (lightbox?.getAttribute("data-state") === "open") return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      flowDirection = 1;
      flowMultiplier = 7.5;
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      flowDirection = -1;
      flowMultiplier = 7.5;
    }
  });
  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") flowMultiplier = 1;
  });

  function step(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    const itemW = getFlowItemWidth();
    const wrapRightThreshold = window.innerWidth + itemW;
    const wrapLeftThreshold = -itemW;

    rowsState.forEach((rowState, rowIndex) => {
      const speed = (baseSpeeds[rowIndex] || baseSpeeds[0]) * flowMultiplier * flowDirection;
      let minLeft = Infinity;
      let maxRight = -Infinity;
      rowState.items.forEach((itemState) => {
        minLeft = Math.min(minLeft, itemState.x);
        maxRight = Math.max(maxRight, itemState.x + itemState.width);
      });
      rowState.items.forEach((itemState) => {
        itemState.x += speed * dt;
        if (speed > 0 && itemState.x > wrapRightThreshold) {
          itemState.x = minLeft - itemState.width - 10;
          minLeft = itemState.x;
        } else if (speed < 0 && itemState.x + itemState.width < wrapLeftThreshold) {
          itemState.x = maxRight + 10;
          maxRight = itemState.x + itemState.width;
        }
        itemState.element.style.setProperty("--x", `${itemState.x}px`);
      });
    });

    if (magneticCursorX !== null && magneticCursorY !== null) applyMagneticScale();
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function createGridTile(item, mediaIndex) {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "media-item portfolio-tile";
  tile.dataset.mediaIndex = String(mediaIndex);
  tile.dataset.kind = typeof item === "string" ? "stills" : "video";

  if (typeof item === "string") {
    const img = document.createElement("img");
    img.src = item;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    tile.appendChild(img);
  } else {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.dataset.src = item.src;
    tile.appendChild(video);
  }

  tile.addEventListener("click", () => {
    if (isMorphingToLightbox) return;
    isMorphingToLightbox = true;
    const { morph, durationMs } = createMorphLayerFromWrapper(tile, mediaItems[mediaIndex]);
    window.setTimeout(() => {
      morph.remove();
      openLightboxFromIndex(mediaIndex);
      isMorphingToLightbox = false;
    }, durationMs + 40);
  });
  return tile;
}

function setupGridGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;
  const fragment = document.createDocumentFragment();
  mediaItems.forEach((item, idx) => fragment.appendChild(createGridTile(item, idx)));
  grid.appendChild(fragment);

  const tiles = Array.from(grid.querySelectorAll(".media-item"));
  const metaEl = document.getElementById("portfolio-meta");
  const filterButtons = Array.from(document.querySelectorAll(".portfolio-filter[data-filter]"));

  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const video = entry.target.querySelector("video");
              if (!video) return;
              if (entry.isIntersecting) {
                if (!video.src && video.dataset.src) {
                  video.src = video.dataset.src;
                  video.load();
                }
                video.play().catch(() => {});
              } else {
                video.pause();
              }
            });
          },
          { rootMargin: "300px 0px", threshold: 0.01 }
        )
      : null;

  function applyFilter(filterValue) {
    tiles.forEach((tile) => {
      const kind = tile.dataset.kind || "stills";
      const show =
        filterValue === "all" ||
        (filterValue === "stills" && kind === "stills") ||
        (filterValue === "video" && kind === "video");
      tile.classList.toggle("is-hidden", !show);
      if (!show) tile.querySelector("video")?.pause();
    });

    if (metaEl) {
      metaEl.textContent = `${tiles.filter((t) => !t.classList.contains("is-hidden")).length} works`;
    }
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      applyFilter(btn.dataset.filter || "all");
    });
  });

  applyFilter("all");
  if (io) tiles.forEach((tile) => io.observe(tile));
}

function setupMenuAndSections() {
  const menuContainer = document.getElementById("gallery-bar-menu");
  const menuTrigger = document.querySelector(".gallery-bar__menu-trigger");
  const menuContent = document.querySelector(".gallery-bar__menu-content");
  const titleEl = document.getElementById("section-title");
  const menuLinks = Array.from(document.querySelectorAll(".gallery-bar__menu-link[href^='#']"));
  const sections = Array.from(document.querySelectorAll(".onepage-section"));

  function setActiveSection(label) {
    if (!titleEl) return;
    if (!label) return;

    titleEl.textContent = label;
    menuLinks.forEach((link) => {
      const linkLabel = (link.textContent || "").trim().toLowerCase();
      link.classList.toggle("is-hidden", linkLabel === label);
    });
  }

  if (menuContainer && menuTrigger && menuContent) {
    menuTrigger.addEventListener("click", () => {
      const isOpen = menuContainer.classList.toggle("gallery-bar__brand--open");
      menuTrigger.setAttribute("aria-expanded", String(isOpen));
      menuContent.setAttribute("aria-hidden", String(!isOpen));
    });

    titleEl?.addEventListener("click", () => menuTrigger.click());
    document.addEventListener("click", (event) => {
      if (!menuContainer.classList.contains("gallery-bar__brand--open")) return;
      if (menuContainer.contains(event.target)) return;
      menuContainer.classList.remove("gallery-bar__brand--open");
      menuTrigger.setAttribute("aria-expanded", "false");
      menuContent.setAttribute("aria-hidden", "true");
    });
  }

  menuLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      menuContainer?.classList.remove("gallery-bar__brand--open");
      menuTrigger?.setAttribute("aria-expanded", "false");
      menuContent?.setAttribute("aria-hidden", "true");
    });
  });

  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const label = entry.target.dataset.sectionLabel;
          if (label) setActiveSection(label);
        });
      },
      { threshold: 0.45 }
    );
    sections.forEach((section) => sectionObserver.observe(section));
  }

  // Ensure dropdown doesn't show the current section immediately on load.
  (function syncInitialActive() {
    const offset = 140;
    const inView =
      sections.find(
        (s) =>
          s.getBoundingClientRect().top <= offset &&
          s.getBoundingClientRect().bottom > offset
      ) || sections[0];
    const label = inView?.dataset?.sectionLabel;
    if (label) setActiveSection(label);
  })();
}

function setupContactBackgroundCrossfade() {
  // Contact page crossfade background slideshow.
  const bgA = document.querySelector(".contact-bg__layer--a");
  const bgB = document.querySelector(".contact-bg__layer--b");
  if (!bgA || !bgB) return;

  const bgImages = [
    "Assets/DSC_0166-2.jpg",
    "Assets/DSC_0173.jpg",
    "Assets/DSC_0104.jpg",
    "Assets/DSC_0179.jpg",
    "Assets/DSC_0128-2.jpg",
    "Assets/DSC_0168.jpg",
  ];

  // Preload to avoid flashes/black frames.
  bgImages.forEach(function (src) {
    const img = new Image();
    img.src = src;
  });

  function setLayer(el, src) {
    el.style.backgroundImage = 'url("' + src + '")';
  }

  let index = 0;
  let showingA = true;
  const fadeMs = 1600;
  const holdMs = 25000;

  // Start with A visible.
  setLayer(bgA, bgImages[index]);
  bgA.classList.add("is-visible");
  bgB.classList.remove("is-visible");

  window.setInterval(function () {
    const nextIndex = (index + 1) % bgImages.length;
    const incoming = showingA ? bgB : bgA;
    const outgoing = showingA ? bgA : bgB;

    setLayer(incoming, bgImages[nextIndex]);

    incoming.classList.remove("is-fading-out");
    outgoing.classList.remove("is-fading-in");

    // Force reflow so transition reliably runs.
    void incoming.offsetWidth;

    incoming.classList.add("is-fading-in", "is-visible");
    outgoing.classList.add("is-fading-out");

    window.setTimeout(function () {
      outgoing.classList.remove("is-visible", "is-fading-out");
      incoming.classList.remove("is-fading-in");
    }, fadeMs + 50);

    index = nextIndex;
    showingA = !showingA;
  }, holdMs);
}

function setupContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const subject = form.querySelector('[name="subject"]')?.value || "";
    const body = form.querySelector('[name="body"]')?.value || "";
    const mailto =
      "mailto:zachariahsavage@gmail.com?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);
    window.location.href = mailto;
  });
}

window.addEventListener("load", () => {
  const rowsState = setupRows();
  galleryRowsState = rowsState;
  setTimeout(() => {
    measureAndPosition(rowsState);
    startFlowAnimation(rowsState);
  }, 60);

  lightbox = document.querySelector(".lightbox");
  lightboxImage = document.querySelector(".lightbox__image");
  lightboxVideo = document.querySelector(".lightbox__video");
  lightboxCloseBtn = document.querySelector(".lightbox__close");
  lightboxPrevBtn = document.querySelector(".lightbox__arrow--prev");
  lightboxNextBtn = document.querySelector(".lightbox__arrow--next");
  lightboxCloseBtn?.addEventListener("click", closeLightbox);
  lightboxPrevBtn?.addEventListener("click", () => changeLightboxBy(-1));
  lightboxNextBtn?.addEventListener("click", () => changeLightboxBy(1));
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target === document.querySelector(".lightbox__backdrop")) {
      closeLightbox();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (lightbox?.getAttribute("data-state") !== "open") return;
    if (event.key === "Escape") closeLightbox();
    else if (event.key === "ArrowLeft") changeLightboxBy(-1);
    else if (event.key === "ArrowRight") changeLightboxBy(1);
  });

  const flowGallery = document.querySelector(".gallery");
  flowGallery?.addEventListener("mousemove", (event) => {
    magneticCursorItem = event.target.closest(".media-item");
    magneticCursorX = event.clientX;
    magneticCursorY = event.clientY;
    applyMagneticScale();

    // If the tiles are moving under the cursor, `mouseenter` on a specific
    // tile may never fire. Trigger the full shockwave based on whatever
    // tile is currently under the pointer.
    if (document.body.dataset.colorShockwave !== "true") {
      triggerFlowShockwave(magneticCursorItem);
    }
  });
  flowGallery?.addEventListener("mouseleave", () => {
    magneticCursorX = null;
    magneticCursorY = null;
    magneticCursorItem = null;
    galleryRowsState?.forEach((row) =>
      row.items.forEach((itemState) => itemState.element.style.setProperty("--scale", "1"))
    );
  });

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => measureAndPosition(rowsState), 150);
  });

  setupGridGallery();
  setupMenuAndSections();
  setupContactBackgroundCrossfade();
  setupContactForm();
});

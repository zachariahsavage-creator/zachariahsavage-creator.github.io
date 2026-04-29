// Single-page experience: home flow, gallery grid, and contact form.

function getFlowItemWidth() {
  const w = window.innerWidth;
  if (w <= 420) return Math.min(200, Math.round(w * 0.72));
  if (w <= 768) return Math.min(248, Math.round(w * 0.58));
  return 288;
}

const mediaItems = [
  "1_3730.webp",
  "6_2584 (1).webp",
  "2_1826.webp",
  "6_2355 (1).webp",
  "4_5325.webp",
  "3_8635.webp",
  "4_5573.webp",
  "6_3087.webp",
  "5_2575.webp",
  "2_0829.webp",
  "2_2040.webp",
  "1_3746.webp",
  "14.webp",
  "4.webp",
  "6_0801.webp",
  "6_1589.webp",
  "6_1781 (1).webp",
  "5_2065.webp",
  "5_2094.webp",
  "6_2390 (1).webp",
  "6_2420 (1).webp",
  "6_2582(1).webp",
  "6_2967.webp",
  "6_3060.webp",
  "5_3353.webp",
  "5_4391.webp",
  "6_4623.webp",
  "6_4773.webp",
  "6_4821.webp",
  "6_4835.webp",
  "6_5838_1.webp",
  "6_6086_1(1).webp",
  "6_6172_1.webp",
  "6_6215_1.webp",
  "DSC_8186.webp",
  "4_5983 (1).webp",
  "4_7165.webp",
  "4_7270.webp",
];

const fullGalleryNumberedItems = [
  "1_3566 (1).webp",
  "1_3697 (1).webp",
  "1_3714.webp",
  "1_3719 (1).webp",
  "1_3730.webp",
  "1_3746.webp",
  "2_0829.webp",
  "2_1826.webp",
  "2_1932.webp",
  "2_1981.webp",
  "2_2040.webp",
  "3_8505.webp",
  "3_8632.webp",
  "3_8635.webp",
  "3_8640.webp",
  "3_9088.webp",
  "3_9098.webp",
  "4_5325.webp",
  "4_5573.webp",
  "4_5983 (1).webp",
  "4_7165.webp",
  "4_7270.webp",
  "5_2065.webp",
  "5_2094.webp",
  "5_2575.webp",
  "5_3353.webp",
  "5_4391.webp",
  "6_0801.webp",
  "6_1589.webp",
  "6_1781 (1).webp",
  "6_2355 (1).webp",
  "6_2390 (1).webp",
  "6_2420 (1).webp",
  "6_2582(1).webp",
  "6_2584 (1).webp",
  "6_2961.webp",
  "6_2967.webp",
  "6_3060.webp",
  "6_3087.webp",
  "6_4623.webp",
  "6_4773.webp",
  "6_4821.webp",
  "6_4835.webp",
  "6_5838_1.webp",
  "6_6086_1(1).webp",
  "6_6172_1.webp",
  "6_6215_1.webp",
];

let activeGalleryItems = mediaItems;
const fullGalleryExpandedGroups = new Set();
const fullGallerySectionTitles = {
  "1": "Boston Church Scandal @ The Drake",
  "2": "DAPHNE @ The Drake",
  "3": "Izzy Flores @ 986 Bathurst",
  "4": "Angelique @ The Ivy",
  "5": "Superstar Crush @ The Baby G",
  "6": "Some Highlights",
};

function getLeadingNumberGroup(src) {
  const filename = src.split("/").pop() || "";
  const match = filename.match(/^(\d+)_/);
  if (!match) return null;
  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric)) return null;
  return String(numeric);
}

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
let scrollRevealObserver = null;

const MAX_HOVER_SCALE = 1.18;
const MAX_NEIGHBOR_SCALE = 1.16;
const MAGNETIC_RADIUS_PX = 320;

function getShouldReduceMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

function observeRevealElement(el, delayMs = 0) {
  if (!el) return;
  el.classList.add("reveal-on-scroll");
  if (delayMs > 0) {
    el.style.setProperty("--reveal-delay", `${delayMs}ms`);
  }
  if (getShouldReduceMotion()) {
    el.classList.add("is-visible");
    return;
  }
  if (!scrollRevealObserver) {
    scrollRevealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: "18% 0px -10% 0px" }
    );
  }
  scrollRevealObserver.observe(el);
}

function setupScrollReveal() {
  const isFullGalleryPage = document.body.classList.contains("page-full-gallery");
  if (isFullGalleryPage) return;
  const targets = document.querySelectorAll(
    ".home-intro, .onepage-section__heading, .portfolio-controls, .portfolio-toggle, .contact__card"
  );
  targets.forEach((el, idx) => {
    observeRevealElement(el, Math.min(220, idx * 35));
  });
}

function triggerFlowShockwave(epicenter) {
  // Shockwave reveal intentionally disabled.
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
  const item = activeGalleryItems[index];
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
  const total = activeGalleryItems.length;
  openLightboxFromIndex((lightboxCurrentIndex + delta + total) % total);
}

function applyMagneticScale() {
  // Magnetic hover scaling intentionally disabled.
}

function attachHoverAndClickBehavior(wrapper, mediaIndex) {
  wrapper.addEventListener("click", () => {
    if (typeof mediaIndex !== "number" || isMorphingToLightbox) return;
    const item = activeGalleryItems[mediaIndex];
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
    // Clamp frame delta so scroll-induced rAF stalls on mobile don't cause
    // huge catch-up jumps in the flow positions.
    const dt = Math.min((now - lastTime) / 1000, 0.05);
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
          const el = itemState.element;
          el.classList.add("media-item--teleport");
          el.style.setProperty("--x", `${itemState.x}px`);
          requestAnimationFrame(() => {
            el.classList.remove("media-item--teleport");
          });
        } else if (speed < 0 && itemState.x + itemState.width < wrapLeftThreshold) {
          itemState.x = maxRight + 10;
          maxRight = itemState.x + itemState.width;
          const el = itemState.element;
          el.classList.add("media-item--teleport");
          el.style.setProperty("--x", `${itemState.x}px`);
          requestAnimationFrame(() => {
            el.classList.remove("media-item--teleport");
          });
        } else {
          itemState.element.style.setProperty("--x", `${itemState.x}px`);
        }
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

  // Attach grouping metadata for full-gallery name-prefix sections.
  const src = typeof item === "string" ? item : item.src;
  const numberGroup = getLeadingNumberGroup(src);
  if (numberGroup !== null) {
    tile.dataset.groupLabel = numberGroup;
    tile.dataset.groupOrder = numberGroup;
  } else {
    tile.dataset.groupLabel = "other";
    tile.dataset.groupOrder = "9999";
  }

  if (typeof item === "string") {
    const img = document.createElement("img");
    img.src = item;
    img.alt = "";
    /* Eager: justified layout re-parents tiles on each pass; lazy + detach reloads and “pops”. */
    img.loading = "eager";
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
    const { morph, durationMs } = createMorphLayerFromWrapper(tile, activeGalleryItems[mediaIndex]);
    window.setTimeout(() => {
      morph.remove();
      openLightboxFromIndex(mediaIndex);
      isMorphingToLightbox = false;
    }, durationMs + 40);
  });
  return tile;
}

function readTileNaturalSize(tile) {
  const img = tile.querySelector("img");
  const video = tile.querySelector("video");
  if (img?.naturalWidth && img.naturalHeight) {
    return { nw: img.naturalWidth, nh: img.naturalHeight };
  }
  if (video?.videoWidth && video.videoHeight) {
    return { nw: video.videoWidth, nh: video.videoHeight };
  }
  const nw = parseFloat(tile.dataset.nw || "0");
  const nh = parseFloat(tile.dataset.nh || "0");
  if (nw > 0 && nh > 0) return { nw, nh };
  return { nw: 4, nh: 5 };
}

function waitForTileDimensions(tile) {
  return new Promise((resolve) => {
    const img = tile.querySelector("img");
    const video = tile.querySelector("video");
    const finish = (nw, nh) => {
      tile.dataset.nw = String(nw);
      tile.dataset.nh = String(nh);
      resolve(tile);
    };

    if (img) {
      if (img.complete && img.naturalWidth) {
        finish(img.naturalWidth, img.naturalHeight);
        return;
      }
      img.addEventListener(
        "load",
        () => finish(img.naturalWidth || 1, img.naturalHeight || 1),
        { once: true }
      );
      img.addEventListener("error", () => finish(4, 5), { once: true });
      return;
    }

    if (video) {
      if (video.dataset.src && !video.src) {
        video.src = video.dataset.src;
        video.load();
      }
      const fromVideo = () => {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (vw && vh) finish(vw, vh);
        else finish(16, 9);
      };
      if (video.readyState >= 1 && video.videoWidth) {
        fromVideo();
        return;
      }
      video.addEventListener("loadedmetadata", fromVideo, { once: true });
      video.addEventListener("error", () => finish(16, 9), { once: true });
    } else {
      finish(4, 5);
    }
  });
}

/** Pack items into rows so each row spans the container width (Flickr-style). */
function packJustifiedRows(items, rowWidth, gap, minRowHeight, maxRowHeight) {
  const rows = [];
  let i = 0;
  while (i < items.length) {
    const row = [];
    while (i < items.length) {
      row.push(items[i]);
      i += 1;
      const sumA = row.reduce((s, t) => s + parseFloat(t.dataset.aspect || 1), 0);
      const n = row.length;
      const h = (rowWidth - (n - 1) * gap) / sumA;
      if (h < minRowHeight && row.length > 1) {
        i -= 1;
        row.pop();
        break;
      }
      if (h <= maxRowHeight) {
        break;
      }
    }
    if (row.length) rows.push(row);
  }
  return rows;
}

function getPortfolioGridContentWidth(grid) {
  const rect = grid.getBoundingClientRect();
  const styles = window.getComputedStyle(grid);
  const pl = parseFloat(styles.paddingLeft) || 0;
  const pr = parseFloat(styles.paddingRight) || 0;
  return Math.max(200, rect.width - pl - pr);
}

function renderJustifiedPortfolio(grid, tiles) {
  const visible = tiles.filter((t) => !t.classList.contains("is-hidden"));
  const isNarrowPhone = window.innerWidth <= 414;
  const gap = isNarrowPhone ? 10 : 16;
  const maxRowH = isNarrowPhone ? 240 : 320;
  const minRowH = isNarrowPhone ? 84 : 72;
  const W = getPortfolioGridContentWidth(grid);

  grid.textContent = "";
  if (!visible.length) return;

  const rows = packJustifiedRows(visible, W, gap, minRowH, maxRowH);

  rows.forEach((rowTiles) => {
    const rowEl = document.createElement("div");
    rowEl.className = "portfolio-row";
    rowEl.style.gap = `${gap}px`;
    const sumA = rowTiles.reduce((s, t) => s + parseFloat(t.dataset.aspect || 1), 0);
    const n = rowTiles.length;
    let h = (W - (n - 1) * gap) / sumA;
    if (h > maxRowH) h = maxRowH;

    rowTiles.forEach((tile) => {
      const a = parseFloat(tile.dataset.aspect || 1);
      const w = h * a;
      // Floor values to prevent 1px cumulative overflow on narrow screens.
      tile.style.width = `${Math.floor(w)}px`;
      tile.style.height = `${Math.floor(h)}px`;
      tile.style.flexShrink = "0";
      rowEl.appendChild(tile);
    });

    const usedW = rowTiles.reduce((s, t) => {
      const a = parseFloat(t.dataset.aspect || 1);
      return s + h * a;
    }, 0) + (n - 1) * gap;
    if (usedW < W - 2) {
      rowEl.classList.add("portfolio-row--short");
    }
    grid.appendChild(rowEl);
  });
}

function prepareFullGalleryTile(tile) {
  tile.classList.add("full-gallery-tile");
  tile.classList.remove("full-gallery-tile--fullwidth");
  tile.style.width = "";
  tile.style.height = "";
  tile.style.flexShrink = "";
}

function appendTilesToFullGalleryGrid(gridEl, tileList) {
  tileList.forEach((tile) => {
    prepareFullGalleryTile(tile);
    gridEl.appendChild(tile);
  });
  // If odd count, let final image fill full row width to avoid empty half-gap.
  if (tileList.length % 2 === 1) {
    const lastTile = tileList[tileList.length - 1];
    lastTile?.classList.add("full-gallery-tile--fullwidth");
  }
}

function orderTilesByOrientation(tiles) {
  const landscapes = [];
  const portraits = [];
  tiles.forEach((tile) => {
    const aspect = parseFloat(tile.dataset.aspect || 1);
    if (aspect >= 1) landscapes.push(tile);
    else portraits.push(tile);
  });
  return [...landscapes, ...portraits];
}

function splitTilesByOrientation(tiles) {
  const landscapes = [];
  const portraits = [];
  tiles.forEach((tile) => {
    const aspect = parseFloat(tile.dataset.aspect || 1);
    if (aspect >= 1) landscapes.push(tile);
    else portraits.push(tile);
  });
  return { landscapes, portraits };
}

// Full-gallery helper: group visible tiles by leading filename number and render
// each numeric bucket as its own section, ordered 1 -> n.
// First row stays fixed size; extra rows use the same height. Expand is CSS-only (no re-layout).
function renderJustifiedPortfolioByNamePrefix(grid, tiles) {
  const visible = tiles.filter((t) => !t.classList.contains("is-hidden"));
  const isFullGalleryPage = document.body.classList.contains("page-full-gallery");
  const isNarrowPhone = window.innerWidth <= 414;
  const isMobileFullGallery = isFullGalleryPage && window.innerWidth <= 768;
  const gap = isNarrowPhone ? 10 : 16;

  grid.textContent = "";
  if (!visible.length) return;

  // Group tiles by numeric filename prefix.
  const groups = new Map();
  visible.forEach((tile) => {
    const label = tile.dataset.groupLabel || "other";
    const order = Number(tile.dataset.groupOrder || 9999);
    const existing = groups.get(label);
    if (existing) {
      existing.tiles.push(tile);
    } else {
      groups.set(label, { order, tiles: [tile] });
    }
  });

  const sorted = Array.from(groups.entries()).sort(([, a], [, b]) => a.order - b.order);

  sorted.forEach(([label, group]) => {
    // User requested number-based grouping only; keep non-numbered items out.
    if (label === "other") return;

    const section = document.createElement("section");
    section.className = "portfolio-date-group";

    const isExpanded = fullGalleryExpandedGroups.has(label);
    section.classList.add(isExpanded ? "portfolio-date-group--expanded" : "portfolio-date-group--collapsed");

    const headerRow = document.createElement("div");
    headerRow.className = "portfolio-date-header";
    const heading = document.createElement("h3");
    heading.className = "portfolio-date-heading";
    heading.textContent = fullGallerySectionTitles[label] || `Placeholder Heading ${label}_`;
    headerRow.appendChild(heading);

    const orientedTiles = orderTilesByOrientation(group.tiles);
    const { landscapes, portraits } = splitTilesByOrientation(orientedTiles);

    const rowsWrap = document.createElement("div");
    rowsWrap.className = "portfolio-date-rows";
    rowsWrap.style.setProperty("--portfolio-section-gap", `${gap}px`);
    const previewGrid = document.createElement("div");
    previewGrid.className = "portfolio-date-grid";

    const leadGroup = landscapes.length ? landscapes : portraits;
    const secondGroup = landscapes.length ? portraits : [];
    const firstPair = leadGroup.slice(0, 2);
    appendTilesToFullGalleryGrid(previewGrid, firstPair);
    rowsWrap.appendChild(previewGrid);

    if (isFullGalleryPage && orientedTiles.length > 2) {
      const chevronBtn = document.createElement("button");
      chevronBtn.type = "button";
      chevronBtn.className = "portfolio-date-chevron";
      chevronBtn.setAttribute("aria-expanded", String(isExpanded));
      chevronBtn.setAttribute("aria-label", isExpanded ? "Collapse section" : "Expand section");
      chevronBtn.textContent = isExpanded ? "▴" : "▾";

      const extraOuter = document.createElement("div");
      extraOuter.className = "portfolio-date-extra";
      if (isExpanded) {
        extraOuter.classList.add("portfolio-date-extra--open");
      }
      const extraInner = document.createElement("div");
      extraInner.className = "portfolio-date-extra-inner";
      const remainingLead = leadGroup.slice(firstPair.length);
      const extraLeadGrid = document.createElement("div");
      extraLeadGrid.className = "portfolio-date-grid";
      appendTilesToFullGalleryGrid(extraLeadGrid, remainingLead);

      if (extraLeadGrid.childElementCount > 0) {
        extraInner.appendChild(extraLeadGrid);
      }

      if (secondGroup.length > 0) {
        const extraSecondGrid = document.createElement("div");
        extraSecondGrid.className = "portfolio-date-grid";
        appendTilesToFullGalleryGrid(extraSecondGrid, secondGroup);
        extraInner.appendChild(extraSecondGrid);
      }
      extraOuter.appendChild(extraInner);
      rowsWrap.appendChild(extraOuter);

      chevronBtn.addEventListener("click", () => {
        const isOpen = extraOuter.classList.contains("portfolio-date-extra--open");
        if (isOpen) {
          fullGalleryExpandedGroups.delete(label);
          extraOuter.classList.remove("portfolio-date-extra--open");
          section.classList.remove("portfolio-date-group--expanded");
          section.classList.add("portfolio-date-group--collapsed");
          chevronBtn.setAttribute("aria-expanded", "false");
          chevronBtn.setAttribute("aria-label", "Expand section");
          chevronBtn.textContent = "▾";
        } else {
          fullGalleryExpandedGroups.add(label);
          extraOuter.classList.add("portfolio-date-extra--open");
          section.classList.remove("portfolio-date-group--collapsed");
          section.classList.add("portfolio-date-group--expanded");
          chevronBtn.setAttribute("aria-expanded", "true");
          chevronBtn.setAttribute("aria-label", "Collapse section");
          chevronBtn.textContent = "▴";
        }
      });

      headerRow.appendChild(chevronBtn);
    } else if (!isMobileFullGallery && orientedTiles.length > 2) {
      appendTilesToFullGalleryGrid(previewGrid, leadGroup.slice(firstPair.length));
      if (secondGroup.length > 0) {
        const secondGrid = document.createElement("div");
        secondGrid.className = "portfolio-date-grid";
        appendTilesToFullGalleryGrid(secondGrid, secondGroup);
        rowsWrap.appendChild(secondGrid);
      }
    }

    section.appendChild(headerRow);
    section.appendChild(rowsWrap);
    grid.appendChild(section);
  });
}

function setupGridGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;
  const isFullGalleryPage = document.body.classList.contains("page-full-gallery");
  const sourceItems = isFullGalleryPage ? fullGalleryNumberedItems : mediaItems;
  activeGalleryItems = sourceItems;
  const fragment = document.createDocumentFragment();
  sourceItems.forEach((item, idx) => fragment.appendChild(createGridTile(item, idx)));
  grid.appendChild(fragment);

  const tiles = Array.from(grid.querySelectorAll(".media-item"));
  const metaEl = document.getElementById("portfolio-meta");
  const filterButtons = Array.from(document.querySelectorAll(".portfolio-filter[data-filter]"));
  const MAX_COLLAPSED_ITEMS = 12;
  let currentFilter = "all";
  const groupByNamePrefix = isFullGalleryPage;

  let toggleWrap = null;
  let toggleBtn = null;
  if (!isFullGalleryPage) {
    toggleWrap = document.createElement("div");
    toggleWrap.className = "portfolio-toggle";
    toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "portfolio-toggle__button";
    toggleBtn.textContent = "View full gallery";
    toggleWrap.appendChild(toggleBtn);
    grid.insertAdjacentElement("afterend", toggleWrap);
  }

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
          { rootMargin: "420px 0px 420px 0px", threshold: 0.01 }
        )
      : null;

  function applyFilter(filterValue) {
    currentFilter = filterValue;
    tiles.forEach((tile) => {
      const kind = tile.dataset.kind || "stills";
      const show =
        filterValue === "all" ||
        (filterValue === "stills" && kind === "stills") ||
        (filterValue === "video" && kind === "video");
      tile.classList.toggle("is-hidden", !show);
      tile.classList.remove("is-collapsed-hidden");
      if (!show) tile.querySelector("video")?.pause();
    });

    const matchingTiles = tiles.filter((t) => !t.classList.contains("is-hidden"));
    matchingTiles.forEach((tile, idx) => {
      const shouldHideForCollapse = !isFullGalleryPage && idx >= MAX_COLLAPSED_ITEMS;
      tile.classList.toggle("is-collapsed-hidden", shouldHideForCollapse);
      if (shouldHideForCollapse) tile.querySelector("video")?.pause();
    });

    if (!isFullGalleryPage && toggleWrap && toggleBtn) {
      const hasOverflow = matchingTiles.length > MAX_COLLAPSED_ITEMS;
      toggleWrap.classList.toggle("is-hidden", !hasOverflow);
      if (hasOverflow) {
        toggleBtn.textContent = "View full gallery";
      }
    }

    if (metaEl) {
      metaEl.textContent = `${matchingTiles.length} works`;
    }
    if (groupByNamePrefix) {
      renderJustifiedPortfolioByNamePrefix(grid, tiles);
    } else {
      renderJustifiedPortfolio(grid, tiles);
    }
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      applyFilter(btn.dataset.filter || "all");
    });
  });

  toggleBtn?.addEventListener("click", () => {
    const target = new URL("full-gallery.html", window.location.href);
    if (currentFilter && currentFilter !== "all") {
      target.searchParams.set("filter", currentFilter);
    }
    window.location.href = target.toString();
  });

  let resizeTimer;
  let lastGalleryWidth = window.innerWidth;
  function onResizeGallery() {
    const nextWidth = window.innerWidth;
    // Mobile browser chrome show/hide emits resize during scroll.
    // Re-layout only when width meaningfully changes.
    if (Math.abs(nextWidth - lastGalleryWidth) < 2) return;
    lastGalleryWidth = nextWidth;
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (groupByNamePrefix) {
        renderJustifiedPortfolioByNamePrefix(grid, tiles);
      } else {
        renderJustifiedPortfolio(grid, tiles);
      }
    }, 120);
  }
  window.addEventListener("resize", onResizeGallery);

  const requestedFilter = new URLSearchParams(window.location.search).get("filter");
  const initialFilter =
    requestedFilter === "stills" || requestedFilter === "video" ? requestedFilter : "all";
  const initialBtn = filterButtons.find((b) => (b.dataset.filter || "all") === initialFilter);
  if (initialBtn) {
    filterButtons.forEach((b) => b.classList.remove("is-active"));
    initialBtn.classList.add("is-active");
  }

  // Render immediately with available/fallback dimensions so gallery appears at once.
  tiles.forEach((t) => {
    const { nw, nh } = readTileNaturalSize(t);
    t.dataset.aspect = String(nw / nh);
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => applyFilter(initialFilter));
  });

  // Refine layout once intrinsic media dimensions are ready.
  Promise.all(tiles.map((t) => waitForTileDimensions(t))).then(() => {
    let needsRerender = false;
    tiles.forEach((t) => {
      const prevAspect = Number(t.dataset.aspect || 0);
      const { nw, nh } = readTileNaturalSize(t);
      const nextAspect = nw / nh;
      t.dataset.aspect = String(nextAspect);
      if (!Number.isFinite(prevAspect) || Math.abs(prevAspect - nextAspect) > 0.02) {
        needsRerender = true;
      }
    });
    if (!needsRerender) return;
    requestAnimationFrame(() => {
      if (groupByNamePrefix) {
        renderJustifiedPortfolioByNamePrefix(grid, tiles);
      } else {
        renderJustifiedPortfolio(grid, tiles);
      }
    });
  });

  if (io) tiles.forEach((tile) => io.observe(tile));
}

/** Pixels from viewport top where section content should align (fixed bar + small gap). */
function getFixedHeaderScrollOffset() {
  const bar = document.querySelector(".gallery-bar");
  const h = bar?.getBoundingClientRect().height ?? 0;
  const fallback = window.innerWidth <= 768 ? 104 : 128;
  return (h > 0 ? h : fallback) + 16;
}

function getPageScrollTop() {
  // Must match `getOnePageScrollRoot`: `body.scrollTop ?? …` is wrong when the
  // document scrolls on `document.scrollingElement` but `body.scrollTop` stays 0,
  // which makes scroll-spy + in-page math oscillate while scrolling.
  const body = document.body;
  const se = document.scrollingElement;
  if (body && body.scrollHeight > body.clientHeight) return body.scrollTop;
  if (se && se.scrollHeight > se.clientHeight) return se.scrollTop;
  return window.scrollY ?? document.documentElement?.scrollTop ?? 0;
}

/** Actual scroll container for the one-page layout (usually `body`). */
function getOnePageScrollRoot() {
  const body = document.body;
  const se = document.scrollingElement;
  if (body && body.scrollHeight > body.clientHeight) return body;
  if (se && se.scrollHeight > se.clientHeight) return se;
  return body || se || document.documentElement;
}

function setupMenuAndSections() {
  const isFullGalleryPage = document.body.classList.contains("page-full-gallery");
  const titleEl = document.getElementById("section-title");
  const menuContainer = document.getElementById("gallery-bar-menu");
  const menuLinks = Array.from(document.querySelectorAll(".gallery-bar__menu-link[href^='#']"));
  const sections = Array.from(document.querySelectorAll(".onepage-section"));

  /** After menu-driven in-page jumps, ignore scroll-spy briefly so it doesn’t fight smooth scroll. */
  let ignoreSpyUntil = 0;

  function clearBrandWidthMorph() {
    if (menuContainer) {
      menuContainer.style.removeProperty("width");
      menuContainer.style.removeProperty("transition");
    }
  }

  /** @param {string} label */
  function setActiveSection(label) {
    if (!titleEl) return;
    if (!label) return;
    if (titleEl.dataset.sectionLabel === label) return;

    clearBrandWidthMorph();

    const resolvedLabel =
      isFullGalleryPage && label === "gallery" ? "full gallery" : label;

    titleEl.textContent = resolvedLabel;
    titleEl.dataset.sectionLabel = label;
    menuLinks.forEach((link) => {
      const linkLabel = (link.textContent || "").trim().toLowerCase();
      link.classList.toggle("is-hidden", linkLabel === label);
    });
  }

  let closeGalleryMenu = () => {};
  if (typeof window.setupGalleryBarMenu === "function") {
    const menuApi = window.setupGalleryBarMenu();
    closeGalleryMenu = (opts) => menuApi.closeMenu(opts);
  }

  // Scroll spy state (also synced from menu clicks so it never fights `scrollIntoView`).
  let spyActiveIndex = 0;
  let spyInitialized = false;
  const SPY_HYSTERESIS_PX = 56;

  function updateActiveSectionFromScroll() {
    if (!sections.length) return;
    if (typeof performance !== "undefined" && performance.now() < ignoreSpyUntil) return;

    const scrollY = getPageScrollTop();
    const tops = sections.map((s) => s.getBoundingClientRect().top + scrollY);
    const probe = scrollY + getFixedHeaderScrollOffset();

    let raw = 0;
    for (let i = 0; i < sections.length; i += 1) {
      if (tops[i] <= probe) raw = i;
    }

    if (!spyInitialized) {
      spyActiveIndex = raw;
      spyInitialized = true;
    } else if (raw > spyActiveIndex) {
      spyActiveIndex = raw;
    } else if (raw < spyActiveIndex) {
      if (probe < tops[spyActiveIndex] - SPY_HYSTERESIS_PX) {
        spyActiveIndex = raw;
      }
    }

    const active = sections[spyActiveIndex];
    const label = active.dataset?.sectionLabel;
    if (label) setActiveSection(label);
  }

  function scrollToSectionWithOffset(target) {
    if (!target) return;
    const root = getOnePageScrollRoot();
    const currentTop = getPageScrollTop();
    const targetTop = target.getBoundingClientRect().top + currentTop;
    // Menu clicks were landing ~1in too high; reduce the header offset for nav jumps.
    const offset = Math.max(0, getFixedHeaderScrollOffset() - 96);
    const destination = Math.max(0, targetTop - offset);
    const instant = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (root === document.body || root === document.documentElement) {
      window.scrollTo({ top: destination, behavior: instant ? "auto" : "smooth" });
      return;
    }
    root.scrollTo({ top: destination, behavior: instant ? "auto" : "smooth" });
  }

  menuLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      const navLabel =
        target?.dataset?.sectionLabel ??
        target?.closest?.(".onepage-section")?.dataset?.sectionLabel;
      closeGalleryMenu({ instant: true });
      if (navLabel) {
        ignoreSpyUntil = performance.now() + 1100;
        setActiveSection(navLabel);
        const idx = sections.findIndex((s) => s.dataset.sectionLabel === navLabel);
        if (idx >= 0) {
          spyActiveIndex = idx;
          spyInitialized = true;
        }
      }
      if (target) {
        window.requestAnimationFrame(() => scrollToSectionWithOffset(target));
      }
    });
  });

  // Scroll spy: keep the menu title aligned with whichever section has crossed
  // the header line (more reliable than a single IntersectionObserver threshold).
  let scrollSpyTicking = false;
  function onScrollSpy() {
    if (scrollSpyTicking) return;
    scrollSpyTicking = true;
    requestAnimationFrame(() => {
      scrollSpyTicking = false;
      updateActiveSectionFromScroll();
    });
  }

  const scrollRoot = getOnePageScrollRoot();
  scrollRoot.addEventListener("scroll", onScrollSpy, { passive: true });
  if (scrollRoot !== window) {
    window.addEventListener("scroll", onScrollSpy, { passive: true });
  }
  function onResizeSections() {
    clearBrandWidthMorph();
    spyInitialized = false;
    updateActiveSectionFromScroll();
  }

  window.addEventListener("resize", onResizeSections);
  updateActiveSectionFromScroll();
}

function setupContactBackgroundCrossfade() {
  // Contact page crossfade background slideshow.
  const bgA = document.querySelector(".contact-bg__layer--a");
  const bgB = document.querySelector(".contact-bg__layer--b");
  if (!bgA || !bgB) return;

  const bgImages = [
    "DSC_0166-2.webp",
    "DSC_0173.webp",
    "DSC_0104.webp",
    "DSC_0179.webp",
    "DSC_0128-2.webp",
    "DSC_0168.webp",
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

function setupHireAvailabilityPill() {
  const isFullGalleryPage = document.body.classList.contains("page-full-gallery");
  if (isFullGalleryPage) return;
  const hash = (window.location.hash || "").toLowerCase();
  if (hash === "#contact-section" || hash === "#contact-heading") return;

  const contactTarget = document.getElementById("contact-heading");
  if (!contactTarget) return;

  const cta = document.createElement("div");
  cta.className = "hire-pill-cta";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "hire-pill-cta__close";
  closeBtn.setAttribute("aria-label", "Dismiss");
  closeBtn.textContent = "✕";

  const actionBtn = document.createElement("button");
  actionBtn.type = "button";
  actionBtn.className = "hire-pill-cta__action";
  actionBtn.setAttribute("aria-label", "Go to contact section");
  actionBtn.innerHTML =
    'Zach is available for hire. <span class="hire-pill-cta__link">Send Inquiry!</span>';

  function scrollToContact() {
    const instant = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    contactTarget.scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "start" });
  }

  actionBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    cta.classList.add("hire-pill-cta--dismissed");
    scrollToContact();
  });
  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    cta.classList.add("hire-pill-cta--dismissed");
  });

  cta.appendChild(closeBtn);
  cta.appendChild(actionBtn);
  document.body.appendChild(cta);

  let shown = false;
  let lastTop = getPageScrollTop();

  function maybeShow() {
    if (shown) return;
    if (cta.classList.contains("hire-pill-cta--dismissed")) return;
    const top = getPageScrollTop();
    const delta = top - lastTop;
    lastTop = top;
    if (top >= 18 && delta > 0) {
      shown = true;
      // Next frame: allow CSS transition to run.
      requestAnimationFrame(() => cta.classList.add("is-visible"));
      window.removeEventListener("scroll", maybeShow);
    }
  }

  // Listen on `window`: when `body` is not the scroll container, `body` scroll events never fire.
  window.addEventListener("scroll", maybeShow, { passive: true });
}

function setupCenterTitleScrollFade() {
  const centerTitle = document.querySelector(".page-center-title");
  if (!centerTitle) return;

  let lastTop = getPageScrollTop();
  let ticking = false;
  const deltaThreshold = 2;

  function update() {
    ticking = false;
    const top = getPageScrollTop();
    const delta = top - lastTop;
    lastTop = top;

    if (top <= 8) {
      centerTitle.classList.remove("page-center-title--hidden");
      return;
    }

    if (delta > deltaThreshold) {
      centerTitle.classList.add("page-center-title--hidden");
    } else if (delta < -deltaThreshold) {
      centerTitle.classList.remove("page-center-title--hidden");
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
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
  flowGallery?.addEventListener("mouseleave", () => {
    magneticCursorX = null;
    magneticCursorY = null;
    magneticCursorItem = null;
    galleryRowsState?.forEach((row) =>
      row.items.forEach((itemState) => itemState.element.style.setProperty("--scale", "1"))
    );
  });

  let resizeTimeout;
  let lastMeasuredWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    const nextWidth = window.innerWidth;
    // Mobile browsers fire `resize` while scrolling as chrome collapses/expands.
    // Re-measure only when width truly changes to avoid visible flow jumps.
    if (Math.abs(nextWidth - lastMeasuredWidth) < 2) return;
    lastMeasuredWidth = nextWidth;
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => measureAndPosition(rowsState), 150);
  });

  setupGridGallery();
  setupScrollReveal();
  setupMenuAndSections();
  setupContactBackgroundCrossfade();
  setupContactForm();
  setupHireAvailabilityPill();
  setupCenterTitleScrollFade();
});

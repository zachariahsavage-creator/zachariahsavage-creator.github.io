// Moving two-row gallery: calm, continuous left-to-right loop

/** Tile width in px; must match CSS `--flow-item-width` on `.media-item`. */
function getFlowItemWidth() {
  const w = window.innerWidth;
  if (w <= 420) return Math.min(200, Math.round(w * 0.72));
  if (w <= 768) return Math.min(248, Math.round(w * 0.58));
  return 288; // 338 * 0.85
}

const mediaItems = [
  // Mix stills and motion so video is spread through the flow.
  "Assets/optimized/14.webp",
  "Assets/optimized/4.webp",
  "Assets/optimized/6_0801.webp",
  "Assets/optimized/6_1589.webp",
  "Assets/optimized/6_1781 (1).webp",
  "Assets/optimized/5_2065.webp",
  "Assets/optimized/5_2094.webp",
  "Assets/optimized/6_2355 (1).webp",
  "Assets/optimized/6_2390 (1).webp",
  "Assets/optimized/6_2420 (1).webp",
  "Assets/optimized/5_2575.webp",
  "Assets/optimized/6_2582(1).webp",
  "Assets/optimized/6_2584 (1).webp",
  "Assets/optimized/6_2967.webp",
  "Assets/optimized/6_3060.webp",
  "Assets/optimized/6_3087.webp",
  "Assets/optimized/5_3353.webp",
  "Assets/optimized/5_4391.webp",
  "Assets/optimized/6_4623.webp",
  "Assets/optimized/6_4773.webp",
  "Assets/optimized/6_4821.webp",
  "Assets/optimized/6_4835.webp",
  "Assets/optimized/6_5838_1.webp",
  "Assets/optimized/6_6086_1(1).webp",
  "Assets/optimized/6_6172_1.webp",
  "Assets/optimized/6_6215_1.webp",
  "Assets/optimized/DSC_8186.webp",
  "Assets/optimized/4_5325.webp",
  "Assets/optimized/4_5573.webp",
  "Assets/optimized/4_5983 (1).webp",
  "Assets/optimized/4_7165.webp",
  "Assets/optimized/4_7270.webp",
];

const ROW_IDS = ["row-top", "row-bottom"];

let lightbox;
let lightboxImage;
let lightboxVideo;
let lightboxCloseBtn;
let lightboxPrevBtn;
let lightboxNextBtn;
let lightboxCurrentIndex = null;
let isMorphingToLightbox = false;

// Row state reference for magnetic cursor scaling.
let galleryRowsState = null;
let magneticCursorX = null;
let magneticCursorY = null;
let magneticCursorItem = null;

const MAX_HOVER_SCALE = 1.18;
const MAX_NEIGHBOR_SCALE = 1.16; // cap for images not directly under cursor
// Slightly tighter radius so tiles react more strongly
// as the cursor approaches them.
const MAGNETIC_RADIUS_PX = 320;

function applyMagneticScale() {
  if (!galleryRowsState || magneticCursorX === null || magneticCursorY === null) {
    return;
  }

  // Re-evaluate which tile is actually under the cursor on every frame,
  // so if the flow carries images away, the new tile beneath the cursor
  // becomes the one that is allowed to hit full scale.
  const elementAtCursor = document.elementFromPoint(
    magneticCursorX,
    magneticCursorY
  );
  magneticCursorItem = elementAtCursor?.closest(".media-item") || null;

  const radius = MAGNETIC_RADIUS_PX;

  galleryRowsState.forEach((rowState) => {
    if (!rowState) return;

    rowState.items.forEach((itemState) => {
      const rect = itemState.element.getBoundingClientRect();

      // If the cursor is directly over this image, force max scale
      // regardless of where within the tile it is.
      const isUnderCursor = itemState.element === magneticCursorItem;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = centerX - magneticCursorX;
      const dy = centerY - magneticCursorY;
      const dist = isUnderCursor ? 0 : Math.hypot(dx, dy);
      const t = Math.min(dist / radius, 1); // 0 (close) → 1 (far)
      const influence = 1 - t;
      let scale =
        1 + (MAX_HOVER_SCALE - 1) * influence * influence; // smooth radial falloff

      // Only the image directly under the cursor is allowed to reach
      // the full pop-out size; others are capped slightly below so
      // they never look identical in size.
      if (!isUnderCursor && scale > MAX_NEIGHBOR_SCALE) {
        scale = MAX_NEIGHBOR_SCALE;
      }
      itemState.element.style.setProperty("--scale", scale.toFixed(3));
      // Baseline stacking so tiles are above background.
      itemState.element.style.zIndex = "3";
    });
  });

  // Ensure the tile directly under the cursor always sits on top
  // of every other tile in both rows.
  if (magneticCursorItem) {
    magneticCursorItem.style.zIndex = "10";
  }
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

  // Compute intrinsic aspect ratio when possible for a cleaner morph.
  let intrinsicAspect = null;
  const innerMedia = wrapper.querySelector("img, video");
  if (innerMedia && innerMedia.tagName === "IMG" && innerMedia.naturalWidth && innerMedia.naturalHeight) {
    intrinsicAspect = innerMedia.naturalWidth / innerMedia.naturalHeight;
  } else if (innerMedia && innerMedia.tagName === "VIDEO") {
    const videoEl = /** @type {HTMLVideoElement} */ (innerMedia);
    if (videoEl.videoWidth && videoEl.videoHeight) {
      intrinsicAspect = videoEl.videoWidth / videoEl.videoHeight;
    }
  }

  const aspect = intrinsicAspect || rect.width / rect.height || 1;

  // Compute target size and position (centered, within viewport)
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

  // Animate via width/height/position
  const durationMs = 420;
  morph.style.transition = `left ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    top ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    width ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    height ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    border-radius ${durationMs}ms linear`;

  // Force layout so transitions apply
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
  const nextIndex = (lightboxCurrentIndex + delta + total) % total;
  openLightboxFromIndex(nextIndex);
}

function attachHoverAndClickBehavior(wrapper, mediaIndex) {
  let hoverTimeoutId = null;

  wrapper.addEventListener("mouseenter", () => {
    // Magnetic effect: on each enter, make this the main tile and its
    // immediate siblings the secondary tiles in one atomic step.
    const row = wrapper.parentElement;
    if (row) {
      const siblings = Array.from(row.querySelectorAll(".media-item"));
      const index = siblings.indexOf(wrapper);

      siblings.forEach((el, i) => {
        el.classList.remove("media-item--hovered", "media-item--neighbor");
        if (i === index) {
          el.classList.add("media-item--hovered");
        } else if (i === index - 1 || i === index + 1) {
          el.classList.add("media-item--neighbor");
        }
      });
    }

    hoverTimeoutId = window.setTimeout(() => {
      const items = Array.from(document.querySelectorAll(".media-item"));
      const epicenter = wrapper;

      const hasTriggeredWave = document.body.dataset.colorShockwave === "true";
      const epicenterAlreadyRevealed = epicenter.classList.contains("media-item--revealed");

      // First hover of any image triggers the color shockwave cascade.
      if (!hasTriggeredWave && !epicenterAlreadyRevealed) {
        document.body.dataset.colorShockwave = "true";

        const rect0 = epicenter.getBoundingClientRect();
        const x0 = rect0.left + rect0.width / 2;
        const y0 = rect0.top + rect0.height / 2;

        // Also trigger background color shockwave from this point.
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
      } else {
        // After the first wave, hovering simply reveals the hovered image.
        epicenter.classList.add("media-item--revealed");
      }
    }, 50);
  });

  wrapper.addEventListener("mouseleave", () => {
    if (hoverTimeoutId !== null) {
      clearTimeout(hoverTimeoutId);
      hoverTimeoutId = null;
    }
  });
}

function createMediaElement(item, mediaIndex) {
  const wrapper = document.createElement("div");
  wrapper.className = "media-item";
  if (typeof mediaIndex === "number") {
    wrapper.dataset.mediaIndex = String(mediaIndex);
  }

  if (typeof item === "string") {
    const img = document.createElement("img");
    img.src = item;
    img.alt = "";
    wrapper.appendChild(img);
  } else if (item.type === "video") {
    const video = document.createElement("video");
    video.src = item.src;
    video.muted = true;
    video.autoplay = true;
    video.loop = true; // rely on native looping
    video.playsInline = true;
    video.preload = "auto";

    const isGifLike = typeof item.src === "string" && item.src.includes("GIF");

    if (isGifLike) {
      // Keep a solid black card behind GIF-style MP4s so if the
      // player ever briefly lacks a frame at the loop boundary,
      // the viewer sees black instead of a transparent gap.
      wrapper.classList.add("media-item--gif");
    }

    wrapper.appendChild(video);
  }

  attachHoverAndClickBehavior(wrapper, mediaIndex);

  wrapper.addEventListener("click", () => {
    if (typeof mediaIndex !== "number") return;
    if (isMorphingToLightbox) return;

    const item = mediaItems[mediaIndex];
    if (!item) {
      openLightboxFromIndex(mediaIndex);
      return;
    }

    isMorphingToLightbox = true;

    const { morph, durationMs } = createMorphLayerFromWrapper(wrapper, item);

    window.setTimeout(() => {
      morph.remove();
      openLightboxFromIndex(mediaIndex);
      isMorphingToLightbox = false;
    }, durationMs + 40);
  });

  return wrapper;
}

function setupRows() {
  const rowsState = [];

  ROW_IDS.forEach((id, index) => {
    const rowElement = document.getElementById(id);
    if (!rowElement) return;

    const itemsForRow = mediaItems
      .map((item, mediaIndex) => ({ item, mediaIndex }))
      .filter(({ mediaIndex }) =>
        index === 0 ? mediaIndex % 2 === 0 : mediaIndex % 2 === 1
      );

    const stateForRow = [];

    itemsForRow.forEach(({ item, mediaIndex }) => {
      const el = createMediaElement(item, mediaIndex);
      rowElement.appendChild(el);
      el.style.opacity = "0";

      stateForRow.push({
        element: el,
        x: 0,
        width: 0,
      });
    });

    rowsState.push({
      rowElement,
      items: stateForRow,
    });
  });

  return rowsState;
}

function measureAndPosition(rowsState) {
  const viewportWidth = window.innerWidth;
  const spacing = 10;
  const itemW = getFlowItemWidth();
  document.documentElement.style.setProperty("--flow-item-width", `${itemW}px`);

  rowsState.forEach((rowState, rowIndex) => {
    if (!rowState) return;

    let currentX = -viewportWidth; // start slightly off-screen to the left

    // First position the base set of items with fixed width so there
    // are no unexpected gaps due to different intrinsic sizes.
    rowState.items.forEach((itemState) => {
      itemState.width = itemW;
      itemState.x = currentX;
      itemState.element.style.setProperty("--x", `${itemState.x}px`);
      itemState.element.style.opacity = "1";

      currentX += itemW + spacing;
    });

    // If the total width is shorter than the viewport, duplicate items
    // so that we always cover the screen plus at least one extra
    // full sequence, but stagger the start index of each extra
    // sequence so that the same asset never appears again within
    // ~10 items horizontally.
    const originalCount = rowState.items.length;
    if (originalCount > 0) {
      const baseCount = originalCount;
      const sequenceWidth = baseCount * (itemW + spacing);
      const baseItems = rowState.items.slice(0, baseCount);
      let sequenceOffset = 0;
      let lastRight =
        rowState.items[rowState.items.length - 1].x + itemW;
      const targetRight = viewportWidth + sequenceWidth; // at least one extra full sequence

      while (lastRight < targetRight) {
        // Shift the start index of each new sequence by 10 so
        // identical assets are pushed well apart visually.
        sequenceOffset = (sequenceOffset + 10) % baseCount;

        for (let i = 0; i < baseCount && lastRight < targetRight; i++) {
          const base = baseItems[(i + sequenceOffset) % baseCount];
          const cloneEl = base.element.cloneNode(true);
          rowState.rowElement.appendChild(cloneEl);
          // Ensure hover + click (lightbox) behavior is active on clones.
          const mediaIndex = Number(base.element.dataset.mediaIndex);
          attachHoverAndClickBehavior(cloneEl, mediaIndex);
          if (!Number.isNaN(mediaIndex)) {
            cloneEl.dataset.mediaIndex = String(mediaIndex);
            cloneEl.addEventListener("click", () => {
              openLightboxFromIndex(mediaIndex);
            });
          }

          const cloneState = {
            element: cloneEl,
            x: currentX,
            width: itemW,
          };

          cloneEl.style.opacity = "1";
          cloneEl.style.setProperty("--x", `${cloneState.x}px`);

          rowState.items.push(cloneState);

          currentX += itemW + spacing;
          lastRight = cloneState.x + itemW;
        }
      }
    }
  });
}

function startAnimation(rowsState) {
  let lastTime = performance.now();
  const baseSpeeds = [24, 30]; // px / second
  let flowDirection = 1; // 1 = right, -1 = left
  let flowMultiplier = 1; // 1x normally, 7.5x while holding arrows

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

  // Swap meanings: right arrow behaves like old left (flows left),
  // left arrow behaves like old right (flows right).
  bindHold(leftBtn, 1);
  bindHold(rightBtn, -1);

  // Keyboard arrows mimic the side arrow buttons when the lightbox is closed.
  window.addEventListener("keydown", (event) => {
    if (lightbox && lightbox.getAttribute("data-state") === "open") return;
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
    if (lightbox && lightbox.getAttribute("data-state") === "open") return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      flowMultiplier = 1;
    }
  });

  function step(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    const viewportWidth = window.innerWidth;
    const itemW = getFlowItemWidth();
    const wrapRightThreshold = viewportWidth + itemW;
    const wrapLeftThreshold = -itemW;

    rowsState.forEach((rowState, rowIndex) => {
      if (!rowState) return;
      const speed = (baseSpeeds[rowIndex] || baseSpeeds[0]) * flowMultiplier * flowDirection;

      // Find bounds for wrapping in either direction.
      let minLeft = Infinity;
      let maxRight = -Infinity;
      rowState.items.forEach((itemState) => {
        if (itemState.x < minLeft) minLeft = itemState.x;
        const right = itemState.x + itemState.width;
        if (right > maxRight) maxRight = right;
      });

      rowState.items.forEach((itemState) => {
        itemState.x += speed * dt;
        const leftEdge = itemState.x;

        // Wrap seamlessly in either direction.
        if (speed > 0 && leftEdge > wrapRightThreshold) {
          const newLeft = minLeft - itemState.width - 10;
          itemState.x = newLeft;
          minLeft = newLeft; // this is now the new furthest‑left tile
          const el = itemState.element;
          el.classList.add("media-item--teleport");
          el.style.setProperty("--x", `${itemState.x}px`);
          requestAnimationFrame(() => {
            el.classList.remove("media-item--teleport");
          });
        } else if (speed < 0 && itemState.x + itemState.width < wrapLeftThreshold) {
          const newLeft = maxRight + 10;
          itemState.x = newLeft;
          maxRight = newLeft + itemState.width;
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

    // Keep magnetic scaling in sync even when the cursor is stationary
    // while the flow moves the rows.
    if (magneticCursorX !== null && magneticCursorY !== null) {
      applyMagneticScale();
    }

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

window.addEventListener("load", () => {
  const rowsState = setupRows();
  galleryRowsState = rowsState;

  setTimeout(() => {
    measureAndPosition(rowsState);
    startAnimation(rowsState);
  }, 60);

  // Lightbox wiring
  lightbox = document.querySelector(".lightbox");
  lightboxImage = document.querySelector(".lightbox__image");
  lightboxVideo = document.querySelector(".lightbox__video");
  lightboxCloseBtn = document.querySelector(".lightbox__close");
  lightboxPrevBtn = document.querySelector(".lightbox__arrow--prev");
  lightboxNextBtn = document.querySelector(".lightbox__arrow--next");

  lightboxCloseBtn?.addEventListener("click", () => closeLightbox());
  lightboxPrevBtn?.addEventListener("click", () => changeLightboxBy(-1));
  lightboxNextBtn?.addEventListener("click", () => changeLightboxBy(1));

  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target === document.querySelector(".lightbox__backdrop")) {
      closeLightbox();
    }
  });

  // Magnetic cursor scaling over gallery tiles.
  const galleryEl = document.querySelector(".gallery");
  if (galleryEl) {
    galleryEl.addEventListener("mousemove", (event) => {
      magneticCursorItem = event.target.closest(".media-item") || null;
      magneticCursorX = event.clientX;
      magneticCursorY = event.clientY;
      applyMagneticScale();
    });

    galleryEl.addEventListener("mouseleave", () => {
      magneticCursorX = null;
      magneticCursorY = null;
      magneticCursorItem = null;
      if (!galleryRowsState) return;
      galleryRowsState.forEach((rowState) => {
        if (!rowState) return;
        rowState.items.forEach((itemState) => {
          itemState.element.style.setProperty("--scale", "1");
        });
      });
    });
  }

  if (typeof window.setupGalleryBarMenu === "function") {
    window.setupGalleryBarMenu();
  }

  window.addEventListener("keydown", (event) => {
    if (!lightbox || lightbox.getAttribute("data-state") !== "open") return;
    if (event.key === "Escape") {
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      changeLightboxBy(-1);
    } else if (event.key === "ArrowRight") {
      changeLightboxBy(1);
    }
  });

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      measureAndPosition(rowsState);
    }, 150);
  });
});


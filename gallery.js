// Classic portfolio gallery (thumbnail grid + lightbox)

const mediaItems = [
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

let lightbox;
let lightboxImage;
let lightboxVideo;
let lightboxCloseBtn;
let lightboxPrevBtn;
let lightboxNextBtn;
let lightboxCurrentIndex = null;
let isMorphingToLightbox = false;

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
  if (
    innerMedia &&
    innerMedia.tagName === "IMG" &&
    innerMedia.naturalWidth &&
    innerMedia.naturalHeight
  ) {
    intrinsicAspect = innerMedia.naturalWidth / innerMedia.naturalHeight;
  } else if (innerMedia && innerMedia.tagName === "VIDEO") {
    const videoEl = /** @type {HTMLVideoElement} */ (innerMedia);
    if (videoEl.videoWidth && videoEl.videoHeight) {
      intrinsicAspect = videoEl.videoWidth / videoEl.videoHeight;
    }
  }

  const aspect = intrinsicAspect || rect.width / rect.height || 1;

  // Centered target size.
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

  // Force layout so transitions apply.
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

  // Pause background tile videos so the lightbox stays the only motion.
  document.querySelectorAll(".portfolio-grid video").forEach((v) => {
    try {
      v.pause();
    } catch (e) {}
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

  // Small accessibility improvement: move focus to the close button.
  lightboxCloseBtn?.focus?.();
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

function createMediaTile(item, mediaIndex) {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "media-item portfolio-tile";
  tile.dataset.mediaIndex = String(mediaIndex);

  const kind = typeof item === "string" ? "stills" : "video";
  tile.dataset.kind = kind;
  tile.setAttribute("aria-label", `Open ${kind} ${mediaIndex + 1}`);

  if (typeof item === "string") {
    const img = document.createElement("img");
    img.src = item;
    img.alt = "";
    img.loading = "eager";
    // Hint to modern browsers to decode off main thread.
    img.decoding = "async";
    tile.appendChild(img);
  } else {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    // Lazy-load the video src so the gallery doesn't fetch every clip up-front.
    video.preload = "metadata";
    video.dataset.src = item.src;
    // Video playback is driven by IntersectionObserver (no hover needed).
    video.pause();
    tile.appendChild(video);
  }

  tile.addEventListener("click", () => {
    if (typeof mediaIndex !== "number") return;
    if (isMorphingToLightbox) return;

    const currentItem = mediaItems[mediaIndex];
    if (!currentItem) return;

    isMorphingToLightbox = true;
    const { morph, durationMs } = createMorphLayerFromWrapper(tile, currentItem);

    window.setTimeout(() => {
      morph.remove();
      openLightboxFromIndex(mediaIndex);
      isMorphingToLightbox = false;
    }, durationMs + 40);
  });

  return tile;
}

function setupGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  const fragment = document.createDocumentFragment();
  mediaItems.forEach((item, mediaIndex) => {
    fragment.appendChild(createMediaTile(item, mediaIndex));
  });
  grid.appendChild(fragment);

  const tiles = Array.from(grid.querySelectorAll(".media-item"));
  const metaEl = document.getElementById("portfolio-meta");
  const filterButtons = Array.from(
    document.querySelectorAll(".portfolio-filter[data-filter]")
  );

  function tryPlayVideo(video) {
    // play() is best-effort; if it fails (not enough data yet), retry on readiness.
    const p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        video.addEventListener(
          "canplay",
          () => {
            video.play().catch(() => {});
          },
          { once: true }
        );
      });
    }
  }

  // Lazy-load videos only when tiles are about to enter the viewport.
  // This drastically reduces initial network + decode work.
  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const tile = entry.target;
              const video = tile.querySelector("video");
              if (!video) return;

              if (entry.isIntersecting) {
                if (!video.src && video.dataset.src) {
                  video.src = video.dataset.src;
                  video.load();
                }
                if (!isMorphingToLightbox) {
                  tryPlayVideo(video);
                }
              } else {
                video.pause();
              }
            });
          },
          {
            root: null,
            rootMargin: "300px 0px",
            threshold: 0.01,
          }
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

      if (!show) {
        const video = tile.querySelector("video");
        if (video) video.pause();
      }
    });

    if (metaEl) {
      const visibleCount = tiles.filter((t) => !t.classList.contains("is-hidden")).length;
      metaEl.textContent = `${visibleCount} works`;
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

  // Start intersection observation after initial render + filter application.
  if (io) {
    tiles.forEach((tile) => {
      if (tile.classList.contains("is-hidden")) return;
      io.observe(tile);
    });
  }
}

function setupMenu() {
  if (typeof window.setupGalleryBarMenu === "function") {
    window.setupGalleryBarMenu();
  }
}

window.addEventListener("load", () => {
  // Lightbox wiring.
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
    const backdrop = document.querySelector(".lightbox__backdrop");
    if (event.target === lightbox || event.target === backdrop) closeLightbox();
  });

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

  setupMenu();
  setupGallery();
});


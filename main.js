// --- GLOBAL DATA & LIGHTBOX STATE ---
const mediaItems =[
  "Assets/14.jpg", "Assets/4.jpg", { type: "video", src: "Assets/0.mp4" },
  "Assets/DSC_0801.jpg", "Assets/DSC_1589.jpg", { type: "video", src: "Assets/GIF 1.mp4" },
  "Assets/DSC_1781 (1).jpg", "Assets/DSC_2065.jpg", { type: "video", src: "Assets/GIF 2.mp4" },
  "Assets/DSC_2094.jpg", "Assets/DSC_2355 (1).jpg", { type: "video", src: "Assets/GIF 3.mp4" },
  "Assets/DSC_2390 (1).jpg", "Assets/DSC_2420 (1).jpg", { type: "video", src: "Assets/GIF 4.mp4" },
  "Assets/DSC_2575.jpg", "Assets/DSC_2582(1).jpg", { type: "video", src: "Assets/My movie 29_1_1_1_1_1.mp4" },
  "Assets/DSC_2584 (1).jpg", "Assets/DSC_2967.jpg", { type: "video", src: "Assets/My movie 5_1_1_1.mp4" },
  "Assets/DSC_3060.jpg", "Assets/DSC_3087.jpg", { type: "video", src: "Assets/clip 1.mp4" },
  "Assets/DSC_3353.jpg", "Assets/DSC_4391.jpg", "Assets/DSC_4623.jpg",
  "Assets/DSC_4773.jpg", "Assets/DSC_4821.jpg", "Assets/DSC_4835.jpg",
  "Assets/DSC_5838_1.jpg", "Assets/DSC_6086_1(1).jpg", "Assets/DSC_6172_1.jpg",
  "Assets/DSC_6215_1.jpg", "Assets/DSC_8186.jpg", "Assets/DSC_5325.jpg",
  "Assets/DSC_5573.jpg", "Assets/DSC_5983 (1).jpg", "Assets/DSC_7165.jpg",
  "Assets/DSC_7270.jpg", { type: "video", src: "Assets/My movie 18_1_1_1_1.mp4" },
];

let lightbox, lightboxImage, lightboxVideo, lightboxCloseBtn, lightboxPrevBtn, lightboxNextBtn;
let lightboxCurrentIndex = null;
let isMorphingToLightbox = false;

// --- GLOBAL LIGHTBOX UTILS ---
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

  let intrinsicAspect = null;
  const innerMedia = wrapper.querySelector("img, video");
  if (innerMedia && innerMedia.tagName === "IMG" && innerMedia.naturalWidth && innerMedia.naturalHeight) {
    intrinsicAspect = innerMedia.naturalWidth / innerMedia.naturalHeight;
  } else if (innerMedia && innerMedia.tagName === "VIDEO" && innerMedia.videoWidth && innerMedia.videoHeight) {
    intrinsicAspect = innerMedia.videoWidth / innerMedia.videoHeight;
  }

  const aspect = intrinsicAspect || rect.width / rect.height || 1;
  const maxWidth = viewportWidth * 0.9;
  const maxHeight = viewportHeight * 0.9;
  let targetWidth = maxWidth;
  let targetHeight = targetWidth / aspect;
  
  if (targetHeight > maxHeight) {
    targetHeight = maxHeight;
    targetWidth = targetHeight * aspect;
  }

  const durationMs = 420;
  morph.style.transition = `left ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    top ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    width ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    height ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    border-radius ${durationMs}ms linear`;

  void morph.offsetWidth;

  morph.style.left = `${(viewportWidth - targetWidth) / 2}px`;
  morph.style.top = `${(viewportHeight - targetHeight) / 2}px`;
  morph.style.width = `${targetWidth}px`;
  morph.style.height = `${targetHeight}px`;
  morph.style.borderRadius = "1.1rem";

  return { morph, durationMs };
}

function openLightboxFromIndex(index) {
  if (!lightbox || !mediaItems[index]) return;
  document.querySelectorAll("video").forEach((v) => { if(!v.classList.contains("lightbox__video")) { try { v.pause(); } catch (e) {} } });
  
  lightboxCurrentIndex = index;
  lightbox.setAttribute("data-state", "open");
  document.documentElement.style.overflow = "hidden";

  if (typeof mediaItems[index] === "string") {
    lightboxVideo.pause(); lightboxVideo.removeAttribute("src"); lightboxVideo.removeAttribute("data-active");
    lightboxImage.src = mediaItems[index]; lightboxImage.setAttribute("data-active", "true");
  } else {
    lightboxImage.removeAttribute("src"); lightboxImage.removeAttribute("data-active");
    lightboxVideo.src = mediaItems[index].src; lightboxVideo.setAttribute("data-active", "true");
    lightboxVideo.play().catch(() => {});
  }
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.setAttribute("data-state", "closed");
  document.documentElement.style.overflow = "";
  lightboxCurrentIndex = null;
  if (lightboxVideo) { lightboxVideo.pause(); lightboxVideo.removeAttribute("src"); lightboxVideo.removeAttribute("data-active"); }
  if (lightboxImage) { lightboxImage.removeAttribute("src"); lightboxImage.removeAttribute("data-active"); }
}

function changeLightboxBy(delta) {
  if (lightboxCurrentIndex === null) return;
  openLightboxFromIndex((lightboxCurrentIndex + delta + mediaItems.length) % mediaItems.length);
}

// --- SETUP MENU & SCROLLING ---
function setupMenu() {
  const menuContainer = document.getElementById("gallery-bar-menu");
  const menuTrigger = document.querySelector(".gallery-bar__menu-trigger");
  const menuContent = document.querySelector(".gallery-bar__menu-content");
  const titleEl = document.querySelector(".gallery-bar__title");

  // Toggle dropdown logic
  menuTrigger.addEventListener("click", () => {
    const isOpen = menuContainer.classList.toggle("gallery-bar__brand--open");
    menuTrigger.setAttribute("aria-expanded", String(isOpen));
    menuContent.setAttribute("aria-hidden", String(!isOpen));
  });

  titleEl?.addEventListener("click", () => menuTrigger.click());

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (menuContainer.classList.contains("gallery-bar__brand--open") && !menuContainer.contains(e.target)) {
      menuContainer.classList.remove("gallery-bar__brand--open");
      menuTrigger.setAttribute("aria-expanded", "false");
      menuContent.setAttribute("aria-hidden", "true");
    }
  });

  // Smooth scroll and menu closing for anchor links
  document.querySelectorAll(".gallery-bar__menu-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetSection = document.getElementById(link.getAttribute("href").substring(1));
      
      if (targetSection) targetSection.scrollIntoView({ behavior: "smooth" });

      menuContainer.classList.remove("gallery-bar__brand--open");
      menuTrigger.setAttribute("aria-expanded", "false");
      menuContent.setAttribute("aria-hidden", "true");
    });
  });

  // ScrollSpy: Update title dynamically based on view port
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && titleEl) {
          titleEl.textContent = entry.target.id;
        }
      });
    }, { threshold: 0.4 }); // Trigger when 40% of the section is visible

    document.querySelectorAll(".page-section").forEach(sec => observer.observe(sec));
  }
}

// --- SETUP HOME FLOW GALLERY ---
let galleryRowsState = null, magneticCursorX = null, magneticCursorY = null, magneticCursorItem = null;
const MAGNETIC_RADIUS_PX = 320, MAX_HOVER_SCALE = 1.18, MAX_NEIGHBOR_SCALE = 1.16;

function getFlowItemWidth() {
  const w = window.innerWidth;
  if (w <= 420) return Math.min(200, Math.round(w * 0.72));
  if (w <= 768) return Math.min(248, Math.round(w * 0.58));
  return 288;
}

function applyMagneticScale() {
  if (!galleryRowsState || magneticCursorX === null || magneticCursorY === null) return;
  const elementAtCursor = document.elementFromPoint(magneticCursorX, magneticCursorY);
  
  // Scope entirely strictly to home section items to avoid bleeding into grid gallery
  magneticCursorItem = elementAtCursor?.closest("#home .media-item") || null;

  galleryRowsState.forEach((rowState) => {
    rowState.items.forEach((itemState) => {
      const rect = itemState.element.getBoundingClientRect();
      const isUnderCursor = itemState.element === magneticCursorItem;
      const dist = isUnderCursor ? 0 : Math.hypot(rect.left + rect.width / 2 - magneticCursorX, rect.top + rect.height / 2 - magneticCursorY);
      let scale = 1 + (MAX_HOVER_SCALE - 1) * Math.pow(Math.min(dist / MAGNETIC_RADIUS_PX, 1) - 1, 2);
      
      if (!isUnderCursor && scale > MAX_NEIGHBOR_SCALE) scale = MAX_NEIGHBOR_SCALE;
      itemState.element.style.setProperty("--scale", scale.toFixed(3));
      itemState.element.style.zIndex = "3";
    });
  });
  if (magneticCursorItem) magneticCursorItem.style.zIndex = "10";
}

function attachHoverAndClickBehavior(wrapper, mediaIndex) {
  let hoverTimeoutId = null;
  wrapper.addEventListener("mouseenter", () => {
    const siblings = Array.from(wrapper.parentElement?.querySelectorAll(".media-item") ||[]);
    const index = siblings.indexOf(wrapper);
    siblings.forEach((el, i) => {
      el.classList.remove("media-item--hovered", "media-item--neighbor");
      if (i === index) el.classList.add("media-item--hovered");
      else if (i === index - 1 || i === index + 1) el.classList.add("media-item--neighbor");
    });

    hoverTimeoutId = window.setTimeout(() => {
      if (document.body.dataset.colorShockwave !== "true" && !wrapper.classList.contains("media-item--revealed")) {
        document.body.dataset.colorShockwave = "true";
        document.body.classList.add("gallery-bg-wave--active");
        
        // Scope only to Home Items so it does not interfere with gallery grid
        const homeItems = Array.from(document.querySelectorAll("#home .media-item"));
        const rect0 = wrapper.getBoundingClientRect();
        
        homeItems.forEach(el => {
          el.classList.add("media-item--revealed", "media-item--shockwave");
          window.setTimeout(() => el.classList.remove("media-item--shockwave"), 420);
        });
      } else wrapper.classList.add("media-item--revealed");
    }, 50);
  });
  wrapper.addEventListener("mouseleave", () => { if (hoverTimeoutId !== null) clearTimeout(hoverTimeoutId); });
}

function setupHomeGallery() {
  const ROW_IDS =["row-top", "row-bottom"];
  const rowsState = ROW_IDS.map((id, index) => {
    const rowElement = document.getElementById(id);
    if (!rowElement) return null;
    
    const items = mediaItems.filter((_, mediaIndex) => index === 0 ? mediaIndex % 2 === 0 : mediaIndex % 2 === 1).map((item, mediaIndex) => {
      const wrapper = document.createElement("div");
      wrapper.className = "media-item";
      wrapper.dataset.mediaIndex = String(mediaIndex);

      if (typeof item === "string") {
        const img = document.createElement("img"); img.src = item; wrapper.appendChild(img);
      } else {
        const video = document.createElement("video");
        video.src = item.src; video.muted = true; video.autoplay = true; video.loop = true; video.playsInline = true;
        if (item.src.includes("GIF")) wrapper.classList.add("media-item--gif");
        wrapper.appendChild(video);
      }

      attachHoverAndClickBehavior(wrapper, mediaIndex);
      wrapper.addEventListener("click", () => {
        if (isMorphingToLightbox) return;
        isMorphingToLightbox = true;
        const { morph, durationMs } = createMorphLayerFromWrapper(wrapper, item);
        window.setTimeout(() => { morph.remove(); openLightboxFromIndex(mediaIndex); isMorphingToLightbox = false; }, durationMs + 40);
      });

      rowElement.appendChild(wrapper);
      wrapper.style.opacity = "0";
      return { element: wrapper, x: 0, width: 0 };
    });
    return { rowElement, items };
  });

  galleryRowsState = rowsState;

  function measureAndPosition() {
    const viewportWidth = window.innerWidth, itemW = getFlowItemWidth();
    document.documentElement.style.setProperty("--flow-item-width", `${itemW}px`);
    
    rowsState.forEach((rowState) => {
      if (!rowState) return;
      let currentX = -viewportWidth;
      rowState.items.forEach((itemState) => {
        itemState.width = itemW; itemState.x = currentX;
        itemState.element.style.setProperty("--x", `${itemState.x}px`);
        itemState.element.style.opacity = "1";
        currentX += itemW + 10;
      });

      const baseCount = rowState.items.length, targetRight = viewportWidth + (baseCount * (itemW + 10));
      let sequenceOffset = 0, lastRight = rowState.items[rowState.items.length - 1].x + itemW;
      const baseItems = rowState.items.slice(0, baseCount);

      while (lastRight < targetRight) {
        sequenceOffset = (sequenceOffset + 10) % baseCount;
        for (let i = 0; i < baseCount && lastRight < targetRight; i++) {
          const base = baseItems[(i + sequenceOffset) % baseCount];
          const cloneEl = base.element.cloneNode(true);
          rowState.rowElement.appendChild(cloneEl);
          
          const mediaIndex = Number(base.element.dataset.mediaIndex);
          attachHoverAndClickBehavior(cloneEl, mediaIndex);
          cloneEl.addEventListener("click", () => openLightboxFromIndex(mediaIndex));

          const cloneState = { element: cloneEl, x: currentX, width: itemW };
          cloneEl.style.opacity = "1"; cloneEl.style.setProperty("--x", `${cloneState.x}px`);
          rowState.items.push(cloneState);

          currentX += itemW + 10; lastRight = cloneState.x + itemW;
        }
      }
    });
  }

  function startAnimation() {
    let lastTime = performance.now(), flowDirection = 1, flowMultiplier = 1;

    const bindHold = (btn, dir) => {
      if (!btn) return;
      const onDown = (e) => { e.preventDefault(); flowDirection = dir; flowMultiplier = 7.5; btn.setPointerCapture?.(e.pointerId); };
      const onUp = () => { flowMultiplier = 1; };
      btn.addEventListener("pointerdown", onDown); btn.addEventListener("pointerup", onUp);
      btn.addEventListener("pointercancel", onUp); btn.addEventListener("pointerleave", onUp);
    };
    bindHold(document.querySelector(".gallery-flow-arrow--left"), 1);
    bindHold(document.querySelector(".gallery-flow-arrow--right"), -1);

    function step(now) {
      const dt = (now - lastTime) / 1000; lastTime = now;
      const viewportWidth = window.innerWidth, itemW = getFlowItemWidth();
      const wrapRightThreshold = viewportWidth + itemW, wrapLeftThreshold = -itemW;

      rowsState.forEach((rowState, i) => {
        if (!rowState) return;
        const speed = (i === 0 ? 24 : 30) * flowMultiplier * flowDirection;
        let minLeft = Infinity, maxRight = -Infinity;

        rowState.items.forEach((st) => {
          if (st.x < minLeft) minLeft = st.x;
          if (st.x + st.width > maxRight) maxRight = st.x + st.width;
        });

        rowState.items.forEach((st) => {
          st.x += speed * dt;
          if (speed > 0 && st.x > wrapRightThreshold) {
            st.x = minLeft - st.width - 10; minLeft = st.x;
            st.element.classList.add("media-item--teleport");
            st.element.style.setProperty("--x", `${st.x}px`);
            requestAnimationFrame(() => st.element.classList.remove("media-item--teleport"));
          } else if (speed < 0 && st.x + st.width < wrapLeftThreshold) {
            st.x = maxRight + 10; maxRight = st.x + st.width;
            st.element.classList.add("media-item--teleport");
            st.element.style.setProperty("--x", `${st.x}px`);
            requestAnimationFrame(() => st.element.classList.remove("media-item--teleport"));
          } else st.element.style.setProperty("--x", `${st.x}px`);
        });
      });

      if (magneticCursorX !== null && magneticCursorY !== null) applyMagneticScale();
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  setTimeout(() => { measureAndPosition(); startAnimation(); }, 60);

  const galleryEl = document.querySelector("#home .gallery");
  if (galleryEl) {
    galleryEl.addEventListener("mousemove", (event) => {
      magneticCursorX = event.clientX; magneticCursorY = event.clientY; applyMagneticScale();
    });
    galleryEl.addEventListener("mouseleave", () => {
      magneticCursorX = null; magneticCursorY = null; magneticCursorItem = null;
      galleryRowsState.forEach(row => row?.items.forEach(item => item.element.style.setProperty("--scale", "1")));
    });
  }
}

// --- SETUP PORTFOLIO GRID GALLERY ---
function setupGridGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  const fragment = document.createDocumentFragment();
  mediaItems.forEach((item, mediaIndex) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "media-item portfolio-tile";
    tile.dataset.kind = typeof item === "string" ? "stills" : "video";

    if (typeof item === "string") {
      const img = document.createElement("img");
      img.src = item; img.loading = "lazy"; img.decoding = "async"; tile.appendChild(img);
    } else {
      const video = document.createElement("video");
      video.muted = true; video.loop = true; video.playsInline = true; video.preload = "metadata";
      video.dataset.src = item.src; tile.appendChild(video);
    }

    tile.addEventListener("click", () => {
      if (isMorphingToLightbox) return;
      isMorphingToLightbox = true;
      const { morph, durationMs } = createMorphLayerFromWrapper(tile, item);
      window.setTimeout(() => { morph.remove(); openLightboxFromIndex(mediaIndex); isMorphingToLightbox = false; }, durationMs + 40);
    });

    fragment.appendChild(tile);
  });
  grid.appendChild(fragment);

  const tiles = Array.from(grid.querySelectorAll(".media-item"));
  const filterButtons = Array.from(document.querySelectorAll(".portfolio-filter"));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector("video");
      if (!video) return;
      if (entry.isIntersecting) {
        if (!video.src && video.dataset.src) { video.src = video.dataset.src; video.load(); }
        if (!isMorphingToLightbox) {
          const p = video.play();
          if (p && typeof p.catch === "function") p.catch(() => { video.addEventListener("canplay", () => video.play().catch(() => {}), { once: true }); });
        }
      } else video.pause();
    });
  }, { rootMargin: "300px 0px", threshold: 0.01 });

  function applyFilter(filterValue) {
    tiles.forEach((tile) => {
      const show = filterValue === "all" || tile.dataset.kind === filterValue;
      tile.classList.toggle("is-hidden", !show);
      if (!show) { const v = tile.querySelector("video"); if (v) v.pause(); }
    });
    document.getElementById("portfolio-meta").textContent = `${tiles.filter(t => !t.classList.contains("is-hidden")).length} works`;
  }

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      applyFilter(btn.dataset.filter || "all");
    });
  });

  applyFilter("all");
  tiles.forEach(tile => io.observe(tile));
}

// --- SETUP CONTACT ---
function setupContact() {
  const bgA = document.querySelector(".contact-bg__layer--a");
  const bgB = document.querySelector(".contact-bg__layer--b");
  const bgImages =["Assets/DSC_0166-2.jpg", "Assets/DSC_0173.jpg", "Assets/DSC_0104.jpg", "Assets/DSC_0179.jpg", "Assets/DSC_0128-2.jpg", "Assets/DSC_0168.jpg"];
  
  bgImages.forEach(src => new Image().src = src);
  let index = 0, showingA = true;
  
  if (bgA && bgB) {
    bgA.style.backgroundImage = `url("${bgImages[index]}")`;
    bgA.classList.add("is-visible");
    
    window.setInterval(() => {
      const nextIndex = (index + 1) % bgImages.length;
      const incoming = showingA ? bgB : bgA;
      const outgoing = showingA ? bgA : bgB;
      
      incoming.style.backgroundImage = `url("${bgImages[nextIndex]}")`;
      incoming.classList.remove("is-fading-out"); outgoing.classList.remove("is-fading-in");
      void incoming.offsetWidth;
      incoming.classList.add("is-fading-in", "is-visible"); outgoing.classList.add("is-fading-out");
      
      window.setTimeout(() => { outgoing.classList.remove("is-visible", "is-fading-out"); incoming.classList.remove("is-fading-in"); }, 1650);
      index = nextIndex; showingA = !showingA;
    }, 25000);
  }

  document.getElementById("contact-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const subject = e.target.querySelector('[name="subject"]')?.value || "";
    const body = e.target.querySelector('[name="body"]')?.value || "";
    window.location.href = `mailto:zachariahsavage@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

// --- INITIALIZE ALL ---
window.addEventListener("load", () => {
  setupMenu();
  setupHomeGallery();
  setupGridGallery();
  setupContact();

  // Wire up Global Lightbox Events
  lightbox = document.querySelector(".lightbox");
  lightboxImage = document.querySelector(".lightbox__image");
  lightboxVideo = document.querySelector(".lightbox__video");
  document.querySelector(".lightbox__close")?.addEventListener("click", closeLightbox);
  document.querySelector(".lightbox__arrow--prev")?.addEventListener("click", () => changeLightboxBy(-1));
  document.querySelector(".lightbox__arrow--next")?.addEventListener("click", () => changeLightboxBy(1));
  
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target === document.querySelector(".lightbox__backdrop")) closeLightbox();
  });

  window.addEventListener("keydown", (e) => {
    if (!lightbox || lightbox.getAttribute("data-state") !== "open") return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") changeLightboxBy(-1);
    else if (e.key === "ArrowRight") changeLightboxBy(1);
  });
});

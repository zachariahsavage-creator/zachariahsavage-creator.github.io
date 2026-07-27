// Single-page experience: home flow, gallery grid, and contact form.

function isFlowMobileLayout() {
  return window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
}

/** Shrink the mobile home title until the full line fits without clipping. */
function fitHomeFlowHeading() {
  const heading = document.querySelector(".home-flow-heading");
  const section = document.querySelector(".onepage-section--home");
  if (!heading) return;

  if (!isFlowMobileLayout()) {
    heading.style.removeProperty("font-size");
    if (section) section.style.removeProperty("padding-top");
    return;
  }

  heading.style.removeProperty("font-size");
  const styles = getComputedStyle(heading);
  let size = parseFloat(styles.fontSize);
  if (!Number.isFinite(size) || size <= 0) return;

  const minPx = 9;
  const available = heading.clientWidth;
  if (!(available > 0)) return;

  heading.style.fontSize = `${size}px`;
  while (size > minPx && heading.scrollWidth > available + 1) {
    size -= 0.5;
    heading.style.fontSize = `${size}px`;
  }

  if (section) section.style.removeProperty("padding-top");
}

function scheduleHomeFlowHeadingFit() {
  if (!document.body.classList.contains("page-home")) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(fitHomeFlowHeading);
  });
}

/** Layout viewport width (stable when iOS / in-app browser chrome shows or hides on scroll). */
let flowLayoutViewportWidth = null;
let flowLayoutViewportLocked = false;

function getFlowLayoutViewportWidth() {
  const clientW = Math.max(
    1,
    Math.round(document.documentElement.clientWidth || window.innerWidth)
  );
  if (!isFlowMobileLayout()) return clientW;

  if (flowLayoutViewportLocked && flowLayoutViewportWidth !== null) {
    return flowLayoutViewportWidth;
  }

  if (flowLayoutViewportWidth === null) {
    flowLayoutViewportWidth = clientW;
    return clientW;
  }

  if (Math.abs(clientW - flowLayoutViewportWidth) >= 56) {
    flowLayoutViewportWidth = clientW;
  }
  return flowLayoutViewportWidth;
}

function lockFlowLayoutViewportWidth() {
  if (!isFlowMobileLayout()) return;
  flowLayoutViewportWidth = Math.max(
    1,
    Math.round(document.documentElement.clientWidth || window.innerWidth)
  );
  flowLayoutViewportLocked = true;
}

function unlockFlowLayoutViewportWidth() {
  flowLayoutViewportWidth = null;
  flowLayoutViewportLocked = false;
}

let trackedLayoutViewportWidth = Math.max(
  1,
  Math.round(document.documentElement.clientWidth || window.innerWidth)
);

/** Ignore mobile browser chrome show/hide (height-only resize); react to real width changes. */
function hasMeaningfulLayoutWidthChange() {
  const nextWidth = Math.max(
    1,
    Math.round(document.documentElement.clientWidth || window.innerWidth)
  );
  const threshold = isFlowMobileLayout() ? 56 : 2;
  if (Math.abs(nextWidth - trackedLayoutViewportWidth) < threshold) return false;
  trackedLayoutViewportWidth = nextWidth;
  return true;
}

function getStableMobileViewportHeightPx() {
  return Math.round(
    window.visualViewport?.height ||
      document.documentElement.clientHeight ||
      window.innerHeight
  );
}

/** Lock fixed page backgrounds to initial mobile viewport height (toolbar hide won't shift them). */
function setupStableViewportBackgrounds() {
  if (!isFlowMobileLayout()) return;

  let lockedHeight = getStableMobileViewportHeightPx();

  const applyHeight = () => {
    document.documentElement.style.setProperty(
      "--stable-viewport-height",
      `${lockedHeight}px`
    );
  };
  applyHeight();

  window.addEventListener("orientationchange", () => {
    window.setTimeout(() => {
      lockedHeight = getStableMobileViewportHeightPx();
      applyHeight();
    }, 250);
  });

  window.addEventListener(
    "resize",
    () => {
      if (!hasMeaningfulLayoutWidthChange()) return;
      lockedHeight = getStableMobileViewportHeightPx();
      applyHeight();
    },
    { passive: true }
  );
}

function getFlowItemWidth() {
  const w = getFlowLayoutViewportWidth();
  if (w <= 420) return Math.min(200, Math.round(w * 0.72));
  if (w <= 768) return Math.min(248, Math.round(w * 0.58));
  return 288;
}

function positiveModulo(value, modulus) {
  if (!(modulus > 0)) return 0;
  return ((value % modulus) + modulus) % modulus;
}

const FLOW_BASE_ITEMS = [
  "boston-church-scandal-the-drake-05.webp",
  "listening-room-longboat-hall-01.webp",
  "daphne-the-drake-01.webp",
  "stacks-rats-nest-06.webp",
  "angelique-the-ivy-01.webp",
  "listening-room-longboat-hall-02.webp",
  "stacks-rats-nest-07.webp",
  "listening-room-longboat-hall-03.webp",
  "daphne-the-drake-05.webp",
  "sam-william-thomas-burdock-05.webp",
  "sam-william-thomas-burdock-02.webp",
  "boston-church-scandal-the-drake-03.webp",
  "superstar-crush-the-baby-g-03.webp",
  "superstar-crush-the-baby-g-04.webp",
  "superstar-crush-the-baby-g-01.webp",
  "superstar-crush-the-baby-g-02.webp",
  "angelique-the-ivy-04.webp",
  "angelique-the-ivy-02.webp",
  "angelique-the-ivy-05.webp",
];

/** Subset of Listening Room shots that appear in the home flow carousel. */
const FLOW_LISTENING_ROOM_ITEMS = [
  "listening-room-longboat-hall-06.webp",
  "listening-room-longboat-hall-04.webp",
];

const FLOW_STACKS_RATS_NEST_ITEMS = ["stacks-rats-nest-02.webp"];

const FLOW_MICO_ITEMS = [
  "mico-hard-luck-01.webp",
  "mico-hard-luck-09.webp",
  "mico-hard-luck-16.webp",
];

const FLOW_PINNED_INSERTS = [
  ...FLOW_LISTENING_ROOM_ITEMS,
  ...FLOW_STACKS_RATS_NEST_ITEMS,
  ...FLOW_MICO_ITEMS,
];

/** Explicit source lists for the numbered gallery folders (labels "1"–"5"). */
const FULL_GALLERY_NUMBERED_SHOW_SOURCES = {
  "1": [
    "boston-church-scandal-the-drake-01.webp",
    "boston-church-scandal-the-drake-02.webp",
    "boston-church-scandal-the-drake-03.webp",
    "boston-church-scandal-the-drake-04.webp",
    "boston-church-scandal-the-drake-05.webp",
    "boston-church-scandal-the-drake-06.webp",
  ],
  "2": [
    "daphne-the-drake-01.webp",
    "daphne-the-drake-02.webp",
    "daphne-the-drake-03.webp",
    "daphne-the-drake-04.webp",
    "daphne-the-drake-05.webp",
  ],
  "3": [
    "izzy-flores-986-bathurst-01.webp",
    "izzy-flores-986-bathurst-02.webp",
    "izzy-flores-986-bathurst-03.webp",
    "izzy-flores-986-bathurst-04.webp",
    "izzy-flores-986-bathurst-05.webp",
    "izzy-flores-986-bathurst-06.webp",
  ],
  "4": [
    "angelique-the-ivy-01.webp",
    "angelique-the-ivy-02.webp",
    "angelique-the-ivy-03.webp",
    "angelique-the-ivy-04.webp",
    "angelique-the-ivy-05.webp",
  ],
  "5": [
    "superstar-crush-the-baby-g-01.webp",
    "superstar-crush-the-baby-g-02.webp",
    "superstar-crush-the-baby-g-03.webp",
    "superstar-crush-the-baby-g-04.webp",
    "superstar-crush-the-baby-g-05.webp",
  ],
};

const numberedShowGroupByPath = new Map();
Object.entries(FULL_GALLERY_NUMBERED_SHOW_SOURCES).forEach(([label, sources]) => {
  sources.forEach((path) => numberedShowGroupByPath.set(path, label));
});

/** Numbered-folder label ("1"–"5") for a path, or null when it belongs to no numbered show. */
function getNumberedShowGroup(src) {
  const filename = src.split("/").pop() || "";
  return numberedShowGroupByPath.get(filename) || null;
}

const FULL_GALLERY_LISTENING_ROOM = {
  id: "listening-room-longboat",
  order: -2,
  title: "Listening Room @ Longboat Hall",
  sources: [
    "listening-room-longboat-hall-01.webp",
    "listening-room-longboat-hall-02.webp",
    "listening-room-longboat-hall-03.webp",
    "listening-room-longboat-hall-04.webp",
    "listening-room-longboat-hall-05.webp",
    "listening-room-longboat-hall-06.webp",
    "listening-room-longboat-hall-07.webp",
    "listening-room-longboat-hall-08.webp",
    "listening-room-longboat-hall-09.webp",
    "listening-room-longboat-hall-10.webp",
    "listening-room-longboat-hall-11.webp",
    "listening-room-longboat-hall-12.webp",
    "listening-room-longboat-hall-13.webp",
    "listening-room-longboat-hall-14.webp",
    "listening-room-longboat-hall-15.webp",
    "listening-room-longboat-hall-16.webp",
    "listening-room-longboat-hall-17.webp",
    "listening-room-longboat-hall-18.webp",
    "listening-room-longboat-hall-19.webp",
    "listening-room-longboat-hall-20.webp",
  ],
};

const FULL_GALLERY_SUPERSTAR_CRUSH_DINAS = {
  id: "superstar-crush-dinas",
  order: -1.875,
  title: "Superstar Crush @ Dina's Tavern",
  sources: [
    "superstar-crush-dinas-tavern-01.webp",
    "superstar-crush-dinas-tavern-02.webp",
    "superstar-crush-dinas-tavern-03.webp",
    "superstar-crush-dinas-tavern-04.webp",
    "superstar-crush-dinas-tavern-05.webp",
    "superstar-crush-dinas-tavern-06.webp",
    "superstar-crush-dinas-tavern-07.webp",
    "superstar-crush-dinas-tavern-08.webp",
    "superstar-crush-dinas-tavern-09.webp",
    "superstar-crush-dinas-tavern-10.webp",
    "superstar-crush-dinas-tavern-11.webp",
    "superstar-crush-dinas-tavern-12.webp",
    "superstar-crush-dinas-tavern-13.webp",
    "superstar-crush-dinas-tavern-14.webp",
    "superstar-crush-dinas-tavern-15.webp",
  ],
};

const FULL_GALLERY_STACKS_RATS_NEST = {
  id: "stacks-rats-nest",
  order: -1.5,
  title: "Stacks @ Rats Nest",
  sources: [
    "stacks-rats-nest-01.webp",
    "stacks-rats-nest-02.webp",
    "stacks-rats-nest-03.webp",
    "stacks-rats-nest-04.webp",
    "stacks-rats-nest-05.webp",
    "stacks-rats-nest-06.webp",
    "stacks-rats-nest-07.webp",
  ],
};

const FULL_GALLERY_PINNED_SHOW = {
  id: "swt-burdock",
  order: -1,
  title: "Sam William Thomas @ Burdock",
  sources: [
    "sam-william-thomas-burdock-01.webp",
    "sam-william-thomas-burdock-02.webp",
    "sam-william-thomas-burdock-03.webp",
    "sam-william-thomas-burdock-04.webp",
    "sam-william-thomas-burdock-05.webp",
    "sam-william-thomas-burdock-06.webp",
    "sam-william-thomas-burdock-07.webp",
    "sam-william-thomas-burdock-08.webp",
    "sam-william-thomas-burdock-09.webp",
  ],
};

const FULL_GALLERY_MICO_HARD_LUCK = {
  id: "mico-hard-luck",
  order: -3,
  title: "MICO @ Hard Luck",
  sources: [
    "mico-hard-luck-01.webp",
    "mico-hard-luck-02.webp",
    "mico-hard-luck-03.webp",
    "mico-hard-luck-04.webp",
    "mico-hard-luck-05.webp",
    "mico-hard-luck-06.webp",
    "mico-hard-luck-07.webp",
    "mico-hard-luck-08.webp",
    "mico-hard-luck-09.webp",
    "mico-hard-luck-10.webp",
    "mico-hard-luck-11.webp",
    "mico-hard-luck-12.webp",
    "mico-hard-luck-13.webp",
    "mico-hard-luck-14.webp",
    "mico-hard-luck-15.webp",
    "mico-hard-luck-16.webp",
    "mico-hard-luck-17.webp",
    "mico-hard-luck-18.webp",
    "mico-hard-luck-19.webp",
    "mico-hard-luck-20.webp",
    "mico-hard-luck-21.webp",
  ],
};

const FULL_GALLERY_PINNED_SHOWS = [
  FULL_GALLERY_LISTENING_ROOM,
  FULL_GALLERY_SUPERSTAR_CRUSH_DINAS,
  FULL_GALLERY_STACKS_RATS_NEST,
  FULL_GALLERY_PINNED_SHOW,
  FULL_GALLERY_MICO_HARD_LUCK,
];

function getPinnedShowById(id) {
  return FULL_GALLERY_PINNED_SHOWS.find((show) => show.id === id);
}

function scatterItemsIntoFlow(baseItems, insertItems) {
  if (!insertItems.length) return [...baseItems];
  const result = [...baseItems];
  insertItems.forEach((item, i) => {
    if (result.includes(item)) return;
    const slot = Math.round(((i + 1) * result.length) / (insertItems.length + 1));
    result.splice(Math.min(slot, result.length), 0, item);
  });
  return result;
}

function dedupeFlowItems(items) {
  const seen = new Set();
  return items.filter((path) => {
    if (seen.has(path)) return false;
    seen.add(path);
    return true;
  });
}

const fullGalleryCustomGroupByPath = new Map();
FULL_GALLERY_PINNED_SHOWS.forEach((show) => {
  show.sources.forEach((path) => {
    fullGalleryCustomGroupByPath.set(path, {
      label: show.id,
      order: show.order,
    });
  });
});

const fullGalleryNumberedItems = [
  ...FULL_GALLERY_LISTENING_ROOM.sources,
  ...FULL_GALLERY_SUPERSTAR_CRUSH_DINAS.sources,
  ...FULL_GALLERY_STACKS_RATS_NEST.sources,
  ...FULL_GALLERY_PINNED_SHOW.sources,
  ...FULL_GALLERY_MICO_HARD_LUCK.sources,
  "boston-church-scandal-the-drake-01.webp",
  "boston-church-scandal-the-drake-02.webp",
  "boston-church-scandal-the-drake-03.webp",
  "boston-church-scandal-the-drake-04.webp",
  "boston-church-scandal-the-drake-05.webp",
  "boston-church-scandal-the-drake-06.webp",
  "daphne-the-drake-01.webp",
  "daphne-the-drake-02.webp",
  "daphne-the-drake-03.webp",
  "daphne-the-drake-04.webp",
  "daphne-the-drake-05.webp",
  "izzy-flores-986-bathurst-01.webp",
  "izzy-flores-986-bathurst-02.webp",
  "izzy-flores-986-bathurst-03.webp",
  "izzy-flores-986-bathurst-04.webp",
  "izzy-flores-986-bathurst-05.webp",
  "izzy-flores-986-bathurst-06.webp",
  "angelique-the-ivy-01.webp",
  "angelique-the-ivy-02.webp",
  "angelique-the-ivy-03.webp",
  "angelique-the-ivy-04.webp",
  "angelique-the-ivy-05.webp",
  "superstar-crush-the-baby-g-01.webp",
  "superstar-crush-the-baby-g-02.webp",
  "superstar-crush-the-baby-g-03.webp",
  "superstar-crush-the-baby-g-04.webp",
  "superstar-crush-the-baby-g-05.webp",
];

/** Used on full gallery page but not in the grid (e.g. page background). */
const FULL_GALLERY_PAGE_ONLY_PATHS = ["gallery-page-backdrop.webp"];

const FULL_GALLERY_PATH_SET = new Set([
  ...fullGalleryNumberedItems,
  ...FULL_GALLERY_PAGE_ONLY_PATHS,
]);

const FULL_GALLERY_PATH_ASPECTS = {
  "angelique-the-ivy-01.webp": 0.667,
  "angelique-the-ivy-02.webp": 0.667,
  "angelique-the-ivy-03.webp": 1.5,
  "angelique-the-ivy-04.webp": 1.5,
  "angelique-the-ivy-05.webp": 1.5,
  "boston-church-scandal-the-drake-01.webp": 0.667,
  "boston-church-scandal-the-drake-02.webp": 0.667,
  "boston-church-scandal-the-drake-03.webp": 0.667,
  "boston-church-scandal-the-drake-04.webp": 1.5,
  "boston-church-scandal-the-drake-05.webp": 1.5,
  "boston-church-scandal-the-drake-06.webp": 1.501,
  "daphne-the-drake-01.webp": 0.667,
  "daphne-the-drake-02.webp": 0.667,
  "daphne-the-drake-03.webp": 0.766,
  "daphne-the-drake-04.webp": 1.5,
  "daphne-the-drake-05.webp": 1.5,
  "gallery-page-backdrop.webp": 1.5,
  "home-hero-backdrop.webp": 0.481,
  "izzy-flores-986-bathurst-01.webp": 1.5,
  "izzy-flores-986-bathurst-02.webp": 1.5,
  "izzy-flores-986-bathurst-03.webp": 1.5,
  "izzy-flores-986-bathurst-04.webp": 1.5,
  "izzy-flores-986-bathurst-05.webp": 1.5,
  "izzy-flores-986-bathurst-06.webp": 0.667,
  "listening-room-longboat-hall-01.webp": 0.667,
  "listening-room-longboat-hall-02.webp": 0.667,
  "listening-room-longboat-hall-03.webp": 0.667,
  "listening-room-longboat-hall-04.webp": 0.667,
  "listening-room-longboat-hall-05.webp": 0.667,
  "listening-room-longboat-hall-06.webp": 0.667,
  "listening-room-longboat-hall-07.webp": 0.667,
  "listening-room-longboat-hall-08.webp": 1.5,
  "listening-room-longboat-hall-09.webp": 1.5,
  "listening-room-longboat-hall-10.webp": 1.5,
  "listening-room-longboat-hall-11.webp": 0.667,
  "listening-room-longboat-hall-12.webp": 1.5,
  "listening-room-longboat-hall-13.webp": 1.5,
  "listening-room-longboat-hall-14.webp": 0.667,
  "listening-room-longboat-hall-15.webp": 0.667,
  "listening-room-longboat-hall-16.webp": 1.5,
  "listening-room-longboat-hall-17.webp": 0.667,
  "listening-room-longboat-hall-18.webp": 0.667,
  "listening-room-longboat-hall-19.webp": 1.5,
  "listening-room-longboat-hall-20.webp": 1.5,
  "mico-hard-luck-01.webp": 0.75,
  "mico-hard-luck-02.webp": 0.75,
  "mico-hard-luck-03.webp": 0.75,
  "mico-hard-luck-04.webp": 0.75,
  "mico-hard-luck-05.webp": 0.75,
  "mico-hard-luck-06.webp": 0.75,
  "mico-hard-luck-07.webp": 0.75,
  "mico-hard-luck-08.webp": 0.75,
  "mico-hard-luck-09.webp": 0.75,
  "mico-hard-luck-10.webp": 0.75,
  "mico-hard-luck-11.webp": 0.75,
  "mico-hard-luck-12.webp": 0.75,
  "mico-hard-luck-13.webp": 0.75,
  "mico-hard-luck-14.webp": 0.75,
  "mico-hard-luck-15.webp": 1.332,
  "mico-hard-luck-16.webp": 1.333,
  "mico-hard-luck-17.webp": 1.332,
  "mico-hard-luck-18.webp": 1.332,
  "mico-hard-luck-19.webp": 1.333,
  "mico-hard-luck-20.webp": 1.5,
  "mico-hard-luck-21.webp": 1.5,
  "sam-william-thomas-burdock-01.webp": 1.5,
  "sam-william-thomas-burdock-02.webp": 1.5,
  "sam-william-thomas-burdock-03.webp": 0.667,
  "sam-william-thomas-burdock-04.webp": 0.667,
  "sam-william-thomas-burdock-05.webp": 1.0,
  "sam-william-thomas-burdock-06.webp": 1.0,
  "sam-william-thomas-burdock-07.webp": 1.5,
  "sam-william-thomas-burdock-08.webp": 1.5,
  "sam-william-thomas-burdock-09.webp": 1.5,
  "stacks-rats-nest-01.webp": 0.667,
  "stacks-rats-nest-02.webp": 0.667,
  "stacks-rats-nest-03.webp": 1.261,
  "stacks-rats-nest-04.webp": 1.5,
  "stacks-rats-nest-05.webp": 0.667,
  "stacks-rats-nest-06.webp": 0.667,
  "stacks-rats-nest-07.webp": 0.667,
  "superstar-crush-dinas-tavern-01.webp": 0.667,
  "superstar-crush-dinas-tavern-02.webp": 0.75,
  "superstar-crush-dinas-tavern-03.webp": 0.667,
  "superstar-crush-dinas-tavern-04.webp": 0.667,
  "superstar-crush-dinas-tavern-05.webp": 0.667,
  "superstar-crush-dinas-tavern-06.webp": 0.667,
  "superstar-crush-dinas-tavern-07.webp": 1.5,
  "superstar-crush-dinas-tavern-08.webp": 1.5,
  "superstar-crush-dinas-tavern-09.webp": 1.0,
  "superstar-crush-dinas-tavern-10.webp": 1.0,
  "superstar-crush-dinas-tavern-11.webp": 1.5,
  "superstar-crush-dinas-tavern-12.webp": 1.5,
  "superstar-crush-dinas-tavern-13.webp": 1.5,
  "superstar-crush-dinas-tavern-14.webp": 0.667,
  "superstar-crush-dinas-tavern-15.webp": 0.667,
  "superstar-crush-the-baby-g-01.webp": 1.5,
  "superstar-crush-the-baby-g-02.webp": 1.5,
  "superstar-crush-the-baby-g-03.webp": 0.667,
  "superstar-crush-the-baby-g-04.webp": 0.667,
  "superstar-crush-the-baby-g-05.webp": 0.667,
  "zach-savage-portrait.webp": 1.5,
};

function getPathAspectRatio(path) {
  const aspect = FULL_GALLERY_PATH_ASPECTS[path];
  return Number.isFinite(aspect) && aspect > 0 ? aspect : null;
}

function isPathLandscape(path) {
  const aspect = getPathAspectRatio(path);
  return aspect !== null && aspect >= 1;
}

function pairPathsByClosestAspect(paths) {
  if (paths.length <= 1) return [...paths];
  const unpaired = [...paths];
  const result = [];
  while (unpaired.length >= 2) {
    let bestI = 0;
    let bestJ = 1;
    let bestDiff = Infinity;
    for (let i = 0; i < unpaired.length; i += 1) {
      const aspectI = getPathAspectRatio(unpaired[i]) ?? 0.75;
      for (let j = i + 1; j < unpaired.length; j += 1) {
        const aspectJ = getPathAspectRatio(unpaired[j]) ?? 0.75;
        const diff = Math.abs(aspectI - aspectJ);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestI = i;
          bestJ = j;
        }
      }
    }
    result.push(unpaired[bestI], unpaired[bestJ]);
    unpaired.splice(bestJ, 1);
    unpaired.splice(bestI, 1);
  }
  if (unpaired.length) result.push(unpaired[0]);
  return result;
}

function findBestSameOrientationPair(paths) {
  if (paths.length < 2) return null;
  let bestI = 0;
  let bestJ = 1;
  let bestDiff = Infinity;
  for (let i = 0; i < paths.length; i += 1) {
    const aspectI = getPathAspectRatio(paths[i]) ?? 0.75;
    for (let j = i + 1; j < paths.length; j += 1) {
      if (isPathLandscape(paths[i]) !== isPathLandscape(paths[j])) continue;
      const aspectJ = getPathAspectRatio(paths[j]) ?? 0.75;
      const diff = Math.abs(aspectI - aspectJ);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestI = i;
        bestJ = j;
      }
    }
  }
  if (!Number.isFinite(bestDiff)) return null;
  return [paths[bestI], paths[bestJ]];
}

/** Pair same-orientation images by closest aspect ratio so 2-col rows align in height. */
function sortPathsForPairedGridLayout(paths, options = {}) {
  const lockFirst = Math.max(0, options.lockFirst ?? 0);
  const useBestPreviewPair = options.useBestPreviewPair ?? false;
  if (!paths?.length) return [];

  let locked = [];
  let rest = [...paths];

  if (useBestPreviewPair) {
    const previewPair = findBestSameOrientationPair(paths);
    if (previewPair) {
      locked = previewPair;
      const lockedSet = new Set(previewPair);
      rest = paths.filter((path) => !lockedSet.has(path));
    }
  } else if (lockFirst > 0) {
    locked = paths.slice(0, Math.min(lockFirst, paths.length));
    rest = paths.slice(locked.length);
  }

  const portraits = rest.filter((path) => !isPathLandscape(path));
  const landscapes = rest.filter((path) => isPathLandscape(path));
  return [
    ...locked,
    ...pairPathsByClosestAspect(portraits),
    ...pairPathsByClosestAspect(landscapes),
  ];
}

function getNumberedFolderSortedSources(label, collectedSources) {
  const explicit = FULL_GALLERY_NUMBERED_FOLDER_SOURCE_ORDER[label];
  if (!explicit?.length) {
    return sortPathsForPairedGridLayout(collectedSources, { useBestPreviewPair: true });
  }

  const inFolder = new Set(collectedSources);
  const ordered = explicit.filter((path) => inFolder.has(path));
  const remainder = collectedSources.filter((path) => !ordered.includes(path));
  return sortPathsForPairedGridLayout([...ordered, ...remainder], {
    lockFirst: Math.min(2, ordered.length),
  });
}

function isInFullGallery(path) {
  return FULL_GALLERY_PATH_SET.has(path);
}

/** Contact section background — must be full-gallery images only. */
const CONTACT_BG_HERO_PATH = "sam-william-thomas-burdock-05.webp";
const CONTACT_BG_IMAGES = [
  CONTACT_BG_HERO_PATH,
  "stacks-rats-nest-01.webp",
  "listening-room-longboat-hall-01.webp",
  "stacks-rats-nest-03.webp",
  "boston-church-scandal-the-drake-05.webp",
  "sam-william-thomas-burdock-03.webp",
];

const mediaItems = dedupeFlowItems(
  scatterItemsIntoFlow(FLOW_BASE_ITEMS, FLOW_PINNED_INSERTS)
)
  .filter(isInFullGallery);

let activeGalleryItems = mediaItems;
const fullGalleryExpandedGroups = new Set();
const fullGallerySectionTitles = {
  [FULL_GALLERY_LISTENING_ROOM.id]: FULL_GALLERY_LISTENING_ROOM.title,
  [FULL_GALLERY_SUPERSTAR_CRUSH_DINAS.id]: FULL_GALLERY_SUPERSTAR_CRUSH_DINAS.title,
  [FULL_GALLERY_STACKS_RATS_NEST.id]: FULL_GALLERY_STACKS_RATS_NEST.title,
  [FULL_GALLERY_PINNED_SHOW.id]: FULL_GALLERY_PINNED_SHOW.title,
  [FULL_GALLERY_MICO_HARD_LUCK.id]: FULL_GALLERY_MICO_HARD_LUCK.title,
  "1": "Boston Church Scandal @ The Drake",
  "2": "DAPHNE @ The Drake",
  "3": "Izzy Flores @ 986 Bathurst",
  "4": "Angelique @ The Ivy",
  "5": "Superstar Crush @ The Baby G",
};

/** Descriptive alt text for gallery photographs, keyed by asset filename. */
const photoAltTextByPath = new Map();

function registerShowAltText(title, sources) {
  const showName = String(title).replace(" @ ", " at ");
  sources.forEach((path, index) => {
    photoAltTextByPath.set(
      path,
      `${showName} — live concert photo ${index + 1} of ${sources.length} by Zach Savage`
    );
  });
}

FULL_GALLERY_PINNED_SHOWS.forEach((show) => registerShowAltText(show.title, show.sources));
Object.entries(FULL_GALLERY_NUMBERED_SHOW_SOURCES).forEach(([label, sources]) => {
  registerShowAltText(fullGallerySectionTitles[label] || "Live show", sources);
});
photoAltTextByPath.set(
  "zach-savage-portrait.webp",
  "Portrait of Zach Savage, Toronto concert and event photographer"
);

/** Alt text for a photo path; decorative backdrops keep an empty alt. */
function getPhotoAltText(assetPath) {
  const key = (normalizeAssetPath(assetPath).split("/").pop() || "").trim();
  return photoAltTextByPath.get(key) || "";
}

/** Paired preview + same-height rows (same layout rules as DAPHNE / folder "2"). */
const FULL_GALLERY_NUMBERED_FOLDER_SOURCE_ORDER = {
  "1": [
    "boston-church-scandal-the-drake-01.webp",
    "boston-church-scandal-the-drake-02.webp",
    "boston-church-scandal-the-drake-03.webp",
    "boston-church-scandal-the-drake-04.webp",
    "boston-church-scandal-the-drake-05.webp",
    "boston-church-scandal-the-drake-06.webp",
  ],
  "2": [
    "daphne-the-drake-01.webp",
    "daphne-the-drake-02.webp",
    "daphne-the-drake-03.webp",
    "daphne-the-drake-04.webp",
    "daphne-the-drake-05.webp",
  ],
  "5": [
    "superstar-crush-the-baby-g-01.webp",
    "superstar-crush-the-baby-g-02.webp",
    "superstar-crush-the-baby-g-03.webp",
    "superstar-crush-the-baby-g-04.webp",
    "superstar-crush-the-baby-g-05.webp",
  ],
};

const ALL_FLOW_ROW_IDS = ["row-top", "row-bottom"];

function getActiveFlowRowIds() {
  return isFlowMobileLayout() ? ["row-top"] : ALL_FLOW_ROW_IDS;
}

function isMobileSingleFlowRow() {
  return getActiveFlowRowIds().length === 1;
}

let lastFlowLayoutMode = null;

function getFlowLayoutMode() {
  return isMobileSingleFlowRow() ? "mobile-single" : "desktop-dual";
}

function syncFlowLayoutModeTracking() {
  lastFlowLayoutMode = getFlowLayoutMode();
}

function hasFlowLayoutModeChange() {
  const mode = getFlowLayoutMode();
  if (lastFlowLayoutMode === null) {
    lastFlowLayoutMode = mode;
    return false;
  }
  if (lastFlowLayoutMode === mode) return false;
  lastFlowLayoutMode = mode;
  return true;
}

function getItemsForFlowRow(rowIndex) {
  const entries = mediaItems.map((item, mediaIndex) => ({ item, mediaIndex }));
  if (isMobileSingleFlowRow()) return entries;
  return entries.filter(({ mediaIndex }) =>
    rowIndex === 0 ? mediaIndex % 2 === 0 : mediaIndex % 2 === 1
  );
}
/** First N tiles per flow row (top + bottom = 6) — eager decode + GPU layer for Instagram WebKit. */
const FLOW_PRIORITY_TILES_PER_ROW = 3;
const FULL_GALLERY_PRIORITY_TILE_COUNT = 6;

function buildFlowPriorityPreloadPaths(
  maxCount = FLOW_PRIORITY_TILES_PER_ROW * getActiveFlowRowIds().length
) {
  const rowIds = getActiveFlowRowIds();
  const perRow = Math.ceil(maxCount / rowIds.length);
  const paths = [];
  for (let slot = 0; slot < perRow && paths.length < maxCount; slot += 1) {
    for (let row = 0; row < rowIds.length && paths.length < maxCount; row += 1) {
      const mediaIndex = slot * rowIds.length + row;
      const item = mediaItems[mediaIndex];
      if (typeof item === "string") paths.push(item);
    }
  }
  return paths.slice(0, maxCount);
}

/** Pre-decode images inside a grid/tile so scroll-back doesn't flash empty in WebKit. */
function warmGalleryGridImages(root) {
  if (!root) return;
  root.querySelectorAll("img").forEach((img) => {
    if (!img.src) return;
    if (img.complete && img.decode) {
      img.decode().catch(() => {});
      return;
    }
    img.addEventListener("load", () => img.decode?.().catch(() => {}), { once: true });
  });
}

/** Decode flow images after layout so WebKit keeps bitmaps when scrolling back. */
function warmFlowImages(rowsState) {
  if (!rowsState?.length) return;
  rowsState.forEach((rowState) => {
    rowState.mediaElements?.forEach((tile) => {
      warmGalleryGridImages(tile);
    });
  });
}

const GALLERY_FOLDER_PREVIEW_ATTR = "data-gallery-folder-preview";

function getGalleryFolderPreviewAssetPaths() {
  const paths = [];
  FULL_GALLERY_PINNED_SHOWS.forEach((show) => {
    show.sources.slice(0, 2).forEach((path) => paths.push(path));
  });

  const byNumberGroup = new Map();
  fullGalleryNumberedItems.forEach((item) => {
    if (typeof item !== "string") return;
    if (fullGalleryCustomGroupByPath.has(item)) return;
    const group = getNumberedShowGroup(item);
    if (!group) return;
    if (!byNumberGroup.has(group)) byNumberGroup.set(group, []);
    byNumberGroup.get(group).push(item);
  });
  byNumberGroup.forEach((items) => {
    items.slice(0, 2).forEach((path) => paths.push(path));
  });

  return [...new Set(paths)];
}

/** One folder = one ordered source list (pinned shows + numbered buckets). */
function getFullGalleryFolderDefinitions() {
  const folders = FULL_GALLERY_PINNED_SHOWS.map((show) => ({
    label: show.id,
    order: show.order,
    sources: sortPathsForPairedGridLayout(show.sources, { lockFirst: 2 }),
  }));

  const byNumber = new Map();
  fullGalleryNumberedItems.forEach((path) => {
    if (typeof path !== "string") return;
    if (fullGalleryCustomGroupByPath.has(path)) return;
    const group = getNumberedShowGroup(path);
    if (!group) return;
    if (!byNumber.has(group)) byNumber.set(group, []);
    byNumber.get(group).push(path);
  });
  byNumber.forEach((sources, label) => {
    folders.push({
      label,
      order: Number(label),
      sources: getNumberedFolderSortedSources(label, sources),
    });
  });

  return folders.sort((a, b) => a.order - b.order);
}

function getMediaIndexForAssetPath(path) {
  const idx = fullGalleryNumberedItems.indexOf(path);
  return idx >= 0 ? idx : 0;
}

function createGridTilesFromPaths(paths) {
  return paths.map((path) => createGridTile(path, getMediaIndexForAssetPath(path)));
}

function getFullGalleryBootImagePaths() {
  return [...new Set([FULL_GALLERY_PAGE_BG_PATH, ...getGalleryFolderPreviewAssetPaths()])];
}

const preparedGalleryFolderGroups = new Set();
let galleryFolderGroupObserver = null;

let galleryFolderPreviewPathSet = null;

function getGalleryFolderPreviewPathSet() {
  if (!galleryFolderPreviewPathSet) {
    galleryFolderPreviewPathSet = new Set(getGalleryFolderPreviewAssetPaths());
  }
  return galleryFolderPreviewPathSet;
}

function isGalleryFolderPreviewPath(path) {
  return getGalleryFolderPreviewPathSet().has(path);
}

function retainGalleryFolderPreviewTile(tile) {
  if (!tile) return;
  tile.setAttribute(GALLERY_FOLDER_PREVIEW_ATTR, "true");
  const path = getTileAssetPath(tile);
  const img = tile.querySelector("img");
  if (img && path) {
    assignPinnedImageAttributes(img, path);
  }
  markTilePriorityRender(tile);
}

function retainGalleryFolderPreviewTiles(tiles) {
  if (!tiles?.length) return;
  tiles.forEach(retainGalleryFolderPreviewTile);
}

function warmGalleryFolderPreviewTiles(root) {
  if (!root) return;
  root.querySelectorAll(`[${GALLERY_FOLDER_PREVIEW_ATTR}]`).forEach((tile) => {
    warmGalleryGridImages(tile);
  });
}

/** Build expanded folder tiles synchronously (call before revealing the container). */
function ensureGalleryFolderExpandedDom(extraInner, extraPaths) {
  if (!extraInner || !extraPaths?.length) return [];

  let tiles = Array.from(extraInner.querySelectorAll(".media-item"));
  if (!tiles.length) {
    tiles = createGridTilesFromPaths(extraPaths);
    renderFolderBody(extraInner, tiles);
  }

  tiles.forEach((tile) => {
    const path = getTileAssetPath(tile);
    const img = tile.querySelector("img");
    if (img && path) {
      assignPinnedImageAttributes(img, path);
    }
  });

  return tiles;
}

async function loadGalleryFolderExpandedImages(extraInner, extraPaths) {
  const tiles = ensureGalleryFolderExpandedDom(extraInner, extraPaths);
  if (!tiles.length) return;

  await pinImagePaths(extraPaths, { concurrency: extraPaths.length });
  appendImageMemoryKeeper(extraPaths);

  tiles.forEach((tile) => {
    const path = getTileAssetPath(tile);
    const img = tile.querySelector("img");
    if (img && path) {
      assignPinnedImageAttributes(img, path);
    }
    markTilePriorityRender(tile);
  });

  refreshPinnedImageSources(extraInner);
  await Promise.all(tiles.map((tile) => ensureDomImagesDecoded(tile)));
  warmGalleryGridImages(extraInner);
  refineFullGalleryFolderRowHeights(extraInner);
}

/** Decode + warm folder preview tiles when scrolled near (blobs pinned at boot). */
async function warmGalleryFolderSection(section, label) {
  if (!section || preparedGalleryFolderGroups.has(label)) return;
  preparedGalleryFolderGroups.add(label);

  section.querySelectorAll(`[${GALLERY_FOLDER_PREVIEW_ATTR}]`).forEach((tile) => {
    retainGalleryFolderPreviewTile(tile);
  });
  refreshPinnedImageSources(section);
  const rowsWrap = section.querySelector(".portfolio-date-rows");
  if (rowsWrap) {
    await ensureDomImagesDecoded(rowsWrap);
    warmGalleryGridImages(rowsWrap);
  }
}

function disconnectGalleryFolderGroupObservers() {
  galleryFolderGroupObserver?.disconnect();
  galleryFolderGroupObserver = null;
}

function ensureGalleryFolderGroupObservers(grid) {
  if (!grid || !("IntersectionObserver" in window)) return;

  disconnectGalleryFolderGroupObservers();
  galleryFolderGroupObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const label = entry.target.dataset.folderLabel;
        if (label) {
          warmGalleryFolderSection(entry.target, label);
        }
      });
    },
    { rootMargin: "40% 0px 40% 0px", threshold: 0.01 }
  );

  grid.querySelectorAll(".portfolio-date-group[data-folder-label]").forEach((section) => {
    galleryFolderGroupObserver.observe(section);
  });
}

async function pinGalleryFolderPreviewImages() {
  const paths = getGalleryFolderPreviewAssetPaths();
  if (!paths.length) return;
  await pinImagePaths(paths, { concurrency: 4 });
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;
  refreshPinnedImageSources(grid);
  warmGalleryFolderPreviewTiles(grid);
}

const FLOW_PRIORITY_PRELOAD_PATHS = buildFlowPriorityPreloadPaths();

const HOME_BIO_IMAGE_PATH = "zach-savage-portrait.webp";

/** Blob + in-memory Image() refs so WebKit cannot discard decoded hero tiles. */
const pinnedBlobUrlByPath = new Map();
const pinnedMemoryImages = [];

function normalizeAssetPath(path) {
  if (!path) return "";
  try {
    return decodeURIComponent(path.split("?")[0].split("#")[0]);
  } catch {
    return path.split("?")[0].split("#")[0];
  }
}

function getAllFlowImagePaths() {
  return mediaItems.filter((item) => typeof item === "string");
}

const HOME_PAGE_BG_PATH = "home-hero-backdrop.webp";
const FULL_GALLERY_PAGE_BG_PATH = "gallery-page-backdrop.webp";

function getBootImagePaths() {
  if (document.body?.classList.contains("page-full-gallery")) {
    return getFullGalleryBootImagePaths();
  }
  if (document.body?.classList.contains("page-home")) {
    return [
      ...new Set([
        ...getAllFlowImagePaths(),
        HOME_BIO_IMAGE_PATH,
        HOME_PAGE_BG_PATH,
        CONTACT_BG_HERO_PATH,
      ]),
    ];
  }
  return getAllFlowImagePaths();
}

function getPinnedImageSrc(assetPath) {
  const key = normalizeAssetPath(assetPath);
  return pinnedBlobUrlByPath.get(key) || assetPath;
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "sync";
    img.onload = () => {
      if (img.decode) {
        img.decode().then(() => resolve(img)).catch(() => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
    if (img.complete) {
      img.onload();
    }
  });
}

async function pinImagePath(assetPath) {
  const key = normalizeAssetPath(assetPath);
  if (!key || pinnedBlobUrlByPath.has(key)) {
    return pinnedBlobUrlByPath.get(key) || assetPath;
  }

  try {
    const response = await fetch(assetPath, { cache: "force-cache" });
    if (!response.ok) throw new Error(String(response.status));
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    pinnedBlobUrlByPath.set(key, blobUrl);
    const keeper = await loadImageElement(blobUrl);
    pinnedMemoryImages.push(keeper);
    return blobUrl;
  } catch {
    pinnedBlobUrlByPath.set(key, assetPath);
    const keeper = await loadImageElement(assetPath);
    pinnedMemoryImages.push(keeper);
    return assetPath;
  }
}

async function pinImagePaths(paths, { concurrency = 6 } = {}) {
  const unique = [...new Set(paths.filter(Boolean))];
  for (let i = 0; i < unique.length; i += concurrency) {
    const batch = unique.slice(i, i + concurrency);
    await Promise.all(batch.map((path) => pinImagePath(path)));
  }
  appendImageMemoryKeeper(unique);
}

function appendImageMemoryKeeper(paths) {
  let keeper = document.getElementById("image-memory-keeper");
  if (!keeper) {
    keeper = document.createElement("div");
    keeper.id = "image-memory-keeper";
    keeper.setAttribute("aria-hidden", "true");
    document.body.appendChild(keeper);
  }
  paths.forEach((path) => {
    const key = normalizeAssetPath(path);
    const exists = [...keeper.querySelectorAll("img")].some(
      (img) => normalizeAssetPath(img.dataset.assetPath || "") === key
    );
    if (exists) return;
    const img = document.createElement("img");
    img.dataset.assetPath = path;
    img.src = getPinnedImageSrc(path);
    img.alt = "";
    img.loading = "eager";
    img.decoding = "sync";
    img.classList.add("priority-render-img");
    keeper.appendChild(img);
  });
}

function assignPinnedImageAttributes(img, assetPath) {
  img.alt = getPhotoAltText(assetPath);
  img.loading = "eager";
  img.decoding = "sync";
  img.setAttribute("fetchpriority", "high");
  img.classList.add("priority-render-img");
  img.dataset.assetPath = assetPath;
  img.src = getPinnedImageSrc(assetPath);
}

function assignFlowImageAttributes(img, assetPath, { priority = false } = {}) {
  if (priority || !isFlowMobileLayout()) {
    assignPinnedImageAttributes(img, assetPath);
    return;
  }
  img.alt = getPhotoAltText(assetPath);
  img.loading = "lazy";
  img.decoding = "async";
  img.dataset.assetPath = assetPath;
  img.src = getPinnedImageSrc(assetPath);
}

function refreshPinnedImageSources(root = document) {
  root.querySelectorAll("img[data-asset-path]").forEach((img) => {
    const assetPath = img.dataset.assetPath;
    if (!assetPath) return;
    const nextSrc = getPinnedImageSrc(assetPath);
    if (img.src !== nextSrc) img.src = nextSrc;
    img.loading = "eager";
    img.decoding = "sync";
  });
  root.querySelectorAll(".home-bio-image").forEach((img) => {
    assignPinnedImageAttributes(img, HOME_BIO_IMAGE_PATH);
  });
  root.querySelectorAll(".home-page-bg img").forEach((img) => {
    assignPinnedImageAttributes(img, HOME_PAGE_BG_PATH);
  });
  root.querySelectorAll(".full-gallery-page-bg img").forEach((img) => {
    assignPinnedImageAttributes(img, FULL_GALLERY_PAGE_BG_PATH);
  });
  root.querySelectorAll(".contact-bg__image[data-asset-path]").forEach((img) => {
    assignPinnedImageAttributes(img, img.dataset.assetPath);
  });
}

/** Hard caps so a slow network can never leave the page stuck behind the boot gate. */
const SITE_BOOT_PIN_TIMEOUT_MS = 2500;
const SITE_BOOT_FAILSAFE_MS = 4000;

let siteBootGateReleased = false;

function lockSiteBootGate() {
  document.documentElement.classList.add("site-boot-locked");
}

function releaseSiteBootGate() {
  if (siteBootGateReleased) return;
  siteBootGateReleased = true;
  document.documentElement.classList.remove("site-boot-locked");
  document.documentElement.classList.add("site-boot-ready");
  document.getElementById("site-boot-gate")?.setAttribute("hidden", "");
  refreshPinnedImageSources();
}

function withBootTimeout(promise, ms = SITE_BOOT_PIN_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((resolve) => window.setTimeout(resolve, ms)),
  ]);
}

async function ensureDomImagesDecoded(root) {
  if (!root) return;
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(imgs.map((img) => ensureImageDecoded(img)));
}

async function ensureImageDecoded(img) {
  if (!img) return;
  return new Promise((resolve) => {
    const finish = () => {
      if (img.decode) {
        img.decode().then(resolve).catch(resolve);
      } else {
        resolve();
      }
    };
    if (img.complete && img.naturalWidth > 0) {
      finish();
      return;
    }
    img.addEventListener("load", finish, { once: true });
    img.addEventListener("error", resolve, { once: true });
  });
}

async function prepareVisibleMediaBeforeUnlock() {
  refreshPinnedImageSources();

  const isHome = document.body.classList.contains("page-home");
  const isFullGallery = document.body.classList.contains("page-full-gallery");

  if (isHome) {
    await ensureDomImagesDecoded(document.querySelector(".home-page-bg"));
    await ensureDomImagesDecoded(document.querySelector(".gallery"));
    await ensureDomImagesDecoded(document.querySelector(".home-bio-row"));
    await ensureDomImagesDecoded(document.querySelector(".onepage-section--contact .contact-bg"));
    await ensureDomImagesDecoded(document.getElementById("image-memory-keeper"));
    return;
  }

  if (isFullGallery) {
    await ensureDomImagesDecoded(document.querySelector(".full-gallery-page-bg"));
    const grid = document.getElementById("gallery-grid");
    if (grid) {
      const previewTiles = grid.querySelectorAll(`[${GALLERY_FOLDER_PREVIEW_ATTR}]`);
      if (previewTiles.length) {
        previewTiles.forEach((tile) => retainGalleryFolderPreviewTile(tile));
        refreshPinnedImageSources(grid);
        await Promise.all(
          Array.from(previewTiles).map((tile) => ensureDomImagesDecoded(tile))
        );
      }
    }
    await ensureDomImagesDecoded(document.getElementById("image-memory-keeper"));
    return;
  }

  await ensureDomImagesDecoded(document.getElementById("image-memory-keeper"));
}

function beginSiteBoot() {
  if (!document.body) return Promise.resolve();
  lockSiteBootGate();
  // Absolute failsafe: reveal the page even if downloads or decodes stall.
  window.setTimeout(releaseSiteBootGate, SITE_BOOT_FAILSAFE_MS);
  const paths = getBootImagePaths();
  const concurrency = document.body.classList.contains("page-full-gallery") ? 8 : 6;
  return withBootTimeout(pinImagePaths(paths, { concurrency })).catch(() => {});
}

const siteBootPromise = beginSiteBoot();

function markTilePriorityRender(tileEl) {
  if (!tileEl) return;
  tileEl.classList.add("media-item--priority-render");
  const img = tileEl.querySelector("img");
  if (img) {
    img.classList.add("priority-render-img");
    img.loading = "eager";
    img.decoding = "sync";
  }
  const video = tileEl.querySelector("video");
  if (video) {
    video.classList.add("priority-render-img");
    video.preload = "auto";
  }
}

function cloneFlowMediaTile(original) {
  const clone = original.cloneNode(true);
  attachHoverAndClickBehavior(clone, Number(original.dataset.mediaIndex));
  return clone;
}
const FLOW_BASE_SPEEDS = [24, 30];
let galleryRowsState = null;
let flowDirection = 1;
let flowMultiplier = 1;
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
let scrollRevealObserver = null;

const MAX_HOVER_SCALE = 1.18;
const MAX_NEIGHBOR_SCALE = 1.16;
const MAGNETIC_RADIUS_PX = 320;

function getShouldReduceMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

function observeRevealElement(el, delayMs = 0, variant = null) {
  if (!el) return;
  el.classList.add("reveal-on-scroll");
  if (variant) {
    el.classList.add(`reveal-on-scroll--${variant}`);
  }
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
      { threshold: 0.05, rootMargin: "14% 0px -8% 0px" }
    );
  }
  scrollRevealObserver.observe(el);
}

let flowRewarmRafId = 0;
let flowRewarmScrollBound = false;
let galleryPreviewRewarmRafId = 0;
let galleryPreviewRewarmScrollBound = false;
let lastFlowRewarmAt = 0;
let lastGalleryPreviewRewarmAt = 0;
let lastContactRewarmAt = 0;
const FLOW_REWARM_VIEWPORT_MARGIN = 0.45;
const FLOW_REWARM_MIN_INTERVAL_MS = () => (isFlowMobileLayout() ? 900 : 200);
const GALLERY_PREVIEW_REWARM_MIN_INTERVAL_MS = () => (isFlowMobileLayout() ? 900 : 200);
const CONTACT_REWARM_MIN_INTERVAL_MS = () => (isFlowMobileLayout() ? 900 : 200);

function isElementNearViewport(el, marginRatio = FLOW_REWARM_VIEWPORT_MARGIN) {
  if (!el) return false;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const rect = el.getBoundingClientRect();
  const margin = vh * marginRatio;
  return rect.bottom > -margin && rect.top < vh + margin;
}

function maybeRewarmFlowGallery() {
  if (!document.body.classList.contains("page-home")) return;
  const flow = document.querySelector(".onepage-section--home .gallery");
  if (!flow || !isElementNearViewport(flow)) return;

  const now = Date.now();
  if (now - lastFlowRewarmAt < FLOW_REWARM_MIN_INTERVAL_MS()) return;
  lastFlowRewarmAt = now;

  refreshPinnedImageSources(flow);
  if (!isFlowMobileLayout()) {
    warmGalleryGridImages(flow);
    if (galleryRowsState) warmFlowImages(galleryRowsState);
  }
}

function maybeRewarmGalleryFolderPreviews() {
  if (!document.body.classList.contains("page-full-gallery")) return;
  const grid = document.getElementById("gallery-grid");
  if (!grid || !isElementNearViewport(grid)) return;

  const now = Date.now();
  if (now - lastGalleryPreviewRewarmAt < GALLERY_PREVIEW_REWARM_MIN_INTERVAL_MS()) return;
  lastGalleryPreviewRewarmAt = now;

  refreshPinnedImageSources(grid);
  if (!isFlowMobileLayout()) {
    warmGalleryFolderPreviewTiles(grid);
  }
}

function maybeRewarmContactBackground() {
  if (!document.body.classList.contains("page-home")) return;
  const contactSection = document.querySelector(".onepage-section--contact");
  if (!contactSection || !isElementNearViewport(contactSection)) return;

  const now = Date.now();
  if (now - lastContactRewarmAt < CONTACT_REWARM_MIN_INTERVAL_MS()) return;
  lastContactRewarmAt = now;

  const contactBg = contactSection.querySelector(".contact-bg");
  if (!contactBg) return;
  refreshPinnedImageSources(contactBg);
  if (!isFlowMobileLayout()) {
    warmGalleryGridImages(contactBg);
  }
}

function scheduleGalleryPreviewRewarmOnScroll() {
  if (galleryPreviewRewarmRafId) return;
  galleryPreviewRewarmRafId = requestAnimationFrame(() => {
    galleryPreviewRewarmRafId = 0;
    maybeRewarmGalleryFolderPreviews();
  });
}

function ensureGalleryPreviewRewarmListener() {
  if (galleryPreviewRewarmScrollBound || !document.body.classList.contains("page-full-gallery")) {
    return;
  }
  galleryPreviewRewarmScrollBound = true;

  const runRewarm = () => maybeRewarmGalleryFolderPreviews();
  const onLayoutResize = () => {
    if (!hasMeaningfulLayoutWidthChange()) return;
    if (isFlowMobileLayout()) {
      runRewarm();
    } else {
      scheduleGalleryPreviewRewarmOnScroll();
    }
  };

  if (isFlowMobileLayout()) {
    registerMobileScrollHandler(runRewarm);
  } else {
    const onScroll = () => scheduleGalleryPreviewRewarmOnScroll();
    const scrollRoot = getOnePageScrollRoot();
    scrollRoot.addEventListener("scroll", onScroll, { passive: true });
    if (scrollRoot !== window) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }
  window.addEventListener("resize", onLayoutResize, { passive: true });
}

function scheduleFlowRewarmOnScroll() {
  if (flowRewarmRafId) return;
  flowRewarmRafId = requestAnimationFrame(() => {
    flowRewarmRafId = 0;
    maybeRewarmFlowGallery();
    maybeRewarmContactBackground();
  });
}

function ensureFlowRewarmListener() {
  if (flowRewarmScrollBound || !document.body.classList.contains("page-home")) return;
  flowRewarmScrollBound = true;

  const runRewarm = () => {
    maybeRewarmFlowGallery();
    maybeRewarmContactBackground();
  };
  const onLayoutResize = () => {
    if (!hasMeaningfulLayoutWidthChange()) return;
    if (isFlowMobileLayout()) {
      runRewarm();
    } else {
      scheduleFlowRewarmOnScroll();
    }
  };

  if (isFlowMobileLayout()) {
    registerMobileScrollHandler(runRewarm);
  } else {
    const onScroll = () => scheduleFlowRewarmOnScroll();
    const scrollRoot = getOnePageScrollRoot();
    scrollRoot.addEventListener("scroll", onScroll, { passive: true });
    if (scrollRoot !== window) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }
  window.addEventListener("resize", onLayoutResize, { passive: true });
}

function setupScrollReveal() {
  const isFullGalleryPage = document.body.classList.contains("page-full-gallery");
  if (isFullGalleryPage) return;

  const revealSequence = [];

  revealSequence.forEach((step) => {
    const el = document.querySelector(step.selector);
    if (!el) return;
    observeRevealElement(el, step.delay, step.variant);
  });
}

function triggerFlowShockwave(epicenter) {
  // Shockwave reveal intentionally disabled.
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
    lightboxImage.alt = getPhotoAltText(item);
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
  let lastActivateAt = 0;

  function activateTile(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const now = Date.now();
    if (now - lastActivateAt < 350) return;
    if (typeof mediaIndex !== "number") return;
    const item = activeGalleryItems[mediaIndex];
    if (!item) return;
    lastActivateAt = now;
    openLightboxFromIndex(mediaIndex);
  }

  wrapper.setAttribute("role", "button");
  wrapper.setAttribute("tabindex", "0");
  wrapper.setAttribute("aria-label", "Open image in lightbox");

  wrapper.addEventListener("click", activateTile);
  wrapper.addEventListener("pointerup", (e) => {
    if (e.pointerType === "mouse") return;
    if (!e.isPrimary) return;
    activateTile(e);
  });
  wrapper.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activateTile(e);
    }
  });
}

/** Cap flow segment length (multiplier of viewport width) to limit DOM/decodes. */
const FLOW_SEGMENT_MAX_VIEWPORT_MULTIPLIER = 2;

function getFlowViewportWidth() {
  return getFlowLayoutViewportWidth();
}

function flowItemPath(item) {
  return typeof item === "string" ? item : item.src;
}

function flowTilePath(tileEl) {
  const mediaIndex = Number(tileEl.dataset.mediaIndex);
  if (!Number.isFinite(mediaIndex) || mediaIndex < 0) return "";
  const item = mediaItems[mediaIndex];
  return item ? flowItemPath(item) : "";
}

function getFlowVisibleTileSlots(viewportWidth, itemW, spacing) {
  return Math.max(2, Math.ceil((viewportWidth + spacing) / (itemW + spacing)) + 1);
}

/** True if `path` appears among the last `minDistance` tiles (prevents on-screen duplicates). */
function isPathBlockedByRecentTiles(tilesA, path, minDistance) {
  if (!path || minDistance <= 0) return false;
  const start = Math.max(0, tilesA.length - minDistance);
  for (let i = start; i < tilesA.length; i += 1) {
    if (flowTilePath(tilesA[i]) === path) return true;
  }
  return false;
}

function pickNextFlowEntry(itemsForRow, tilesA, minDistance, cursor, { allowReuse = false } = {}) {
  const n = itemsForRow.length;
  if (!n) return null;
  const gap = allowReuse ? minDistance : Math.max(minDistance, tilesA.length + 1);

  for (let offset = 0; offset < n; offset += 1) {
    const idx = (cursor + offset) % n;
    const entry = itemsForRow[idx];
    const path = flowItemPath(entry.item);
    if (!isPathBlockedByRecentTiles(tilesA, path, gap)) {
      return { entry, nextCursor: (idx + 1) % n };
    }
  }

  return null;
}

/** Order each row's images once with no adjacent duplicate paths. */
function orderRowItemsWithoutAdjacentDupes(itemsForRow) {
  const remaining = [...itemsForRow];
  const ordered = [];
  let prevPath = null;

  while (remaining.length) {
    let pickIdx = remaining.findIndex((entry) => flowItemPath(entry.item) !== prevPath);
    if (pickIdx === -1) pickIdx = 0;
    const entry = remaining.splice(pickIdx, 1)[0];
    ordered.push(entry);
    prevPath = flowItemPath(entry.item);
  }

  return ordered;
}

function computeFlowSegmentTargetWidth(viewportWidth, itemW, spacing, itemsForRowLength) {
  const tileStep = itemW + spacing;
  const minTiles = Math.max(2, Math.ceil((viewportWidth + tileStep) / tileStep));
  const minWidth = Math.max(
    minTiles * itemW + (minTiles - 1) * spacing,
    viewportWidth + tileStep * 2
  );

  const uncapped = viewportWidth + itemsForRowLength * tileStep;
  const capped = Math.min(uncapped, viewportWidth * FLOW_SEGMENT_MAX_VIEWPORT_MULTIPLIER);
  return { targetWidth: Math.max(minWidth, capped), maxTiles: Math.ceil(capped / tileStep) + itemsForRowLength };
}

function buildFlowSegmentTiles(itemsForRow, targetWidth, maxTiles, itemW, spacing, track, viewportWidth) {
  const tileStep = itemW + spacing;
  const visibleSlots = getFlowVisibleTileSlots(viewportWidth, itemW, spacing);
  /** Same image must not reappear within this many tiles (covers full viewport). */
  const minPathGap = Math.max(visibleSlots + 1, 3);
  const tilesA = [];
  let segmentWidthPx = 0;

  orderRowItemsWithoutAdjacentDupes(itemsForRow).forEach(({ item, mediaIndex }) => {
    const el = createFlowMediaElement(item, mediaIndex);
    track.appendChild(el);
    tilesA.push(el);
  });
  segmentWidthPx =
    tilesA.length > 0 ? tilesA.length * itemW + (tilesA.length - 1) * spacing : 0;

  const minFillWidth = viewportWidth + tileStep;
  let cursor = 0;
  while (segmentWidthPx < Math.max(targetWidth, minFillWidth) && tilesA.length < maxTiles) {
    const picked = pickNextFlowEntry(itemsForRow, tilesA, minPathGap, cursor, { allowReuse: false });
    if (!picked) break;

    const { entry, nextCursor } = picked;
    const el = createFlowMediaElement(entry.item, entry.mediaIndex);
    track.appendChild(el);
    tilesA.push(el);
    cursor = nextCursor;
    segmentWidthPx = tilesA.length * itemW + (tilesA.length - 1) * spacing;
  }

  if (tilesA.length > 1 && itemsForRow.length > 1) {
    const firstPath = flowTilePath(tilesA[0]);
    let lastPath = flowTilePath(tilesA[tilesA.length - 1]);
    let guard = 0;
    while (lastPath === firstPath && tilesA.length > 2 && guard < itemsForRow.length + 2) {
      guard += 1;
      const removed = tilesA.pop();
      track.removeChild(removed);
      segmentWidthPx =
        tilesA.length > 0 ? tilesA.length * itemW + (tilesA.length - 1) * spacing : 0;
      const repick = pickNextFlowEntry(itemsForRow, tilesA, minPathGap, cursor, { allowReuse: false });
      if (!repick) break;
      const { entry, nextCursor } = repick;
      const el = createFlowMediaElement(entry.item, entry.mediaIndex);
      track.appendChild(el);
      tilesA.push(el);
      cursor = nextCursor;
      lastPath = flowItemPath(entry.item);
      segmentWidthPx = tilesA.length * itemW + (tilesA.length - 1) * spacing;
    }
  }

  tilesA.forEach((el, index) => {
    if (!isFlowMobileLayout() || index < FLOW_PRIORITY_TILES_PER_ROW) {
      markTilePriorityRender(el);
    }
  });

  return { segmentWidthPx, tilesA };
}

function createFlowMediaElement(item, mediaIndex) {
  const wrapper = document.createElement("div");
  wrapper.className = "media-item";
  wrapper.dataset.mediaIndex = String(mediaIndex);

  if (typeof item === "string") {
    const img = document.createElement("img");
    assignFlowImageAttributes(img, item);
    if (!isFlowMobileLayout()) {
      wrapper.classList.add("media-item--priority-render");
    }
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
  const activeRowIds = new Set(getActiveFlowRowIds());
  ALL_FLOW_ROW_IDS.forEach((id) => {
    const rowElement = document.getElementById(id);
    if (!rowElement) return;
    const isActive = activeRowIds.has(id);
    rowElement.hidden = !isActive;
    if (!isActive) {
      rowElement.replaceChildren();
      return;
    }
    rowElement.replaceChildren();
    const trackElement = document.createElement("div");
    trackElement.className = "gallery-flow-track";
    rowElement.appendChild(trackElement);
    rowsState.push({
      rowElement,
      trackElement,
      segmentWidthPx: 0,
      segmentTileCount: 0,
      /** Scroll accumulator; transform uses -positiveModulo(this, W) so the row stays filled. */
      trackScroll: 0,
      mediaElements: [],
    });
  });
  syncFlowLayoutModeTracking();
  return rowsState;
}

function updateFlowLayoutWidths(rowsState) {
  const spacing = 10;
  const itemW = getFlowItemWidth();
  document.documentElement.style.setProperty("--flow-item-width", `${itemW}px`);

  rowsState.forEach((rowState, rowIndex) => {
    const tileCount = rowState.segmentTileCount || 0;
    if (!rowState.trackElement || tileCount <= 0) return;
    rowState.segmentWidthPx = tileCount * itemW + (tileCount - 1) * spacing;
    applyFlowTrackMotion(rowState, rowIndex);
  });
}

function measureAndPosition(rowsState, { forceRebuild = false } = {}) {
  const viewportWidth = getFlowViewportWidth();
  const spacing = 10;
  const itemW = getFlowItemWidth();
  document.documentElement.style.setProperty("--flow-item-width", `${itemW}px`);

  const canUpdateWidthsOnly =
    !forceRebuild &&
    rowsState.every(
      (row) =>
        (row.segmentTileCount || 0) > 0 &&
        row.trackElement &&
        row.trackElement.querySelector(".media-item")
    );
  if (canUpdateWidthsOnly) {
    updateFlowLayoutWidths(rowsState);
    return;
  }

  rowsState.forEach((rowState, rowIndex) => {
    if (!rowState?.trackElement) return;
    const track = rowState.trackElement;
    track.replaceChildren();

    const itemsForRow = getItemsForFlowRow(rowIndex);

    if (!itemsForRow.length) {
      rowState.segmentWidthPx = 0;
      rowState.segmentTileCount = 0;
      rowState.mediaElements = [];
      track.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    const { targetWidth, maxTiles } = computeFlowSegmentTargetWidth(
      viewportWidth,
      itemW,
      spacing,
      itemsForRow.length
    );
    const { segmentWidthPx, tilesA } = buildFlowSegmentTiles(
      itemsForRow,
      targetWidth,
      maxTiles,
      itemW,
      spacing,
      track,
      viewportWidth
    );

    tilesA.forEach((el) => {
      track.appendChild(cloneFlowMediaTile(el));
    });

    rowState.segmentWidthPx = segmentWidthPx;
    rowState.segmentTileCount = tilesA.length;
    rowState.mediaElements = Array.from(track.querySelectorAll(".media-item"));
    rowState.trackScroll = 0;
    applyFlowTrackMotion(rowState, rowIndex);
  });

  warmFlowImages(rowsState);
  refreshPinnedImageSources(document.querySelector(".gallery"));
}

/** CSS marquee on the compositor thread (stable in Safari while the page scrolls). */
function applyFlowTrackMotion(rowState, rowIndex) {
  const track = rowState.trackElement;
  const W = rowState.segmentWidthPx;
  if (!track || !(W > 0)) return;

  track.style.setProperty("--flow-segment-width", `${W}px`);
  track.classList.add("flow-marquee-active");

  if (getShouldReduceMotion()) {
    track.style.animation = "none";
    track.style.transform = "translate3d(0, 0, 0)";
    return;
  }

  const speed = (FLOW_BASE_SPEEDS[rowIndex] || FLOW_BASE_SPEEDS[0]) * flowMultiplier;
  const durationSec = W / speed;
  track.style.setProperty("--flow-marquee-duration", `${durationSec}s`);
  track.style.setProperty("--flow-marquee-direction", flowDirection < 0 ? "reverse" : "normal");
}

function refreshFlowTrackAnimations() {
  if (!galleryRowsState?.length) return;
  galleryRowsState.forEach((rowState, rowIndex) => {
    applyFlowTrackMotion(rowState, rowIndex);
  });
  syncViewGalleryBurstSpinDuration();
}

/** Keep View Gallery burst spin in sync with flow marquee speed. */
function syncViewGalleryBurstSpinDuration() {
  if (!document.body.classList.contains("page-home")) return;

  const tracks = document.querySelectorAll(
    ".onepage-section--home .gallery-flow-track.flow-marquee-active"
  );
  if (!tracks.length) return;

  let totalSec = 0;
  let count = 0;
  tracks.forEach((track) => {
    const raw = track.style.getPropertyValue("--flow-marquee-duration").trim();
    const sec = parseFloat(raw);
    if (Number.isFinite(sec) && sec > 0) {
      totalSec += sec;
      count += 1;
    }
  });

  if (count > 0) {
    const avgSec = totalSec / count;
    document.documentElement.style.setProperty(
      "--view-gallery-burst-spin-duration",
      `${avgSec}s`
    );
  }
}

/** Prime clip-path, spin animation, and hover fonts so the first hover stays smooth. */
function prewarmViewGalleryHoverFx() {
  if (!document.body.classList.contains("page-home")) return;
  if (!window.matchMedia("(min-width: 769px) and (hover: hover) and (pointer: fine)").matches) {
    return;
  }

  const btn = document.querySelector(".home-bio-row .home-start-btn--pov");
  if (!btn || btn.classList.contains("is-burst-ready")) return;

  syncViewGalleryBurstSpinDuration();

  const warmFonts = [];
  if (document.fonts?.load) {
    warmFonts.push(
      document.fonts.load('700 1rem "DM Sans"'),
      document.fonts.load('900 1rem "DM Sans"'),
      document.fonts.load('900 italic 1rem "DM Sans"')
    );
  }

  const runWarm = () => {
    btn.classList.add("is-hover-prewarming");
    void btn.offsetHeight;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        btn.classList.remove("is-hover-prewarming");
        btn.classList.add("is-burst-ready");
      });
    });
  };

  if (warmFonts.length) {
    Promise.allSettled(warmFonts).finally(runWarm);
  } else {
    runWarm();
  }
}

let viewGalleryHoverPrewarmScheduled = false;

function scheduleViewGalleryHoverPrewarm() {
  if (!document.body.classList.contains("page-home")) return;
  if (viewGalleryHoverPrewarmScheduled) return;
  viewGalleryHoverPrewarmScheduled = true;

  const btn = document.querySelector(".home-bio-row .home-start-btn--pov");
  if (!btn) return;

  btn.addEventListener(
    "mouseenter",
    () => {
      if (!btn.classList.contains("is-burst-ready")) prewarmViewGalleryHoverFx();
    },
    { once: true, passive: true }
  );

  const run = () => prewarmViewGalleryHoverFx();
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(run, { timeout: 1800 });
  } else {
    window.setTimeout(run, 700);
  }
}

function startFlowAnimation(rowsState) {
  galleryRowsState = rowsState;
  refreshFlowTrackAnimations();
  scheduleViewGalleryHoverPrewarm();
}

function createGridTile(item, mediaIndex) {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "media-item portfolio-tile";
  tile.dataset.mediaIndex = String(mediaIndex);
  tile.dataset.kind = typeof item === "string" ? "stills" : "video";
  const isFullGalleryPage = document.body.classList.contains("page-full-gallery");
  const isBootPinnedTile =
    !isFullGalleryPage &&
    mediaIndex < FULL_GALLERY_PRIORITY_TILE_COUNT &&
    typeof item === "string";

  // Attach grouping metadata for full-gallery name-prefix sections.
  const src = typeof item === "string" ? item : item.src;
  const knownAspect = typeof item === "string" ? getPathAspectRatio(src) : null;
  if (knownAspect !== null) {
    tile.dataset.aspect = String(knownAspect);
  }
  const customGroup = fullGalleryCustomGroupByPath.get(src);
  if (customGroup) {
    tile.dataset.groupLabel = customGroup.label;
    tile.dataset.groupOrder = String(customGroup.order);
  } else {
    const numberGroup = getNumberedShowGroup(src);
    if (numberGroup !== null) {
      tile.dataset.groupLabel = numberGroup;
      tile.dataset.groupOrder = numberGroup;
    } else {
      tile.dataset.groupLabel = "other";
      tile.dataset.groupOrder = "9999";
    }
  }

  if (typeof item === "string") {
    const img = document.createElement("img");
    if (isBootPinnedTile) {
      assignPinnedImageAttributes(img, item);
    } else if (isFullGalleryPage) {
      if (isGalleryFolderPreviewPath(item)) {
        assignPinnedImageAttributes(img, item);
      } else {
        img.alt = getPhotoAltText(item);
        img.loading = "lazy";
        img.decoding = "async";
        img.dataset.assetPath = item;
        img.src = item;
      }
    } else {
      assignPinnedImageAttributes(img, item);
      img.removeAttribute("fetchpriority");
    }
    tile.appendChild(img);
  } else {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = isBootPinnedTile ? "auto" : "metadata";
    video.dataset.src = item.src;
    tile.appendChild(video);
  }

  if (isBootPinnedTile) {
    markTilePriorityRender(tile);
  }

  tile.addEventListener("click", () => {
    openLightboxFromIndex(mediaIndex);
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

function getTileAspect(tile) {
  const { nw, nh } = readTileNaturalSize(tile);
  const aspect = nw / nh;
  if (Number.isFinite(aspect) && aspect > 0) {
    tile.dataset.aspect = String(aspect);
    tile.dataset.nw = String(nw);
    tile.dataset.nh = String(nh);
    return aspect;
  }
  return parseFloat(tile.dataset.aspect || "1");
}

function prepareFullGalleryTile(tile) {
  tile.classList.add("full-gallery-tile");
  tile.classList.remove(
    "full-gallery-tile--fullwidth",
    "full-gallery-tile--center-x",
    "full-gallery-tile--orphan-portrait"
  );
  tile.style.width = "";
  tile.style.height = "";
  tile.style.flexShrink = "";
}

function appendTilesToFullGalleryGrid(gridEl, tileList) {
  tileList.forEach((tile) => {
    prepareFullGalleryTile(tile);
    gridEl.appendChild(tile);
  });
  if (tileList.length % 2 === 1) {
    const lastTile = tileList[tileList.length - 1];
    if (!lastTile) return;
    lastTile.classList.add("full-gallery-tile--fullwidth");
    if (!isTileLandscape(lastTile)) {
      lastTile.classList.add("full-gallery-tile--orphan-portrait");
    }
  }
  schedulePairedRowHeightSync(gridEl);
}

/** Equalize side-by-side tile heights in 2-col folder grids (DAPHNE-style pairing). */
function syncPairedRowHeightsInGrid(gridEl) {
  if (!gridEl?.classList.contains("portfolio-date-grid")) return;
  if (gridEl.classList.contains("portfolio-date-grid--stacked")) return;

  const tiles = Array.from(
    gridEl.querySelectorAll(":scope > .media-item.full-gallery-tile")
  );
  const gridWidth = gridEl.getBoundingClientRect().width;
  const gapPx = parseFloat(getComputedStyle(gridEl).columnGap || getComputedStyle(gridEl).gap) || 0;
  const colWidth = gridWidth > 0 ? (gridWidth - gapPx) / 2 : 0;

  for (let i = 0; i + 1 < tiles.length; i += 2) {
    const left = tiles[i];
    const right = tiles[i + 1];
    if (!left || !right || right.classList.contains("full-gallery-tile--fullwidth")) break;

    left.style.height = "";
    right.style.height = "";
    let maxH = Math.max(left.getBoundingClientRect().height, right.getBoundingClientRect().height);

    if (maxH < 2 && colWidth > 0) {
      const leftAspect = getTileAspect(left);
      const rightAspect = getTileAspect(right);
      const leftH = leftAspect > 0 ? colWidth / leftAspect : 0;
      const rightH = rightAspect > 0 ? colWidth / rightAspect : 0;
      maxH = Math.max(leftH, rightH);
    }

    if (maxH > 0) {
      left.style.height = `${maxH}px`;
      right.style.height = `${maxH}px`;
    }
  }
}

function schedulePairedRowHeightSync(gridEl) {
  if (!gridEl) return;
  const run = () => syncPairedRowHeightsInGrid(gridEl);
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(run);
  });
  gridEl.querySelectorAll("img").forEach((img) => {
    if (img.complete && img.naturalWidth > 0) return;
    img.addEventListener("load", run, { once: true });
    img.addEventListener("error", run, { once: true });
  });
}

function refineFullGalleryFolderRowHeights(root) {
  if (!root) return;
  root.querySelectorAll(".portfolio-date-grid").forEach((gridEl) => {
    schedulePairedRowHeightSync(gridEl);
  });
}

/** Always-visible folder preview: first two images in source order. */
function renderFolderPreview(parentEl, layoutTiles) {
  const preview = layoutTiles.slice(0, 2);
  if (!preview.length) return;

  preview.forEach((tile) => {
    tile.classList.remove(
      "full-gallery-tile--fullwidth",
      "full-gallery-tile--center-x",
      "full-gallery-tile--orphan-portrait"
    );
  });

  const sameOrientation =
    preview.length === 2 && isTileLandscape(preview[0]) === isTileLandscape(preview[1]);

  if (sameOrientation) {
    const gridEl = document.createElement("div");
    gridEl.className = "portfolio-date-grid portfolio-date-preview-grid";
    appendTilesToFullGalleryGrid(gridEl, preview);
    parentEl.appendChild(gridEl);
  } else {
    preview.forEach((tile) => {
      const gridEl = document.createElement("div");
      gridEl.className = "portfolio-date-grid portfolio-date-preview-grid portfolio-date-grid--stacked";
      prepareFullGalleryTile(tile);
      tile.classList.add("full-gallery-tile--fullwidth");
      gridEl.appendChild(tile);
      parentEl.appendChild(gridEl);
    });
  }

  retainGalleryFolderPreviewTiles(preview);
}

/** Expanded folder body: pair by closest aspect (same rules as DAPHNE preview rows). */
function renderFolderBody(parentEl, tiles) {
  if (!tiles.length) return;

  const orderedPaths = sortPathsForPairedGridLayout(tiles.map(getTileAssetPath));
  const orderedTiles = sortTilesByAssetOrder(tiles, orderedPaths);

  splitTilesIntoSourceOrderOrientationRuns(orderedTiles).forEach((run) => {
    const gridEl = document.createElement("div");
    gridEl.className = "portfolio-date-grid";
    appendTilesToFullGalleryGrid(gridEl, run);
    parentEl.appendChild(gridEl);
  });
}

function getTileAssetPath(tile) {
  const idx = Number(tile.dataset.mediaIndex);
  if (Number.isFinite(idx) && activeGalleryItems[idx]) {
    const item = activeGalleryItems[idx];
    return typeof item === "string" ? item : item.src;
  }
  const img = tile.querySelector("img");
  if (img?.src) {
    const match = img.src.match(/Assets\/optimized\/[^?#]+/);
    if (match) return match[0];
  }
  return "";
}

function sortTilesByAssetOrder(tiles, sourcePaths) {
  const order = new Map(sourcePaths.map((path, index) => [path, index]));
  return [...tiles].sort((a, b) => {
    const rankA = order.get(getTileAssetPath(a)) ?? 9999;
    const rankB = order.get(getTileAssetPath(b)) ?? 9999;
    return rankA - rankB;
  });
}

function sortTilesByFullGalleryListOrder(tiles) {
  const order = new Map();
  fullGalleryNumberedItems.forEach((item, index) => {
    if (typeof item === "string") order.set(item, index);
  });
  return [...tiles].sort((a, b) => {
    const rankA = order.get(getTileAssetPath(a)) ?? 9999;
    const rankB = order.get(getTileAssetPath(b)) ?? 9999;
    return rankA - rankB;
  });
}

function isTileLandscape(tile) {
  return getTileAspect(tile) >= 1;
}

/** Split in source order; each run is same orientation so 2-col rows never mix L+P. */
function splitTilesIntoSourceOrderOrientationRuns(tiles) {
  if (!tiles.length) return [];
  const runs = [];
  let run = [tiles[0]];
  let runLandscape = isTileLandscape(tiles[0]);

  for (let i = 1; i < tiles.length; i += 1) {
    const tile = tiles[i];
    if (isTileLandscape(tile) === runLandscape) {
      run.push(tile);
    } else {
      runs.push(run);
      run = [tile];
      runLandscape = isTileLandscape(tile);
    }
  }
  runs.push(run);
  return runs;
}

/** Render tiles in separate 2-col grids so landscapes and portraits are never side-by-side. */
function appendTilesInOrientationGroups(parentEl, tiles) {
  renderFolderBody(parentEl, tiles);
}

/** Minimal expand/collapse control — full-width banner at folder bottom. */
function createFolderToggleButton(isExpanded) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "portfolio-date-toggle";
  if (isExpanded) btn.classList.add("portfolio-date-toggle--expanded");
  btn.setAttribute("aria-expanded", String(isExpanded));
  btn.setAttribute("aria-label", isExpanded ? "Show Less" : "View More");

  const label = document.createElement("span");
  label.className = "portfolio-date-toggle__label";
  label.textContent = isExpanded ? "Show Less" : "View More";
  btn.appendChild(label);

  const icon = document.createElement("span");
  icon.className = "portfolio-date-toggle__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 9 12 17 20 9"></polyline></svg>';
  btn.appendChild(icon);
  return btn;
}

function setFolderToggleState(btn, isOpen) {
  if (!btn) return;
  btn.classList.toggle("portfolio-date-toggle--expanded", isOpen);
  btn.setAttribute("aria-expanded", String(isOpen));
  btn.setAttribute("aria-label", isOpen ? "Show Less" : "View More");
  const label = btn.querySelector(".portfolio-date-toggle__label");
  if (label) label.textContent = isOpen ? "Show Less" : "View More";
}

/** Small up-arrow control in the folder header — visible only while expanded. */
function createFolderTopCollapseButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "portfolio-date-collapse";
  btn.setAttribute("aria-label", "Show Less");

  const label = document.createElement("span");
  label.className = "portfolio-date-collapse__label";
  label.textContent = "Show Less";
  btn.appendChild(label);

  const icon = document.createElement("span");
  icon.className = "portfolio-date-collapse__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 9 12 17 20 9"></polyline></svg>';
  btn.appendChild(icon);
  return btn;
}

function getGalleryFolderCenteredScrollTarget(sectionEl) {
  if (!sectionEl) return null;
  const scrollTop = getPageScrollTop();
  const rect = sectionEl.getBoundingClientRect();
  const sectionDocTop = rect.top + scrollTop;
  const sectionHeight = rect.height;
  const headerOffset = Math.max(0, getFixedHeaderScrollOffset() - 96);
  const visibleHeight = Math.max(0, window.innerHeight - headerOffset);
  return Math.max(0, sectionDocTop + sectionHeight / 2 - headerOffset - visibleHeight / 2);
}

function getUnionBoundingDocBlock(elements) {
  if (!elements?.length) return null;
  const scrollTop = getPageScrollTop();
  let top = Infinity;
  let bottom = -Infinity;

  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    top = Math.min(top, rect.top);
    bottom = Math.max(bottom, rect.bottom);
  });

  if (!Number.isFinite(top) || !Number.isFinite(bottom)) return null;
  return { top: top + scrollTop, height: Math.max(0, bottom - top) };
}

function getGalleryFolderPreviewCenteredScrollTarget(sectionEl) {
  const rowsWrap = sectionEl?.querySelector(".portfolio-date-rows");
  if (!rowsWrap) return getGalleryFolderCenteredScrollTarget(sectionEl);

  const previewGrids = Array.from(
    rowsWrap.querySelectorAll(":scope > .portfolio-date-preview-grid")
  );
  let block = getUnionBoundingDocBlock(previewGrids);

  if (!block) {
    const previewTiles = Array.from(
      rowsWrap.querySelectorAll(":scope > .portfolio-date-grid .media-item")
    ).slice(0, 2);
    block = getUnionBoundingDocBlock(previewTiles);
  }

  if (!block) return getGalleryFolderCenteredScrollTarget(sectionEl);

  const headerOffset = Math.max(0, getFixedHeaderScrollOffset() - 96);
  const visibleHeight = Math.max(0, window.innerHeight - headerOffset);
  return Math.max(0, block.top + block.height / 2 - headerOffset - visibleHeight / 2);
}

/** Instant jump: center the folder preview row (after collapse or nav pick). */
function scrollToFolderPreview(sectionEl) {
  if (!sectionEl) return;
  const target = getGalleryFolderPreviewCenteredScrollTarget(sectionEl);
  if (target !== null) setPageScrollTop(target);
}

function createPortfolioDateGroupSection(folderDef, gap, isFullGalleryPage) {
  const label = folderDef.label;
  const sources = folderDef.sources || [];
  const layoutTiles = createGridTilesFromPaths(sources);

  const section = document.createElement("section");
  section.className = "portfolio-date-group";
  section.dataset.folderLabel = label;
  if (isFullGalleryPage) {
    section.style.setProperty("--portfolio-section-gap", `${gap}px`);
  }

  const isExpanded = fullGalleryExpandedGroups.has(label);
  section.classList.add(isExpanded ? "portfolio-date-group--expanded" : "portfolio-date-group--collapsed");

  const headerRow = document.createElement("div");
  headerRow.className = "portfolio-date-header";
  const heading = document.createElement("h3");
  heading.className = "portfolio-date-heading";
  heading.textContent = fullGallerySectionTitles[label] || `Placeholder Heading ${label}_`;
  headerRow.appendChild(heading);

  const rowsWrap = document.createElement("div");
  rowsWrap.className = "portfolio-date-rows";
  rowsWrap.style.setProperty("--portfolio-section-gap", `${gap}px`);

  const previewTiles = layoutTiles.slice(0, 2);
  const extraPaths = sources.slice(2);
  const hasCollapsibleExtra = isFullGalleryPage && sources.length > previewTiles.length;

  const topCollapseBtn = hasCollapsibleExtra ? createFolderTopCollapseButton() : null;
  if (topCollapseBtn) {
    headerRow.appendChild(topCollapseBtn);
  }

  if (isFullGalleryPage) {
    retainGalleryFolderPreviewTiles(previewTiles);
    if (!hasCollapsibleExtra) {
      retainGalleryFolderPreviewTiles(layoutTiles);
    }
  }

  if (hasCollapsibleExtra) {
    renderFolderPreview(rowsWrap, previewTiles);

    const extraOuter = document.createElement("div");
    extraOuter.className = "portfolio-date-extra";
    if (isExpanded) {
      extraOuter.classList.add("portfolio-date-extra--open");
    }
    const extraInner = document.createElement("div");
    extraInner.className = "portfolio-date-extra-inner";
    extraOuter.appendChild(extraInner);
    rowsWrap.appendChild(extraOuter);

    if (isExpanded) {
      loadGalleryFolderExpandedImages(extraInner, extraPaths);
    }

    const toggleBtn = createFolderToggleButton(isExpanded);

    const setFolderExpanded = (open) => {
      if (open) {
        fullGalleryExpandedGroups.add(label);
        ensureGalleryFolderExpandedDom(extraInner, extraPaths);
        extraOuter.classList.add("portfolio-date-extra--open");
        section.classList.remove("portfolio-date-group--collapsed");
        section.classList.add("portfolio-date-group--expanded");
        setFolderToggleState(toggleBtn, true);
        refineFullGalleryFolderRowHeights(extraInner);
        void loadGalleryFolderExpandedImages(extraInner, extraPaths);
        return;
      }

      fullGalleryExpandedGroups.delete(label);
      extraOuter.classList.remove("portfolio-date-extra--open");
      section.classList.remove("portfolio-date-group--expanded");
      section.classList.add("portfolio-date-group--collapsed");
      setFolderToggleState(toggleBtn, false);
      void extraOuter.offsetHeight;
      scrollToFolderPreview(section);
    };

    toggleBtn.addEventListener("click", () => {
      setFolderExpanded(!extraOuter.classList.contains("portfolio-date-extra--open"));
    });

    topCollapseBtn.addEventListener("click", () => {
      setFolderExpanded(false);
    });

    section.expandFolder = () => setFolderExpanded(true);

    section.appendChild(headerRow);
    section.appendChild(rowsWrap);
    section.appendChild(toggleBtn);
    return section;
  }

  renderFolderBody(rowsWrap, layoutTiles);
  section.appendChild(headerRow);
  section.appendChild(rowsWrap);
  return section;
}

function getFullGallerySectionGap() {
  const isNarrowPhone = window.innerWidth <= 414;
  const baseGap = isNarrowPhone ? 10 : 16;
  return Math.round(baseGap * 0.8);
}

function getFullGalleryFolderDisplayTitle(label) {
  return fullGallerySectionTitles[label] || `Placeholder Heading ${label}_`;
}

function getFullGalleryLeftGutterPx() {
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const rootFontPx =
    parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const gridMaxPx = Math.min(83.2 * rootFontPx, viewportWidth * 0.8);
  return Math.max(0, (viewportWidth - gridMaxPx) / 2);
}

function ensureFullGalleryFolderNav() {
  let nav = document.getElementById("full-gallery-folder-nav");
  if (!nav) {
    nav = document.createElement("nav");
    nav.id = "full-gallery-folder-nav";
    nav.className = "full-gallery-folder-nav";
    nav.setAttribute("aria-label", "Gallery folders");
    nav.hidden = true;
    const list = document.createElement("ol");
    list.className = "full-gallery-folder-nav__list";
    nav.appendChild(list);
    document.body.appendChild(nav);
  }
  return nav;
}

function renderFullGalleryFolderNav(grid) {
  const nav = ensureFullGalleryFolderNav();
  const list = nav.querySelector(".full-gallery-folder-nav__list");
  if (!list) return;

  list.textContent = "";
  const isDesktop = window.matchMedia("(min-width: 769px)").matches;
  const gutterPx = getFullGalleryLeftGutterPx();
  const folders = getFullGalleryFolderDefinitions();

  if (!isDesktop || folders.length === 0 || gutterPx < 68) {
    nav.hidden = true;
    return;
  }

  nav.hidden = false;
  nav.style.setProperty("--full-gallery-nav-max-width", `${Math.max(56, gutterPx - 14)}px`);

  folders.forEach((folder) => {
    const label = folder.label;
    const li = document.createElement("li");
    li.className = "full-gallery-folder-nav__item";

    const link = document.createElement("a");
    link.className = "full-gallery-folder-nav__link";
    link.href = `#folder-${CSS.escape(label)}`;
    link.textContent = getFullGalleryFolderDisplayTitle(label);

    const section = grid.querySelector(
      `.portfolio-date-group[data-folder-label="${label}"]`
    );
    if (section) {
      section.id = `folder-${label}`;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        if (typeof section.expandFolder === "function") {
          section.expandFolder();
        }
        scrollToFolderPreview(section);
      });
    }

    li.appendChild(link);
    list.appendChild(li);
  });
}

function renderFullGalleryFolders(grid) {
  const gap = getFullGallerySectionGap();
  grid.style.setProperty("--portfolio-section-gap", `${gap}px`);
  grid.textContent = "";

  getFullGalleryFolderDefinitions().forEach((folderDef) => {
    grid.appendChild(createPortfolioDateGroupSection(folderDef, gap, true));
  });

  ensureGalleryFolderGroupObservers(grid);
  grid.querySelectorAll(`[${GALLERY_FOLDER_PREVIEW_ATTR}]`).forEach((tile) => {
    retainGalleryFolderPreviewTile(tile);
  });
  refreshPinnedImageSources(grid);
  warmGalleryFolderPreviewTiles(grid);

  const aboveFoldSections = grid.querySelectorAll(
    ".portfolio-date-group[data-folder-label]"
  );
  for (let i = 0; i < Math.min(3, aboveFoldSections.length); i += 1) {
    const section = aboveFoldSections[i];
    const label = section.dataset.folderLabel;
    if (label) {
      preparedGalleryFolderGroups.add(label);
    }
  }

  preparedGalleryFolderGroups.forEach((label) => {
    const section = grid.querySelector(`.portfolio-date-group[data-folder-label="${label}"]`);
    if (!section) return;
    section.querySelectorAll(`[${GALLERY_FOLDER_PREVIEW_ATTR}]`).forEach((tile) => {
      retainGalleryFolderPreviewTile(tile);
    });
    refreshPinnedImageSources(section);
    if (fullGalleryExpandedGroups.has(label)) {
      const folder = getFullGalleryFolderDefinitions().find((f) => f.label === label);
      const extraInner = section.querySelector(".portfolio-date-extra-inner");
      if (folder && extraInner) {
        loadGalleryFolderExpandedImages(extraInner, folder.sources.slice(2));
      }
    }
  });

  renderFullGalleryFolderNav(grid);
  refineFullGalleryFolderRowHeights(grid);
}

function refineVisibleGalleryFolderLayouts(grid) {
  if (!grid) return;
  grid.querySelectorAll(`[${GALLERY_FOLDER_PREVIEW_ATTR}]`).forEach((tile) => {
    getTileAspect(tile);
  });
  refineFullGalleryFolderRowHeights(grid);
}

function setupFullGalleryPage(grid) {
  activeGalleryItems = fullGalleryNumberedItems;

  renderFullGalleryFolders(grid);
  refineVisibleGalleryFolderLayouts(grid);

  let resizeTimer;
  let lastGalleryWidth = window.innerWidth;
  function onResizeFullGallery() {
    const nextWidth = window.innerWidth;
    if (Math.abs(nextWidth - lastGalleryWidth) < 2) return;
    lastGalleryWidth = nextWidth;
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      renderFullGalleryFolders(grid);
      refineVisibleGalleryFolderLayouts(grid);
    }, 120);
  }
  window.addEventListener("resize", onResizeFullGallery);

  refineFullGalleryFolderRowHeights(grid);
}

// Full-gallery helper: group visible tiles by leading filename number and render
// each numeric bucket as its own section, ordered 1 -> n.
function renderJustifiedPortfolioByNamePrefix(grid, tiles) {
  renderFullGalleryFolders(grid);
}

function setupGridGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;
  const isFullGalleryPage = document.body.classList.contains("page-full-gallery");

  if (isFullGalleryPage) {
    setupFullGalleryPage(grid);
    return;
  }

  const sourceItems = mediaItems;
  activeGalleryItems = sourceItems;
  const fragment = document.createDocumentFragment();
  sourceItems.forEach((item, idx) => fragment.appendChild(createGridTile(item, idx)));
  grid.appendChild(fragment);

  const tiles = Array.from(grid.querySelectorAll(".media-item"));
  const metaEl = document.getElementById("portfolio-meta");
  const filterButtons = Array.from(document.querySelectorAll(".portfolio-filter[data-filter]"));
  const MAX_COLLAPSED_ITEMS = 12;
  let currentFilter = "all";
  const groupByNamePrefix = false;

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
  if (isFullGalleryPage) {
    applyFilter(initialFilter);
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => applyFilter(initialFilter));
    });
  }

  // Refine layout as images load; re-render when aspects change so orientation runs stay correct.
  const refineLayoutFromTiles = (tilesToRefine) => {
    Promise.all(tilesToRefine.map((t) => waitForTileDimensions(t))).then(() => {
      let needsRerender = false;
      tilesToRefine.forEach((t) => {
        const prevAspect = Number(t.dataset.aspect || 0);
        getTileAspect(t);
        const nextAspect = Number(t.dataset.aspect || 0);
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
  };

  refineLayoutFromTiles(tiles);

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
  const se = document.scrollingElement || document.documentElement;
  return window.scrollY ?? se?.scrollTop ?? document.body?.scrollTop ?? 0;
}

function setPageScrollTop(top) {
  const y = Math.max(0, top);
  window.scrollTo({ top: y, behavior: "auto" });
}

/** Actual scroll container for the one-page layout. */
function getOnePageScrollRoot() {
  return document.scrollingElement || document.documentElement || document.body;
}

/** Mobile: one passive scroll listener + one RAF per frame for all scroll-driven UI. */
let mobileScrollBatchRafId = 0;
let mobileScrollListenerBound = false;
const mobileScrollHandlers = [];

function registerMobileScrollHandler(fn) {
  if (!isFlowMobileLayout()) return null;
  mobileScrollHandlers.push(fn);
  ensureMobileScrollListener();
  return () => {
    const index = mobileScrollHandlers.indexOf(fn);
    if (index >= 0) mobileScrollHandlers.splice(index, 1);
  };
}

function ensureMobileScrollListener() {
  if (mobileScrollListenerBound || !mobileScrollHandlers.length) return;
  mobileScrollListenerBound = true;

  const onScroll = () => {
    if (mobileScrollBatchRafId) return;
    mobileScrollBatchRafId = requestAnimationFrame(() => {
      mobileScrollBatchRafId = 0;
      mobileScrollHandlers.slice().forEach((fn) => fn());
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
}

/** Keep finger-scroll position when flow DOM above the fold is rebuilt. */
function preserveScrollPosition(fn) {
  const scrollY = getPageScrollTop();
  fn();
  requestAnimationFrame(() => {
    if (Math.abs(getPageScrollTop() - scrollY) > 2) {
      setPageScrollTop(scrollY);
    }
  });
}

/**
 * Same scroll math as gallery menu in-page links (fixed header offset).
 * @param {Element} target
 * @param {{ instant?: boolean }} [options] Pass `{ instant: true }` for immediate jump (e.g. hire pill).
 */
function isContactScrollTarget(target) {
  if (!target) return false;
  if (target.id === "contact-heading" || target.id === "contact-section") return true;
  return Boolean(target.closest?.(".onepage-section--contact"));
}

function getContactDesktopScrollLiftPx() {
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;width:1.5in;height:0";
  document.documentElement.appendChild(probe);
  const px = probe.getBoundingClientRect().width;
  probe.remove();
  return px;
}

function scrollToSectionWithOffset(target, options) {
  if (!target) return;
  const opts = options || {};
  const root = getOnePageScrollRoot();
  const currentTop = getPageScrollTop();
  const targetTop = target.getBoundingClientRect().top + currentTop;
  // Menu clicks were landing ~1in too high; reduce the header offset for nav jumps.
  const offset = Math.max(0, getFixedHeaderScrollOffset() - 96);
  const contactLift =
    window.matchMedia("(min-width: 769px)").matches && isContactScrollTarget(target)
      ? getContactDesktopScrollLiftPx()
      : 0;
  const destination = Math.max(0, targetTop - offset - contactLift);
  const instant =
    opts.instant === true || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  if (root === document.body || root === document.documentElement) {
    window.scrollTo({ top: destination, behavior: instant ? "auto" : "smooth" });
    return;
  }
  root.scrollTo({ top: destination, behavior: instant ? "auto" : "smooth" });
}

/**
 * Map URL hash fragment id to the element we scroll to on the home page,
 * matching `.gallery-bar__menu-link` targets (e.g. contact uses `#contact-heading`).
 * @param {string} hashId raw id without `#`
 */
function resolveIndexHashScrollTarget(hashId) {
  if (!hashId) return null;
  const id = decodeURIComponent(hashId.split("&")[0]);
  if (id === "contact-section") {
    return document.getElementById("contact-heading") || document.getElementById("contact-section");
  }
  if (id === "gallery-section" || id === "gallery-section-heading") {
    window.location.replace("full-gallery.html");
    return null;
  }
  return document.getElementById(id);
}

function setupMenuAndSections() {
  const isFullGalleryPage = document.body.classList.contains("page-full-gallery");
  const titleEl = document.getElementById("section-title");
  const menuContainer = document.getElementById("gallery-bar-menu");
  const menuLinks = Array.from(document.querySelectorAll(".gallery-bar__menu-link[href^='#']"));
  const allMenuLinks = Array.from(document.querySelectorAll(".gallery-bar__menu-link"));
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

    titleEl.textContent = label;
    titleEl.dataset.sectionLabel = label;
    allMenuLinks.forEach((link) => {
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
        window.requestAnimationFrame(() => {
          if (navLabel === "home") {
            const root = getOnePageScrollRoot();
            if (root === document.body || root === document.documentElement) {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              root.scrollTo({ top: 0, behavior: "smooth" });
            }
            return;
          }
          scrollToSectionWithOffset(target);
        });
      }
    });
  });

  // Scroll spy: keep the menu title aligned with whichever section has crossed
  // the header line (more reliable than a single IntersectionObserver threshold).
  if (isFlowMobileLayout()) {
    registerMobileScrollHandler(updateActiveSectionFromScroll);
  } else {
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
  }
  function onResizeSections() {
    if (!hasMeaningfulLayoutWidthChange()) return;
    clearBrandWidthMorph();
    spyInitialized = false;
    updateActiveSectionFromScroll();
  }

  window.addEventListener("resize", onResizeSections);
  if (isFullGalleryPage) {
    setActiveSection("gallery");
  } else {
    updateActiveSectionFromScroll();
  }

  // Cross-page links (e.g. full gallery → index.html#contact-heading) use the browser's
  // default hash scroll, which does not match our menu's scrollToSectionWithOffset.
  if (!isFullGalleryPage) {
    function applyInitialHashNavigation() {
      const raw = (window.location.hash || "").trim();
      if (!raw || raw === "#") return;
      const hashId = raw.slice(1);
      const el = resolveIndexHashScrollTarget(hashId);
      if (!el) return;

      const navLabel =
        el.dataset?.sectionLabel ?? el.closest?.(".onepage-section")?.dataset?.sectionLabel;
      if (navLabel) {
        ignoreSpyUntil = performance.now() + 1100;
        setActiveSection(navLabel);
        const idx = sections.findIndex((s) => s.dataset.sectionLabel === navLabel);
        if (idx >= 0) {
          spyActiveIndex = idx;
          spyInitialized = true;
        }
      }
      window.requestAnimationFrame(() => scrollToSectionWithOffset(el));
    }
    applyInitialHashNavigation();
  }
}

let contactLayoutRafId = 0;

function isContactTabletLayout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return vw > 768 && (vw <= 1100 || vh <= 920);
}

function updateContactSectionLayout() {
  if (contactLayoutRafId) return;
  contactLayoutRafId = requestAnimationFrame(() => {
    contactLayoutRafId = 0;

    const section = document.querySelector(".page--onepage .onepage-section--contact");
    if (!section) return;

    const card = section.querySelector(".contact__card");
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tabletLayout = isContactTabletLayout();

    section.classList.toggle("onepage-section--contact-tablet", tabletLayout);

    if (vw <= 768) {
      section.style.removeProperty("--contact-section-min-height");
      section.style.removeProperty("--contact-card-max-width");
      section.style.removeProperty("--contact-card-offset-y");
      return;
    }

    if (tabletLayout) {
      const maxW = Math.round(Math.min(680, Math.max(560, vw * 0.62)));
      let minH = Math.round(Math.min(Math.max(vh * 0.78, 520), 760));
      if (card) {
        const needed = card.offsetHeight + 48;
        if (needed > minH) minH = needed;
      }
      section.style.setProperty("--contact-card-max-width", `${maxW}px`);
      section.style.setProperty("--contact-card-offset-y", "0px");
      section.style.setProperty("--contact-section-min-height", `${minH}px`);
      return;
    }

    section.style.removeProperty("--contact-section-min-height");
    section.style.setProperty("--contact-card-max-width", `${Math.min(720, Math.round(vw * 0.56))}px`);
    section.style.setProperty("--contact-card-offset-y", "-4in");
  });
}

function scheduleContactSectionLayout() {
  updateContactSectionLayout();
}

function ensureContactSectionLayoutListener() {
  if (ensureContactSectionLayoutListener.bound) return;
  ensureContactSectionLayoutListener.bound = true;
  window.addEventListener("resize", scheduleContactSectionLayout, { passive: true });
  window.addEventListener(
    "orientationchange",
    () => {
      window.setTimeout(scheduleContactSectionLayout, 250);
    },
    { passive: true }
  );
}

function setupContactBackground() {
  const layerA = document.querySelector(".contact-bg__layer--a");
  const layerB = document.querySelector(".contact-bg__layer--b");
  if (!layerA) return;

  const heroPath = CONTACT_BG_HERO_PATH;
  const contactSection = document.querySelector(".page--onepage .onepage-section--contact");

  let img = layerA.querySelector(".contact-bg__image");
  if (!img) {
    img = document.createElement("img");
    img.className = "contact-bg__image";
    layerA.textContent = "";
    layerA.appendChild(img);
  }

  assignPinnedImageAttributes(img, heroPath);
  layerA.classList.add("is-visible", "contact-bg__layer--static");
  layerB?.classList.remove("is-visible");

  const applyAspect = (w, h) => {
    if (!(w > 0 && h > 0)) return;
    const aspect = `${w} / ${h}`;
    document.documentElement.style.setProperty("--contact-bg-aspect", aspect);
    contactSection?.style.setProperty("--contact-bg-aspect", aspect);
    scheduleContactSectionLayout();
  };

  if (img.complete && img.naturalWidth > 0) {
    applyAspect(img.naturalWidth, img.naturalHeight);
  } else {
    img.addEventListener(
      "load",
      () => applyAspect(img.naturalWidth, img.naturalHeight),
      { once: true }
    );
  }
}

function setupContactBackgroundCrossfade() {
  setupContactBackground();
  ensureContactSectionLayoutListener();
  scheduleContactSectionLayout();
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

function setupHeaderPillsScrollFade() {
  const centerTitle = document.querySelector(".page-center-title");
  const menuPill = document.querySelector(".gallery-bar__brand");
  if (!centerTitle && !menuPill) return;

  let lastTop = getPageScrollTop();
  let ticking = false;
  const deltaThreshold = 2;

  function update() {
    ticking = false;
    const top = getPageScrollTop();
    const delta = top - lastTop;
    lastTop = top;

    if (top <= 8) {
      if (centerTitle) centerTitle.classList.remove("page-center-title--hidden");
      if (menuPill) menuPill.classList.remove("gallery-bar__brand--scroll-hidden");
      return;
    }

    if (delta > deltaThreshold) {
      if (centerTitle) centerTitle.classList.add("page-center-title--hidden");
      if (menuPill && !menuPill.classList.contains("gallery-bar__brand--open")) {
        menuPill.classList.add("gallery-bar__brand--scroll-hidden");
      }
    } else if (delta < -deltaThreshold) {
      if (menuPill && !menuPill.classList.contains("gallery-bar__brand--open")) {
        menuPill.classList.remove("gallery-bar__brand--scroll-hidden");
      }
    }
  }

  if (isFlowMobileLayout()) {
    registerMobileScrollHandler(update);
    return;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  const scrollRoot = getOnePageScrollRoot();
  scrollRoot.addEventListener("scroll", onScroll, { passive: true });
  if (scrollRoot !== window) {
    window.addEventListener("scroll", onScroll, { passive: true });
  }
}

async function waitForHomeFlowLayout(rowsState) {
  let flowStarted = false;

  function runFlowMeasure() {
    measureAndPosition(rowsState);
    const flowReady = rowsState.every((row) => row.segmentWidthPx > 0);
    if (!flowStarted && flowReady) {
      startFlowAnimation(rowsState);
      flowStarted = true;
    }
  }

  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const widthAtPaint = getFlowViewportWidth();
        runFlowMeasure();
        setTimeout(() => {
          const widthNow = Math.round(
            document.documentElement.clientWidth || window.innerWidth
          );
          const widthThreshold = isFlowMobileLayout() ? 56 : 2;
          if (Math.abs(widthNow - widthAtPaint) >= widthThreshold) {
            if (!flowStarted) {
              unlockFlowLayoutViewportWidth();
              preserveScrollPosition(() => {
                measureAndPosition(rowsState, { forceRebuild: true });
              });
              if (rowsState.every((row) => row.segmentWidthPx > 0) && !flowStarted) {
                startFlowAnimation(rowsState);
                flowStarted = true;
              }
            } else {
              updateFlowLayoutWidths(rowsState);
            }
          }
          lockFlowLayoutViewportWidth();
          resolve();
        }, 280);
      });
    });
  });
}

let onePageInitialized = false;

async function initOnePage() {
  if (onePageInitialized) return;
  onePageInitialized = true;

  const isHome = document.body.classList.contains("page-home");

  await siteBootPromise;

  let rowsState = null;

  if (isHome) {
    rowsState = setupRows();
    galleryRowsState = rowsState;
    await waitForHomeFlowLayout(rowsState);
    setupContactBackground();
    ensureContactSectionLayoutListener();
    scheduleContactSectionLayout();
  }

  await prepareVisibleMediaBeforeUnlock();
  releaseSiteBootGate();

  let flowStarted = rowsState?.every((row) => row.segmentWidthPx > 0) ?? false;
  function runFlowMeasure() {
    if (!rowsState) return;
    measureAndPosition(rowsState);
    const flowReady = rowsState.every((row) => row.segmentWidthPx > 0);
    if (!flowStarted && flowReady) {
      startFlowAnimation(rowsState);
      flowStarted = true;
    }
  }

  if (!isHome) {
    rowsState = setupRows();
    galleryRowsState = rowsState;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        runFlowMeasure();
      });
    });
  }

  const flowGallery = document.querySelector(".gallery");
  flowGallery?.addEventListener("mouseleave", () => {
    magneticCursorX = null;
    magneticCursorY = null;
    magneticCursorItem = null;
    galleryRowsState?.forEach((row) =>
      row.mediaElements?.forEach((el) => el.style.setProperty("--scale", "1"))
    );
  });

  let resizeTimeout;

  function applyFlowLayoutWidthChange() {
    if (!rowsState) return;
    if (hasFlowLayoutModeChange()) {
      rowsState = setupRows();
      galleryRowsState = rowsState;
      preserveScrollPosition(() => {
        measureAndPosition(rowsState, { forceRebuild: true });
      });
      refreshFlowTrackAnimations();
      flowStarted = rowsState.every((row) => row.segmentWidthPx > 0);
      return;
    }
    const nextWidth = Math.max(
      1,
      Math.round(document.documentElement.clientWidth || window.innerWidth)
    );
    if (isFlowMobileLayout()) {
      unlockFlowLayoutViewportWidth();
      flowLayoutViewportWidth = nextWidth;
      lockFlowLayoutViewportWidth();
    }
    const flowReady = rowsState.every((row) => (row.segmentTileCount || 0) > 0);
    if (flowReady) {
      updateFlowLayoutWidths(rowsState);
    } else {
      preserveScrollPosition(() => {
        measureAndPosition(rowsState);
      });
    }
    refreshFlowTrackAnimations();
  }

  function scheduleFlowRemeasure() {
    const pendingModeChange =
      lastFlowLayoutMode !== null && getFlowLayoutMode() !== lastFlowLayoutMode;
    if (!hasMeaningfulLayoutWidthChange() && !pendingModeChange) return;
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      applyFlowLayoutWidthChange();
      scheduleHomeFlowHeadingFit();
    }, 150);
  }

  window.addEventListener("resize", () => {
    scheduleFlowRemeasure();
    scheduleHomeFlowHeadingFit();
  }, { passive: true });
  window.addEventListener(
    "orientationchange",
    () => {
      window.setTimeout(() => {
        const pendingModeChange =
          lastFlowLayoutMode !== null && getFlowLayoutMode() !== lastFlowLayoutMode;
        if (hasMeaningfulLayoutWidthChange() || pendingModeChange) {
          applyFlowLayoutWidthChange();
        }
        scheduleHomeFlowHeadingFit();
      }, 250);
    },
    { passive: true }
  );

  setupGridGallery();
  initSharedPageUi();

  if (isHome) {
    ensureFlowRewarmListener();
    maybeRewarmFlowGallery();
    maybeRewarmContactBackground();
    scheduleHomeFlowHeadingFit();
    scheduleViewGalleryHoverPrewarm();
    if (document.fonts?.ready) {
      document.fonts.ready.then(scheduleHomeFlowHeadingFit).catch(() => {});
    }
  }
}

/** Boot on DOMContentLoaded (not window.load) so image downloads never delay page setup. */
function scheduleOnePageInit() {
  if (document.body?.classList.contains("page-full-gallery")) return;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOnePage, { once: true });
  } else {
    initOnePage();
  }
}

scheduleOnePageInit();

let fullGalleryPageInitialized = false;

function initSharedPageUi() {
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

  setupScrollReveal();
  setupStableViewportBackgrounds();
  setupMenuAndSections();
  setupContactBackgroundCrossfade();
  setupContactForm();
  setupHeaderPillsScrollFade();
}

async function initFullGalleryPage() {
  if (fullGalleryPageInitialized) return;
  fullGalleryPageInitialized = true;

  await siteBootPromise;
  refreshPinnedImageSources();
  setupGridGallery();
  await prepareVisibleMediaBeforeUnlock();
  releaseSiteBootGate();
  initSharedPageUi();
  ensureGalleryPreviewRewarmListener();
  maybeRewarmGalleryFolderPreviews();
}

function scheduleFullGalleryInit() {
  if (fullGalleryPageInitialized) return;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFullGalleryPage, { once: true });
  } else {
    initFullGalleryPage();
  }
}

if (document.body?.classList.contains("page-full-gallery")) {
  scheduleFullGalleryInit();
}

(function () {
  const form = document.getElementById("contact-form");
  if (!form) return;

  // Crossfade background slideshow (contact page)
  const bgA = document.querySelector(".contact-bg__layer--a");
  const bgB = document.querySelector(".contact-bg__layer--b");
  const bgImages = [
    "DSC_0166-2.jpg",
    "DSC_0173.jpg",
    "DSC_0104.jpg",
    "DSC_0179.jpg",
    "DSC_0128-2.jpg",
    "DSC_0168.jpg",
  ];

  (function initCrossfade() {
    if (!bgA || !bgB) return;

    // Preload to avoid flashes/black frames
    bgImages.forEach(function (src) {
      const img = new Image();
      img.src = src;
    });

    let index = 0;
    let showingA = true;
    const fadeMs = 1600;
    const holdMs = 25000;

    function setLayer(el, src) {
      el.style.backgroundImage = 'url("' + src + '")';
    }

    // Start with A visible
    setLayer(bgA, bgImages[index]);
    bgA.classList.add("is-visible");
    bgB.classList.remove("is-visible");

    window.setInterval(function () {
      const nextIndex = (index + 1) % bgImages.length;
      const incoming = showingA ? bgB : bgA;
      const outgoing = showingA ? bgA : bgB;

      setLayer(incoming, bgImages[nextIndex]);

      // Ensure incoming is behind the outgoing until it fades in
      incoming.classList.remove("is-fading-out");
      outgoing.classList.remove("is-fading-in");

      // Force reflow so transition reliably runs
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
  })();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const subject = (form.querySelector('[name="subject"]') || {}).value || "";
    const body = (form.querySelector('[name="body"]') || {}).value || "";
    const mailto =
      "mailto:zachariahsavage@gmail.com" +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
    window.location.href = mailto;
  });

  // Hamburger menu (same behavior as on index)
  const menuContainer = document.getElementById("gallery-bar-menu");
  const menuTrigger = document.querySelector(".gallery-bar__menu-trigger");
  const menuContent = document.querySelector(".gallery-bar__menu-content");
  if (menuContainer && menuTrigger && menuContent) {
    menuTrigger.addEventListener("click", function () {
      const isOpen = menuContainer.classList.toggle("gallery-bar__brand--open");
      menuTrigger.setAttribute("aria-expanded", String(isOpen));
      menuTrigger.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      menuContent.setAttribute("aria-hidden", String(!isOpen));
    });

    // Click heading (CONTACT) to open/close menu
    const titleEl = menuContainer.querySelector(".gallery-bar__title");
    if (titleEl) {
      titleEl.addEventListener("click", function () {
        menuTrigger.click();
      });
    }

    // Close menu when clicking outside the pill
    document.addEventListener("click", function (event) {
      if (!menuContainer.classList.contains("gallery-bar__brand--open")) return;
      if (menuContainer.contains(event.target)) return;
      menuContainer.classList.remove("gallery-bar__brand--open");
      menuTrigger.setAttribute("aria-expanded", "false");
      menuTrigger.setAttribute("aria-label", "Open menu");
      menuContent.setAttribute("aria-hidden", "true");
    });
  }
})();

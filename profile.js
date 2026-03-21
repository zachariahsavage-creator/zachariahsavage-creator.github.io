(function () {
  // Hamburger menu (same behavior as other pages)
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

    // Click heading (PROFILE) to open/close menu
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

  // Autoplay profile videos (best-effort; mobile may require user gesture)
  document.querySelectorAll(".profile__video, .profile-bg__video").forEach(function (vid) {
    try {
      vid.muted = true;
      vid.playsInline = true;
      const p = vid.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    } catch (e) {}
  });

  // Simple hero image cycle using the stills that previously lived
  // on the profile page, with a straightforward fade-out / fade-in
  // to avoid any flicker.
  var heroImg = document.querySelector(".profile__hero-img");
  if (heroImg) {
    var heroSources = [
      "DSC_4821.jpg",
      "DSC_2575.jpg",
      "DSC_2065.jpg",
      "DSC_4623.jpg"
    ];
    var currentHeroIndex = 0;
    var FADE_MS = 420;
    var INTERVAL_MS = 4000;

    // Preload images so swaps are immediate when opacity is 0.
    heroSources.forEach(function (src) {
      var img = new Image();
      img.src = src;
    });

    setInterval(function () {
      var nextIndex = (currentHeroIndex + 1) % heroSources.length;

      // Fade out current image
      heroImg.style.opacity = "0";

      setTimeout(function () {
        // Swap source while invisible, then fade back in.
        heroImg.src = heroSources[nextIndex];
        currentHeroIndex = nextIndex;
        heroImg.style.opacity = "1";
      }, FADE_MS);
    }, INTERVAL_MS);
  }

})();


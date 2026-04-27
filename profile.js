(function () {
  if (typeof window.setupGalleryBarMenu === "function") {
    window.setupGalleryBarMenu();
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
      "6_4821.webp",
      "5_2575.webp",
      "5_2065.webp",
      "6_4623.webp"
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


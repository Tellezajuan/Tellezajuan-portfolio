(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var themeButtons = Array.prototype.slice.call(document.querySelectorAll(".theme-toggle"));
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var mobileMenu = document.querySelector(".mobile-menu");
  var mobileGroups = Array.prototype.slice.call(document.querySelectorAll(".mobile-nav-group"));
  var desktopGroups = Array.prototype.slice.call(document.querySelectorAll(".desktop-nav .nav-group"));

  function isDark() {
    return root.getAttribute("data-theme") === "dark";
  }

  function syncTheme() {
    var dark = isDark();
    themeButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", dark ? "true" : "false");
      button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      var icon = button.querySelector("[aria-hidden]");
      if (icon) icon.textContent = dark ? "☀" : "◐";
    });
    if (themeMeta) themeMeta.setAttribute("content", dark ? "#121619" : "#f5f3ee");
  }

  syncTheme();
  themeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      if (next === "dark") root.setAttribute("data-theme", "dark");
      else root.removeAttribute("data-theme");
      try { localStorage.setItem("theme", next); } catch (error) {}
      syncTheme();
    });
  });

  function closeDesktopGroups(except) {
    desktopGroups.forEach(function (group) {
      if (group !== except) group.open = false;
    });
  }

  desktopGroups.forEach(function (group) {
    group.addEventListener("toggle", function () {
      if (group.open) closeDesktopGroups(group);
    });
  });

  function closeMobileMenu(returnFocus) {
    if (!mobileMenu || !mobileMenu.open) return;
    mobileMenu.open = false;
    body.classList.remove("mobile-nav-open");
    if (returnFocus) mobileMenu.querySelector("summary").focus();
  }

  if (mobileMenu) {
    mobileMenu.addEventListener("toggle", function () {
      body.classList.toggle("mobile-nav-open", mobileMenu.open);
    });
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { closeMobileMenu(false); });
    });
  }

  mobileGroups.forEach(function (group) {
    group.addEventListener("toggle", function () {
      if (!group.open) return;
      mobileGroups.forEach(function (other) {
        if (other !== group) other.open = false;
      });
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    var openGroup = desktopGroups.find(function (group) { return group.open; });
    if (openGroup) {
      openGroup.open = false;
      openGroup.querySelector("summary").focus();
    }
    closeMobileMenu(true);
  });

  document.addEventListener("click", function (event) {
    desktopGroups.forEach(function (group) {
      if (group.open && !group.contains(event.target)) group.open = false;
    });
    if (mobileMenu && mobileMenu.open && !mobileMenu.contains(event.target)) closeMobileMenu(false);
  });

  var desktopQuery = window.matchMedia("(min-width: 901px)");
  function resetNavigationForViewport(event) {
    if (event.matches) closeMobileMenu(false);
    else closeDesktopGroups(null);
  }
  if (desktopQuery.addEventListener) desktopQuery.addEventListener("change", resetNavigationForViewport);

  var current = (body.getAttribute("data-route") || location.pathname.split("/").pop() || "index.html").split("#")[0];
  var builderRequested = current === "_patterns.html" || new URLSearchParams(location.search).get("layout") === "1";
  if (builderRequested) {
    body.classList.add("layout-debug");
    var builderBar = document.createElement("aside");
    builderBar.className = "builder-toolbar";
    builderBar.setAttribute("aria-label", "Layout builder controls");
    builderBar.innerHTML = '<div><strong>Layout map</strong><span>' + current + ' · ' + (body.dataset.recipe || "page") + '</span></div><button type="button">Hide boxes</button><a href="_patterns.html">Component showroom</a>';
    var builderButton = builderBar.querySelector("button");
    builderButton.addEventListener("click", function () {
      var visible = body.classList.toggle("layout-debug");
      builderButton.textContent = visible ? "Hide boxes" : "Show boxes";
    });
    body.appendChild(builderBar);
  }

  var dialog = document.querySelector(".image-dialog");
  var dialogImage = dialog && dialog.querySelector("img");
  var dialogCaption = dialog && dialog.querySelector("p");
  var dialogStatus = dialog && dialog.querySelector(".image-dialog-status");
  var dialogPrevious = dialog && dialog.querySelector(".dialog-prev");
  var dialogNext = dialog && dialog.querySelector(".dialog-next");
  var dialogTrigger = null;
  var dialogItems = [];
  var dialogIndex = 0;
  function closeDialog() { if (dialog && dialog.open) dialog.close(); }

  function lightboxGroup(image) {
    var scope = image.closest(".carousel, .tour, .media-grid, .site-section") || document;
    return Array.prototype.slice.call(scope.querySelectorAll("img[data-lightbox]"));
  }

  function imageCaption(image) {
    var figure = image.closest("figure");
    var caption = figure && figure.querySelector("figcaption");
    return caption ? caption.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function showDialogItem(index) {
    if (!dialogItems.length || !dialogImage) return;
    dialogIndex = (index + dialogItems.length) % dialogItems.length;
    var image = dialogItems[dialogIndex];
    dialogImage.src = image.currentSrc || image.src;
    dialogImage.alt = image.alt || "Expanded portfolio image";
    if (dialogCaption) dialogCaption.textContent = imageCaption(image);
    var multiple = dialogItems.length > 1;
    if (dialogPrevious) dialogPrevious.hidden = !multiple;
    if (dialogNext) dialogNext.hidden = !multiple;
    if (dialogStatus) dialogStatus.textContent = multiple ? (dialogIndex + 1) + " / " + dialogItems.length : "";
  }

  document.querySelectorAll("img[data-lightbox]").forEach(function (image) {
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", (image.alt || "Portfolio image") + ". Open larger view.");
    image.addEventListener("click", function () {
      if (!dialog || !dialogImage) return;
      dialogTrigger = image;
      dialogItems = lightboxGroup(image);
      showDialogItem(dialogItems.indexOf(image));
      if (dialog.showModal) dialog.showModal();
    });
    image.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        image.click();
      }
    });
  });

  var closeButton = dialog && dialog.querySelector(".dialog-close");
  if (closeButton) closeButton.addEventListener("click", closeDialog);
  if (dialogPrevious) dialogPrevious.addEventListener("click", function () { showDialogItem(dialogIndex - 1); });
  if (dialogNext) dialogNext.addEventListener("click", function () { showDialogItem(dialogIndex + 1); });
  if (dialog) dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeDialog();
  });
  if (dialog) dialog.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showDialogItem(dialogIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showDialogItem(dialogIndex + 1);
    }
  });
  if (dialog) dialog.addEventListener("close", function () {
    if (dialogTrigger) dialogTrigger.focus();
    dialogTrigger = null;
    dialogItems = [];
    if (dialogStatus) dialogStatus.textContent = "";
  });

  document.querySelectorAll(".carousel, .tour").forEach(function (group) {
    var track = group.querySelector(".carousel-track, .tour-track");
    if (!track) return;
    var slides = Array.prototype.slice.call(track.querySelectorAll(".carousel-slide, .tour-slide"));
    var previous = group.querySelector(".carousel-prev, .tour-prev");
    var next = group.querySelector(".carousel-next, .tour-next");
    var status = group.querySelector(".gallery-status");
    var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var behavior = function () { return motion.matches ? "auto" : "smooth"; };
    var nearestIndex = function () {
      if (!slides.length) return 0;
      var trackLeft = track.getBoundingClientRect().left;
      return slides.reduce(function (best, item, index) {
        var distance = Math.abs(item.getBoundingClientRect().left - trackLeft);
        return distance < best.distance ? { index: index, distance: distance } : best;
      }, { index: 0, distance: Infinity }).index;
    };
    var updateStatus = function () {
      if (!status || !slides.length) return;
      status.textContent = (nearestIndex() + 1) + " of " + slides.length;
    };
    var moveBy = function (delta) {
      if (!slides.length) return;
      var targetIndex = Math.max(0, Math.min(slides.length - 1, nearestIndex() + delta));
      var trackLeft = track.getBoundingClientRect().left;
      var targetLeft = slides[targetIndex].getBoundingClientRect().left - trackLeft + track.scrollLeft;
      track.scrollTo({ left: targetLeft, behavior: behavior() });
    };
    if (previous) previous.addEventListener("click", function () { moveBy(-1); });
    if (next) next.addEventListener("click", function () { moveBy(1); });
    if (status) {
      var queued = false;
      track.addEventListener("scroll", function () {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () {
          updateStatus();
          queued = false;
        });
      }, { passive: true });
      updateStatus();
    }
  });
})();

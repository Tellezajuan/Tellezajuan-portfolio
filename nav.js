(function () {
  "use strict";

  var root = document.documentElement;
  var MOON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>';
  var SUN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
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
      var icon = button.querySelector(".theme-icon");
      if (icon) icon.innerHTML = dark ? SUN_ICON : MOON_ICON;
    });
    if (themeMeta) themeMeta.setAttribute("content", dark ? "#121619" : "#f5f3ee");
  }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  syncTheme();
  themeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      var apply = function () {
        if (next === "dark") root.setAttribute("data-theme", "dark");
        else root.removeAttribute("data-theme");
        try { localStorage.setItem("theme", next); } catch (error) {}
        syncTheme();
      };
      if (document.startViewTransition && !reducedMotion.matches) document.startViewTransition(apply);
      else apply();
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
    return Array.prototype.slice.call(scope.querySelectorAll("img[data-lightbox]")).filter(function (item) {
      return item.getClientRects().length > 0;
    });
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
    var source = image.currentSrc || image.src;
    if (dialog.open && dialogImage.src !== source) {
      dialogImage.classList.add("is-swapping");
      dialogImage.onload = function () { dialogImage.classList.remove("is-swapping"); };
    }
    dialogImage.src = source;
    [dialogIndex - 1, dialogIndex + 1].forEach(function (index) {
      var neighbour = dialogItems[(index + dialogItems.length) % dialogItems.length];
      if (neighbour && neighbour !== image) new Image().src = neighbour.currentSrc || neighbour.src;
    });
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
  var swipeStart = null;
  if (dialog) dialog.addEventListener("pointerdown", function (event) {
    swipeStart = event.pointerType === "mouse" ? null : event.clientX;
  });
  if (dialog) dialog.addEventListener("pointerup", function (event) {
    if (swipeStart === null || dialogItems.length < 2) return;
    var distance = event.clientX - swipeStart;
    swipeStart = null;
    if (Math.abs(distance) > 48) showDialogItem(dialogIndex + (distance < 0 ? 1 : -1));
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

  function sketch(illustration) {
    Array.prototype.forEach.call(illustration.children, function (shape, index) {
      shape.style.setProperty("--i", Math.min(index, 30));
    });
    illustration.classList.add("is-drawing");
  }

  // Give each part of a diagram its order so it can step in after the one before.
  var DIAGRAM_PARTS = ".process-flow > *, .report-snapshots > *, .verdict-distribution > *, .posting-checks > *, " +
    ".metrics > *, .visual-stat-pair > *, .evidence-stack > *, .rule-card > *, .career-path > .career-stop, .posting-card mark";
  function orderParts(scope) {
    scope.querySelectorAll(DIAGRAM_PARTS).forEach(function (part) {
      part.style.setProperty("--i", Array.prototype.indexOf.call(part.parentElement.children, part));
    });
    scope.querySelectorAll(".posting-card").forEach(function (card) {
      card.querySelectorAll("mark").forEach(function (mark, index) { mark.style.setProperty("--i", index); });
    });
    scope.querySelectorAll(".nested-scale").forEach(function (nest) {
      nest.querySelectorAll(".nested-layer").forEach(function (layer, depth) { layer.style.setProperty("--i", depth); });
    });
  }

  if (root.classList.contains("motion-ready")) {
    orderParts(document);
    document.querySelectorAll(".page-intro .illo").forEach(sketch);
    var fold = window.innerHeight * 0.92;
    var candidates = document.querySelectorAll(
      ".section-shell > :not(.card-grid):not(.media-grid):not(.project-directory):not(.compare-table-wrap), " +
      ".section-shell .card-grid > *, .section-shell .media-grid > *, .project-tile-grid > *, .compare-table tbody tr"
    );
    var reveal = new IntersectionObserver(function (entries) {
      var order = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var element = entry.target;
        element.style.setProperty("--reveal-order", Math.min(order++, 5));
        element.setAttribute("data-reveal", "shown");
        element.querySelectorAll(".illo").forEach(sketch);
        reveal.unobserve(element);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    Array.prototype.forEach.call(candidates, function (element) {
      if (element.parentElement.closest("[data-reveal]") || element.getBoundingClientRect().top < fold) return;
      element.setAttribute("data-reveal", "pending");
      reveal.observe(element);
    });
    window.addEventListener("beforeprint", function () {
      document.querySelectorAll('[data-reveal="pending"]').forEach(function (element) {
        element.setAttribute("data-reveal", "shown");
      });
    });
  }

  // Decision-day slider: read the same report at different times.
  Array.prototype.forEach.call(document.querySelectorAll(".time-slider"), function (box, n) {
    var steps;
    try { steps = JSON.parse(box.getAttribute("data-steps")); } catch (error) { return; }
    if (!steps || !steps.length) return;
    var id = "time-slider-" + n;
    var cols = steps.map(function (step, i) {
      return '<span class="ts-col" data-i="' + i + '"><span class="ts-bar"><span style="height:' + step.share + '%"></span></span>' +
        '<span class="ts-col-label">' + step.when.replace(" later", "") + "</span></span>";
    }).join("");
    box.innerHTML =
      '<div class="ts-readout" aria-hidden="true"><span class="ts-when"></span><strong class="ts-share"></strong>' +
      '<span class="ts-share-label">of the eventual credit existed</span><span class="ts-count"></span></div>' +
      '<div class="ts-bars" aria-hidden="true">' + cols + "</div>" +
      '<label class="ts-label" for="' + id + '">Drag to read the same report later</label>' +
      '<input class="ts-range" id="' + id + '" type="range" min="0" max="' + (steps.length - 1) + '" step="1">';
    var range = box.querySelector(".ts-range");
    var when = box.querySelector(".ts-when");
    var share = box.querySelector(".ts-share");
    var count = box.querySelector(".ts-count");
    var columns = Array.prototype.slice.call(box.querySelectorAll(".ts-col"));
    function show(i) {
      var step = steps[i];
      range.value = i;
      when.textContent = step.when + (step.flag ? " · " + step.flag : "");
      share.textContent = step.share + "%";
      count.innerHTML = "<strong>" + step.count + "</strong> campaigns look worth scaling";
      range.setAttribute("aria-valuetext", step.when + ": " + step.share + "% of the eventual credit existed, and " +
        step.count + " campaigns looked worth scaling" + (step.flag ? ". " + step.flag + " at this reading." : "."));
      columns.forEach(function (column, j) {
        column.classList.toggle("is-active", j === i);
        column.classList.toggle("is-flag", !!steps[j].flag);
      });
      box.classList.toggle("is-at-flag", !!step.flag);
    }
    range.addEventListener("input", function () { show(parseInt(range.value, 10)); });
    columns.forEach(function (column) {
      column.addEventListener("click", function () {
        show(parseInt(column.getAttribute("data-i"), 10));
        range.focus();
      });
    });
    var start = parseInt(box.getAttribute("data-start") || "0", 10);
    show(isNaN(start) ? 0 : Math.max(0, Math.min(steps.length - 1, start)));
    box.hidden = false;
    var figure = box.closest("figure");
    if (figure) figure.classList.add("has-slider");
  });

  // On-page menu for long pages: always open on wide screens, a toggle on
  // phones, and it marks the section being read.
  var toc = document.querySelector(".page-toc");
  var tocBar = document.querySelector(".page-toc-bar");
  if (toc && tocBar) {
    var wide = window.matchMedia("(min-width: 681px)");
    var tocSummary = toc.querySelector("summary");
    var tocSummaryText = tocSummary ? tocSummary.textContent : "";
    var tocLinks = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    var tocTargets = tocLinks.map(function (link) {
      return document.getElementById(link.getAttribute("href").slice(1));
    });
    var tocQueued = false;
    var syncTocOpen = function () { toc.open = wide.matches; };
    var markSection = function () {
      tocQueued = false;
      var line = tocBar.getBoundingClientRect().bottom + 24;
      var current = -1;
      tocTargets.forEach(function (target, i) {
        if (target && target.getBoundingClientRect().top <= line) current = i;
      });
      tocLinks.forEach(function (link, i) {
        if (i === current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      if (tocSummary) {
        tocSummary.textContent = current >= 0 ? "On this page · " + tocLinks[current].textContent : tocSummaryText;
      }
    };
    syncTocOpen();
    markSection();
    if (wide.addEventListener) wide.addEventListener("change", syncTocOpen);
    window.addEventListener("scroll", function () {
      if (!tocQueued) {
        tocQueued = true;
        window.requestAnimationFrame(markSection);
      }
    }, { passive: true });
    toc.addEventListener("click", function (event) {
      if (!wide.matches && event.target.closest("a")) toc.open = false;
    });
  }

  // Analytics stays off until an endpoint is set. Paste a GoatCounter endpoint
  // (https://NAME.goatcounter.com/count) to count page views plus LinkedIn,
  // resume, and YouTube clicks. No cookies, no personal data.
  var ANALYTICS_ENDPOINT = "";
  if (ANALYTICS_ENDPOINT) {
    var counter = document.createElement("script");
    counter.async = true;
    counter.src = "https://gc.zgo.at/count.js";
    counter.setAttribute("data-goatcounter", ANALYTICS_ENDPOINT);
    document.head.appendChild(counter);
    document.addEventListener("click", function (event) {
      var link = event.target.closest && event.target.closest("a[href]");
      if (!link || !window.goatcounter || !window.goatcounter.count) return;
      var href = link.getAttribute("href");
      var name = /linkedin\.com/.test(href) ? "linkedin-click" : /\.pdf$/.test(href) ? "resume-download" : /youtube\.com/.test(href) ? "youtube-click" : "";
      if (name) window.goatcounter.count({ path: name, title: document.title, event: true });
    });
  }
})();

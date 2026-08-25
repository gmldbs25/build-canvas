(function () {
  "use strict";

  var data = window.TEXAS_TRACE_DATA;

  if (!data) {
    document.body.innerHTML = '<main class="data-error">Texas Trace data could not be loaded.</main>';
    return;
  }

  var adapter = window.TexasTraceDataAdapter.create(data);
  var steps = adapter.getSteps();
  var mapController = null;
  var photoController = null;
  var stepController = null;
  var isTransitioning = false;
  var hasRenderedInitialState = false;
  var latestState = null;

  var elements = {
    currentStepNumber: document.getElementById("current-step-number"),
    totalStepNumber: document.getElementById("total-step-number"),
    pointRole: document.getElementById("point-role"),
    routeLabel: document.getElementById("route-label"),
    pointTitle: document.getElementById("point-title"),
    pointSubtitle: document.getElementById("point-subtitle"),
    pointSummary: document.getElementById("point-summary"),
    coordinateNote: document.getElementById("coordinate-note"),
    progressDots: document.getElementById("progress-dots"),
    prevButton: document.getElementById("prev-step"),
    nextButton: document.getElementById("next-step"),
    player: document.querySelector(".journey-player")
  };

  function padStep(value) {
    return String(value).padStart(2, "0");
  }

  function routeLabelForState(state) {
    if (state.currentRouteLink) {
      return state.currentRouteLink.label + " · " + state.currentRouteLink.type;
    }

    if (!state.previousStepId) {
      return "Journey start";
    }

    return "No routeLink for this transition";
  }

  function renderProgress(state) {
    Array.prototype.forEach.call(elements.progressDots.children, function (dot) {
      var stepId = Number(dot.dataset.stepId);
      dot.classList.toggle("is-current", stepId === state.currentStepId);
      dot.classList.toggle("is-visited", state.visitedStepIds.has(stepId));
    });
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function updateControls(state) {
    elements.prevButton.disabled = isTransitioning || state.currentStepIndex === 0;
    elements.nextButton.disabled = isTransitioning || state.currentStepIndex === steps.length - 1;
  }

  function setTransitioning(nextValue, state) {
    isTransitioning = Boolean(nextValue);
    if (elements.player) {
      elements.player.classList.toggle("is-transitioning", isTransitioning);
    }
    if (state) {
      updateControls(state);
    }
  }

  function renderText(state) {
    var step = adapter.getStepById(state.currentStepId);
    var location = adapter.getLocationForStep(state.currentStepId);
    var presentation = adapter.getPresentation(step);

    elements.currentStepNumber.textContent = padStep(state.currentStepIndex + 1);
    elements.pointRole.textContent = step.role;
    elements.routeLabel.textContent = routeLabelForState(state);
    elements.pointTitle.textContent = presentation.headline;
    elements.pointSubtitle.textContent = step.subtitle;
    elements.pointSummary.textContent = presentation.shortText;
    elements.coordinateNote.textContent = location
      ? location.officialName + " · " + location.coordinateStatus
      : "Location data missing";

    updateControls(state);
  }

  function renderState(state) {
    var step = adapter.getStepById(state.currentStepId);
    latestState = state;

    if (!hasRenderedInitialState) {
      hasRenderedInitialState = true;
      renderText(state);
      renderProgress(state);

      if (mapController) {
        mapController.renderState(state, { immediate: true });
      }

      if (photoController && step) {
        photoController.render(step);
      }
      return;
    }

    transitionToState(state, step);
  }

  function transitionToState(state, step) {
    setTransitioning(true, state);

    delay(180)
      .then(function () {
        if (mapController) {
          return mapController.renderState(state);
        }
        return Promise.resolve();
      })
      .then(function () {
        renderText(state);
        renderProgress(state);

        if (photoController && step) {
          photoController.render(step);
        }

        return delay(120);
      })
      .then(function () {
        setTransitioning(false, state);
      })
      .catch(function () {
        renderText(state);
        renderProgress(state);
        if (photoController && step) {
          photoController.render(step);
        }
        setTransitioning(false, state);
      });
  }

  function requestStep(stepId) {
    var state = stepController.getState();
    if (isTransitioning) {
      return;
    }
    if (state.currentStepId === stepId) {
      return;
    }
    setTransitioning(true, latestState || state);
    stepController.goToStep(stepId);
  }

  function requestNext() {
    var state = stepController.getState();
    if (isTransitioning) {
      return;
    }
    if (state.currentStepIndex >= steps.length - 1) {
      return;
    }
    setTransitioning(true, latestState || state);
    stepController.next();
  }

  function requestPrev() {
    var state = stepController.getState();
    if (isTransitioning) {
      return;
    }
    if (state.currentStepIndex <= 0) {
      return;
    }
    setTransitioning(true, latestState || state);
    stepController.prev();
  }

  function createProgressDots() {
    elements.progressDots.innerHTML = "";

    steps.forEach(function (step, index) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "progress-dot";
      dot.dataset.stepId = step.stepId;
      dot.dataset.tooltip = padStep(index + 1) + ": " + step.title;
      dot.setAttribute("aria-label", "Go to step " + (index + 1) + ": " + step.title);
      dot.addEventListener("click", function () {
        requestStep(step.stepId);
      });
      elements.progressDots.appendChild(dot);
    });
  }

  function bindControls() {
    elements.prevButton.addEventListener("click", function () {
      requestPrev();
    });

    elements.nextButton.addEventListener("click", function () {
      requestNext();
    });

    document.addEventListener("keydown", function (event) {
      var lightbox = document.getElementById("photo-lightbox");
      if (lightbox && !lightbox.hidden) {
        return;
      }

      if (event.key === "ArrowRight") {
        requestNext();
      }

      if (event.key === "ArrowLeft") {
        requestPrev();
      }
    });
  }

  function init() {
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    elements.totalStepNumber.textContent = padStep(steps.length);
    createProgressDots();

    stepController = window.TexasTraceStepController.create(adapter, renderState);

    mapController = window.TexasTraceMap.init({
      adapter: adapter,
      mapElement: document.getElementById("trace-map"),
      maskElement: document.getElementById("map-transition-mask"),
      fallbackElement: document.getElementById("map-fallback"),
      onMarkerSelect: function (stepId) {
        requestStep(stepId);
      }
    });

    photoController = window.TexasTracePhotoController.create({
      adapter: adapter,
      previewElement: document.getElementById("photo-preview"),
      countElement: document.getElementById("photo-count-label"),
      lightboxElement: document.getElementById("photo-lightbox"),
      lightboxImage: document.getElementById("lightbox-image"),
      lightboxCaption: document.getElementById("lightbox-caption"),
      lightboxPrevButton: document.getElementById("lightbox-prev"),
      lightboxNextButton: document.getElementById("lightbox-next")
    });

    bindControls();
    stepController.emit();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

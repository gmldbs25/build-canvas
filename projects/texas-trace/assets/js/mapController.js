(function () {
  "use strict";

  var mapCameraRules = {
    worldFlight: { zoom: 3 },
    airport: { zoom: 9 },
    texasOverview: { zoom: 7 },
    city: { zoom: 10.5 },
    local: { zoom: 12.5 },
    roleZoom: {
      arrival: 9,
      "flight-transfer": 9,
      space: 11.5,
      race: 11.5
    }
  };

  function markerState(stepId, currentStepId, visitedStepIds) {
    if (stepId === currentStepId) {
      return "current";
    }
    if (visitedStepIds.has(stepId)) {
      return "visited";
    }
    return "unvisited";
  }

  function createMarkerIcon(step, state) {
    var isCurrent = state === "current";
    var size = isCurrent ? 44 : 30;

    return L.divIcon({
      className: "trace-marker-shell",
      html:
        '<div class="trace-marker role-' +
        step.role +
        " is-" +
        state +
        '" data-step="' +
        step.stepId +
        '"></div>',
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size]
    });
  }

  function baseRouteStyle(link) {
    var isFlight = link.type === "flight";
    var isLong = link.type === "long-drive";

    return {
      color: isFlight ? "#72d6ff" : isLong ? "#d9bd7f" : "#b7a16c",
      weight: link.importance === "primary" ? 2.4 : 1.5,
      opacity: link.importance === "primary" ? 0.25 : 0.14,
      dashArray: isFlight ? "8 12" : link.importance === "secondary" ? "3 9" : null,
      lineCap: "round",
      lineJoin: "round"
    };
  }

  function currentRouteStyle(link) {
    var isFlight = link && link.type === "flight";
    var isLong = link && link.type === "long-drive";

    return {
      color: isFlight ? "#72d6ff" : "#f4a340",
      weight: isLong ? 5 : 4,
      opacity: 0.95,
      dashArray: isFlight ? "12 13" : "1 0",
      lineCap: "round",
      lineJoin: "round",
      className: "route-current"
    };
  }

  function roleZoom(step) {
    var presentationZoom =
      step.presentation &&
      (step.presentation.focusZoom || (step.presentation.camera && step.presentation.camera.zoom));
    if (presentationZoom) {
      return presentationZoom;
    }

    if (step.role === "departure" || step.role === "arrival-home") {
      return step.locationId === "incheon-airport" ? mapCameraRules.worldFlight.zoom : mapCameraRules.airport.zoom;
    }
    if (step.role === "flight-transfer" || step.role === "arrival") {
      return mapCameraRules.roleZoom[step.role] || mapCameraRules.airport.zoom;
    }
    if (step.role === "space" || step.role === "race") {
      return mapCameraRules.roleZoom[step.role] || mapCameraRules.city.zoom;
    }
    return mapCameraRules.local.zoom;
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function getTransitionType(routeLink) {
    if (!routeLink) {
      return "fade-settle";
    }

    if (routeLink.type === "flight") {
      return "overview-fade";
    }

    if (routeLink.type === "long-drive" || routeLink.type === "return-stop") {
      return "overview-then-settle";
    }

    if (
      routeLink.type === "local" ||
      routeLink.type === "houston-local" ||
      routeLink.type === "local-story" ||
      routeLink.type === "arrival-drive" ||
      routeLink.type === "departure-drive"
    ) {
      return "local-fly";
    }

    return "fade-settle";
  }

  function getOverviewOptions(routeLink, pair) {
    var bothUs =
      pair &&
      pair.fromLocation &&
      pair.toLocation &&
      pair.fromLocation.country === "US" &&
      pair.toLocation.country === "US";

    if (routeLink && routeLink.type === "flight") {
      return {
        duration: 0.38,
        maxZoom: bothUs ? 4.5 : 3,
        paddingTopLeft: [72, 96],
        paddingBottomRight: [72, 150]
      };
    }

    return {
      duration: 0.42,
      maxZoom: mapCameraRules.texasOverview.zoom,
      paddingTopLeft: [86, 104],
      paddingBottomRight: [86, 150]
    };
  }

  function getGoogleMapsUrl(location) {
    var queryParts = [
      location.officialName || location.name,
      location.address,
      location.lat + "," + location.lng
    ].filter(Boolean);

    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(queryParts.join(" "));
  }

  function getTileProviders() {
    return [
      {
        name: "OpenStreetMap",
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        options: {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          maxNativeZoom: 19,
          detectRetina: false,
          crossOrigin: true,
          updateWhenIdle: true,
          updateWhenZooming: false,
          keepBuffer: 4
        }
      },
      {
        name: "CARTO Dark",
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        options: {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
          maxNativeZoom: 19,
          detectRetina: false,
          crossOrigin: true,
          updateWhenIdle: true,
          updateWhenZooming: false,
          keepBuffer: 4
        }
      },
      {
        name: "Esri Dark Gray",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        options: {
          attribution: "Tiles &copy; Esri",
          maxZoom: 16,
          maxNativeZoom: 16,
          detectRetina: false,
          crossOrigin: true,
          updateWhenIdle: true,
          updateWhenZooming: false,
          keepBuffer: 4
        }
      }
    ];
  }

  function init(options) {
    var adapter = options.adapter;
    var mapElement = options.mapElement;
    var fallbackElement = options.fallbackElement;
    var onMarkerSelect = options.onMarkerSelect;
    var markersByStepId = {};
    var routeLinesByKey = {};
    var currentRouteLine = null;
    var tileProviders = getTileProviders();
    var activeTileLayer = null;
    var activeTileProviderIndex = 0;
    var tileErrorCount = 0;
    var map = null;
    var resizeHandler = null;
    var maskElement = options.maskElement;
    var isTileLoading = false;

    if (!window.L || !mapElement) {
      if (fallbackElement) {
        fallbackElement.hidden = false;
      }
      return {
        renderState: function () {}
      };
    }

    try {
      mapElement.style.width = "100%";
      mapElement.style.height = "100%";

      map = L.map(mapElement, {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
        zoomSnap: 0.25,
        zoomDelta: 1,
        scrollWheelZoom: true,
        wheelDebounceTime: 28,
        wheelPxPerZoomLevel: 60,
        easeLinearity: 0.2,
        fadeAnimation: true,
        zoomAnimation: true,
        markerZoomAnimation: true,
        worldCopyJump: true
      });

      applyTileProvider(0);

      adapter.getRouteLinks().forEach(function (link) {
        var pair = adapter.resolveRouteLocations(link);
        if (!pair) {
          return;
        }

        var line = L.polyline(
          [
            [pair.fromLocation.lat, pair.fromLocation.lng],
            [pair.toLocation.lat, pair.toLocation.lng]
          ],
          baseRouteStyle(link)
        ).addTo(map);

        routeLinesByKey[adapter.getRouteKey(link)] = line;
      });

      adapter.getSteps().forEach(function (step) {
        var location = adapter.getLocationForStep(step.stepId);
        if (!location) {
          return;
        }

        var marker = L.marker([location.lat, location.lng], {
          icon: createMarkerIcon(step, "unvisited"),
          title: step.stepId + ". " + step.title
        }).addTo(map);

        marker.bindPopup(
          "<strong>" +
            step.stepId +
            ". " +
            step.title +
            "</strong><br>" +
            step.subtitle +
            '<br><span class="map-link-note">Google Maps에서 열기</span>'
        );
        marker.on("click", function () {
          window.open(getGoogleMapsUrl(location), "_blank", "noopener,noreferrer");
        });

        markersByStepId[step.stepId] = marker;
      });

      var firstStep = adapter.getSteps()[0];
      var firstLocation = adapter.getLocationForStep(firstStep.stepId);
      map.setView([firstLocation.lat, firstLocation.lng], 3, { animate: false });

      refreshMapSize();
      map.whenReady(refreshMapSize);
      window.addEventListener("load", refreshMapSize);
      window.addEventListener("resize", refreshMapSize);
      resizeHandler = refreshMapSize;
    } catch (error) {
      if (fallbackElement) {
        fallbackElement.hidden = false;
      }
      return {
        renderState: function () {}
      };
    }

    function refreshMapSize() {
      if (!map) {
        return;
      }

      requestAnimationFrame(function () {
        map.invalidateSize(false);

        requestAnimationFrame(function () {
          map.invalidateSize(false);
        });
      });

      setTimeout(function () {
        if (map) {
          map.invalidateSize(false);
        }
      }, 120);
    }

    function showTileFallbackMessage() {
      if (fallbackElement) {
        fallbackElement.hidden = false;
        fallbackElement.textContent =
          "지도 타일을 불러오지 못했습니다. 네트워크 또는 외부 지도 타일 접근을 확인해주세요.";
      }
    }

    function hideTileFallbackMessage() {
      if (fallbackElement) {
        fallbackElement.hidden = true;
      }
    }

    function applyTileProvider(providerIndex) {
      var provider = tileProviders[providerIndex];

      if (!provider || !map) {
        showTileFallbackMessage();
        return;
      }

      if (activeTileLayer) {
        activeTileLayer.off();
        map.removeLayer(activeTileLayer);
      }

      activeTileProviderIndex = providerIndex;
      tileErrorCount = 0;
      activeTileLayer = L.tileLayer(provider.url, provider.options);

      activeTileLayer.on("tileload", function () {
        hideTileFallbackMessage();
      });

      activeTileLayer.on("loading", function () {
        isTileLoading = true;
        setMaskLoading(true);
      });

      activeTileLayer.on("load", function () {
        isTileLoading = false;
        setMaskLoading(false);
      });

      activeTileLayer.on("tileerror", function () {
        tileErrorCount += 1;

        if (tileErrorCount >= 4) {
          showTileFallbackMessage();
        }
      });

      activeTileLayer.addTo(map);
      refreshMapSize();
    }

    function setMaskActive(isActive) {
      if (maskElement) {
        maskElement.classList.toggle("is-active", Boolean(isActive));
      }
    }

    function setMaskLoading(isLoading) {
      if (maskElement) {
        maskElement.classList.toggle("is-loading", Boolean(isLoading));
      }
    }

    function waitForMove(timeoutMs) {
      return new Promise(function (resolve) {
        var resolved = false;
        var timeoutId = null;

        function finish() {
          if (resolved) {
            return;
          }
          resolved = true;
          clearTimeout(timeoutId);
          map.off("moveend zoomend", finish);
          resolve();
        }

        timeoutId = setTimeout(finish, timeoutMs);
        map.once("moveend zoomend", finish);
      });
    }

    function waitForTiles(timeoutMs) {
      return new Promise(function (resolve) {
        var timeoutId = null;

        function finish() {
          clearTimeout(timeoutId);
          if (activeTileLayer) {
            activeTileLayer.off("load", finish);
          }
          resolve();
        }

        if (!isTileLoading) {
          timeoutId = setTimeout(finish, Math.min(140, timeoutMs));
          return;
        }

        timeoutId = setTimeout(finish, timeoutMs);
        if (activeTileLayer) {
          activeTileLayer.once("load", finish);
        }
      });
    }

    function moveToBounds(pair, routeLink, options) {
      if (!pair) {
        return Promise.resolve();
      }

      map.flyToBounds(
        [
          [pair.fromLocation.lat, pair.fromLocation.lng],
          [pair.toLocation.lat, pair.toLocation.lng]
        ],
        Object.assign(getOverviewOptions(routeLink, pair), options || {})
      );
      return waitForMove(850);
    }

    function flyToStep(step, location, options) {
      map.flyTo([location.lat, location.lng], roleZoom(step), {
        animate: true,
        duration: (options && options.duration) || 0.68
      });
      return waitForMove(((options && options.duration) || 0.68) * 1000 + 260);
    }

    function setViewToStep(step, location) {
      map.setView([location.lat, location.lng], roleZoom(step), { animate: false });
      refreshMapSize();
    }

    function resetBaseRoutes() {
      adapter.getRouteLinks().forEach(function (link) {
        var line = routeLinesByKey[adapter.getRouteKey(link)];
        if (line) {
          line.setStyle(baseRouteStyle(link));
        }
      });
    }

    function removeCurrentRoute() {
      if (currentRouteLine) {
        currentRouteLine.remove();
        currentRouteLine = null;
      }
    }

    function renderCurrentRoute(routeLink) {
      removeCurrentRoute();
      resetBaseRoutes();

      if (!routeLink) {
        return;
      }

      var pair = adapter.resolveRouteLocations(routeLink);
      if (!pair) {
        return;
      }

      var baseLine = routeLinesByKey[adapter.getRouteKey(routeLink)];
      if (baseLine) {
        baseLine.setStyle({
          opacity: 0.5,
          weight: 3
        });
        baseLine.bringToFront();
      }

      currentRouteLine = L.polyline(
        [
          [pair.fromLocation.lat, pair.fromLocation.lng],
          [pair.toLocation.lat, pair.toLocation.lng]
        ],
        currentRouteStyle(routeLink)
      ).addTo(map);

      currentRouteLine.bringToFront();
    }

    function renderMarkers(currentStepId, visitedStepIds) {
      adapter.getSteps().forEach(function (step) {
        var marker = markersByStepId[step.stepId];
        if (!marker) {
          return;
        }

        var state = markerState(step.stepId, currentStepId, visitedStepIds);
        marker.setIcon(createMarkerIcon(step, state));
        marker.setOpacity(state === "unvisited" ? 0.48 : 1);
        marker.setZIndexOffset(state === "current" ? 1000 : state === "visited" ? 200 : 0);
      });
    }

    function moveMap(step, location, routeLink) {
      if (!step || !location) {
        return Promise.resolve();
      }

      var pair = routeLink && adapter.resolveRouteLocations(routeLink);
      var transitionType = getTransitionType(routeLink);

      if (transitionType === "local-fly") {
        return flyToStep(step, location, { duration: 0.72 }).then(function () {
          refreshMapSize();
        });
      }

      if (transitionType === "overview-then-settle") {
        return moveToBounds(pair, routeLink)
          .then(function () {
            return delay(360);
          })
          .then(function () {
            return flyToStep(step, location, { duration: 0.56 });
          })
          .then(function () {
            refreshMapSize();
          });
      }

      if (transitionType === "overview-fade") {
        return moveToBounds(pair, routeLink, { animate: false, duration: 0.1 })
          .then(function () {
            return delay(430);
          })
          .then(function () {
            setViewToStep(step, location);
          });
      }

      setViewToStep(step, location);
      return Promise.resolve();
    }

    function renderState(state, options) {
      var step = adapter.getStepById(state.currentStepId);
      var location = adapter.getLocationForStep(state.currentStepId);

      renderMarkers(state.currentStepId, state.visitedStepIds);
      renderCurrentRoute(state.currentRouteLink);

      if (options && options.immediate) {
        if (step && location) {
          setViewToStep(step, location);
        }
        refreshMapSize();
        return Promise.resolve();
      }

      setMaskActive(true);
      refreshMapSize();

      return delay(80)
        .then(function () {
          return moveMap(step, location, state.currentRouteLink);
        })
        .then(function () {
          return waitForTiles(900);
        })
        .then(function () {
          refreshMapSize();
          return delay(120);
        })
        .then(function () {
          setMaskActive(false);
          setMaskLoading(false);
        });
    }

    return {
      renderState: renderState,
      refreshMapSize: refreshMapSize,
      destroy: function () {
        if (resizeHandler) {
          window.removeEventListener("load", resizeHandler);
          window.removeEventListener("resize", resizeHandler);
        }
      }
    };
  }

  window.TexasTraceMap = {
    init: init
  };
})();

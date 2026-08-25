(function () {
  "use strict";

  function create(data) {
    var steps = data.journeySteps.slice();
    var stepById = steps.reduce(function (lookup, step) {
      lookup[step.stepId] = step;
      return lookup;
    }, {});

    function getStepById(stepId) {
      return stepById[stepId] || null;
    }

    function getStepIndex(stepId) {
      return steps.findIndex(function (step) {
        return step.stepId === stepId;
      });
    }

    function getLocationForStep(stepId) {
      var step = getStepById(stepId);
      return step ? data.locations[step.locationId] || null : null;
    }

    function getMediaGroupForStep(stepId) {
      var step = getStepById(stepId);
      return step ? data.mediaGroups[step.mediaGroupId] || null : null;
    }

    function findRouteLink(previousStepId, currentStepId) {
      if (!previousStepId || !currentStepId || previousStepId === currentStepId) {
        return null;
      }

      var directLink =
        data.routeLinks.find(function (link) {
          return (
            (link.from === previousStepId && link.to === currentStepId) ||
            (link.from === currentStepId && link.to === previousStepId)
          );
        }) || null;

      if (directLink) {
        return directLink;
      }

      return (
        data.routeLinks.find(function (link) {
          var fromStep = getStepById(link.from);
          var toStep = getStepById(link.to);
          var connectsCurrent = link.from === currentStepId || link.to === currentStepId;
          var connectsHub =
            (fromStep && fromStep.role === "lodging-hub") || (toStep && toStep.role === "lodging-hub");

          return connectsCurrent && connectsHub;
        }) || null
      );
    }

    function resolveRouteLocations(link) {
      if (!link) {
        return null;
      }

      var fromStep = getStepById(link.from);
      var toStep = getStepById(link.to);
      var fromLocation = fromStep ? data.locations[fromStep.locationId] : null;
      var toLocation = toStep ? data.locations[toStep.locationId] : null;

      if (!fromLocation || !toLocation) {
        return null;
      }

      return {
        fromStep: fromStep,
        toStep: toStep,
        fromLocation: fromLocation,
        toLocation: toLocation
      };
    }

    function getRouteKey(link) {
      return link.from + "::" + link.to + "::" + link.type + "::" + link.label;
    }

    function getPresentation(step) {
      var presentation = step.presentation || {};
      return {
        headline: presentation.headline || step.title,
        shortText: presentation.shortText || step.summary,
        focusZoom: presentation.focusZoom || null,
        photoLimit: presentation.photoLimit || 3,
        mood: presentation.mood || step.storyType
      };
    }

    function getPhotoPaths(group, image) {
      var path = group.basePath + "/" + image.file;
      return {
        thumb: path,
        full: path
      };
    }

    return {
      getData: function () {
        return data;
      },
      getSteps: function () {
        return steps;
      },
      getStepById: getStepById,
      getStepIndex: getStepIndex,
      getLocationForStep: getLocationForStep,
      getMediaGroupForStep: getMediaGroupForStep,
      getRouteLinks: function () {
        return data.routeLinks;
      },
      findRouteLink: findRouteLink,
      resolveRouteLocations: resolveRouteLocations,
      getRouteKey: getRouteKey,
      getPresentation: getPresentation,
      getPhotoPaths: getPhotoPaths
    };
  }

  window.TexasTraceDataAdapter = {
    create: create
  };
})();

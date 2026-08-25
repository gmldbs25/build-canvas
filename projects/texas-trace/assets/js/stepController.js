(function () {
  "use strict";

  function create(adapter, onChange) {
    var steps = adapter.getSteps();
    var state = {
      currentStepIndex: 0,
      currentStepId: steps[0].stepId,
      previousStepId: null,
      visitedStepIds: new Set([steps[0].stepId]),
      currentRouteLink: null
    };

    function getVisitedStepIds() {
      return new Set(
        steps.slice(0, state.currentStepIndex + 1).map(function (step) {
          return step.stepId;
        })
      );
    }

    function emit() {
      onChange({
        currentStepIndex: state.currentStepIndex,
        currentStepId: state.currentStepId,
        previousStepId: state.previousStepId,
        visitedStepIds: getVisitedStepIds(),
        currentRouteLink: state.currentRouteLink
      });
    }

    function goToIndex(nextIndex) {
      var clampedIndex = Math.max(0, Math.min(steps.length - 1, nextIndex));
      var nextStep = steps[clampedIndex];

      if (!nextStep || nextStep.stepId === state.currentStepId) {
        emit();
        return;
      }

      state.previousStepId = state.currentStepId;
      state.currentStepIndex = clampedIndex;
      state.currentStepId = nextStep.stepId;
      state.visitedStepIds.add(nextStep.stepId);
      state.currentRouteLink = adapter.findRouteLink(state.previousStepId, state.currentStepId);
      emit();
    }

    function goToStep(stepId) {
      var index = adapter.getStepIndex(stepId);
      if (index !== -1) {
        goToIndex(index);
      }
    }

    function next() {
      goToIndex(state.currentStepIndex + 1);
    }

    function prev() {
      goToIndex(state.currentStepIndex - 1);
    }

    function getState() {
      return {
        currentStepIndex: state.currentStepIndex,
        currentStepId: state.currentStepId,
        previousStepId: state.previousStepId,
        visitedStepIds: getVisitedStepIds(),
        currentRouteLink: state.currentRouteLink
      };
    }

    return {
      next: next,
      prev: prev,
      goToStep: goToStep,
      getState: getState,
      emit: emit
    };
  }

  window.TexasTraceStepController = {
    create: create
  };
})();

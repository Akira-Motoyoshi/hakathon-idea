(() => {
  let fallbackStarted = false;
  const originalAddRoutesAndMarkers = addRoutesAndMarkers;
  const originalAddThreeDimensionalBuildings = addThreeDimensionalBuildings;

  addRoutesAndMarkers = function addRoutesAndMarkersOnce() {
    if (map.getSource("messi-route") || document.querySelectorAll(".career-marker").length) {
      return;
    }
    return originalAddRoutesAndMarkers();
  };

  addThreeDimensionalBuildings = function addThreeDimensionalBuildingsOnce() {
    if (map.getLayer("career-3d-buildings")) {
      return;
    }
    return originalAddThreeDimensionalBuildings();
  };

  function startStoryFallback() {
    if (fallbackStarted || !map.getStyle()?.layers?.length) {
      return;
    }
    fallbackStarted = true;
    try {
      addThreeDimensionalBuildings();
      addRoutesAndMarkers();
      updatePanel(0);
      updateActiveMarker(0);
      setSourceData("messi-progress", emptyCollection());
      setSourceData("ronaldo-progress", emptyCollection());
      window.setTimeout(() => playScene(0), 550);
    } catch (error) {
      fallbackStarted = false;
      console.warn("Story fallback initialization delayed", error);
    }
  }

  map.on("load", startStoryFallback);
  map.on("style.load", startStoryFallback);
  const timer = window.setInterval(() => {
    startStoryFallback();
    if (fallbackStarted) {
      window.clearInterval(timer);
    }
  }, 700);
})();

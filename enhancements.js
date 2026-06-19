(() => {
  const scenes = window.CAREER_SCENES || [];
  const aqua = "#32c7ff";

  function commonsImageUrl(file, width = 900) {
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
  }

  function ensureIntro() {
    if (document.querySelector("#intro")) return;
    const intro = document.createElement("section");
    intro.id = "intro";
    intro.className = "intro";
    intro.setAttribute("aria-label", "Opening animation");
    intro.innerHTML = `
      <div class="intro-orb" aria-hidden="true"><span></span></div>
      <div class="intro-copy">
        <p>From Ball To Planet</p>
        <strong>Messi's World Route</strong>
      </div>
    `;
    document.querySelector(".story-shell")?.append(intro);
    window.setTimeout(() => intro.classList.add("is-earth"), 620);
    window.setTimeout(() => intro.classList.add("is-hidden"), 2050);
  }

  function ensureMedia() {
    const panel = document.querySelector(".scene-panel");
    if (!panel || panel.querySelector(".scene-media")) return;
    const figure = document.createElement("figure");
    figure.className = "scene-media";
    figure.innerHTML = '<img id="scene-image" alt="" decoding="async"><figcaption id="scene-credit"></figcaption>';
    panel.prepend(figure);
  }

  function currentSceneIndex() {
    const counter = document.querySelector("#scene-counter")?.textContent || "1";
    const parsed = Number.parseInt(counter, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed - 1) : 0;
  }

  function updateMedia(index = currentSceneIndex()) {
    const scene = scenes[index];
    if (!scene?.image) return;
    const img = document.querySelector("#scene-image");
    const credit = document.querySelector("#scene-credit");
    if (!img || !credit) return;
    img.src = commonsImageUrl(scene.image.file);
    img.alt = scene.image.alt;
    credit.textContent = `${scene.image.credit} - ${scene.image.license}`;
    credit.title = scene.image.source;
  }

  function removeRonaldoUi() {
    document.querySelectorAll(".legend span").forEach((item) => {
      if (item.textContent?.toLowerCase().includes("ronaldo")) item.remove();
    });
    document.title = "Messi 3D Career Atlas";
    document.querySelector("main")?.setAttribute("aria-label", "Messi 3D story map");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.content = "MapLibre GL JS and OpenFreeMap powered 3D story map tracing Lionel Messi's life and career.";
    }
  }

  function addFixedPointLayers() {
    if (typeof map === "undefined" || !map.getStyle()?.layers?.length || map.getLayer("career-point-fixed-active")) {
      return;
    }
    const pointFeatures = scenes.map((scene, index) => ({
      type: "Feature",
      properties: { id: scene.id, order: index + 1, title: scene.title },
      geometry: { type: "Point", coordinates: scene.coordinates }
    }));
    if (!map.getSource("career-points-fixed")) {
      map.addSource("career-points-fixed", {
        type: "geojson",
        data: { type: "FeatureCollection", features: pointFeatures }
      });
    }
    map.addLayer({
      id: "career-point-fixed-halos",
      type: "circle",
      source: "career-points-fixed",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 4, 14, 13],
        "circle-color": aqua,
        "circle-opacity": 0.18,
        "circle-stroke-width": 1,
        "circle-stroke-color": "rgba(255,255,255,0.92)"
      }
    });
    map.addLayer({
      id: "career-point-fixed-dots",
      type: "circle",
      source: "career-points-fixed",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 2.5, 14, 6],
        "circle-color": "#ffffff",
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 2, 1.5, 14, 3],
        "circle-stroke-color": aqua
      }
    });
    map.addLayer({
      id: "career-point-fixed-active",
      type: "circle",
      source: "career-points-fixed",
      filter: ["==", ["get", "id"], scenes[0]?.id || ""],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 6, 14, 15],
        "circle-color": "#ffffff",
        "circle-stroke-width": 4,
        "circle-stroke-color": aqua
      }
    });
  }

  function updateFixedActive(index = currentSceneIndex()) {
    if (typeof map !== "undefined" && map.getLayer?.("career-point-fixed-active") && scenes[index]) {
      map.setFilter("career-point-fixed-active", ["==", ["get", "id"], scenes[index].id]);
    }
  }

  function ensureSoundButton() {
    const controls = document.querySelector(".control-strip");
    if (!controls || document.querySelector("#sound-toggle")) return;
    const button = document.createElement("button");
    button.id = "sound-toggle";
    button.type = "button";
    button.textContent = "Sound";
    button.setAttribute("aria-label", "Turn music on");
    controls.append(button);
  }

  let audioContext = null;
  let masterGain = null;
  let musicTimer = null;
  let musicOn = false;

  function createMusic() {
    if (audioContext) return;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioContext.destination);
  }

  function playTone(freq, start, duration, gainValue, type = "sine") {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(gainValue, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function scheduleMusicLoop() {
    if (!musicOn || !audioContext) return;
    const now = audioContext.currentTime + 0.04;
    const beat = 0.42;
    const bass = [196, 196, 247, 220, 196, 294, 247, 220];
    const lead = [392, 494, 587, 659, 587, 494, 392, 440];
    bass.forEach((note, i) => playTone(note, now + i * beat, 0.26, 0.09, "triangle"));
    lead.forEach((note, i) => playTone(note, now + i * beat + beat * 0.5, 0.18, 0.045, "sine"));
    for (let i = 0; i < 8; i += 1) {
      playTone(i % 2 === 0 ? 880 : 1175, now + i * beat, 0.045, 0.025, "square");
    }
    musicTimer = window.setTimeout(scheduleMusicLoop, beat * 8 * 1000 - 80);
  }

  async function setMusic(nextOn) {
    createMusic();
    if (audioContext.state === "suspended") await audioContext.resume();
    musicOn = nextOn;
    const button = document.querySelector("#sound-toggle");
    button.textContent = musicOn ? "Sound On" : "Sound";
    button.classList.toggle("sound-on", musicOn);
    button.setAttribute("aria-label", musicOn ? "Turn music off" : "Turn music on");
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.linearRampToValueAtTime(musicOn ? 0.36 : 0, audioContext.currentTime + 0.35);
    if (musicTimer) window.clearTimeout(musicTimer);
    if (musicOn) scheduleMusicLoop();
  }

  function hookPanelUpdates() {
    const original = window.updatePanel;
    if (typeof original === "function" && !original.__messiEnhanced) {
      window.updatePanel = function enhancedUpdatePanel(index) {
        original(index);
        updateMedia(index);
        updateFixedActive(index);
      };
      window.updatePanel.__messiEnhanced = true;
    }
    window.setInterval(() => {
      const index = currentSceneIndex();
      updateMedia(index);
      updateFixedActive(index);
    }, 450);
  }

  function boot() {
    ensureIntro();
    ensureMedia();
    removeRonaldoUi();
    ensureSoundButton();
    updateMedia(0);
    hookPanelUpdates();
    document.querySelector("#sound-toggle")?.addEventListener("click", () => setMusic(!musicOn));
    const layerTimer = window.setInterval(() => {
      addFixedPointLayers();
      updateFixedActive();
      if (typeof map !== "undefined" && map.getLayer?.("career-point-fixed-active")) {
        window.clearInterval(layerTimer);
      }
    }, 700);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

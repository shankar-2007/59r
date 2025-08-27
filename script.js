(() => {
  const $ = (sel) => document.querySelector(sel);
  const video = $("#video");
  const playPause = $("#playPause");
  const mute = $("#mute");
  const volume = $("#volume");
  const seek = $("#seek");
  const currentTimeEl = $("#currentTime");
  const durationEl = $("#duration");
  const fullscreenBtn = $("#fullscreen");
  const pipBtn = $("#pip");
  const rate = $("#playbackRate");
  let userInteracted = false;

  // Utility
  const formatTime = (sec) => {
    if (!isFinite(sec)) return "0:00";
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    const m = Math.floor((sec / 60) % 60).toString();
    const h = Math.floor(sec / 3600);
    return h ? `${h}:${m.padStart(2, "0")}:${s}` : `${m}:${s}`;
  };

  // Init after metadata
  video.addEventListener("loadedmetadata", () => {
    seek.max = video.duration;
    durationEl.textContent = formatTime(video.duration);
  });

  // Play/Pause
  const togglePlay = async () => {
    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (e) {
      console.error(e);
    }
  };

  playPause.addEventListener("click", togglePlay);
  video.addEventListener("click", togglePlay);
  video.addEventListener("play", () => (playPause.textContent = "⏸"));
  video.addEventListener("pause", () => (playPause.textContent = "▶"));

  // Seek
  video.addEventListener("timeupdate", () => {
    if (!seek.matches(":active")) seek.value = video.currentTime;
    currentTimeEl.textContent = formatTime(video.currentTime);
  });
  seek.addEventListener("input", () => (currentTimeEl.textContent = formatTime(seek.value)));
  seek.addEventListener("change", () => (video.currentTime = seek.valueAsNumber));

  // Volume & Mute
  const setMuteIcon = () => {
    let icon = "🔊";
    if (video.muted || video.volume === 0) icon = "🔇";
    else if (video.volume < 0.5) icon = "🔉";
    mute.textContent = icon;
  };
  volume.addEventListener("input", () => {
    video.volume = volume.valueAsNumber;
    video.muted = video.volume === 0;
    setMuteIcon();
  });
  mute.addEventListener("click", () => {
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 0.5;
    volume.value = video.muted ? 0 : video.volume;
    setMuteIcon();
  });

  // Rate
  rate.addEventListener("change", () => (video.playbackRate = parseFloat(rate.value)));

  // Fullscreen
  fullscreenBtn.addEventListener("click", async () => {
    const wrap = document.getElementById("player");
    if (!document.fullscreenElement) await wrap.requestFullscreen();
    else await document.exitFullscreen();
  });

  // PiP
  pipBtn.addEventListener("click", async () => {
    if (!("pictureInPictureEnabled" in document)) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch (e) {
      console.warn("PiP unavailable:", e);
    }
  });

  // Keyboard controls
  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
    switch (e.key.toLowerCase()) {
      case " ":
      case "k": e.preventDefault(); togglePlay(); break;
      case "j": video.currentTime = Math.max(0, video.currentTime - 10); break;
      case "l": video.currentTime = Math.min(video.duration, video.currentTime + 10); break;
      case "arrowleft": video.currentTime = Math.max(0, video.currentTime - 5); break;
      case "arrowright": video.currentTime = Math.min(video.duration, video.currentTime + 5); break;
      case "m": video.muted = !video.muted; setMuteIcon(); break;
      case "f":
        const wrap = document.getElementById("player");
        if (!document.fullscreenElement) wrap.requestFullscreen();
        else document.exitFullscreen();
        break;
      case "arrowup":
        video.volume = Math.min(1, video.volume + 0.05); volume.value = video.volume; setMuteIcon(); break;
      case "arrowdown":
        video.volume = Math.max(0, video.volume - 0.05); volume.value = video.volume; setMuteIcon(); break;
    }
  });

  // Autoplay policy hint: require first interaction
  const ensureInteraction = () => { userInteracted = true; document.removeEventListener("click", ensureInteraction); };
  document.addEventListener("click", ensureInteraction, { once: true });
})();
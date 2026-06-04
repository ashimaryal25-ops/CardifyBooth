// State variables tracking customization values
let appState = {
  selectedSlots: 3,
  activeFilter: "none",
  capturedImages: [],
};

// Global DOM Nodes Lookup Map
const screens = {
  welcome: document.getElementById("screen-welcome"),
  layout: document.getElementById("screen-layout"),
  capture: document.getElementById("screen-capture"),
  customize: document.getElementById("screen-customize"),
  final: document.getElementById("screen-final"),
};

// ---- NAVIGATION HISTORY TRACKING ----
let navigationHistory = ["screen-welcome"];

function navigateTo(targetScreenId) {
  const currentActiveScreen = document.querySelector(".booth-screen.active");
  const targetScreen = document.getElementById(targetScreenId);

  if (currentActiveScreen && targetScreen) {
    currentActiveScreen.classList.remove("active");
    targetScreen.classList.add("active");
    navigationHistory.push(targetScreenId);
  }
}

// ---- UNIVERSAL RETURN BUTTON LOGIC ----
const backButtons = document.querySelectorAll(".back-btn");

backButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (navigationHistory.length > 1) {
      const currentActiveScreen = document.querySelector(
        ".booth-screen.active",
      );
      navigationHistory.pop();

      const previousScreenId = navigationHistory[navigationHistory.length - 1];
      const targetScreen = document.getElementById(previousScreenId);

      if (currentActiveScreen.id === "screen-capture") {
        stopWebcamStream();
        resetCaptureInterface();
      }

      if (currentActiveScreen && targetScreen) {
        currentActiveScreen.classList.remove("active");
        targetScreen.classList.add("active");
      }
    }
  });
});

// ---- NAVIGATION LINK WIRES ----
document
  .getElementById("btn-start")
  .addEventListener("click", () => navigateTo("screen-layout"));

document.querySelectorAll(".layout-opt").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    appState.selectedSlots = parseInt(e.target.getAttribute("data-slots"));
    navigateTo("screen-capture");
    initiateCameraStream();
    prepareCaptureWorkspace(); // Dynamically moves & sets up strip preview on the capture screen
  });
});

// WIRED FIX: Connected the Take Pictures button to the capture sequence
document
  .getElementById("btn-shoot")
  .addEventListener("click", startCaptureSequence);

// Setup Live Camera Feeds
const videoEl = document.getElementById("webcam");
function initiateCameraStream() {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((stream) => {
      videoEl.srcObject = stream;
    })
    .catch((err) => {
      console.error("Camera access failed:", err);
      alert("Camera device blocked or unavailable.");
    });
}

function stopWebcamStream() {
  if (videoEl && videoEl.srcObject) {
    videoEl.srcObject.getTracks().forEach((track) => track.stop());
    videoEl.srcObject = null;
  }
}

// ---- AUTOMATED CAPTURE & RETAKE SYSTEM ----
let currentSequence = 0;
let isPausedForReview = false;
let captureTimeout = null;
let countdownInterval = null;

function prepareCaptureWorkspace() {
  resetCaptureInterface();

  // Dynamically attach the preview strip to the capture screen so users see it live
  const captureScreen = document.getElementById("screen-capture");
  const previewStrip = document.getElementById("photostrip-preview");

  // Check if it's already there to prevent duplicate injections
  if (!captureScreen.querySelector("#photostrip-preview")) {
    const wrapper = document.createElement("div");
    wrapper.id = "capture-workspace-wrapper";
    wrapper.style.display = "flex";
    wrapper.style.gap = "20px";
    wrapper.style.alignItems = "center";
    wrapper.style.margin = "15px 0";

    // Group video window and controls on the left side
    const leftSide = document.createElement("div");
    leftSide.style.display = "flex";
    leftSide.style.flexDirection = "column";
    leftSide.style.alignItems = "center";

    const camWrapper = document.querySelector(".camera-wrapper");
    const shootBtn = document.getElementById("btn-shoot");
    const countdownDisp = document.getElementById("countdown-display");

    leftSide.appendChild(countdownDisp);
    leftSide.appendChild(camWrapper);
    leftSide.appendChild(shootBtn);

    // Add custom Retake Button configuration directly beneath Take Pictures button
    const retakeBtn = document.createElement("button");
    retakeBtn.id = "btn-retake";
    retakeBtn.className = "btn-secondary";
    retakeBtn.textContent = "🔄 Retake Last Photo";
    retakeBtn.style.display = "none";
    retakeBtn.style.marginTop = "10px";
    leftSide.appendChild(retakeBtn);

    wrapper.appendChild(leftSide);
    wrapper.appendChild(previewStrip);

    captureScreen.insertBefore(
      wrapper,
      captureScreen.querySelector(".back-btn").nextSibling,
    );

    // Attach event hook directly to Retake Button execution pipeline
    retakeBtn.addEventListener("click", triggerPhotoRetake);
  }

  renderBlankStripSlots();
}

function renderBlankStripSlots() {
  const container = document.getElementById("strip-slots-container");
  container.innerHTML = "";

  for (let i = 0; i < appState.selectedSlots; i++) {
    const frame = document.createElement("div");
    frame.classList.add("captured-slot-frame");
    frame.id = `capture-slot-${i}`;
    frame.innerHTML = `<span style="color:#aaa; font-size:0.8rem; display:block; text-align:center; padding-top:40px;">Slot ${i + 1}</span>`;
    container.appendChild(frame);
  }
}

function resetCaptureInterface() {
  currentSequence = 0;
  isPausedForReview = false;
  appState.capturedImages = [];
  clearInterval(countdownInterval);
  clearTimeout(captureTimeout);

  const countdownDisplay = document.getElementById("countdown-display");
  if (countdownDisplay) countdownDisplay.textContent = "Ready";

  const shootBtn = document.getElementById("btn-shoot");
  if (shootBtn) {
    shootBtn.disabled = false;
    shootBtn.textContent = "Take Pictures";
  }

  const retakeBtn = document.getElementById("btn-retake");
  if (retakeBtn) retakeBtn.style.display = "none";
}

function startCaptureSequence() {
  const shootBtn = document.getElementById("btn-shoot");
  shootBtn.disabled = true;
  shootBtn.textContent = "Capturing...";
  runNextCapture();
}

function runNextCapture() {
  let countdownDisplay = document.getElementById("countdown-display");
  const retakeBtn = document.getElementById("btn-retake");

  if (currentSequence < appState.selectedSlots) {
    isPausedForReview = false;
    retakeBtn.style.display = "none"; // Hide retake option during a live countdown sequence

    let timerValue = 3;
    countdownDisplay.textContent = timerValue;

    countdownInterval = setInterval(() => {
      timerValue--;
      if (timerValue > 0) {
        countdownDisplay.textContent = timerValue;
      } else {
        clearInterval(countdownInterval);
        countdownDisplay.textContent = "📸 FLASH!";
        captureCanvasFrame();

        // Pause automated loop temporarily for 3 seconds to let user review their photo slot
        isPausedForReview = true;
        countdownDisplay.textContent = "Reviewing Shot...";
        retakeBtn.style.display = "inline-block";

        currentSequence++;

        captureTimeout = setTimeout(() => {
          if (isPausedForReview) {
            runNextCapture(); // Auto-advance if they don't press retake within 3 seconds
          }
        }, 3000);
      }
    }, 900);
  } else {
    countdownDisplay.textContent = "Finished!";
    retakeBtn.style.display = "none";

    // Move the built preview strip structure right over to the customize workspace container layout securely
    const customWorkspace = document.querySelector(".customize-workspace");
    const previewStrip = document.getElementById("photostrip-preview");
    customWorkspace.insertBefore(previewStrip, customWorkspace.firstChild);

    navigateTo("screen-customize");
    stopWebcamStream();
  }
}

function triggerPhotoRetake() {
  // Clear running timeouts to halt automatic progressions safely
  clearTimeout(captureTimeout);
  clearInterval(countdownInterval);

  // Rewind tracker safely to capture frame location index bounds again
  currentSequence--;
  appState.capturedImages.pop();

  // Clear out specific image block row frame preview instantly
  const slotFrame = document.getElementById(`capture-slot-${currentSequence}`);
  slotFrame.innerHTML = `<span style="color:#aaa; font-size:0.8rem; display:block; text-align:center; padding-top:40px;">Retaking...</span>`;

  // Re-run current sequence capture logic loop instantly
  runNextCapture();
}

function captureCanvasFrame() {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");

  if (appState.activeFilter === "bw") {
    ctx.filter = "grayscale(100%)";
  } else if (appState.activeFilter === "soft") {
    ctx.filter = "brightness(1.1) blur(0.4px) saturate(0.9)";
  }

  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/png");
  appState.capturedImages.push(dataUrl);

  // Instantly render snapshot directly into current vertical frame layout container slice
  const slotFrame = document.getElementById(`capture-slot-${currentSequence}`);
  slotFrame.innerHTML = `<img src="${dataUrl}" style="width:100%; height:100%; object-fit:cover;">`;
}

// ---- CUSTOMIZE TOOLING LOGICS ----
document.querySelectorAll(".color-opt").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const targetPreview = document.getElementById("photostrip-preview");
    targetPreview.className = "";
    targetPreview.style.background = "";

    const selectedColor = e.target.getAttribute("data-color");
    const selectedPreset = e.target.getAttribute("data-preset");

    if (selectedColor) {
      targetPreview.style.backgroundColor = selectedColor;
    } else if (selectedPreset) {
      targetPreview.classList.add(selectedPreset);
    }
  });
});

const stickerDrawer = document.getElementById("sticker-drawer");
document
  .getElementById("btn-toggle-stickers")
  .addEventListener("click", () => stickerDrawer.classList.remove("hidden"));
document
  .getElementById("btn-close-stickers")
  .addEventListener("click", () => stickerDrawer.classList.add("hidden"));

document.querySelectorAll(".sticker-item").forEach((sticker) => {
  sticker.addEventListener("click", (e) => {
    const emoji = e.target.getAttribute("data-emoji");
    const placedElement = document.createElement("div");
    placedElement.classList.add("placed-sticker");
    placedElement.textContent = emoji;

    placedElement.style.top = "40px";
    placedElement.style.left = "40px";

    document.getElementById("photostrip-preview").appendChild(placedElement);
    makeElementDraggable(placedElement);
  });
});

function makeElementDraggable(element) {
  let offsetX = 0,
    offsetY = 0,
    initialX = 0,
    initialY = 0;
  element.addEventListener("mousedown", dragStart);

  function dragStart(e) {
    e.preventDefault();
    initialX = e.clientX;
    initialY = e.clientY;
    document.addEventListener("mousemove", dragMove);
    document.addEventListener("mouseup", dragEnd);
  }

  function dragMove(e) {
    offsetX = initialX - e.clientX;
    offsetY = initialY - e.clientY;
    initialX = e.clientX;
    initialY = e.clientY;

    element.style.top = element.offsetTop - offsetY + "px";
    element.style.left = element.offsetLeft - offsetX + "px";
  }

  function dragEnd() {
    document.removeEventListener("mousemove", dragMove);
    document.removeEventListener("mouseup", dragEnd);
  }
}

// Move to Final Screen
document.getElementById("btn-finish").addEventListener("click", () => {
  const finalOutContainer = document.getElementById("final-output-container");
  finalOutContainer.innerHTML = "";

  const compiledStripClone = document
    .getElementById("photostrip-preview")
    .cloneNode(true);

  finalOutContainer.appendChild(compiledStripClone);
  navigateTo("screen-final");
});

// ---- DYNAMIC HIGH-RES CANVAS DOWNLOAD GENERATOR ----
document
  .getElementById("btn-download")
  .addEventListener("click", generateStripDownload);

function generateStripDownload() {
  const previewStrip = document.getElementById("photostrip-preview");
  const slotsCount = appState.selectedSlots;

  const imgW = 400;
  const imgH = 300;
  const padding = 25;
  const bottomFooterGap = 80;

  const totalWidth = imgW + padding * 2;
  const totalHeight =
    imgH * slotsCount + padding * (slotsCount + 1) + bottomFooterGap;

  const canvas = document.getElementById("download-compiler-canvas");
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");

  const computedStyle = window.getComputedStyle(previewStrip);
  const backgroundStyle = computedStyle.backgroundImage;

  if (
    previewStrip.classList.contains("retro-strip") ||
    (backgroundStyle && backgroundStyle !== "none")
  ) {
    let gradient = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
    gradient.addColorStop(0, "#ff9a9e");
    gradient.addColorStop(0.99, "#fecfef");
    gradient.addColorStop(1, "#fecfef");
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = computedStyle.backgroundColor || "#ffffff";
  }
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  let imagesLoaded = 0;
  appState.capturedImages.forEach((imgSrc, index) => {
    const img = new Image();
    img.onload = function () {
      const posX = padding;
      const posY = padding + index * (imgH + padding);

      ctx.drawImage(img, posX, posY, imgW, imgH);
      imagesLoaded++;

      if (imagesLoaded === slotsCount) {
        renderStickersAndExport(
          ctx,
          previewStrip,
          totalWidth,
          totalHeight,
          imgW,
          imgH,
          padding,
        );
      }
    };
    img.src = imgSrc;
  });
}

function renderStickersAndExport(
  ctx,
  previewStrip,
  totalWidth,
  totalHeight,
  imgW,
  imgH,
  padding,
) {
  const stickers = previewStrip.querySelectorAll(".placed-sticker");

  const previewWidth = previewStrip.offsetWidth;
  const scaleRatio = totalWidth / previewWidth;

  stickers.forEach((sticker) => {
    const rawTop = parseFloat(sticker.style.top) || 0;
    const rawLeft = parseFloat(sticker.style.left) || 0;

    const canvasX = rawLeft * scaleRatio;
    const canvasY = rawTop * scaleRatio;

    const calculatedFontSize = Math.round(11 * scaleRatio);
    ctx.font = `${calculatedFontSize}px Arial`;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#000000";
    ctx.fillText(
      sticker.textContent,
      canvasX + calculatedFontSize / 2,
      canvasY + calculatedFontSize / 2,
    );
  });

  ctx.fillStyle = "#666666";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("GBURG PHOTO BOOTH", totalWidth / 2, totalHeight - 40);

  const finalImageUrl = document
    .getElementById("download-compiler-canvas")
    .toDataURL("image/png");
  const downloadAnchor = document.createElement("a");
  downloadAnchor.download = "gburg-photobooth-strip.png";
  downloadAnchor.href = finalImageUrl;
  downloadAnchor.click();
}

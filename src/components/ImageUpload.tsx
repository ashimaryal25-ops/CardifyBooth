"use client";

/* eslint-disable @next/next/no-img-element -- Captured/uploaded images are data URLs. */

import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ImageUploadProps {
  photo: string | null;
  onUpload: (photo: string) => void;
  onChooseAnother: () => void;
  onViewSample: () => void;
}

type CameraStatus = "idle" | "starting" | "active" | "error";

function createSamplePortrait() {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;

  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }

  context.fillStyle = "#222222";
  context.fillRect(0, 0, 800, 600);
  context.fillStyle = "#043371";
  context.fillRect(0, 410, 800, 190);
  context.fillStyle = "#cc4e00";
  context.globalAlpha = 0.78;
  context.fillRect(60, 108, 168, 146);
  context.fillStyle = "#8fdbff";
  context.fillRect(560, 86, 174, 152);
  context.globalAlpha = 1;

  context.fillStyle = "#d8d8d8";
  context.beginPath();
  context.arc(400, 205, 90, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#222222";
  context.beginPath();
  context.ellipse(400, 155, 104, 62, -0.1, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#043371";
  context.beginPath();
  context.moveTo(252, 560);
  context.bezierCurveTo(274, 423, 338, 342, 400, 342);
  context.bezierCurveTo(462, 342, 526, 423, 548, 560);
  context.closePath();
  context.fill();

  context.fillStyle = "#ffffff";
  context.font = "700 34px Arial";
  context.textAlign = "center";
  context.fillText("GETTYSBURG", 400, 82);

  return canvas.toDataURL("image/png");
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function ImageUpload({ photo, onUpload, onChooseAnother, onViewSample }: ImageUploadProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [cameraError, setCameraError] = useState("");

  const stopCamera = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      stopStream(streamRef.current);
    };
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("error");
      setCameraError("This browser does not support camera capture.");
      return;
    }

    setCameraStatus("starting");
    setCameraError("");

    try {
      stopStream(streamRef.current);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraStatus("active");
    } catch {
      setCameraStatus("error");
      setCameraError("Camera permission was blocked or no camera was found.");
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraStatus("error");
      setCameraError("Camera is not ready yet. Try again in a second.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      setCameraStatus("error");
      setCameraError("Could not capture this camera frame.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    onUpload(canvas.toDataURL("image/png"));
    stopCamera();
  }, [onUpload, stopCamera]);

  if (photo) {
    return (
      <section className="grid gap-4">
        <div className="overflow-hidden rounded-[6px] border border-[#d7c9bb] bg-[var(--gc-black)]">
          <img
            src={photo}
            alt="Captured booth portrait"
            className="aspect-video w-full object-cover"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onChooseAnother();
          }}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-[6px] border border-[var(--gc-black)]/22 bg-white px-3 text-sm font-semibold text-[var(--gc-black)] transition hover:bg-[var(--gc-alabaster)]"
        >
          <RefreshCw size={18} />
          Retake photo
        </button>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <div className="overflow-hidden rounded-[6px] border border-[#d7c9bb] bg-[#f5f5f5]">
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`h-full w-full object-cover ${cameraStatus === "active" ? "block" : "hidden"}`}
          />

          {cameraStatus !== "active" && (
            <div className="grid h-full place-items-center p-6">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[6px] border border-[var(--gc-blue)]/24 bg-white text-[var(--gc-blue)]">
                  {cameraStatus === "error" ? <CameraOff size={28} /> : <Camera size={28} />}
                </div>
                <p className="mt-4 text-xl font-black text-[var(--gc-black)]">
                  {cameraStatus === "starting" ? "Starting camera" : "Camera ready"}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[var(--gc-gray)]">
                  {cameraStatus === "error"
                    ? cameraError
                    : "Start the camera and frame the portrait."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {cameraStatus === "active" ? (
          <>
            <button
              type="button"
              onClick={capturePhoto}
              className="inline-flex h-11 items-center gap-2 rounded-[6px] bg-[var(--gc-orange)] px-4 text-sm font-bold text-white transition hover:bg-[#a43e00]"
            >
              <Camera size={18} />
              Capture photo
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex h-11 items-center gap-2 rounded-[6px] border border-[var(--gc-black)]/22 bg-white px-4 text-sm font-semibold text-[var(--gc-black)] transition hover:bg-[var(--gc-alabaster)]"
            >
              <CameraOff size={18} />
              Stop camera
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={startCamera}
            disabled={cameraStatus === "starting"}
            className="inline-flex h-11 items-center gap-2 rounded-[6px] bg-[var(--gc-orange)] px-4 text-sm font-bold text-white transition hover:bg-[#a43e00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera size={18} />
            {cameraStatus === "starting" ? "Starting" : "Start camera"}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            const portrait = createSamplePortrait();
            if (portrait) {
              stopCamera();
              onUpload(portrait);
            }
          }}
          className="inline-flex h-11 items-center gap-2 rounded-[6px] border border-[var(--gc-black)]/22 bg-white px-4 text-sm font-semibold text-[var(--gc-black)] transition hover:bg-[var(--gc-alabaster)]"
        >
          Use sample photo
        </button>

        <button
          type="button"
          onClick={onViewSample}
          className="inline-flex h-11 items-center gap-2 rounded-[6px] border border-[var(--gc-blue)]/28 bg-white px-4 text-sm font-semibold text-[var(--gc-blue)] transition hover:bg-[var(--gc-alabaster)]"
        >
          See sample card
        </button>
      </div>

    </section>
  );
}

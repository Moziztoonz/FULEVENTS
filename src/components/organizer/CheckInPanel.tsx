"use client";

import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { sendJson } from "@/lib/client";
import { Alert } from "../Alert";
import { Icon } from "../Icon";

interface CheckInSuccess {
  studentName: string;
  ticketCode: string;
  checkedInAt: string;
}

export function CheckInPanel({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<CheckInSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const inFlight = useRef(false);

  function stopCamera() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    setSuccess(null);

    const result = await sendJson<CheckInSuccess>("/api/checkin", "POST", {
      eventId,
      code: trimmed,
    });
    setBusy(false);
    inFlight.current = false;

    if (!result.ok) {
      setError(result.data.error ?? "We could not check that ticket in.");
      return;
    }
    setSuccess({
      studentName: String(result.data.studentName ?? ""),
      ticketCode: String(result.data.ticketCode ?? trimmed),
      checkedInAt: String(result.data.checkedInAt ?? new Date().toISOString()),
    });
    setCode("");
    router.refresh();
  }

  async function startCamera() {
    setCameraError(null);
    setError(null);
    setSuccess(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser cannot open the camera. Type the ticket code instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setScanning(true);
    } catch {
      setCameraError(
        "Camera access was blocked. Allow the camera in your browser settings, or type the ticket code instead.",
      );
    }
  }

  useEffect(() => {
    if (!scanning) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.play().catch(() => undefined);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    timerRef.current = window.setInterval(() => {
      if (!video.videoWidth || !context || inFlight.current) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      const found = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "dontInvert" });
      if (found?.data) {
        stopCamera();
        void submit(found.data);
      }
    }, 350);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  useEffect(() => stopCamera, []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card p-5">
        <h2 className="text-lg font-semibold">Check in a ticket</h2>
        <p className="mt-0.5 text-sm text-muted">
          Type the code from the student&apos;s ticket, or scan the QR code with your camera.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={scanning ? stopCamera : startCamera}
            className={scanning ? "btn btn-secondary flex-1" : "btn btn-primary flex-1"}
          >
            <Icon name={scanning ? "alert" : "camera"} size={16} />
            {scanning ? "Stop camera" : "Scan QR code"}
          </button>
        </div>

        {cameraError && (
          <div className="mt-3">
            <Alert variant="warning">{cameraError}</Alert>
          </div>
        )}

        {scanning && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-ink">
            <video ref={videoRef} muted playsInline className="aspect-[4/3] w-full object-cover" />
            <p className="bg-ink px-3 py-2 text-center text-xs text-white/80">
              Point the camera at the QR code on the student&apos;s ticket.
            </p>
          </div>
        )}

        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(code);
          }}
        >
          <label htmlFor="ticket-code" className="label">
            Ticket code
          </label>
          <div className="flex gap-2">
            <input
              id="ticket-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="FUL-XXXX-XXXX"
              autoComplete="off"
              autoCapitalize="characters"
              className="input font-mono uppercase"
            />
            <button type="submit" className="btn btn-primary shrink-0" disabled={busy || code.trim().length < 4}>
              {busy ? "Checking…" : "Check in"}
            </button>
          </div>
        </form>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          Every ticket can be used once. Paid tickets must be confirmed before check-in.
        </p>
      </section>

      <section className="card p-5" aria-live="polite">
        <h2 className="text-lg font-semibold">Result</h2>
        {!success && !error && (
          <div className="mt-4 rounded-2xl border border-dashed border-line px-4 py-10 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-page text-muted">
              <Icon name="scan" size={20} />
            </span>
            <p className="mt-3 text-sm text-muted">Waiting for a ticket for {eventTitle}.</p>
          </div>
        )}

        {error && (
          <div className="mt-4">
            <Alert variant="error" title="Check-in rejected">
              {error}
            </Alert>
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-2xl border border-[#bfe2cd] bg-brand-soft p-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white">
              <Icon name="check" size={22} />
            </span>
            <p className="mt-3 text-lg font-semibold text-brand-dark">Checked in</p>
            <p className="text-sm text-ink-soft">{success.studentName}</p>
            <p className="mt-1 font-mono text-sm text-brand-dark">{success.ticketCode}</p>
            <p className="mt-1 text-xs text-muted">
              {new Date(success.checkedInAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

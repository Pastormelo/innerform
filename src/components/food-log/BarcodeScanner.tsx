"use client";

import React, { useEffect, useRef, useState } from "react";
import { Barcode, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { InlineSpinner } from "@/components/ui/GeneratingOverlay";

/* ============================================================
   Barcode scanner (#14). Uses the native BarcodeDetector API
   (Chrome/Android/Edge) against the device camera when
   available; always offers manual code entry as a fallback
   (iOS Safari has no BarcodeDetector yet).
   ============================================================ */

type DetectorCtor = new (opts?: { formats?: string[] }) => { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> };

export function BarcodeScanner({ open, onClose, onDetected }: { open: boolean; onClose: () => void; onDetected: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "unsupported" | "denied">("idle");

  const stop = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      stop();
      return;
    }
    const Detector = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => setStatus("unsupported"));
      return;
    }
    let cancelled = false;
    queueMicrotask(() => setStatus("starting"));
    const detector = new Detector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setStatus("scanning");
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0 && codes[0].rawValue) {
              onDetected(codes[0].rawValue);
              return;
            }
          } catch {
            /* frame not ready */
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => setStatus("denied"));

    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="if-fade-in"
      style={{ position: "fixed", inset: 0, zIndex: 1300, background: "rgba(5,7,10,0.94)", display: "flex", flexDirection: "column" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px" }}>
        <span className="if-overline" style={{ color: "var(--text-secondary)" }}>
          Scan barcode
        </span>
        <button type="button" onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          <X size={22} />
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 24 }}>
        {status === "scanning" || status === "starting" ? (
          <div style={{ position: "relative", width: "100%", maxWidth: 380, aspectRatio: "4/3", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "#000" }}>
            <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: "28% 12%", border: "2px solid var(--forest-400)", borderRadius: 12, boxShadow: "0 0 0 100vmax rgba(0,0,0,0.35)" }} />
            {status === "starting" && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <InlineSpinner size={28} />
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "var(--text-secondary)", maxWidth: 340 }}>
            <Barcode size={40} color="var(--text-muted)" />
            <p style={{ fontSize: 14, marginTop: 12 }}>
              {status === "denied"
                ? "Camera access was blocked. Enter the barcode number below instead."
                : status === "unsupported"
                  ? "Live scanning isn't supported in this browser (iOS Safari has no barcode API yet). Type the number below — it still looks up Open Food Facts."
                  : "Point your camera at a barcode."}
            </p>
          </div>
        )}

        <div style={{ width: "100%", maxWidth: 380, display: "flex", gap: 8 }}>
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value.replace(/\D/g, ""))}
            placeholder="Or enter barcode number"
            inputMode="numeric"
          />
          <Button onClick={() => manual && onDetected(manual)} disabled={!manual} leadingIcon={<Camera size={16} />}>
            Look up
          </Button>
        </div>
      </div>
    </div>
  );
}

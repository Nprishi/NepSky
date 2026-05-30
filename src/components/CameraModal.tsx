import React, { useEffect, useRef, useState } from "react";
import { X, Camera } from "lucide-react";

type Props = {
  onCapture: (image: string) => void;
  onClose: () => void;
};

const CameraModal: React.FC<Props> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user", // front camera
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Camera access denied or not supported");
      }
    };

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const takePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);

    const image = canvas.toDataURL("image/jpeg");
    onCapture(image);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] h-full max-h-full flex items-center justify-center bg-black/70">
      <div className="relative h-full w-full max-w-screen-xl overflow-hidden rounded-2xl bg-black">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-black px-4 py-3 text-white">
          <Camera className="h-4 w-4" />
          <h2 className="font-semibold">Camera</h2>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* VIDEO */}
        <div className="relative bg-black">
          {error ? (
            <div className="p-10 text-center text-white">{error}</div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="h-[850px] w-full object-cover"
            />
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex justify-center gap-4 bg-black ">
          <button
            onClick={takePhoto}
            className="rounded-full bg-white p-4 mt-3 text-black"
          >
            <Camera />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;

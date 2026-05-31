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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div className="relative h-screen w-full overflow-hidden bg-black">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 text-white bg-black">
          <Camera className="h-5 w-5" />
          <h2 className="font-semibold">Camera</h2>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Camera Preview */}
        {error ? (
          <div className="flex h-full items-center justify-center text-white">
            {error}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        )}

        {/* Capture Button */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <button
            onClick={takePhoto}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-lg"
          >
            <Camera size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;

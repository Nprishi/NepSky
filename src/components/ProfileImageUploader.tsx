import React, { useRef } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Camera, Upload, Trash2 } from "lucide-react";

type Props = {
  onCameraClick: () => void;
  onGallerySelect: (image: string) => void;
};

const ProfileImageUploader: React.FC<Props> = ({
  onCameraClick,
  onGallerySelect,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const openGallery = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onGallerySelect(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex gap-2">
      {/* CAMERA */}
      <button
        onClick={onCameraClick}
        className="rounded-full bg-black p-2 text-white"
      >
        <Camera className="h-4 w-4" />
      </button>

      {/* GALLERY */}
      <button
        onClick={openGallery}
        className="rounded-full bg-indigo-600 p-2 text-white"
      >
        <Upload className="h-4 w-4" />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};

export default ProfileImageUploader;

import { useState } from "react";
import { X, Image as ImageIcon, Upload } from "lucide-react";

interface ImageUploadProps {
  value: string; // imagePreview URL
  onChange: (file: File) => void;
  onRemove: () => void;
  label?: string;
  accept?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  label = "Image",
  accept = "image/*",
  className = "",
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        onChange(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onChange(files[0]);
    }
  };

  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      <div className="image-upload">
        {value ? (
          <div className="image-preview">
            <img src={value} alt="Preview" />
            <button
              type="button"
              className="remove-image"
              onClick={(e) => {
                e.preventDefault();
                onRemove();
              }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label
            className={`upload-placeholder ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload size={32} />
            <span>Drag & drop or click to upload</span>
            <span className="upload-hint">Supports: JPG, PNG, GIF</span>
            <input
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              hidden
            />
          </label>
        )}
      </div>
    </label>
  );
}

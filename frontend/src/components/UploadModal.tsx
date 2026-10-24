import React, { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: File) => void;
  onSelectSample: (sampleUrl: string, sampleName: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
  onSelectSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onSelectFile(file);
        onClose();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSelectFile(e.target.files[0]);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl border border-[#E4E4E7] w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#E4E4E7] flex items-center justify-between bg-white">
          <div>
            <h3 className="font-semibold text-xs text-[#18181B] tracking-tight">
              Image Analysis
            </h3>
            <p className="text-[11px] text-[#71717A] mt-0.5">
              Select or drop a photo of waste objects to inspect
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#71717A] hover:text-[#18181B] hover:bg-zinc-100 transition-colors"
            aria-label="Close upload modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropzone Area */}
        <div className="p-5 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-emerald-600 bg-emerald-50/30"
                : "border-[#E4E4E7] hover:border-zinc-400 hover:bg-[#F7F8FA]"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#F7F8FA] border border-[#E4E4E7] flex items-center justify-center mx-auto mb-2 text-[#71717A]">
              <UploadCloud className="w-5 h-5 text-[#18181B]" />
            </div>
            <p className="text-xs font-semibold text-[#18181B] mb-0.5">
              Click to browse or drop an image here
            </p>
            <p className="text-[11px] text-[#71717A]">
              JPEG, PNG, WebP up to 25MB
            </p>
          </div>

          {/* Quick Test Samples */}
          <div>
            <span className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider block mb-2">
              Or Try A Preset Sample
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectSample("/samples/desk_waste.jpg", "desk_waste");
                  onClose();
                }}
                className="flex items-center gap-2 p-2 rounded border border-[#E4E4E7] hover:bg-[#F7F8FA] hover:border-zinc-300 text-left transition-colors"
              >
                <div className="w-7 h-7 rounded bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                  <img
                    src="/samples/desk_waste.jpg"
                    alt="Desk waste sample"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-xs font-medium text-[#18181B] block leading-tight">
                    Desk Waste
                  </span>
                  <span className="text-[10px] text-[#71717A]">
                    Cup, Laptop, Apple
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectSample(
                    "/samples/plastic_and_can.jpg",
                    "plastic_and_can"
                  );
                  onClose();
                }}
                className="flex items-center gap-2 p-2 rounded border border-[#E4E4E7] hover:bg-[#F7F8FA] hover:border-zinc-300 text-left transition-colors"
              >
                <div className="w-7 h-7 rounded bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                  <img
                    src="/samples/plastic_and_can.jpg"
                    alt="Containers sample"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-xs font-medium text-[#18181B] block leading-tight">
                    Containers
                  </span>
                  <span className="text-[10px] text-[#71717A]">
                    Bottle & Can
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-[#F7F8FA] border-t border-[#E4E4E7] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs font-medium text-[#71717A] hover:text-[#18181B] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

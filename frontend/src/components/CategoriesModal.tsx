import React from "react";
import { SupportedCategory } from "@/lib/types";
import { X, Layers, AlertCircle } from "lucide-react";

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: SupportedCategory[];
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl border border-[#E4E4E7] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#E4E4E7] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="font-semibold text-xs text-[#18181B]">
                Waste Streams & Intelligence Rules
              </h3>
              <p className="text-[11px] text-[#71717A] mt-0.5">
                The 8 canonical categories evaluated by ReMatter AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#71717A] hover:text-[#18181B] hover:bg-zinc-100 transition-colors"
            aria-label="Close categories modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Transparent Model Architecture Note */}
          <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#E4E4E7] text-xs text-[#71717A] leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#18181B] block mb-0.5">
                Model Architecture & Verification Philosophy
              </span>
              ReMatter AI utilizes an Ultralytics YOLO baseline to detect visual
              contours and object classes. Because visual cameras cannot analyze
              polymer chemistry or internal food grease, items like bottles and
              takeout containers enter a strict <strong>&ldquo;Needs verification&rdquo;</strong> state
              with actionable physical checklists before disposal.
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="border border-[#E4E4E7] rounded-lg p-3 hover:border-zinc-300 transition-colors bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-[#18181B]">
                      {cat.name}
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F7F8FA] text-[#71717A] font-mono border border-[#E4E4E7]">
                      Stream
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A] leading-relaxed mb-2">
                    {cat.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E4E4E7] text-[10px] text-[#71717A]">
                  <span className="font-medium text-[#18181B] block mb-0.5">
                    Disposal:
                  </span>
                  <span>{cat.disposal_overview}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-[#F7F8FA] border-t border-[#E4E4E7] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-medium bg-[#18181B] text-white hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

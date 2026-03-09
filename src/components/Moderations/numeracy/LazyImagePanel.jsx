// components/Moderations/numeracy/LazyImagePanel.jsx
"use client";

import { Image as ImageIcon, AlertCircle, Loader2 } from "lucide-react";
import { useWorkoutImage } from "@/hooks/useWorkoutImage";

export default function LazyImagePanel({ label, savedUrl, findUrl, onUrlResolved }) {
  const img = useWorkoutImage({ savedUrl, findUrl, onUrlResolved });

  return (
    <div className="mt-6 pt-6 border-t border-gray-600">
      <button
        onClick={img.toggle}
        className="flex items-center gap-2 text-gray-400 hover:text-foreground transition-colors mb-3"
      >
        <ImageIcon className="w-4 h-4" />
        {img.visible ? `Hide ${label}` : `Show ${label}`}
      </button>

      {img.visible && (
        <div className="mt-2">

          {/* First time load — may take a moment */}
          {img.state === "scanning" && (
            <div className="flex items-center gap-3 text-sm text-gray-400 bg-gray-800/50 rounded-lg p-4 border border-gray-600">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-primary-3" />
              <span>Please wait, this may take a moment…</span>
            </div>
          )}

          {/* Image found, now rendering */}
          {img.state === "loading" && (
            <div className="flex items-center gap-3 text-sm text-gray-400 bg-gray-800/50 rounded-lg p-4 border border-gray-600">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-primary-3" />
              <span>Loading image…</span>
            </div>
          )}

          {/* No image submitted */}
          {img.state === "not_found" && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              No image was submitted for this response.
            </div>
          )}

          {/* Something went wrong */}
          {img.state === "error" && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Unable to load image. Please try again.
            </div>
          )}

          {/* Image — hidden while loading, fades in once ready */}
          {img.resolvedUrl && (img.state === "loading" || img.state === "loaded") && (
            <img
              src={img.resolvedUrl}
              alt={label}
              onLoad={img.onLoad}
              onError={img.onError}
              className={`w-full rounded-lg border border-gray-600 max-h-64 object-contain transition-opacity duration-300 ${
                img.state === "loaded" ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
              }`}
            />
          )}

        </div>
      )}
    </div>
  );
}
"use client";
import { Heart, Star, ThumbsUp } from "lucide-react";
export default function RatingRenderer({ question, value, onChange, disabled }) {
  const { max = 5, icon = "star" } = question.config ?? {};
  const current = value ?? 0;
  const RatingIcon = icon === "heart" ? Heart : icon === "thumb" ? ThumbsUp : Star;
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(n)}
          className="transition-transform hover:scale-110 disabled:opacity-60"
          aria-label={`Rate ${n}`}
        >
          <RatingIcon
            size={26}
            className={n <= current ? "fill-primary-3 text-primary-3" : "text-gray-600"}
          />
        </button>
      ))}
    </div>
  );
}
// hooks/useWorkoutImage.js
// Manages the full lifecycle of a workout screenshot:
//
//   FAST PATH  – URL already saved in metadata → load instantly on demand.
//
//   SLOW PATH  – No saved URL → on first open, scan Firebase Storage for a
//                matching file using a regex pattern (same approach as the
//                Python admin scripts). If found, fetch the authenticated
//                download URL, display the image, then call onUrlResolved
//                so the parent saves it to Firestore metadata. Future
//                moderators will hit the fast path.
//
//   NOT FOUND  – Pattern scan returns null → surface "not available" state.
//
// Usage:
//   const img = useWorkoutImage({ savedUrl, findUrl, onUrlResolved });
//
//   img.visible     – boolean, whether the panel is open
//   img.resolvedUrl – authenticated URL to pass to <img src>
//   img.state       – "idle" | "scanning" | "loading" | "loaded" | "not_found" | "error"
//   img.isFirstLoad – true when no savedUrl was provided (shows extended message)
//   img.toggle()    – open / close the panel
//   img.onLoad()    – attach to <img onLoad>
//   img.onError()   – attach to <img onError>

import { useState, useRef } from "react";

/**
 * @param {object}        params
 * @param {string|null}   params.savedUrl       – URL already in Firestore metadata, or null
 * @param {function}      params.findUrl        – async () => string|null — scans storage
 * @param {function|null} params.onUrlResolved  – (url: string) => void — called once on first success
 */
export function useWorkoutImage({ savedUrl, findUrl, onUrlResolved }) {
  const [visible, setVisible]         = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState(savedUrl || null);
  const [state, setState]             = useState("idle"); // idle | scanning | loading | loaded | not_found | error
  const saveAttempted                 = useRef(false);
  const isFirstLoad                   = !savedUrl;

  const toggle = async () => {
    // Close
    if (visible) {
      setVisible(false);
      return;
    }

    setVisible(true);

    // Fast path — URL already known, just let the img tag load it
    if (resolvedUrl) {
      setState("loading");
      return;
    }

    // Slow path — scan storage for a matching file
    setState("scanning");
    try {
      const url = await findUrl();

      if (!url) {
        setState("not_found");
        return;
      }

      // File found — set URL and let the img tag load it
      setResolvedUrl(url);
      setState("loading");
    } catch (err) {
      console.error("[useWorkoutImage] Scan error:", err);
      setState("error");
    }
  };

  const onLoad = () => {
    setState("loaded");

    // Persist the URL once so future moderators skip the storage scan
    if (isFirstLoad && !saveAttempted.current && resolvedUrl) {
      saveAttempted.current = true;
      onUrlResolved?.(resolvedUrl);
    }
  };

  const onError = () => setState("error");

  return {
    visible,
    resolvedUrl,
    state,
    isFirstLoad,
    toggle,
    onLoad,
    onError,
  };
}
"use client";

import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { useState, useRef, useEffect } from "react";

export default function ModerationCard({ assessmentId, studentId }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [results, setResults] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const audioInstance = useRef(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const resultsRef = doc(
          db,
          `assessments/${assessmentId}/assessments-results/${assessmentId}_${studentId}`
        );
        const resultsSnap = await getDoc(resultsRef);

        if (!resultsSnap.exists()) {
          throw new Error(`Assessment results for ${studentId} not found`);
        }

        const resultsData = resultsSnap.data();
        setResults(resultsData);
        setCurrentIndex(0);
      } catch (error) {
        console.log("Error fetching assessment results:", error);
      }
    };

    if (assessmentId && studentId) {
      fetchResults();
    }
  }, [assessmentId, studentId]);

  const getAudioUrl = async (path) => {
    try {
      const storage = getStorage();
      const fileRef = ref(storage, path);
      const url = await getDownloadURL(fileRef);
      return url;
    } catch (err) {
      console.error("Error getting audio URL", err);
      setAudioError("Failed to fetch audio URL");
      return null;
    }
  };

  useEffect(() => {
    const loadAudio = async () => {
      setIsAudioLoading(true);
      setAudioError(null);
      
      const item = results?.literacy_results?.reading_results?.[currentIndex];
      if (!item) {
        setIsAudioLoading(false);
        return;
      }

      const meta = item.metadata;
      try {
        if (meta?.audio_url?.startsWith("http")) {
          setAudioUrl(meta.audio_url);
        } else if (meta?.audio_url) {
          const url = await getAudioUrl(meta.audio_url);
          setAudioUrl(url);
        } else {
          setAudioUrl(null);
        }
      } catch (err) {
        console.error("Error loading audio:", err);
        setAudioError("Failed to load audio file");
        setAudioUrl(null);
      } finally {
        setIsAudioLoading(false);
      }
    };

    loadAudio();
    setIsPlaying(false);
    setCurrentTime(0);
  }, [currentIndex, results]);

  const handlePlayPause = () => {
    if (!audioUrl) return;

    if (isPlaying) {
      audioInstance.current.pause();
      setIsPlaying(false);
    } else {
      // Create new audio instance if needed
      if (!audioInstance.current || audioInstance.current.src !== audioUrl) {
        if (audioInstance.current) {
          audioInstance.current.pause();
          audioInstance.current = null;
        }
        
        audioInstance.current = new Audio(audioUrl);
        
        audioInstance.current.addEventListener('timeupdate', () => {
          setCurrentTime(audioInstance.current.currentTime);
        });
        
        audioInstance.current.addEventListener('loadedmetadata', () => {
          setDuration(audioInstance.current.duration);
        });
        
        audioInstance.current.addEventListener('ended', () => {
          setIsPlaying(false);
        });
        
        audioInstance.current.addEventListener('error', () => {
          setAudioError("Failed to play audio");
          setIsPlaying(false);
        });
      }
      
      audioInstance.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("Playback failed:", err);
          setAudioError("Failed to play audio");
          setIsPlaying(false);
        });
    }
  };

  // Cleanup audio instance when component unmounts
  useEffect(() => {
    return () => {
      if (audioInstance.current) {
        audioInstance.current.pause();
        audioInstance.current = null;
      }
    };
  }, []);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getColoredWords = (content, transcript) => {
    if (!content) return null;

    const contentWords = content.trim().split(/\s+/);
    const transcriptWords = (transcript || "").trim().toLowerCase().split(/\s+/);

    let transcriptIndex = 0;

    return contentWords.map((word, index) => {
      const cleanWord = word.replace(/[.,!?;:""'’]/g, "").toLowerCase();
      let matched = false;

      while (transcriptIndex < transcriptWords.length) {
        const transcriptWord = transcriptWords[transcriptIndex];
        if (transcriptWord === cleanWord) {
          matched = true;
          transcriptIndex++;
          break;
        } else {
          transcriptIndex++;
        }
      }

      return (
        <span
          key={index}
          className={`mr-1 font-semibold ${
            matched ? "text-green-600" : "text-red-500"
          }`}
        >
          {word}
        </span>
      );
    });
  };

  const currentItem = results?.literacy_results?.reading_results?.[currentIndex];
  const totalResults = results?.literacy_results?.reading_results?.length || 0;

  const handleNext = () => {
    if (currentIndex < totalResults - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      console.log("Next student logic goes here.");
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!results || !currentItem) {
    return <div className="text-center py-6 text-gray-500">Loading result...</div>;
  }

  const showColoredWords =
    currentItem?.type === "Story" || currentItem?.type === "Paragraph";

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Unvalidated Results</h3>
            <p className="text-gray-600">{totalResults} results to validate</p>
          </div>
          <div className="text-gray-500">
            {currentIndex + 1}/{totalResults}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-6 text-center text-lg text-gray-900 leading-relaxed">
        {showColoredWords ? (
          getColoredWords(currentItem.content, currentItem.transcript)
        ) : (
          <span
            className={`font-semibold ${
              currentItem?.metadata?.passed ? "text-green-600" : "text-red-500"
            }`}
          >
            {currentItem.content}
          </span>
        )}
      </div>

      {/* Transcript */}
      <div className="mb-6 flex justify-center">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-w-md w-full text-center">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Model Prediction</h3>
          <p className="text-gray-900">{currentItem.transcript || "No transcript"}</p>
        </div>
      </div>

      {/* Audio Player */}
      <div className="mb-6 flex justify-center">
        <div className="bg-[#FFCD29] rounded-lg p-2 flex items-center space-x-4 max-w-xs w-full">
          {isAudioLoading ? (
            <div className="text-black">Loading audio...</div>
          ) : audioError ? (
            <div className="text-red-600 text-sm p-1">{audioError}</div>
          ) : audioUrl ? (
            <>
              <button
                onClick={handlePlayPause}
                className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-yellow-900 hover:bg-yellow-600 transition-colors"
                disabled={!!audioError}
              >
                {isPlaying ? "⏸️" : "▶️"}
              </button>

              <div className="flex-1 flex items-center gap-2">
                <div className="text-black font-medium whitespace-nowrap text-sm">
                  {formatTime(currentTime)}/{formatTime(duration || 0)}
                </div>
                <div className="flex-1 bg-yellow-500 rounded-full h-2">
                  <div
                    className="bg-yellow-700 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                      backgroundColor: audioError ? '#ef4444' : '#FFCD29'
                    }}
                  ></div>
                </div>
              </div>

              <button 
                className="text-yellow-900 hover:text-yellow-700"
                onClick={() => {
                  if (audioInstance.current) {
                    audioInstance.current.volume = audioInstance.current.volume === 1 ? 0.5 : 1;
                  }
                }}
              >
                🔊
              </button>
            </>
          ) : (
            <div className="text-black">No audio available</div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => console.log("Marked as bad audio")}
          className="flex items-center space-x-2 px-6 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
        >
          <span>❌</span>
          <span>Bad Audio</span>
        </button>

        <button
          onClick={() => console.log("Edit audio")}
          className="flex items-center space-x-2 px-6 py-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
        >
          <span>✏️</span>
          <span>Edit</span>
        </button>

        <button
          onClick={() => console.log("Marked as OK")}
          className="flex items-center space-x-2 px-6 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
        >
          <span>👍</span>
          <span>Ok</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>←</span>
          <span>Back</span>
        </button>

        <div className="text-gray-400 text-sm">
          {currentIndex === totalResults - 1 ? "NEXT STUDENT" : ""}
        </div>

        <button
          onClick={handleNext}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          <span>Next</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
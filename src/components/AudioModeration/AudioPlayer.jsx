import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

export default function AudioPlayer({ currentResult }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => {
          console.error("Audio playback error:", err);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const progressBar = e.currentTarget;
    const clickX = e.nativeEvent.offsetX;
    const width = progressBar.offsetWidth;
    const newTime = (clickX / width) * duration;

    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Reset when currentResult changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentResult]);

  return (
    <div className="bg-primary-3 rounded-xl p-3 mb-4 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={togglePlayPause} className="flex-shrink-0">
          {isPlaying ? (
            <Pause className="w-6 h-6 text-primary-1" />
          ) : (
            <Play className="w-6 h-6 text-primary-1" />
          )}
        </button>
        <div className="flex-1 max-w-full">
          <div className="text-sm font-medium text-primary-1 mb-1">
            {formatTime(currentTime)}/{formatTime(duration)}
          </div>
          <div
            className="w-full h-2 bg-primary-1 bg-opacity-20 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-primary-1 rounded-full"
              style={{
                width: duration ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
          </div>
        </div>
        <Volume2 className="w-5 h-5 text-primary-1 flex-shrink-0" />
      </div>
      {currentResult.metadata?.audio_url ? (
        <audio
          ref={audioRef}
          src={currentResult.metadata.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      ) : (
        <p className="text-primary-1 text-sm mt-2 max-w-full">No audio available</p>
      )}
    </div>
  );
}
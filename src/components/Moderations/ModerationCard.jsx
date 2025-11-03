"use client"

import { useState, useRef, useEffect } from "react"
import { PlayIcon, PauseIcon, SpeakerWaveIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/solid"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"

export default function ModerationCard({
  sample,
  currentResult,
  totalResults,
  onNext,
  onBack,
  assessmentId,
  studentId,
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [audioError, setAudioError] = useState(null)
  const audioRef = useRef(null)

  // Handle audio loading and playback
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadStart = () => {
      setIsLoading(true)
      setAudioError(null)
    }

    const handleLoadedData = () => {
      setIsLoading(false)
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = () => {
      setIsLoading(false)
      setAudioError("Failed to load audio. Please check the audio URL.")
      console.error("Audio loading error for URL:", sample.audioUrl)
    }

    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("loadeddata", handleLoadedData)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("loadeddata", handleLoadedData)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [sample.audioUrl])

  const togglePlayPause = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        await audio.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Audio playback error:", error)
      setAudioError("Failed to play audio. Please try again.")
    }
  }

  const handleProgressClick = (e) => {
    const audio = audioRef.current
    if (!audio || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickRatio = clickX / rect.width
    const newTime = clickRatio * duration

    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            disabled={currentResult === 1}
            className="flex items-center px-3 py-2 text-sm font-medium text-foreground bg-background-light border border-gray-500 rounded-xl hover:bg-background-lighter disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back
          </button>
          <span className="text-sm text-gray-300">
            {currentResult} of {totalResults}
          </span>
          <button
            onClick={onNext}
            disabled={currentResult === totalResults}
            className="flex items-center px-3 py-2 text-sm font-medium text-foreground bg-background-light border border-gray-500 rounded-xl hover:bg-background-lighter disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
          >
            Next
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {/* Original Text */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">Original Text</h3>
          <p className="text-foreground bg-background-lighter p-3 rounded-xl border border-gray-600">
            {sample.originalText.split(sample.highlightedWord).map((part, index, array) => (
              <span key={index}>
                {part}
                {index < array.length - 1 && (
                  <span className="bg-primary-3/30 text-primary-3 px-1 rounded-lg border border-primary-3/50">{sample.highlightedWord}</span>
                )}
              </span>
            ))}
          </p>
        </div>

        {/* Audio Player */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">Audio Recording</h3>
          <div className="bg-background-lighter p-4 rounded-xl border border-gray-600">
            <audio ref={audioRef} src={sample.audioUrl} preload="metadata" />

            {audioError && (
              <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-400">{audioError}</p>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlayPause}
                disabled={isLoading || !!audioError}
                className="flex items-center justify-center w-10 h-10 bg-primary-2 text-white rounded-full hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <PauseIcon className="h-5 w-5" />
                ) : (
                  <PlayIcon className="h-5 w-5 ml-0.5" />
                )}
              </button>

              <div className="flex-1">
                <div 
                  className="w-full h-2 bg-gray-600 rounded-full cursor-pointer" 
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-2 bg-primary-2 rounded-full transition-all duration-100"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{duration > 0 ? formatTime(duration) : sample.duration}</span>
                </div>
              </div>

              <SpeakerWaveIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Model Prediction */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">Model Prediction</h3>
          <p className="text-foreground bg-background-lighter p-3 rounded-xl border border-gray-600">{sample.modelPrediction}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 pt-4 border-t border-gray-600">
          <button className="flex items-center px-6 py-2 bg-secondary-2 text-white rounded-xl hover:bg-green-600 transition-colors shadow-md hover:shadow-lg">
            <CheckIcon className="h-4 w-4 mr-2" />
            Approve
          </button>
          <button className="flex items-center px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-md hover:shadow-lg">
            <XMarkIcon className="h-4 w-4 mr-2" />
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}
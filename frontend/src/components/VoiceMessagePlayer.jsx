import { useState, useRef, useEffect } from "react";
import { Play, Pause, Mic } from "lucide-react";

const VoiceMessagePlayer = ({ voiceUrl, duration, isMyMessage }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setAudioDuration(audio.duration);
      setIsLoaded(true);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleLoadStart = () => setIsLoaded(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * audioDuration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  // Generate waveform visualization (simplified)
  const generateWaveform = () => {
    const bars = [];
    const barCount = 40;
    for (let i = 0; i < barCount; i++) {
      const height = Math.random() * 16 + 4; // Random height between 4-20px
      const isPlayed = progress > (i / barCount) * 100;
      bars.push(
        <div
          key={i}
          className={`w-0.5 rounded-full transition-all duration-75 ${
            isPlayed
              ? isMyMessage ? 'bg-white' : 'bg-cyan-400'
              : isMyMessage ? 'bg-cyan-300/50' : 'bg-slate-500/50'
          }`}
          style={{ height: `${height}px` }}
        />
      );
    }
    return bars;
  };

  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg min-w-0 max-w-sm`}>
      <audio ref={audioRef} src={voiceUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={!isLoaded}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
          isMyMessage
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-cyan-500 hover:bg-cyan-600 text-white'
        } ${!isLoaded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {!isLoaded ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {/* Waveform Visualization */}
        <div
          onClick={handleSeek}
          className="flex items-center gap-0.5 h-8 cursor-pointer group"
        >
          {generateWaveform()}
        </div>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1">
        <Mic className={`w-3 h-3 ${isMyMessage ? 'text-white/70' : 'text-slate-400'}`} />
        <span className={`text-xs font-medium ${isMyMessage ? 'text-white/80' : 'text-slate-400'}`}>
          {formatTime(isPlaying ? audioDuration - currentTime : audioDuration)}
        </span>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
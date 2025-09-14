import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

const VoiceMessagePlayer = ({ voiceUrl, duration, isMyMessage }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setAudioDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
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

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      isMyMessage ? 'bg-cyan-600/20' : 'bg-slate-700/50'
    } max-w-xs`}>
      <audio ref={audioRef} src={voiceUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isMyMessage
            ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
            : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {/* Voice Icon */}
        <div className="flex items-center gap-2 mb-1">
          <Volume2 className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Voice Message</span>
        </div>

        {/* Progress Bar */}
        <div
          onClick={handleSeek}
          className="h-2 bg-slate-600/50 rounded-full cursor-pointer relative"
        >
          <div
            className={`h-full rounded-full transition-all ${
              isMyMessage ? 'bg-cyan-400' : 'bg-slate-400'
            }`}
            style={{ width: `${progress}%` }}
          />
          <div
            className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white transition-all ${
              isMyMessage ? 'bg-cyan-400' : 'bg-slate-400'
            }`}
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-slate-400">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs text-slate-400">
            {formatTime(audioDuration)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
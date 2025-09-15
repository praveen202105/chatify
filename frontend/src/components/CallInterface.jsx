import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from "lucide-react";
import { useCallStore } from "../store/useCallStore";

function CallInterface() {
  const {
    isInCall,
    callType,
    callStatus,
    currentCall,
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    isRemoteAudioEnabled,
    isRemoteVideoEnabled,
    toggleAudio,
    toggleVideo,
    endCall
  } = useCallStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);

  // Setup local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Setup remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected' && !callStartTime) {
      setCallStartTime(Date.now());
    }

    if (callStatus === 'connected' && callStartTime) {
      const interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callStatus, callStartTime]);

  // Reset timer when call ends
  useEffect(() => {
    if (!isInCall) {
      setCallDuration(0);
      setCallStartTime(null);
    }
  }, [isInCall]);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'initiating':
        return 'Calling...';
      case 'ringing':
        return 'Ringing...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formatDuration(callDuration);
      default:
        return '';
    }
  };

  if (!isInCall || !currentCall) return null;

  const isVideoCall = callType === 'video';

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Call Header */}
      <div className="flex-shrink-0 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-slate-100 font-semibold text-lg">
              {currentCall.participantName}
            </h3>
            <p className="text-slate-400 text-sm">
              {getStatusText()}
            </p>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative">
        {isVideoCall ? (
          <>
            {/* Remote Video (Full Screen) */}
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
              {remoteStream && isRemoteVideoEnabled ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-600 mb-4">
                    <img
                      src={currentCall.participantAvatar || "/avatar.png"}
                      alt={currentCall.participantName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm">
                    {!isRemoteVideoEnabled ? "Camera is off" : "Connecting..."}
                  </p>
                </div>
              )}
            </div>

            {/* Local Video (Picture-in-Picture) */}
            {localStream && (
              <div className="absolute top-4 right-4 w-32 h-40 bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-600 shadow-lg">
                {isVideoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                    <VideoOff className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Voice Call UI */
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col items-center justify-center">
            <div className="w-48 h-48 rounded-full overflow-hidden border-8 border-slate-600 mb-8 shadow-2xl">
              <img
                src={currentCall.participantAvatar || "/avatar.png"}
                alt={currentCall.participantName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Audio visualizer placeholder */}
            <div className="flex items-center gap-1 mb-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 bg-green-400 rounded-full transition-all duration-300 ${
                    isRemoteAudioEnabled
                      ? 'h-6 animate-pulse'
                      : 'h-2 bg-slate-600'
                  }`}
                  style={{
                    animationDelay: `${i * 100}ms`
                  }}
                />
              ))}
            </div>

            {/* Mute indicators */}
            <div className="flex items-center gap-4 text-slate-400 text-sm">
              {!isRemoteAudioEnabled && (
                <span className="flex items-center gap-1">
                  <MicOff className="w-4 h-4" />
                  Muted
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mute Indicators Overlay */}
        {!isRemoteAudioEnabled && (
          <div className="absolute top-4 left-4">
            <div className="bg-red-500/90 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm flex items-center gap-1">
              <VolumeX className="w-4 h-4" />
              Muted
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700/50 px-6 py-6">
        <div className="flex items-center justify-center gap-8">
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
              isAudioEnabled
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            aria-label={isAudioEnabled ? "Mute" : "Unmute"}
          >
            {isAudioEnabled ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-red-500/25"
            aria-label="End call"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>

          {/* Video Toggle (only for video calls) */}
          {isVideoCall && (
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                isVideoEnabled
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoEnabled ? (
                <Video className="w-6 h-6" />
              ) : (
                <VideoOff className="w-6 h-6" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CallInterface;
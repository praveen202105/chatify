import { useRef, useState, useEffect } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon, Mic, Square, Trash2 } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingAmplitude, setRecordingAmplitude] = useState([]);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const { sendMessage, isSoundEnabled, selectedUser } = useChatStore();
  const { socket } = useAuthStore();

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    // Stop typing indicator when sending message
    if (isTyping) {
      socket?.emit("stopTyping", { receiverId: selectedUser?._id });
      setIsTyping(false);
    }

    sendMessage({
      text: text.trim(),
      image: imagePreview,
    });
    setText("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTyping = () => {
    if (!selectedUser || !socket) {
      console.log("Typing not triggered:", { selectedUser: !!selectedUser, socket: !!socket });
      return;
    }

    console.log("User is typing to:", selectedUser.fullName, selectedUser._id);

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { receiverId: selectedUser._id });
      console.log("Emitted typing event to:", selectedUser._id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("stopTyping", { receiverId: selectedUser._id });
      console.log("Emitted stopTyping event to:", selectedUser._id);
    }, 2000);
  };

  // Audio visualization
  const analyzeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Get average amplitude
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedAmplitude = (average / 255) * 50; // Scale to 0-50px height

    setRecordingAmplitude(prev => {
      const newAmplitude = [...prev, normalizedAmplitude];
      return newAmplitude.slice(-40); // Keep only last 40 bars
    });

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio context for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setRecordingAmplitude([]);

      // Start audio analysis
      analyzeAudio();

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
      setRecordingAmplitude([]);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const sendVoiceMessage = async (audioBlob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result;
      sendMessage({
        voice: base64Audio,
        voiceDuration: recordingTime,
      });
      setRecordingTime(0);
    };
    reader.readAsDataURL(audioBlob);
  };

  // Cleanup timeout on unmount or user change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [selectedUser]);

  return (
    <div className="p-3 sm:p-4 border-t border-slate-700/50">
      {imagePreview && (
        <div className="w-full mx-auto mb-3 flex items-center">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-slate-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Recording Interface */}
      {isRecording && (
        <div className="w-full mx-auto mb-4 p-4 bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div className="absolute inset-0 bg-red-500/30 rounded-full animate-ping"></div>
              </div>
              <div>
                <p className="text-red-400 font-medium text-sm">Recording Voice Message</p>
                <p className="text-slate-400 text-xs">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>

            <button
              onClick={cancelRecording}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
              aria-label="Cancel recording"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>

          {/* Live Waveform */}
          <div className="flex items-center justify-center gap-0.5 h-12 mb-3 bg-slate-900/50 rounded-lg p-2">
            {recordingAmplitude.length > 0 ? (
              recordingAmplitude.map((amplitude, index) => (
                <div
                  key={index}
                  className="w-1 bg-red-400 rounded-full transition-all duration-100"
                  style={{ height: `${Math.max(amplitude, 4)}px` }}
                />
              ))
            ) : (
              // Placeholder bars while starting
              Array.from({ length: 20 }).map((_, index) => (
                <div
                  key={index}
                  className="w-1 bg-slate-600 rounded-full"
                  style={{ height: '8px' }}
                />
              ))
            )}
          </div>

          <p className="text-slate-400 text-center text-xs">
            Tap the send button to send • Tap the delete button to cancel
          </p>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="w-full mx-auto flex gap-2 sm:gap-4">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            isSoundEnabled && playRandomKeyStrokeSound();
            handleTyping();
          }}
          className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-3 sm:px-4 text-sm sm:text-base min-w-0"
          placeholder="Type your message..."
          disabled={isRecording}
        />

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg p-2 sm:px-4 sm:py-2 transition-colors ${
            imagePreview ? "text-cyan-500" : ""
          }`}
          disabled={isRecording}
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* Voice Message Button */}
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg p-2 sm:px-4 sm:py-2 transition-all hover:scale-105 active:scale-95"
            disabled={text.trim() || imagePreview}
            title="Hold to record voice message"
          >
            <Mic className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg p-2 transition-colors"
              title="Cancel recording"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg p-2 transition-all hover:scale-105 animate-pulse"
              title="Send voice message"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={(!text.trim() && !imagePreview) || isRecording}
          className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg p-2 sm:px-4 sm:py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
export default MessageInput;

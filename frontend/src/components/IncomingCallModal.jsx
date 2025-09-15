import { Phone, PhoneOff, Video } from "lucide-react";
import { useCallStore } from "../store/useCallStore";

function IncomingCallModal() {
  const { incomingCall, answerCall, rejectCall } = useCallStore();

  if (!incomingCall) return null;

  const { callerName, callerAvatar, callType } = incomingCall;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-md mx-auto text-center border border-slate-700 shadow-2xl">
        {/* Caller Avatar */}
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-slate-600">
            <img
              src={callerAvatar || "/avatar.png"}
              alt={callerName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Call Info */}
        <div className="mb-2">
          <h3 className="text-xl font-semibold text-slate-100 mb-1">
            {callerName}
          </h3>
          <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
            {callType === 'video' ? (
              <>
                <Video className="w-4 h-4" />
                Incoming video call
              </>
            ) : (
              <>
                <Phone className="w-4 h-4" />
                Incoming voice call
              </>
            )}
          </p>
        </div>

        {/* Pulsing Ring Animation */}
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping"></div>
            <div className="absolute inset-2 rounded-full bg-green-500/40 animate-ping animation-delay-75"></div>
            <Phone className="w-6 h-6 text-green-400 relative z-10" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          {/* Reject Call */}
          <button
            onClick={rejectCall}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-red-500/25"
            aria-label="Reject call"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>

          {/* Answer Call */}
          <button
            onClick={answerCall}
            className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-green-500/25"
            aria-label="Answer call"
          >
            <Phone className="w-7 h-7 text-white" />
          </button>
        </div>

        {/* Hint text */}
        <p className="text-slate-500 text-xs mt-4">
          Swipe left to reject • Swipe right to answer
        </p>
      </div>
    </div>
  );
}

export default IncomingCallModal;
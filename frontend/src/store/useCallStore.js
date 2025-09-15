import { create } from "zustand";
import WebRTCService from "../lib/webrtc.js";
import { useAuthStore } from "./useAuthStore.js";
import toast from "react-hot-toast";

export const useCallStore = create((set, get) => ({
  // Call state
  isInCall: false,
  callType: null, // 'voice' | 'video'
  callStatus: 'idle', // 'idle' | 'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended'
  callId: null,

  // Participant info
  currentCall: null, // { participantId, participantName, participantAvatar, callType }
  incomingCall: null, // { callerId, callerName, callerAvatar, callType, offer, callId }

  // Media state
  localStream: null,
  remoteStream: null,
  isAudioEnabled: true,
  isVideoEnabled: true,
  isRemoteAudioEnabled: true,
  isRemoteVideoEnabled: true,

  // Audio
  ringtoneAudio: null,

  // WebRTC service instance
  webRTCService: new WebRTCService(),

  // Initialize call system
  initializeCallSystem: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    // Listen for incoming calls
    socket.on("incomingCall", (data) => {
      const { callerId, callerName, callerAvatar, callType, offer, callId } = data;

      set({
        incomingCall: {
          callerId,
          callerName,
          callerAvatar,
          callType,
          offer,
          callId
        }
      });

      // Show notification sound or UI
      get().playIncomingCallSound();
    });

    // Listen for call answered
    socket.on("callAnswered", async (data) => {
      const { answer, callId } = data;

      try {
        await get().webRTCService.handleAnswer(answer);
        set({
          callStatus: 'connected',
          callId: callId
        });
      } catch (error) {
        console.error('Error handling call answer:', error);
        get().endCall();
      }
    });

    // Listen for call rejected
    socket.on("callRejected", (data) => {
      const { reason } = data;

      set({
        callStatus: 'ended',
        isInCall: false,
        currentCall: null
      });

      toast.error(reason === 'rejected' ? 'Call was rejected' : 'Call failed');
      get().cleanup();
    });

    // Listen for call ended
    socket.on("callEnded", (data) => {
      set({
        callStatus: 'ended',
        isInCall: false,
        currentCall: null
      });

      toast.info('Call ended');
      get().cleanup();
    });

    // Listen for ICE candidates
    socket.on("iceCandidate", async (data) => {
      const { candidate } = data;

      try {
        await get().webRTCService.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    // Listen for participant status updates
    socket.on("participantStatusUpdate", (data) => {
      const { status } = data;

      set({
        isRemoteAudioEnabled: status.audio,
        isRemoteVideoEnabled: status.video
      });
    });

    // Listen for call ringing
    socket.on("callRinging", () => {
      set({ callStatus: 'ringing' });
    });

    // Listen for call failed
    socket.on("callFailed", (data) => {
      const { reason, message } = data;

      set({
        callStatus: 'ended',
        isInCall: false,
        currentCall: null
      });

      toast.error(message || 'Call failed');
      get().cleanup();
    });
  },

  // Initiate a call
  initiateCall: async (participantId, participantName, participantAvatar, callType) => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    try {
      set({
        isInCall: true,
        callType: callType,
        callStatus: 'initiating',
        currentCall: {
          participantId,
          participantName,
          participantAvatar,
          callType
        }
      });

      // Initialize WebRTC
      await get().webRTCService.initialize();

      // Get user media
      const constraints = {
        audio: true,
        video: callType === 'video'
      };

      const localStream = await get().webRTCService.getUserMedia(constraints);
      set({ localStream });

      // Setup WebRTC event handlers
      get().webRTCService.setupEventHandlers({
        onIceCandidate: (candidate) => {
          socket.emit("iceCandidate", {
            participantId: participantId,
            candidate: candidate,
            callId: get().callId
          });
        },
        onRemoteStream: (stream) => {
          set({ remoteStream: stream });
        },
        onConnectionStateChange: (state) => {
          console.log('Connection state:', state);
          if (state === 'connected') {
            set({ callStatus: 'connected' });
          } else if (state === 'failed' || state === 'disconnected') {
            get().endCall();
          }
        }
      });

      // Create offer
      const offer = await get().webRTCService.createOffer();

      // Send call invitation
      socket.emit("initiateCall", {
        receiverId: participantId,
        callType: callType,
        offer: offer
      });

    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Failed to start call');
      get().cleanup();
    }
  },

  // Answer incoming call
  answerCall: async () => {
    const { incomingCall } = get();
    const { socket } = useAuthStore.getState();

    if (!incomingCall || !socket) return;

    // Stop ringtone
    get().stopIncomingCallSound();

    try {
      set({
        isInCall: true,
        callType: incomingCall.callType,
        callStatus: 'connecting',
        currentCall: {
          participantId: incomingCall.callerId,
          participantName: incomingCall.callerName,
          participantAvatar: incomingCall.callerAvatar,
          callType: incomingCall.callType
        },
        callId: incomingCall.callId,
        incomingCall: null
      });

      // Initialize WebRTC
      await get().webRTCService.initialize();

      // Get user media
      const constraints = {
        audio: true,
        video: incomingCall.callType === 'video'
      };

      const localStream = await get().webRTCService.getUserMedia(constraints);
      set({ localStream });

      // Setup WebRTC event handlers
      get().webRTCService.setupEventHandlers({
        onIceCandidate: (candidate) => {
          socket.emit("iceCandidate", {
            participantId: incomingCall.callerId,
            candidate: candidate,
            callId: incomingCall.callId
          });
        },
        onRemoteStream: (stream) => {
          set({ remoteStream: stream });
        },
        onConnectionStateChange: (state) => {
          console.log('Connection state:', state);
          if (state === 'connected') {
            set({ callStatus: 'connected' });
          } else if (state === 'failed' || state === 'disconnected') {
            get().endCall();
          }
        }
      });

      // Create answer
      const answer = await get().webRTCService.createAnswer(incomingCall.offer);

      // Send answer
      socket.emit("answerCall", {
        callerId: incomingCall.callerId,
        answer: answer,
        callId: incomingCall.callId
      });

    } catch (error) {
      console.error('Error answering call:', error);
      toast.error('Failed to answer call');
      get().rejectCall();
    }
  },

  // Reject incoming call
  rejectCall: () => {
    const { incomingCall } = get();
    const { socket } = useAuthStore.getState();

    if (!incomingCall || !socket) return;

    // Stop ringtone
    get().stopIncomingCallSound();

    socket.emit("rejectCall", {
      callerId: incomingCall.callerId,
      callId: incomingCall.callId
    });

    set({ incomingCall: null });
  },

  // End current call
  endCall: () => {
    const { currentCall, callId } = get();
    const { socket } = useAuthStore.getState();

    if (currentCall && socket && callId) {
      socket.emit("endCall", {
        participantId: currentCall.participantId,
        callId: callId
      });
    }

    get().cleanup();
  },

  // Toggle audio
  toggleAudio: () => {
    const { isAudioEnabled } = get();
    const newState = !isAudioEnabled;

    get().webRTCService.toggleAudio(newState);
    set({ isAudioEnabled: newState });

    // Notify participant
    get().sendStatusUpdate();
  },

  // Toggle video
  toggleVideo: () => {
    const { isVideoEnabled } = get();
    const newState = !isVideoEnabled;

    get().webRTCService.toggleVideo(newState);
    set({ isVideoEnabled: newState });

    // Notify participant
    get().sendStatusUpdate();
  },

  // Send status update to participant
  sendStatusUpdate: () => {
    const { currentCall, callId, isAudioEnabled, isVideoEnabled } = get();
    const { socket } = useAuthStore.getState();

    if (currentCall && socket && callId) {
      socket.emit("callStatusUpdate", {
        participantId: currentCall.participantId,
        status: {
          audio: isAudioEnabled,
          video: isVideoEnabled
        },
        callId: callId
      });
    }
  },

  // Cleanup call resources
  cleanup: () => {
    // Stop any playing ringtone
    get().stopIncomingCallSound();

    get().webRTCService.hangUp();

    set({
      isInCall: false,
      callType: null,
      callStatus: 'idle',
      callId: null,
      currentCall: null,
      incomingCall: null,
      localStream: null,
      remoteStream: null,
      isAudioEnabled: true,
      isVideoEnabled: true,
      isRemoteAudioEnabled: true,
      isRemoteVideoEnabled: true,
      ringtoneAudio: null
    });
  },

  // Play incoming call sound
  playIncomingCallSound: () => {
    try {
      const ringtone = new Audio("/sounds/notification.mp3");
      ringtone.loop = true; // Loop the ringtone
      ringtone.volume = 0.7;
      ringtone.play().catch(e => console.log("Ringtone play failed:", e));

      // Store reference to stop it later
      set({ ringtoneAudio: ringtone });
    } catch (error) {
      console.log('Error playing ringtone:', error);
    }
  },

  // Stop incoming call sound
  stopIncomingCallSound: () => {
    const { ringtoneAudio } = get();
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
      set({ ringtoneAudio: null });
    }
  },

  // Cleanup on unmount
  destroy: () => {
    get().cleanup();

    const { socket } = useAuthStore.getState();
    if (socket) {
      socket.off("incomingCall");
      socket.off("callAnswered");
      socket.off("callRejected");
      socket.off("callEnded");
      socket.off("iceCandidate");
      socket.off("participantStatusUpdate");
      socket.off("callRinging");
      socket.off("callFailed");
    }
  }
}));
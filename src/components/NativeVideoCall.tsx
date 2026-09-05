"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

interface NativeVideoCallProps {
  chatRoomId: string;
  userEmail: string;
  peerEmail: string;
  onEndCall: () => void;
}

export function NativeVideoCall({ chatRoomId, userEmail, peerEmail, onEndCall }: NativeVideoCallProps) {
  const [hasMedia, setHasMedia] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [status, setStatus] = useState("Connecting to peer...");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const handledSignalIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 1. Initialize local media
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setHasMedia(true);
        initWebRTC(stream);
      } catch (err) {
        console.error("Error accessing media devices.", err);
        setStatus("Could not access camera/microphone");
      }
    };

    initMedia();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendSignal = async (type: string, payload: any) => {
    try {
      await fetch("/api/webrtc/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatRoomId,
          senderEmail: userEmail,
          receiverEmail: peerEmail,
          type,
          payload
        })
      });
    } catch (e) {
      console.error("Failed to send signal", e);
    }
  };

  const initWebRTC = async (localStream: MediaStream) => {
    // ICE servers for NAT traversal (using free Google STUN)
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    };
    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Add local tracks to peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      setStatus("Connected");
      if (remoteVideoRef.current && event.streams[0]) {
        if (remoteVideoRef.current.srcObject !== event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    };

    // Send ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("ice-candidate", event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setStatus("Connected");
      if (pc.connectionState === "disconnected") setStatus("Peer disconnected");
      if (pc.connectionState === "failed") setStatus("Connection failed");
    };

    // Initialize Signaling (SSE)
    const url = `/api/webrtc/signal?room=${chatRoomId}&email=${encodeURIComponent(userEmail)}`;
    const source = new EventSource(url);
    eventSourceRef.current = source;

    source.onmessage = async (e) => {
      try {
        const signal = JSON.parse(e.data);
        if (signal.type === "connected") return;
        
        // Prevent processing same signal twice
        if (signal.id && handledSignalIds.current.has(signal.id)) return;
        if (signal.id) handledSignalIds.current.add(signal.id);

        if (signal.type === "offer") {
          setStatus("Receiving call...");
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal("answer", answer);
        } else if (signal.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
        } else if (signal.type === "ice-candidate") {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
          } catch (err) {
            console.error("Error adding ice candidate", err);
          }
        }
      } catch (err) {
        console.error("Error handling signal", err);
      }
    };

    // Start connection by sending offer if we are the "founder"
    // To avoid race conditions where both send offers, we let the person who mounted first wait 2s
    // Actually, a simpler approach: the person who clicked "Start Call" (which we don't strictly know here)
    // Let's use a deterministic initiator based on email sort order
    const isInitiator = userEmail > peerEmail;
    if (isInitiator) {
      setStatus("Calling peer...");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal("offer", offer);
    }
  };

  const cleanup = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micOn;
        setMicOn(!micOn);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoOn;
        setVideoOn(!videoOn);
      }
    }
  };

  const handleHangup = () => {
    cleanup();
    onEndCall();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <h2 className="text-white text-xl font-semibold tracking-wide">Secure Deal Room Call</h2>
          <p className="text-white/60 text-sm mt-1">{status}</p>
        </div>
      </div>

      {/* Video Grid */}
      <div className="relative w-full max-w-6xl aspect-video bg-[#111] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        {/* Remote Video */}
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        
        {/* Local Video Picture-in-Picture */}
        <div className="absolute bottom-6 right-6 w-48 aspect-[3/4] bg-black rounded-xl overflow-hidden border border-white/20 shadow-2xl transition-transform hover:scale-105">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover mirror-mode"
            style={{ transform: "scaleX(-1)" }} // mirror for local view
          />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md px-8 py-4 rounded-full border border-white/10">
        <button 
          onClick={toggleMic}
          className={`p-4 rounded-full transition-all ${micOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/80 hover:bg-red-500 text-white'}`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button 
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-all ${videoOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/80 hover:bg-red-500 text-white'}`}
        >
          {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button 
          onClick={handleHangup}
          className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] px-8 flex items-center gap-2 font-medium"
        >
          <PhoneOff className="w-5 h-5" />
          End Call
        </button>
      </div>

    </div>
  );
}

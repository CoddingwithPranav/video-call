import { useEffect, useRef, useState } from "react";

interface WsMessage {
  type: 'lobby' | 'send-offer' | 'offer' | 'answer' | 'add-ice-candidate';
  roomId?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  candidateType?: 'sender' | 'receiver';
}

export const RealRoom = ({
  name,
  localAudioTrack,
  localVideoTrack,
  onLeave,
}: {
  name: string;
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
  onLeave: () => void;
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lobby, setLobby] = useState(true);
  const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
  const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  useEffect(() => {
    const socket = new WebSocket('wss://vecall.pranavmishra.dev/api'); // Fixed URL to wss://
    setSocket(socket);

    socket.onopen = () => {
      console.log("WebSocket connected successfully");
      socket.send(JSON.stringify({ type: 'sender' }));
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = (event) => {
      console.log("WebSocket closed with code:", event.code, "reason:", event.reason);
    };

    socket.onmessage = async (event) => {
      const message: WsMessage = JSON.parse(event.data);
      console.log("WebSocket message received:", message);

      if (message.type === 'send-offer') {
        setLobby(false);
        const pc =  new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302'}, {
            urls: "turn:free.expressturn.com:3478",
            username: "000000002083246983",
            credential: "wON0bzQQ19tSIZuPwS2TKAyuQRQ="
          },
          ]
        });
        pc.onconnectionstatechange = () => {
          console.log("Peer connection state:", pc.connectionState);
        };

        if (localVideoTrack) {
          console.log("Adding video track:", localVideoTrack);
          pc.addTrack(localVideoTrack);
        } else {
          console.warn("No video track available");
        }
        if (localAudioTrack) {
          console.log("Adding audio track:", localAudioTrack);
          pc.addTrack(localAudioTrack);
        } else {
          console.warn("No audio track available");
        }

        pc.ontrack = (event) => {
          console.log("Sender received remote track:", event.track.kind);
          if (event.track.kind === 'video' && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = new MediaStream([event.track]);
            remoteVideoRef.current.play().catch(e => console.error("Play error:", e));
          } else if (event.track.kind === 'audio' && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = new MediaStream([event.track]);
            remoteAudioRef.current.play().catch(e => console.error("Play error:", e));
          }
        };

        pc.onicecandidate = async (e) => {
          if (e.candidate) {
            socket.send(JSON.stringify({
              type: 'add-ice-candidate',
              candidate: e.candidate,
              candidateType: 'sender',
              roomId: message.roomId,
            }));
          }
        };

        pc.onnegotiationneeded = async () => {
          console.log("Negotiation needed, creating offer");
          const sdp = await pc.createOffer();
          await pc.setLocalDescription(sdp);
          socket.send(JSON.stringify({
            type: 'offer',
            sdp,
            roomId: message.roomId,
          }));
        };

        setSendingPc(pc);
      }

      if (message.type === 'offer') {
        console.log("here");
        if (!message.sdp) return;
        setLobby(false);
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302'}, {
            urls: "turn:free.expressturn.com:3478",
            username: "000000002083246983",
            credential: "wON0bzQQ19tSIZuPwS2TKAyuQRQ="
          },
          ]
        });

        if (localVideoTrack) {
          pc.addTrack(localVideoTrack);
        }
        if (localAudioTrack) {
          pc.addTrack(localAudioTrack);
        }

        pc.ontrack = (event) => {
          console.log("Track received:", event.track, event.streams);
          const stream = event.streams[0] || new MediaStream();
          if (event.track.kind === 'video' && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = new MediaStream([event.track]);
            remoteVideoRef.current.muted = true; // Video elements don't need audio
            remoteVideoRef.current.play().catch(err => console.error("Remote video play error:", err));
          } else if (event.track.kind === 'audio' && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = new MediaStream([event.track]);
            remoteAudioRef.current.play().catch(err => console.error("Remote audio play error:", err));
          }
        };

        await pc.setRemoteDescription(message.sdp);
        const sdp = await pc.createAnswer();
        await pc.setLocalDescription(sdp);

        pc.onicecandidate = async (e) => {
          if (e.candidate) {
            socket.send(JSON.stringify({
              type: 'add-ice-candidate',
              candidate: e.candidate,
              candidateType: 'receiver',
              roomId: message.roomId,
            }));
          }
        };

        setReceivingPc(pc);
        socket.send(JSON.stringify({
          type: 'answer',
          roomId: message.roomId,
          sdp,
        }));
      }

      if (message.type === 'answer') {
        setLobby(false);
        setSendingPc((pc) => {
          if (message.sdp && pc) {
            pc.setRemoteDescription(message.sdp).catch(err => console.error("Set remote description error:", err));
          }
          return pc;
        });
      }

      if (message.type === 'lobby') {
        setLobby(true);
      }

      if (message.type === 'add-ice-candidate') {
        if (message.candidateType === 'sender') {
          setReceivingPc((pc) => {
            if (message.candidate && pc) {
              pc.addIceCandidate(message.candidate).catch(err => console.error("ICE candidate error:", err));
            }
            return pc;
          });
        } else {
          setSendingPc((pc) => {
            if (message.candidate && pc) {
              pc.addIceCandidate(message.candidate).catch(err => console.error("ICE candidate error:", err));
            }
            return pc;
          });
        }
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localVideoTrack) {
      localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(err => console.error("Local video play error:", err));
    }
  }, [localVideoRef, localVideoTrack]);

  const toggleMute = () => {
    if (localAudioTrack) {
      localAudioTrack.enabled = !localAudioTrack.enabled;
      setIsMuted(!localAudioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrack) {
      localVideoTrack.enabled = !localVideoTrack.enabled;
      setIsVideoOff(!localVideoTrack.enabled);
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsSpeakerOn(!remoteAudioRef.current.muted);
    }
  };

  const handleEndCall = () => {
    if (sendingPc) {
      sendingPc.close();
    }
    if (receivingPc) {
      receivingPc.close();
    }
    if (socket) {
      socket.close();
    }
    if (localAudioTrack) {
      localAudioTrack.stop();
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
    }
    onLeave();
  };

  return (
    <div className="relative h-screen w-screen bg-gray-900 overflow-hidden">
      {/* Remote video (full screen) */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <video
            autoPlay
            playsInline
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
        />
        <audio autoPlay ref={remoteAudioRef} />
      </div>

      {/* Local video (picture-in-picture) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-24 h-32 sm:w-32 sm:h-40 md:w-40 md:h-52 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-800 z-10">
        {!isVideoOff && localVideoTrack ? (
          <video
            autoPlay
            muted
            playsInline
            ref={localVideoRef}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <span className="text-xl sm:text-2xl font-bold uppercase text-white">
                {name.charAt(0) || 'Y'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top bar with name */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 sm:p-6 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <span className="text-lg sm:text-xl font-bold uppercase text-white">
                {lobby ? '?' : 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-white font-semibold text-base sm:text-lg">
                {lobby ? 'Searching...' : 'Connected User'}
              </h2>
              <p className="text-green-400 text-xs sm:text-sm">
                {lobby ? 'Looking for a match' : 'In call'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls bar (WhatsApp style) */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-8  pb-safe-6 sm:pb-safe-10 z-10">
        <div className="max-w-md mx-auto mb-16 md:mb-0 flex items-center justify-center gap-4 sm:gap-6">
          {/* Mute/Unmute button */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg active:scale-95 touch-manipulation ${
              isMuted 
                ? 'bg-white text-gray-900' 
                : 'bg-gray-700/80 text-white hover:bg-gray-600/80'
            }`}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Video on/off button */}
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg active:scale-95 touch-manipulation ${
              isVideoOff 
                ? 'bg-white text-gray-900' 
                : 'bg-gray-700/80 text-white hover:bg-gray-600/80'
            }`}
            aria-label={isVideoOff ? 'Turn video on' : 'Turn video off'}
          >
            {isVideoOff ? (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            )}
          </button>

          {/* End call button */}
          <button
            onClick={handleEndCall}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all duration-200 shadow-xl active:scale-95 touch-manipulation"
            aria-label="End call"
          >
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" transform="rotate(135 10 10)" />
            </svg>
          </button>

          {/* Speaker toggle button */}
          <button
            onClick={toggleSpeaker}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg active:scale-95 touch-manipulation ${
              !isSpeakerOn 
                ? 'bg-white text-gray-900' 
                : 'bg-gray-700/80 text-white hover:bg-gray-600/80'
            }`}
            aria-label={isSpeakerOn ? 'Turn speaker off' : 'Turn speaker on'}
          >
            {isSpeakerOn ? (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

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
}: {
  name: string;
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lobby, setLobby] = useState(true);
  const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
  const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null); // Added for remote audio
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);

  useEffect(() => {
    const socket = new WebSocket('wss://locahost:8080'); // Fixed URL to wss://
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
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
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
        if (!message.sdp) return;
        setLobby(false);
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        pc.ontrack = (event) => {
          console.log("Track received:", event.track, event.streams);
          const stream = event.streams[0] || new MediaStream();
          if (event.track.kind === 'video' && remoteVideoRef.current) {
            setRemoteVideoTrack(event.track);
            remoteVideoRef.current.srcObject = new MediaStream([event.track]);
            remoteVideoRef.current.muted = true; // Video elements don't need audio
            remoteVideoRef.current.play().catch(err => console.error("Remote video play error:", err));
          } else if (event.track.kind === 'audio' && remoteAudioRef.current) {
            setRemoteAudioTrack(event.track);
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

  return (
    <div>
      Hi {name}
      <video autoPlay muted width={400} height={400} ref={localVideoRef} />
      {lobby ? "Waiting to connect you to someone" : null}
      <video autoPlay muted width={400} height={400} ref={remoteVideoRef} />
      <audio autoPlay ref={remoteAudioRef} /> {/* Added for remote audio */}
    </div>
  );
};
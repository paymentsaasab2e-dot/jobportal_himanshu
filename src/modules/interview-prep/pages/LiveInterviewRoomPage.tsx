'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { Camera, CameraOff, Mic, MicOff, MonitorUp, PhoneOff, Users } from 'lucide-react';
import { API_ORIGIN } from '@/lib/api-base';

type RoomRole = 'candidate' | 'interviewer' | 'guest';

type ChatMessage = {
  socketId: string;
  displayName: string;
  role: RoomRole | string;
  message: string;
  createdAt: string;
};

type RoomParticipant = {
  socketId: string;
  displayName: string;
  role: string;
};

const ROOM_EVENT = {
  JOIN: 'interview-room:join',
  JOINED: 'interview-room:joined',
  JOIN_ERROR: 'interview-room:join-error',
  PARTICIPANT_JOINED: 'interview-room:participant-joined',
  PARTICIPANT_LEFT: 'interview-room:participant-left',
  SIGNAL: 'interview-room:signal',
  CHAT_MESSAGE: 'interview-room:chat-message',
} as const;

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
};

function sanitizeRoomId(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeRole(value: string): RoomRole {
  const role = String(value || '').trim().toLowerCase();
  if (role === 'candidate') return 'candidate';
  if (role === 'interviewer') return 'interviewer';
  return 'guest';
}

export default function LiveInterviewRoomPage() {
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();
  const roomId = sanitizeRoomId(String(params?.roomId || ''));
  const displayName = String(searchParams.get('name') || 'Participant').trim().slice(0, 80) || 'Participant';
  const role = normalizeRole(String(searchParams.get('role') || 'guest'));

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [statusText, setStatusText] = useState(
    roomId ? 'Requesting camera and microphone...' : 'Invalid room ID.'
  );
  const [chatDraft, setChatDraft] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [mediaError, setMediaError] = useState('');

  const socketOrigin = String(process.env.NEXT_PUBLIC_INTERVIEW_SIGNAL_ORIGIN || API_ORIGIN || '').replace(/\/$/, '');

  const attachRemoteStream = (stream: MediaStream) => {
    remoteStreamRef.current = stream;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  };

  const closePeer = (peerSocketId: string) => {
    const peer = peerConnectionsRef.current.get(peerSocketId);
    if (peer) {
      peer.ontrack = null;
      peer.onicecandidate = null;
      peer.close();
    }
    peerConnectionsRef.current.delete(peerSocketId);
  };

  useEffect(() => {
    let mounted = true;

    if (!roomId) {
      return undefined;
    }

    const ensurePeerConnection = (peerSocketId: string, initiator: boolean) => {
      const existing = peerConnectionsRef.current.get(peerSocketId);
      if (existing) return existing;

      const socket = socketRef.current;
      const localStream = localStreamRef.current;
      if (!socket || !localStream) return null;

      const connection = new RTCPeerConnection(rtcConfig);
      localStream.getTracks().forEach((track) => {
        connection.addTrack(track, localStream);
      });

      connection.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) attachRemoteStream(stream);
      };

      connection.onicecandidate = (event) => {
        if (!event.candidate) return;
        socket.emit(ROOM_EVENT.SIGNAL, {
          roomId,
          to: peerSocketId,
          candidate: event.candidate,
        });
      };

      peerConnectionsRef.current.set(peerSocketId, connection);

      if (initiator) {
        void (async () => {
          const offer = await connection.createOffer();
          await connection.setLocalDescription(offer);
          socket.emit(ROOM_EVENT.SIGNAL, {
            roomId,
            to: peerSocketId,
            description: offer,
          });
        })();
      }

      return connection;
    };

    const cleanupMedia = () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };

    const cleanupSocket = () => {
      peerConnectionsRef.current.forEach((peer) => peer.close());
      peerConnectionsRef.current.clear();
      socketRef.current?.disconnect();
      socketRef.current = null;
    };

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setStatusText('Connecting to room...');

        const socket = io(socketOrigin, {
          transports: ['websocket', 'polling'],
          withCredentials: true,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit(ROOM_EVENT.JOIN, { roomId, displayName, role });
        });

        socket.on(ROOM_EVENT.JOINED, (payload: { participants: RoomParticipant[] }) => {
          const joinedParticipants = Array.isArray(payload?.participants) ? payload.participants : [];
          setParticipants(joinedParticipants);
          setStatusText(joinedParticipants.length > 0 ? 'Connected. Starting secure peer call...' : 'Waiting for second participant...');
          joinedParticipants.forEach((participant) => {
            ensurePeerConnection(participant.socketId, true);
          });
        });

        socket.on(ROOM_EVENT.JOIN_ERROR, (payload: { message?: string }) => {
          setStatusText(payload?.message || 'Unable to join room.');
        });

        socket.on(ROOM_EVENT.PARTICIPANT_JOINED, (participant: RoomParticipant) => {
          setParticipants((prev) => {
            const deduped = prev.filter((item) => item.socketId !== participant.socketId);
            return [...deduped, participant];
          });
          setStatusText('Participant joined. Establishing connection...');
          ensurePeerConnection(participant.socketId, true);
        });

        socket.on(ROOM_EVENT.PARTICIPANT_LEFT, (payload: { socketId: string }) => {
          closePeer(payload.socketId);
          setParticipants((prev) => prev.filter((item) => item.socketId !== payload.socketId));
          setStatusText('Other participant left the room.');
          remoteStreamRef.current = null;
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        });

        socket.on(
          ROOM_EVENT.SIGNAL,
          async (payload: { from: string; description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) => {
            const peerSocketId = String(payload?.from || '').trim();
            if (!peerSocketId) return;

            const peer = ensurePeerConnection(peerSocketId, false);
            if (!peer) return;

            if (payload.description) {
              await peer.setRemoteDescription(new RTCSessionDescription(payload.description));
              if (payload.description.type === 'offer') {
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                socket.emit(ROOM_EVENT.SIGNAL, {
                  roomId,
                  to: peerSocketId,
                  description: answer,
                });
              }
              setStatusText('Live interview connected.');
            }

            if (payload.candidate) {
              await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
            }
          }
        );

        socket.on(ROOM_EVENT.CHAT_MESSAGE, (message: ChatMessage) => {
          setChatMessages((prev) => [...prev, message]);
        });

        socket.on('disconnect', () => {
          setStatusText('Disconnected from room. Reconnecting...');
        });
      } catch (error) {
        setMediaError(
          error instanceof Error
            ? error.message
            : 'Unable to access camera/microphone. Please allow browser permissions.'
        );
        setStatusText('Camera or microphone access blocked.');
      }
    })();

    return () => {
      mounted = false;
      cleanupSocket();
      cleanupMedia();
    };
  }, [displayName, role, roomId, socketOrigin]);

  const toggleAudio = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !audioEnabled;
    });
    setAudioEnabled((prev) => !prev);
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !videoEnabled;
    });
    setVideoEnabled((prev) => !prev);
  };

  const toggleScreenShare = async () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    if (isSharingScreen) {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const cameraTrack = cameraStream.getVideoTracks()[0];
      if (!cameraTrack) return;
      const oldTrack = stream.getVideoTracks()[0];
      if (oldTrack) stream.removeTrack(oldTrack);
      stream.addTrack(cameraTrack);
      peerConnectionsRef.current.forEach((peer) => {
        const sender = peer.getSenders().find((item) => item.track?.kind === 'video');
        if (sender) void sender.replaceTrack(cameraTrack);
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setVideoEnabled(true);
      setIsSharingScreen(false);
      return;
    }

    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = displayStream.getVideoTracks()[0];
    if (!screenTrack) return;

    const oldTrack = stream.getVideoTracks()[0];
    if (oldTrack) stream.removeTrack(oldTrack);
    stream.addTrack(screenTrack);
    peerConnectionsRef.current.forEach((peer) => {
      const sender = peer.getSenders().find((item) => item.track?.kind === 'video');
      if (sender) void sender.replaceTrack(screenTrack);
    });
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    setIsSharingScreen(true);

    screenTrack.onended = () => {
      setIsSharingScreen(false);
      void toggleScreenShare();
    };
  };

  const sendChatMessage = () => {
    const message = chatDraft.trim();
    const socket = socketRef.current;
    if (!message || !socket) return;
    socket.emit(ROOM_EVENT.CHAT_MESSAGE, { roomId, displayName, role, message });
    setChatDraft('');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[1fr_330px]">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-cyan-300">Live Interview Room</p>
              <p className="text-xs text-slate-300">Room: {roomId}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs">
              <Users className="h-3.5 w-3.5 text-cyan-300" />
              <span>{participants.length + 1}/2 participants</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              <p className="border-b border-slate-800 px-3 py-2 text-xs text-slate-300">You ({displayName})</p>
              <video ref={localVideoRef} autoPlay muted playsInline className="h-64 w-full bg-black object-cover" />
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              <p className="border-b border-slate-800 px-3 py-2 text-xs text-slate-300">Other Participant</p>
              <video ref={remoteVideoRef} autoPlay playsInline className="h-64 w-full bg-black object-cover" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
            {statusText}
          </div>
          {mediaError ? (
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
              {mediaError}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleAudio}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                audioEnabled ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              {audioEnabled ? 'Mute' : 'Unmute'}
            </button>
            <button
              type="button"
              onClick={toggleVideo}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                videoEnabled ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {videoEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              {videoEnabled ? 'Stop Camera' : 'Start Camera'}
            </button>
            <button
              type="button"
              onClick={() => void toggleScreenShare()}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                isSharingScreen ? 'bg-amber-600 hover:bg-amber-500' : 'bg-cyan-600 hover:bg-cyan-500'
              }`}
            >
              <MonitorUp className="h-4 w-4" />
              {isSharingScreen ? 'Stop Share' : 'Share Screen'}
            </button>
            <button
              type="button"
              onClick={() => window.close()}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-600"
            >
              <PhoneOff className="h-4 w-4" />
              Leave
            </button>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-sm font-semibold text-cyan-300">Room Chat</p>
          <div className="mt-3 h-80 space-y-2 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-2">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-slate-400">No messages yet.</p>
            ) : (
              chatMessages.map((item, idx) => (
                <div key={`${item.socketId}-${item.createdAt}-${idx}`} className="rounded-md bg-slate-800 px-2 py-1.5 text-xs">
                  <p className="font-semibold text-cyan-200">{item.displayName}</p>
                  <p className="mt-0.5 text-slate-100">{item.message}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={chatDraft}
              onChange={(event) => setChatDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendChatMessage();
                }
              }}
              placeholder="Type message..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={sendChatMessage}
              className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
            >
              Send
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

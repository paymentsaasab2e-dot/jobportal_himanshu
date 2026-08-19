'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { Camera, CameraOff, Check, MessageSquare, Mic, MicOff, MonitorUp, PhoneOff, Users, X } from 'lucide-react';
import { API_ORIGIN } from '@/lib/api-base';
import { completeLiveInterview, getInterviewLiveByRoom, submitInterviewReview } from '@/lib/interview-request-api';
import { InterviewReviewModal } from '@/modules/interview-prep/components/InterviewReviewModal';

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
  NOTES_UPDATED: 'interview-room:notes-updated',
  NOTES_UPDATE: 'interview-room:notes-update',
  COMPLETE: 'interview-room:complete',
  MEETING_COMPLETED: 'interview-room:meeting-completed',
} as const;

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302'] },
  ],
};

function shouldOfferFirst(selfSocketId: string, peerSocketId: string) {
  return String(selfSocketId || '') > String(peerSocketId || '');
}

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
  const router = useRouter();
  const roomId = sanitizeRoomId(String(params?.roomId || ''));
  const displayName = String(searchParams.get('name') || 'Participant').trim().slice(0, 80) || 'Participant';
  const role = normalizeRole(String(searchParams.get('role') || 'guest'));
  const roomRequestId = roomId.replace(/^hryantra-interview-/, '');

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
  const [notes, setNotes] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);
  const [requestDbId, setRequestDbId] = useState('');
  const [meetingStatus, setMeetingStatus] = useState('');
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');
  const [callEnded, setCallEnded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const notesApplyingRef = useRef(false);
  const notesTimerRef = useRef<number | null>(null);
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const socketOrigin = String(process.env.NEXT_PUBLIC_INTERVIEW_SIGNAL_ORIGIN || API_ORIGIN || '').replace(/\/$/, '');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!callEnded) return;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnectionsRef.current.forEach((peer) => {
      peer.ontrack = null;
      peer.onicecandidate = null;
      peer.close();
    });
    peerConnectionsRef.current.clear();
    pendingIceRef.current.clear();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, [callEnded]);

  const attachRemoteStream = (stream: MediaStream) => {
    remoteStreamRef.current = stream;
    const video = remoteVideoRef.current;
    if (!video) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    const play = () => {
      void video.play().catch(() => {});
    };
    if (video.paused) play();
    video.onloadedmetadata = play;
  };

  const closePeer = (peerSocketId: string) => {
    const peer = peerConnectionsRef.current.get(peerSocketId);
    if (peer) {
      peer.ontrack = null;
      peer.onicecandidate = null;
      peer.onconnectionstatechange = null;
      peer.close();
    }
    peerConnectionsRef.current.delete(peerSocketId);
    pendingIceRef.current.delete(peerSocketId);
  };

  const flushPendingIce = async (peer: RTCPeerConnection, peerSocketId: string) => {
    const queued = pendingIceRef.current.get(peerSocketId) || [];
    pendingIceRef.current.delete(peerSocketId);
    for (const candidate of queued) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Candidate may be obsolete after a renegotiation.
      }
    }
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
        const stream = event.streams[0] || new MediaStream([event.track]);
        attachRemoteStream(stream);
        setStatusText('Live interview connected.');
      };

      connection.onicecandidate = (event) => {
        if (!event.candidate) return;
        socket.emit(ROOM_EVENT.SIGNAL, {
          roomId,
          to: peerSocketId,
          candidate: event.candidate,
        });
      };

      connection.onconnectionstatechange = () => {
        if (connection.connectionState === 'connected') {
          setStatusText('Live interview connected.');
        }
        if (connection.connectionState === 'failed') {
          setStatusText('Connection failed. Retrying...');
          try {
            connection.restartIce();
          } catch {
            closePeer(peerSocketId);
            ensurePeerConnection(peerSocketId, shouldOfferFirst(socket.id || '', peerSocketId));
          }
        }
      };

      peerConnectionsRef.current.set(peerSocketId, connection);

      if (initiator) {
        void (async () => {
          try {
            const offer = await connection.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            if (connection.signalingState !== 'stable') return;
            await connection.setLocalDescription(offer);
            socket.emit(ROOM_EVENT.SIGNAL, {
              roomId,
              to: peerSocketId,
              description: connection.localDescription || offer,
            });
          } catch (error) {
            console.warn('Unable to create interview offer', error);
          }
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

        void getInterviewLiveByRoom(roomId)
          .then((bundle) => {
            if (!mounted) return;
            notesApplyingRef.current = true;
            setNotes(String(bundle.notes || ''));
            setChatMessages((prev) =>
              prev.length > 0
                ? prev
                : (bundle.messages || []).map((item) => ({
                    socketId: 'history',
                    displayName: item.displayName,
                    role: item.role || 'guest',
                    message: item.message,
                    createdAt: item.createdAt,
                  }))
            );
            if (bundle.request?.id) {
              setRequestDbId(bundle.request.id);
              setMeetingStatus(String(bundle.request.status || ''));
            } else if (roomRequestId) {
              setRequestDbId(roomRequestId);
            }
          })
          .catch(() => {
            if (roomRequestId) setRequestDbId(roomRequestId);
          });

        const socket = io(socketOrigin, {
          transports: ['polling', 'websocket'],
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: 12,
          reconnectionDelay: 800,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          setStatusText('Connected. Joining room...');
          socket.emit(ROOM_EVENT.JOIN, { roomId, displayName, role });
        });

        socket.on('connect_error', (error) => {
          setStatusText(error?.message || 'Unable to reach the interview server.');
        });

        socket.on(
          ROOM_EVENT.JOINED,
          (payload: {
            participants: RoomParticipant[];
            notes?: string;
            messages?: Array<{
              displayName?: string;
              role?: string;
              message?: string;
              createdAt?: string;
              socketId?: string;
            }>;
          }) => {
            const joinedParticipants = Array.isArray(payload?.participants) ? payload.participants : [];
            setParticipants(joinedParticipants);
            notesApplyingRef.current = true;
            setNotes(String(payload?.notes || ''));
            const history = Array.isArray(payload?.messages) ? payload.messages : [];
            setChatMessages(
              history.map((item) => ({
                socketId: String(item.socketId || 'history'),
                displayName: String(item.displayName || 'Participant'),
                role: String(item.role || 'guest'),
                message: String(item.message || ''),
                createdAt: String(item.createdAt || new Date().toISOString()),
              }))
            );
            setStatusText(
              joinedParticipants.length > 0
                ? 'Connected. Starting secure peer call...'
                : 'Waiting for second participant...'
            );
            joinedParticipants.forEach((participant) => {
              ensurePeerConnection(
                participant.socketId,
                shouldOfferFirst(socket.id || '', participant.socketId)
              );
            });
          }
        );

        socket.on(ROOM_EVENT.JOIN_ERROR, (payload: { message?: string }) => {
          setStatusText(payload?.message || 'Unable to join room.');
        });

        socket.on(ROOM_EVENT.PARTICIPANT_JOINED, (participant: RoomParticipant) => {
          setParticipants((prev) => {
            const deduped = prev.filter((item) => item.socketId !== participant.socketId);
            return [...deduped, participant];
          });
          setStatusText('Participant joined. Establishing connection...');
          ensurePeerConnection(
            participant.socketId,
            shouldOfferFirst(socket.id || '', participant.socketId)
          );
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
          async (payload: { from: string; description?: RTCSessionDescriptionInit | null; candidate?: RTCIceCandidateInit | null }) => {
            const peerSocketId = String(payload?.from || '').trim();
            if (!peerSocketId) return;

            const peer = ensurePeerConnection(peerSocketId, false);
            if (!peer) return;

            try {
              if (payload.description) {
                const description = payload.description;
                if (description.type === 'offer' && peer.signalingState !== 'stable') {
                  try {
                    await peer.setLocalDescription({ type: 'rollback' } as RTCSessionDescriptionInit);
                  } catch {
                    closePeer(peerSocketId);
                    const nextPeer = ensurePeerConnection(peerSocketId, false);
                    if (!nextPeer) return;
                    await nextPeer.setRemoteDescription(new RTCSessionDescription(description));
                    const answer = await nextPeer.createAnswer();
                    await nextPeer.setLocalDescription(answer);
                    socket.emit(ROOM_EVENT.SIGNAL, {
                      roomId,
                      to: peerSocketId,
                      description: nextPeer.localDescription || answer,
                    });
                    await flushPendingIce(nextPeer, peerSocketId);
                    setStatusText('Live interview connected.');
                    return;
                  }
                }

                await peer.setRemoteDescription(new RTCSessionDescription(description));
                if (description.type === 'offer') {
                  const answer = await peer.createAnswer();
                  await peer.setLocalDescription(answer);
                  socket.emit(ROOM_EVENT.SIGNAL, {
                    roomId,
                    to: peerSocketId,
                    description: peer.localDescription || answer,
                  });
                }
                await flushPendingIce(peer, peerSocketId);
                setStatusText('Live interview connected.');
              }

              if (payload.candidate) {
                if (!peer.remoteDescription) {
                  const queued = pendingIceRef.current.get(peerSocketId) || [];
                  queued.push(payload.candidate);
                  pendingIceRef.current.set(peerSocketId, queued);
                } else {
                  await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
                }
              }
            } catch (error) {
              console.warn('Interview signal failed', error);
            }
          }
        );

        socket.on(ROOM_EVENT.CHAT_MESSAGE, (message: ChatMessage) => {
          setChatMessages((prev) => [...prev, message]);
        });

        socket.on(ROOM_EVENT.NOTES_UPDATED, (payload: { notes?: string }) => {
          notesApplyingRef.current = true;
          setNotes(String(payload?.notes || ''));
        });

        socket.on(ROOM_EVENT.MEETING_COMPLETED, (payload: { completedBy?: string }) => {
          setCallEnded(true);
          setMeetingStatus('COMPLETED');
          setCompleteConfirmOpen(false);
          setStatusText(
            payload?.completedBy
              ? `${payload.completedBy} ended this meeting.`
              : 'This interview is completed.'
          );
          if (role !== 'guest') setReviewOpen(true);
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
      if (notesTimerRef.current) window.clearTimeout(notesTimerRef.current);
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

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (notesApplyingRef.current) {
      notesApplyingRef.current = false;
      return;
    }
    if (notesTimerRef.current) window.clearTimeout(notesTimerRef.current);
    notesTimerRef.current = window.setTimeout(() => {
      socketRef.current?.emit(ROOM_EVENT.NOTES_UPDATE, { notes: value, displayName });
    }, 600);
  };

  const completedHubPath =
    role === 'interviewer'
      ? '/lms/interview-prep/become-interviewer?tab=completed'
      : '/lms/interview-prep/request-interview?tab=completed';

  const leaveToHub = (extraQuery?: string) => {
    socketRef.current?.disconnect();
    const path = extraQuery ? `${completedHubPath}&${extraQuery}` : completedHubPath;
    router.push(path);
  };

  const leaveMeeting = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    socketRef.current?.disconnect();
    if (meetingStatus === 'COMPLETED' || callEnded) {
      leaveToHub();
      return;
    }
    if (window.history.length > 1) {
      router.back();
      return;
    }
    leaveToHub();
  };

  const completeMeeting = async () => {
    const id = requestDbId || roomRequestId;
    if (!id || completing || meetingStatus === 'COMPLETED') return;
    try {
      setCompleting(true);
      setCompleteError('');
      await completeLiveInterview(id);
      socketRef.current?.emit(ROOM_EVENT.COMPLETE, { displayName });
      setCallEnded(true);
      setMeetingStatus('COMPLETED');
      setCompleteConfirmOpen(false);
      setStatusText('This interview is completed.');
      if (role !== 'guest') setReviewOpen(true);
    } catch (error) {
      setCompleteError(error instanceof Error ? error.message : 'Unable to complete this interview');
    } finally {
      setCompleting(false);
    }
  };

  const submitLiveReview = async (input: { rating: number; feedback: string }) => {
    const id = requestDbId || roomRequestId;
    if (!id) {
      leaveToHub();
      return;
    }
    try {
      setReviewBusy(true);
      setReviewError('');
      await submitInterviewReview(id, input);
      setReviewOpen(false);
      leaveToHub();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Unable to submit review');
    } finally {
      setReviewBusy(false);
    }
  };

  const remotePresent = participants.length > 0;
  const canComplete =
    Boolean(requestDbId || roomRequestId) && meetingStatus !== 'COMPLETED' && !callEnded && role !== 'guest';
  const counterpartName =
    participants.find((item) => item.displayName && item.displayName !== displayName)?.displayName ||
    (role === 'interviewer' ? 'the candidate' : 'the interviewer');

  return (
    <div className="fixed inset-0 z-[5000] flex h-dvh w-screen overflow-hidden bg-[#202124] text-white">
      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">Live interview</p>
            <p className="truncate text-xs text-white/60">{statusText}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              <span>{participants.length + 1}</span>
            </div>
            {meetingStatus === 'COMPLETED' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold">
                <Check className="h-3.5 w-3.5" />
                Completed
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setPanelOpen((open) => !open)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                panelOpen ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'
              }`}
              aria-label="Toggle chat and notes"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 px-3 pb-28 sm:px-5">
          <div className="relative h-full overflow-hidden rounded-2xl bg-black">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full bg-black object-cover"
            />
            {remotePresent && counterpartName ? (
              <p className="absolute bottom-4 left-4 rounded bg-black/60 px-2 py-1 text-xs">{counterpartName}</p>
            ) : null}
            {!remotePresent && !callEnded ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#202124]">
                <p className="max-w-sm px-4 text-center text-sm text-white/75">
                  Waiting for the other participant to join
                </p>
              </div>
            ) : null}
            {callEnded ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <p className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium">Call ended</p>
              </div>
            ) : null}
            <div className="absolute bottom-4 right-4 h-36 w-52 overflow-hidden rounded-xl border border-white/20 bg-black shadow-2xl sm:h-44 sm:w-64">
              <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
              <p className="absolute bottom-1.5 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px]">You · {displayName}</p>
            </div>
            {mediaError ? (
              <div className="absolute left-4 right-4 top-4 rounded-xl border border-rose-400/40 bg-rose-950/80 px-3 py-2 text-sm text-rose-100">
                {mediaError}
              </div>
            ) : null}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center pb-5">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-[#3c4043] px-4 py-3 shadow-2xl">
            <button
              type="button"
              onClick={toggleAudio}
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
                audioEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-rose-600 hover:bg-rose-500'
              }`}
              aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={toggleVideo}
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
                videoEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-rose-600 hover:bg-rose-500'
              }`}
              aria-label={videoEnabled ? 'Stop camera' : 'Start camera'}
            >
              {videoEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => void toggleScreenShare()}
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
                isSharingScreen ? 'bg-blue-600 hover:bg-blue-500' : 'bg-white/10 hover:bg-white/20'
              }`}
              aria-label={isSharingScreen ? 'Stop sharing screen' : 'Share screen'}
            >
              <MonitorUp className="h-5 w-5" />
            </button>
            {canComplete ? (
              <button
                type="button"
                onClick={() => {
                  setCompleteError('');
                  setCompleteConfirmOpen(true);
                }}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-semibold hover:bg-emerald-500"
              >
                <Check className="h-5 w-5" />
                Complete meeting
              </button>
            ) : null}
            <button
              type="button"
              onClick={leaveMeeting}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 hover:bg-rose-500"
              aria-label="Leave call"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {panelOpen ? (
        <aside className="flex h-full w-full max-w-[360px] shrink-0 flex-col border-l border-white/10 bg-[#1a1c1e] max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-30">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-medium">In-call messages</p>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Shared notes</p>
            <textarea
              value={notes}
              onChange={(event) => handleNotesChange(event.target.value)}
              placeholder="Write notes during the interview. Both people see this after the call."
              className="mt-2 h-28 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-2 text-xs text-white outline-none focus:border-blue-400"
            />
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-white/50">No messages yet. Messages are visible to everyone in this room.</p>
            ) : (
              chatMessages.map((item, idx) => (
                <div key={`${item.socketId}-${item.createdAt}-${idx}`} className="rounded-lg bg-white/5 px-2.5 py-2 text-xs">
                  <p className="font-semibold text-blue-200">{item.displayName}</p>
                  <p className="mt-0.5 text-white/90">{item.message}</p>
                  <p className="mt-1 text-[10px] text-white/40">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 border-t border-white/10 p-3">
            <input
              value={chatDraft}
              onChange={(event) => setChatDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendChatMessage();
                }
              }}
              placeholder="Send a message"
              className="w-full rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={sendChatMessage}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
            >
              Send
            </button>
          </div>
        </aside>
      ) : null}

      {completeConfirmOpen ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#2d2f31] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold">Complete this meeting?</h3>
            <p className="mt-2 text-sm text-white/70">
              This marks the interview as completed for both of you. You can leave a review from Completed after you
              exit.
            </p>
            {completeError ? (
              <p className="mt-3 rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-200">{completeError}</p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={completing}
                onClick={() => setCompleteConfirmOpen(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Keep meeting
              </button>
              <button
                type="button"
                disabled={completing}
                onClick={() => void completeMeeting()}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-60"
              >
                {completing ? 'Completing...' : 'Complete meeting'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {role !== 'guest' ? (
        <InterviewReviewModal
          open={reviewOpen}
          counterpartName={counterpartName}
          viewerRole={role === 'interviewer' ? 'interviewer' : 'candidate'}
          submitting={reviewBusy}
          error={reviewError}
          onClose={() => {
            setReviewOpen(false);
            const id = requestDbId || roomRequestId;
            leaveToHub(id ? `reviewId=${encodeURIComponent(id)}` : undefined);
          }}
          onSubmit={(input) => {
            void submitLiveReview(input);
          }}
        />
      ) : null}
    </div>
  );
}

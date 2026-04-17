"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, Mic, Play, RefreshCw, AlertCircle, Maximize2, Minimize2, Video, VideoOff, MicOff, Type, Loader2 } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api-base";

export default function AiMockInterview() {
  const [topic, setTopic] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  
  const [status, setStatus] = useState("idle"); // idle, speaking, listening, thinking, finished
  const [question, setQuestion] = useState("");
  const [transcript, setTranscript] = useState("");
  const transcriptRef = useRef("");
  const [report, setReport] = useState<any>(null);
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const stateRef = useRef({ status, isMicOn });
  useEffect(() => {
    stateRef.current = { status, isMicOn };
  }, [status, isMicOn]);

  useEffect(() => {
    if (isStarted && isVideoOn) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => console.error("Camera error:", err));
    } else if (!isVideoOn && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    
    return () => {
      if (streamRef.current) {
         streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isStarted, isVideoOn]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcriptRef.current += event.results[i][0].transcript + " ";
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setTranscript(transcriptRef.current + interimTranscript);
        };
        recognition.onerror = (e: any) => {
          console.log('Speech recognition error:', e.error);
        };
        recognition.onend = () => {
          if (stateRef.current.status === "listening" && stateRef.current.isMicOn) {
            try { recognitionRef.current.start(); } catch(e){}
          }
        };
        
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleStart = async () => {
    if (!topic.trim()) return;
    setIsStarted(true);
    setStatus("thinking");

    try {
      const res = await fetch(`${getApiBaseUrl()}/mock-interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
      });
      const data = await res.json();
      setInterviewId(data.interviewId);
      setQuestion(data.question);
      speakText(data.question);
    } catch (err) {
      console.error(err);
      setStatus("idle");
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => {
      setStatus("speaking");
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
      }
    };
    
    utterance.onend = () => {
      setStatus("listening");
      setTranscript("");
      transcriptRef.current = "";
    };

    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    if (status === "listening" && isMicOn && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // already started
      }
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // already stopped
      }
    }
  }, [status, isMicOn]);

  const submitAnswer = async () => {
    if (!transcript.trim()) return;
    
    const finalAnswer = transcript;
    setStatus("thinking");
    setTranscript("");
    transcriptRef.current = "";
    
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/mock-interview/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, answerText: finalAnswer })
      });
      const data = await res.json();
      
      if (data.isFinished) {
        setStatus("thinking");
        fetchResult();
      } else {
        setQuestion(data.question);
        speakText(data.question);
      }
    } catch (err) {
      console.error(err);
      setStatus("idle");
    }
  };

  const fetchResult = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/mock-interview/result/${interviewId}`);
      const data = await res.json();
      setReport(data);
      setStatus("finished");
    } catch (err) {
      console.error(err);
    }
  };

  const stopInterview = () => {
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }
    // optionally force finish early
    if (interviewId && !report) {
       setStatus("thinking");
       fetchResult();
    } else {
       setIsStarted(false);
    }
  };

  const PAGE_BG = "radial-gradient(circle at top left, rgba(40,168,225,0.13), transparent 28%), radial-gradient(circle at 85% 12%, rgba(40,168,223,0.1), transparent 16%), radial-gradient(circle at 18% 82%, rgba(252,150,32,0.08), transparent 18%), linear-gradient(180deg, #f5fafd 0%, #f8fcff 44%, #fcfdff 100%)";

  if (!isStarted) {
    return (
      <div className="min-h-[calc(100vh-[var(--app-header-height)])] flex flex-col font-sans" style={{ background: PAGE_BG }}>
        <div className="flex-1 w-full flex items-center justify-center px-4 py-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg w-full text-center border border-slate-100">
            <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
              <Mic className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Global AI Interview</h1>
            <p className="text-slate-500 mb-8 font-medium">Enter any topic to start a dynamic voice-based mock interview. Our AI will adapt to your level.</p>
            
            <input 
              type="text" 
              placeholder="e.g. React.js, HR Management, Banking..." 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-slate-800 font-semibold mb-4"
            />
            
            <button 
              onClick={handleStart}
              disabled={!topic.trim()}
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
            >
              Start Session <Play className="w-5 h-5 fill-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "finished" && report) {
    return (
      <div className="min-h-[calc(100vh-[var(--app-header-height)])] flex flex-col shadow-inner font-sans" style={{ background: PAGE_BG }}>
        <div className="flex-1 pt-4 pb-4 px-4 flex items-start justify-center overflow-hidden">
          <div className="max-w-6xl w-full grid lg:grid-cols-12 gap-6 h-full">
            
            {/* Left Column - Results */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-center mb-5">
                  <CheckCircle className="w-10 h-10 text-[#28A8E1] mx-auto mb-2" />
                  <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Interview Completed</h2>
                  <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-bold uppercase tracking-wide text-[10px]">Topic: {topic}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center transition hover:shadow-md">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Overall Score</h3>
                    <p className="text-3xl font-black text-slate-900">{report.overallScore}<span className="text-sm text-slate-400 font-medium">/100</span></p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center transition hover:shadow-md">
                    <h3 className="text-[10px] font-bold text-[#28A8E1] uppercase tracking-wider mb-1">Detected Level</h3>
                    <p className="text-xl font-black text-blue-900 mt-1">{report.skillLevel}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-5 text-sm">
                  <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Strengths</h3>
                    <ul className="space-y-1.5">
                      {report.strengths?.slice(0,3).map((s: string, i: number) => (
                        <li key={i} className="flex gap-2 text-slate-600 font-medium text-xs leading-snug">
                           {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white border border-rose-100 rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs font-bold text-rose-600 mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Weaknesses</h3>
                    <ul className="space-y-1.5">
                      {report.weaknesses?.slice(0,3).map((w: string, i: number) => (
                        <li key={i} className="flex gap-2 text-slate-600 font-medium text-xs leading-snug">
                           {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <button onClick={() => window.location.reload()} className="hidden lg:block w-full py-3 bg-[#28A8E1] hover:bg-[#1a85b6] text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98]">Take Another Interview</button>
            </div>

            {/* Right Column - Improvement Plan */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-2xl flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#28A8E1]/20 flex items-center justify-center">
                       <CheckCircle className="w-4 h-4 text-[#28A8E1]" />
                    </div>
                    <h2 className="text-lg font-black tracking-tight">Your Next Steps</h2>
                  </div>
                  
                  <h3 className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide flex items-center gap-2">Improvement Plan</h3>
                  <p className="text-slate-200 text-xs leading-relaxed font-medium mb-5 bg-white/5 p-3 rounded-xl border border-white/5 line-clamp-3">{report.improvementPlan}</p>
                  
                  <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-2">Recommended Knowledge Topics</h3>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {report.recommendedTopics?.slice(0,4).map((t: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-[#28A8E1]/10 text-[#28A8E1] rounded-md text-[11px] font-bold border border-[#28A8E1]/20">{t}</span>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#28A8E1]/20 to-blue-600/10 p-5 rounded-xl border border-[#28A8E1]/20">
                  <h4 className="font-bold text-sm text-white mb-1.5">Master These Skills</h4>
                  <p className="text-[11px] text-blue-200/80 mb-4 leading-relaxed">We found some targeted Learning Management System courses specifically curated to accelerate your continued professional growth.</p>
                  <button onClick={() => window.location.href='/lms/courses'} className="w-full py-2.5 bg-[#28A8E1] hover:bg-[#1a85b6] text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(40,168,225,0.3)] flex items-center justify-center gap-2">
                    Find Recommended Courses <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              </div>
              
              <button onClick={() => window.location.reload()} className="lg:hidden mt-4 w-full py-3 bg-[#28A8E1] hover:bg-[#1a85b6] text-white rounded-xl text-sm font-bold transition-all shadow-md">Take Another Interview</button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-[var(--app-header-height)])] bg-slate-950 flex flex-col font-sans">
      <div className="flex-1 grid lg:grid-cols-2 gap-6 p-6">
        
        {/* LEFT COMPARTMENT - USER */}
        <div className="bg-slate-900 rounded-[32px] overflow-hidden border border-white/10 flex flex-col relative shadow-2xl">
          <div className="absolute top-6 left-6 z-10 flex gap-2">
            <div className="px-3 py-1.5 bg-black/50 backdrop-blur-md text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Candidate
            </div>
          </div>
          <div className="absolute top-6 right-6 z-10 flex gap-3">
             <button onClick={() => setIsVideoOn(!isVideoOn)} className={`p-2.5 rounded-full ${isVideoOn ? 'bg-black/50 text-white' : 'bg-rose-500/80 text-white'} backdrop-blur-md transition-colors`}>
               {isVideoOn ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
               : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/><line x1="2" y1="2" x2="22" y2="22"/></svg>}
             </button>
             <button onClick={() => setIsMicOn(!isMicOn)} className={`p-2.5 rounded-full ${isMicOn ? 'bg-black/50 text-white' : 'bg-rose-500/80 text-white'} backdrop-blur-md transition-colors`}>
               {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
             </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center bg-slate-950">
             {isVideoOn ? (
               <video ref={videoRef} autoPlay playsInline muted className="object-cover w-full h-full opacity-60" style={{ transform: "scaleX(-1)" }} />
             ) : (
               <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center text-4xl text-slate-600 font-bold border-4 border-slate-700">You</div>
             )}
             
             {/* Center Status indicator for user */}
             {status === "listening" && (
                <div className="absolute inset-0 border-4 border-emerald-500/50 rounded-[32px] pointer-events-none transition-all"></div>
             )}
          </div>
          
          <div className="p-6 bg-slate-900 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status === "listening" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 animate-pulse" : "bg-slate-800 text-slate-500"}`}>
                {status === "listening" ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-white font-bold">{status === "listening" ? "Listening..." : "Waiting for AI..."}</p>
                <p className="text-slate-400 text-sm">Speak clearly into the microphone</p>
              </div>
            </div>
            {status === "listening" && (
              <button onClick={submitAnswer} className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors">Send Answer</button>
            )}
          </div>
        </div>

        {/* RIGHT COMPARTMENT - AI */}
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[32px] overflow-hidden border border-white/10 flex flex-col relative shadow-2xl items-center justify-center">
            <div className="absolute top-6 left-6 z-10 flex gap-2">
              <div className="px-3 py-1.5 bg-black/30 backdrop-blur-md text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div> AI Interviewer
              </div>
            </div>

            <div className="w-64 h-64 relative flex items-center justify-center mb-8">
               <div className={`absolute inset-0 rounded-full border-2 ${status === "speaking" ? "border-blue-400 scale-110 animate-ping opacity-30" : "border-slate-600/30"} transition-all duration-700`}></div>
               <div className={`absolute inset-0 rounded-full border-4 ${status === "speaking" ? "border-blue-400 scale-105 opacity-80" : "border-slate-600/50 scale-100"} transition-all duration-300`}></div>
               <div className="w-full h-full rounded-full bg-slate-800 overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  {/* Robot animation video */}
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    src="/aivideo/vecteezy_cute-robot-chatting-with-speech-bubbles-and-gears-animation_68930253.mp4"
                  />
                  {/* Subtle overlay */}
                  <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay"></div>
               </div>
            </div>

            <div className="px-6 py-2 rounded-full bg-black/40 text-blue-200 font-bold uppercase tracking-widest text-sm flex items-center gap-3 backdrop-blur-md">
              {status === "thinking" && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === "speaking" && <div className="flex gap-1"><span className="w-1 h-3 bg-blue-400 animate-bounce"></span><span className="w-1 h-4 bg-blue-400 animate-bounce delay-75"></span><span className="w-1 h-2 bg-blue-400 animate-bounce delay-150"></span></div>}
              {status === "listening" && "Awaiting Candidate"}
              {status === "thinking" && "Analyzing Profile"}
              {status === "speaking" && "Interviewing"}
            </div>
        </div>
      </div>

      {/* BOTTOM TRANSCRIPT AREA */}
      <div className="bg-slate-900 border-t border-white/5 p-6 md:p-8 flex items-center">
         <div className="max-w-5xl mx-auto w-full">
            {status === "thinking" ? (
                <div className="text-center py-6 text-slate-500 font-bold flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing AI response...
                </div>
            ) : (
                <div className="space-y-6">
                  {/* AI Question */}
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                    <p className="text-blue-300 font-bold uppercase tracking-widest text-[11px] mb-2 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> AI Asks:</p>
                    <p className="text-white text-xl md:text-2xl font-medium leading-relaxed">{question}</p>
                  </div>
                  
                  {/* Candidate Transcript Live */}
                  <div className={`rounded-2xl p-6 border transition-all ${status === "listening" ? "bg-white/10 border-white/20 shadow-inner" : "bg-transparent border-transparent"}`}>
                    <div className="flex items-center justify-between mb-2">
                       <p className="text-emerald-400 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Your response:</p>
                       <div className="flex gap-4">
                          {!isMicOn && status === "listening" && <span className="text-xs text-rose-400 font-bold mt-1">Mic is OFF - Typing Mode</span>}
                          <button onClick={stopInterview} className="text-slate-500 text-sm font-bold hover:text-white transition">End Session Early</button>
                       </div>
                    </div>
                    {isMicOn ? (
                      <p className={`text-slate-300 text-lg md:text-xl font-medium leading-relaxed ${status === "listening" ? "min-h-[6rem] border border-emerald-500/30 rounded-xl p-4 bg-emerald-900/10 focus-within:bg-emerald-900/20" : ""}`}>
                        {transcript || (status === "listening" ? <span className="text-slate-600 animate-pulse">Start speaking. Capturing from permanent microphone...</span> : null)}
                      </p>
                    ) : (
                      <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        disabled={status !== "listening"}
                        placeholder={status === "listening" ? "Type your response here..." : ""}
                        className="w-full bg-transparent text-slate-300 text-lg md:text-xl font-medium leading-relaxed outline-none resize-none h-24"
                      />
                    )}
                  </div>
                </div>
            )}
         </div>
      </div>
    </div>
  );
}

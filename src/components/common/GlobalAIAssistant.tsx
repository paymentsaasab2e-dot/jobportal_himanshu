'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  X, 
  Send, 
  User, 
  Briefcase, 
  FileText, 
  BrainCircuit,
  MessageSquare,
  Bot,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-base';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AI_FUNCTIONS = [
  {
    id: 'optimize-profile',
    label: 'Optimize Profile',
    icon: User,
    description: 'Get AI suggestions to improve your profile completeness and impact.',
    prompt: 'How can I optimize my profile to attract more recruiters?'
  },
  {
    id: 'job-matches',
    label: 'Identify Job Matches',
    icon: Briefcase,
    description: 'Find jobs that perfectly match your skills and experience.',
    prompt: 'Based on my profile, what are the best job matches for me right now?'
  },
  {
    id: 'cv-analysis',
    label: 'Analyze My CV',
    icon: FileText,
    description: 'Get a detailed score and feedback on your current resume.',
    prompt: 'Please analyze my CV and give me a score with improvement tips.'
  },
  {
    id: 'career-advice',
    label: 'Career Advice',
    icon: BrainCircuit,
    description: 'Ask anything about your career path or industry trends.',
    prompt: 'What skills should I learn next to advance my career in my field?'
  }
];

export default function GlobalAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your AI Career Assistant. How can I help you advance your career today?',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  useEffect(() => {
    setCandidateId(sessionStorage.getItem('candidateId'));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSendMessage = async (content: string) => {
    const text = content || inputValue;
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          candidateId,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (response.ok) {
        const result = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data?.message || "I'm sorry, I couldn't process that request right now.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error in AI assistant:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFunctionClick = (func: typeof AI_FUNCTIONS[0]) => {
    handleSendMessage(func.prompt);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '500px',
              width: '380px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 bg-white/90 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white/20 overflow-hidden flex flex-col backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-br from-[#28A8DF] via-[#28A8DF] to-[#1e8dbd] text-white flex items-center justify-between shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                  <Sparkles size={20} className="text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight leading-none mb-1">AI Career Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
                    <span className="text-[11px] text-white/90 font-semibold uppercase tracking-wider">Ready to help</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group/close"
                  title="Close assistant"
                >
                  <X size={18} className="transition-transform group-hover/close:scale-110" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" style={{ scrollbarWidth: 'thin' }}>
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        message.role === 'user' 
                          ? 'bg-[#28A8DF] text-white rounded-tr-none shadow-sm' 
                          : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />

                  {/* AI Quick Actions - Only show at start or when relevant */}
                  {messages.length < 3 && !isTyping && (
                    <div className="grid grid-cols-1 gap-2 mt-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Quick Actions</p>
                      {AI_FUNCTIONS.map((func) => (
                        <button
                          key={func.id}
                          onClick={() => handleFunctionClick(func)}
                          className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-[#28A8DF]/30 hover:bg-[#28A8DF]/5 transition-all text-left group shadow-sm"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#28A8DF]/10 flex items-center justify-center text-[#28A8DF] group-hover:scale-110 transition-transform">
                            <func.icon size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-700">{func.label}</p>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{func.description}</p>
                          </div>
                          <ChevronRight size={14} className="text-slate-300 group-hover:text-[#28A8DF] transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage('')}
                      placeholder="Ask me anything..."
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black caret-black focus:outline-none focus:ring-2 focus:ring-[#28A8DF]/20 focus:border-[#28A8DF] transition-all"
                    />
                    <button
                      onClick={() => handleSendMessage('')}
                      disabled={!inputValue.trim() || isTyping}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#28A8DF] text-white rounded-lg hover:bg-[#1e8dbd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-center text-slate-400 font-medium">
                    Powered by SAASA Intelligence
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ 
          scale: 1.08,
          boxShadow: '0 15px 40px rgba(40,168,223,0.5)',
        }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_12px_35px_rgba(40,168,223,0.4)] transition-all duration-500 relative overflow-hidden group ${
          isOpen 
            ? 'bg-slate-900 rotate-90 rounded-full' 
            : 'bg-gradient-to-br from-[#28A8DF] via-[#28A8DF] to-[#0EA5E9]'
        }`}
      >
        {/* Subtle glass reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {isOpen ? (
          <X className="text-white relative z-10" size={28} />
        ) : (
          <div className="relative z-10">
            <Bot className="text-white drop-shadow-lg" size={32} />
            <motion.div 
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [1, 0.8, 1]
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm"
            />
          </div>
        )}
      </motion.button>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Companion, ChatMessage, EmotionState } from '../types';
import {
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Brain,
  RotateCcw,
  Compass,
  Play,
  Square,
  Activity,
} from 'lucide-react';

interface CompanionChatProps {
  companion: Companion;
  messages: ChatMessage[];
  onSendMessage: (text: string, highThinking: boolean) => Promise<void>;
  isLoading: boolean;
  onClearChat: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  isSpeaking: boolean;
  onSpeakMessage: (text: string) => void;
  onStopSpeaking: () => void;
  onOpenMemoryInsights?: () => void;
  suggestedReplies: string[];
}

export const CompanionChat: React.FC<CompanionChatProps> = ({
  companion,
  messages,
  onSendMessage,
  isLoading,
  onClearChat,
  voiceEnabled,
  onToggleVoice,
  isSpeaking,
  onSpeakMessage,
  onStopSpeaking,
  onOpenMemoryInsights,
  suggestedReplies,
}) => {
  const [inputText, setInputText] = useState('');
  const [highThinking, setHighThinking] = useState(false);
  const [currentlyPlayingMsgId, setCurrentlyPlayingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isSpeaking) {
      setCurrentlyPlayingMsgId(null);
    }
  }, [isSpeaking]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText.trim();
    setInputText('');
    onSendMessage(textToSend, highThinking);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (isLoading) return;
    onSendMessage(suggestion, highThinking);
  };

  const handlePlayMessageVoice = (msg: ChatMessage) => {
    if (isSpeaking && currentlyPlayingMsgId === msg.id) {
      onStopSpeaking();
      setCurrentlyPlayingMsgId(null);
    } else {
      setCurrentlyPlayingMsgId(msg.id);
      onSpeakMessage(msg.text);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/90 backdrop-blur-xl border-l border-neutral-800/80 shadow-2xl">
      {/* Chat Top Header */}
      <div className="p-3.5 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-950/40">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md border"
              style={{
                backgroundColor: companion.avatar3D.outfitPrimaryColor,
                borderColor: companion.avatar3D.glowColor,
              }}
            >
              {companion.name.charAt(0)}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-900" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-neutral-100">{companion.name}</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-medium">
                {companion.relationship}
              </span>
            </div>

            {/* Speaking audio indicator or tagline */}
            {isSpeaking ? (
              <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-medium">
                <span className="flex gap-0.5 items-end h-3">
                  <span className="w-0.5 h-2 bg-rose-400 animate-bounce" />
                  <span className="w-0.5 h-3 bg-rose-400 animate-bounce [animation-delay:0.15s]" />
                  <span className="w-0.5 h-1.5 bg-rose-400 animate-bounce [animation-delay:0.3s]" />
                </span>
                <span>Speaking to you...</span>
              </div>
            ) : (
              <p className="text-[11px] text-neutral-400 truncate max-w-[190px]">{companion.tagline}</p>
            )}
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1">
          {/* Memory Insights Button */}
          {onOpenMemoryInsights && (
            <button
              onClick={onOpenMemoryInsights}
              className="px-2 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/60 text-rose-300 hover:text-rose-200 text-xs font-medium flex items-center gap-1 transition-all"
              title="View Memory Insights &amp; D3 Spider Chart"
            >
              <Compass className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] hidden sm:inline">Bond Insights</span>
            </button>
          )}

          {/* Voice Toggle */}
          <button
            onClick={onToggleVoice}
            className={`px-2 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all ${
              voiceEnabled
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title={voiceEnabled ? 'Voice Response: ON' : 'Voice Response: Muted'}
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-semibold text-rose-300">Voice ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="text-[10px]">Muted</span>
              </>
            )}
          </button>

          {/* High Thinking Mode Toggle */}
          <button
            onClick={() => setHighThinking(!highThinking)}
            className={`p-1.5 rounded-xl text-xs flex items-center gap-1 transition-all ${
              highThinking
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-900/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title={highThinking ? 'High Thinking: Active (Gemini 3.1 Pro)' : 'Enable High Thinking for deep complex queries'}
          >
            <Brain className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium hidden sm:inline">
              {highThinking ? 'Deep' : 'Fast'}
            </span>
          </button>

          {/* Reset Chat */}
          <button
            onClick={onClearChat}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isThisMsgPlaying = isSpeaking && currentlyPlayingMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              {/* Spoken bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-3 shadow-md relative group ${
                  isUser
                    ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white rounded-tr-sm'
                    : 'bg-neutral-950/80 border border-neutral-800/80 text-neutral-100 rounded-tl-sm'
                }`}
              >
                {/* Physical Action or subtle gesture narration if present */}
                {msg.action && (
                  <p className="text-[11px] text-rose-300/90 italic mb-1.5 font-light">
                    {msg.action}
                  </p>
                )}

                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {/* Footer tags & Voice listen button */}
                <div className="flex items-center justify-between gap-3 mt-2 text-[9px] opacity-80 pt-1 border-t border-white/10">
                  <span>{msg.timestamp}</span>

                  <div className="flex items-center gap-1.5">
                    {msg.highThinking && (
                      <span className="bg-purple-900/60 text-purple-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Brain className="w-2.5 h-2.5" /> High Thought
                      </span>
                    )}
                    {msg.moodLabel && (
                      <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                        {msg.moodLabel}
                      </span>
                    )}

                    {/* Listen / Replay Voice Button for Companion messages */}
                    {!isUser && (
                      <button
                        onClick={() => handlePlayMessageVoice(msg)}
                        className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-all ${
                          isThisMsgPlaying
                            ? 'bg-rose-500 text-white font-bold animate-pulse'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                        }`}
                        title="Play or Replay companion voice"
                      >
                        {isThisMsgPlaying ? (
                          <>
                            <Square className="w-2.5 h-2.5 fill-current" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Voice</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-neutral-400 text-xs py-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[11px] italic">
              {highThinking ? `${companion.name} is deeply contemplating...` : `${companion.name} is typing & vocalizing...`}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Replies */}
      {suggestedReplies.length > 0 && !isLoading && (
        <div className="px-3 pt-1 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
          {suggestedReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSuggestion(reply)}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/60 text-neutral-300 hover:text-white text-[10px] transition-all shrink-0"
            >
              💬 {reply}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Console */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-800/80 bg-neutral-950/60">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Say something to ${companion.name}...`}
            disabled={isLoading}
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-10 h-10 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center shadow-lg shadow-rose-950/40 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

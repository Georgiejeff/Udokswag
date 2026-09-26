/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Companion, ChatMessage, EmotionState, GestureType } from './types';
import { DEFAULT_COMPANIONS, SCENARIOS } from './data/defaultCompanions';
import { Avatar3DCanvas } from './components/Avatar3DCanvas';
import { CompanionChat } from './components/CompanionChat';
import { EmotionHUD } from './components/EmotionHUD';
import { PersonaForge } from './components/PersonaForge';
import { ScenarioPicker } from './components/ScenarioPicker';
import { CompanionRoster } from './components/CompanionRoster';
import { MemoryInsightsModal } from './components/MemoryInsightsModal';
import { soundscape, speakCompanionVoice, stopSpeaking } from './utils/audioSynth';
import {
  Sparkles,
  Users,
  Compass,
  Wand2,
  Volume2,
  VolumeX,
  Radio,
  MessageSquare,
  Heart,
  TrendingUp,
} from 'lucide-react';

export default function App() {
  const [companions, setCompanions] = useState<Companion[]>(() => {
    try {
      const saved = localStorage.getItem('aetheria_companions');
      return saved ? JSON.parse(saved) : DEFAULT_COMPANIONS;
    } catch {
      return DEFAULT_COMPANIONS;
    }
  });

  const [currentCompanion, setCurrentCompanion] = useState<Companion>(() => companions[0]);
  const [currentScenario, setCurrentScenario] = useState<(typeof SCENARIOS)[0]>(SCENARIOS[0]);

  // Per-companion chat histories stored in state
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>(() => {
    const initial: Record<string, ChatMessage[]> = {};
    DEFAULT_COMPANIONS.forEach((c) => {
      initial[c.id] = [
        {
          id: `greet-${c.id}`,
          role: 'model',
          text: c.greetingMessage,
          timestamp: 'Just now',
          moodLabel: c.emotions.moodLabel,
          gesture: c.emotions.currentGesture,
        },
      ];
    });
    return initial;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Default voice enabled to TRUE so companion responds with voice immediately!
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [ambientAudioActive, setAmbientAudioActive] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>(
    companions[0]?.starterScenarios || []
  );

  // Modal controls
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);
  const [isMemoryInsightsOpen, setIsMemoryInsightsOpen] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Sync companion changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aetheria_companions', JSON.stringify(companions));
    } catch {}
  }, [companions]);

  // When changing companions, stop speaking and update suggestions
  const handleSelectCompanion = (comp: Companion) => {
    stopSpeaking();
    setIsSpeaking(false);
    setCurrentCompanion(comp);

    // If companion has a preferred environment, match scenario
    const matchScene = SCENARIOS.find((s) => s.environment === comp.environment);
    if (matchScene) {
      setCurrentScenario(matchScene);
      if (ambientAudioActive) {
        soundscape.playEnvironment(matchScene.environment);
      }
    }

    setSuggestedReplies(comp.starterScenarios || []);
  };

  // Toggle ambient soundscape
  const handleToggleAmbientAudio = () => {
    const active = soundscape.toggle(currentScenario.environment);
    setAmbientAudioActive(active);
  };

  // Toggle voice playback
  const handleToggleVoice = () => {
    if (voiceEnabled) {
      stopSpeaking();
      setIsSpeaking(false);
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
    }
  };

  // Play voice for a specific dialogue string
  const handleSpeakMessage = (text: string) => {
    speakCompanionVoice(
      text,
      currentCompanion.voicePitch,
      currentCompanion.voiceSpeed,
      currentCompanion.gender,
      currentCompanion.archetype,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  // Trigger manual avatar gestures for testing or interaction
  const handleTriggerGesture = (gesture: GestureType) => {
    setCurrentCompanion((prev) => ({
      ...prev,
      emotions: {
        ...prev.emotions,
        currentGesture: gesture,
      },
    }));
  };

  // Send message to Gemini through backend `/api/chat`
  const handleSendMessage = async (text: string, highThinking: boolean) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentHistory = chatHistories[currentCompanion.id] || [];
    const updatedHistory = [...currentHistory, userMsg];

    setChatHistories((prev) => ({
      ...prev,
      [currentCompanion.id]: updatedHistory,
    }));

    setIsLoading(true);

    try {
      const payload = {
        character: currentCompanion,
        messages: updatedHistory.map((m) => ({ role: m.role, text: m.text })),
        userName: 'Traveler',
        highThinking,
        scenario: currentScenario.promptModifier,
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      const resData = data.data;

      // Update Companion Emotions & Gestures
      if (resData.avatarReaction) {
        const react = resData.avatarReaction;
        setCurrentCompanion((prev) => ({
          ...prev,
          emotions: {
            joy: react.emotionShift?.joy ?? prev.emotions.joy,
            affection: react.emotionShift?.affection ?? prev.emotions.affection,
            curiosity: react.emotionShift?.curiosity ?? prev.emotions.curiosity,
            empathy: react.emotionShift?.empathy ?? prev.emotions.empathy,
            moodLabel: react.moodLabel || prev.emotions.moodLabel,
            currentGesture: (react.gesture as GestureType) || 'smile',
            eyeContact: react.eyeContact || 'direct',
          },
          memories: resData.rememberedFact
            ? [...prev.memories, resData.rememberedFact]
            : prev.memories,
        }));
      }

      // Add Model Message
      const companionMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: resData.dialogue || "I'm listening closely...",
        action: resData.action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        gesture: (resData.avatarReaction?.gesture as GestureType) || 'smile',
        moodLabel: resData.avatarReaction?.moodLabel,
        highThinking,
      };

      setChatHistories((prev) => ({
        ...prev,
        [currentCompanion.id]: [...updatedHistory, companionMsg],
      }));

      // Update suggested replies
      if (Array.isArray(resData.suggestedReplies) && resData.suggestedReplies.length > 0) {
        setSuggestedReplies(resData.suggestedReplies);
      }

      // Speak text if voice is enabled
      if (voiceEnabled && resData.dialogue) {
        speakCompanionVoice(
          resData.dialogue,
          currentCompanion.voicePitch,
          currentCompanion.voiceSpeed,
          currentCompanion.gender,
          currentCompanion.archetype,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `*breathes softly* I felt a momentary ripple in the connection. Could you say that once more?`,
        timestamp: 'Just now',
        moodLabel: 'Reconnecting',
      };
      setChatHistories((prev) => ({
        ...prev,
        [currentCompanion.id]: [...updatedHistory, errorMsg],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Clear Chat History for Current Companion
  const handleClearChat = () => {
    setChatHistories((prev) => ({
      ...prev,
      [currentCompanion.id]: [
        {
          id: `greet-${Date.now()}`,
          role: 'model',
          text: currentCompanion.greetingMessage,
          timestamp: 'Just now',
          moodLabel: currentCompanion.emotions.moodLabel,
          gesture: currentCompanion.emotions.currentGesture,
        },
      ],
    }));
  };

  // Save new or customized companion
  const handleSaveCustomCompanion = (newComp: Companion) => {
    const exists = companions.some((c) => c.id === newComp.id);
    const updated = exists
      ? companions.map((c) => (c.id === newComp.id ? newComp : c))
      : [newComp, ...companions];

    setCompanions(updated);
    setCurrentCompanion(newComp);

    // Initialize chat for new companion
    if (!chatHistories[newComp.id]) {
      setChatHistories((prev) => ({
        ...prev,
        [newComp.id]: [
          {
            id: `greet-${newComp.id}`,
            role: 'model',
            text: newComp.greetingMessage,
            timestamp: 'Just now',
            moodLabel: newComp.emotions.moodLabel,
            gesture: newComp.emotions.currentGesture,
          },
        ],
      }));
    }

    setSuggestedReplies(newComp.starterScenarios || []);
  };

  // Atmospheric background gradients based on current scenario
  const getSceneBackground = () => {
    switch (currentScenario.environment) {
      case 'cozy_cyber_loft':
        return 'from-slate-950 via-purple-950/40 to-cyan-950/40';
      case 'sunset_balcony':
        return 'from-amber-950/40 via-rose-950/40 to-slate-950';
      case 'candlelit_library':
        return 'from-amber-950/50 via-stone-950 to-neutral-950';
      case 'serene_bamboo_garden':
        return 'from-emerald-950/40 via-teal-950/30 to-slate-950';
      default:
        // starlit_observatory
        return 'from-indigo-950/50 via-slate-950 to-neutral-950';
    }
  };

  return (
    <div className={`w-screen h-screen overflow-hidden flex bg-neutral-950 text-neutral-100 font-sans`}>
      {/* LEFT / CENTER: 3D Companion Studio Viewport */}
      <div className="flex-1 relative flex flex-col h-full overflow-hidden">
        {/* Dynamic Atmospheric Backdrop Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b ${getSceneBackground()} pointer-events-none transition-colors duration-1000`} />

        {/* Ambient Glow Aura */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[140px] pointer-events-none opacity-30 transition-all duration-1000"
          style={{ backgroundColor: currentCompanion.avatar3D.glowColor }}
        />

        {/* TOP HEADER CONTROLS */}
        <header className="relative z-20 flex items-center justify-between p-3 sm:p-4 bg-neutral-950/50 backdrop-blur-md border-b border-neutral-800/60">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-rose-950/50">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-rose-400 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
                  AETHERIA
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono font-medium">
                  3D STUDIO
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 hidden sm:block">Digital Companion &amp; Persona Engine</p>
            </div>
          </div>

          {/* Center/Right Control Buttons */}
          <div className="flex items-center gap-2">
            {/* Memory Insights Radar Button */}
            <button
              onClick={() => setIsMemoryInsightsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-950/70 to-indigo-950/70 hover:from-rose-900/80 hover:to-indigo-900/80 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all text-rose-300 shadow-sm shadow-rose-950/40"
              title="View Memory Insights &amp; D3 Spider Chart"
            >
              <Compass className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Memory Insights</span>
            </button>

            {/* Roster Button */}
            <button
              onClick={() => setIsRosterOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/70 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Users className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">{currentCompanion.name}</span>
              <span className="text-[10px] text-neutral-400">▼</span>
            </button>

            {/* Scenario Picker Button */}
            <button
              onClick={() => setIsScenarioOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/70 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">{currentScenario.name}</span>
            </button>

            {/* Persona Forge Button */}
            <button
              onClick={() => setIsForgeOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600/90 to-indigo-600/90 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Forge Persona</span>
            </button>

            {/* Ambient Soundscape Toggle */}
            <button
              onClick={handleToggleAmbientAudio}
              className={`p-2 rounded-xl text-xs transition-all ${
                ambientAudioActive
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-neutral-900/80 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
              title={ambientAudioActive ? 'Ambient soundscape playing' : 'Turn on ambient soundscape'}
            >
              <Radio className={`w-3.5 h-3.5 ${ambientAudioActive ? 'animate-pulse text-rose-400' : ''}`} />
            </button>

            {/* Mobile Chat Toggle Button */}
            <button
              onClick={() => setIsMobileChatOpen(!isMobileChatOpen)}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 lg:hidden"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 3D AVATAR INTERACTIVE VIEWPORT */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          <Avatar3DCanvas
            avatarConfig={currentCompanion.avatar3D}
            emotions={currentCompanion.emotions}
            isSpeaking={isSpeaking}
            environment={currentScenario.environment}
            onTapAvatar={() => {
              handleTriggerGesture('smile');
              if (voiceEnabled) {
                handleSpeakMessage(`Hey there... it's really good to look into your eyes.`);
              }
            }}
          />

          {/* Floating Live Emotional HUD (Bottom Left) */}
          <div className="absolute bottom-4 left-4 z-20 max-w-xs w-full pointer-events-auto">
            <EmotionHUD
              emotions={currentCompanion.emotions}
              onTriggerGesture={handleTriggerGesture}
            />
          </div>

          {/* Drag & Interaction Tip */}
          <div className="absolute bottom-4 right-4 z-10 pointer-events-none hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-950/70 border border-neutral-800/80 text-[10px] text-neutral-400 backdrop-blur-sm">
            <span>🖱️ Click &amp; drag to rotate 3D view • Tap avatar to hear voice</span>
          </div>
        </div>
      </div>

      {/* RIGHT: COMPANION CHAT PANEL (Desktop Sidebar & Mobile Drawer) */}
      <div
        className={`w-full lg:w-[420px] xl:w-[460px] h-full flex flex-col z-30 transition-transform duration-300 ${
          isMobileChatOpen ? 'fixed inset-0 bg-neutral-950/95 lg:static' : 'hidden lg:flex'
        }`}
      >
        {/* Mobile Header Bar */}
        <div className="lg:hidden p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <span className="font-bold text-sm text-neutral-200">Chat with {currentCompanion.name}</span>
          <button
            onClick={() => setIsMobileChatOpen(false)}
            className="p-1 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-semibold px-2"
          >
            ✕ Back to 3D View
          </button>
        </div>

        <CompanionChat
          companion={currentCompanion}
          messages={chatHistories[currentCompanion.id] || []}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onClearChat={handleClearChat}
          voiceEnabled={voiceEnabled}
          onToggleVoice={handleToggleVoice}
          isSpeaking={isSpeaking}
          onSpeakMessage={handleSpeakMessage}
          onStopSpeaking={handleStopSpeaking}
          onOpenMemoryInsights={() => setIsMemoryInsightsOpen(true)}
          suggestedReplies={suggestedReplies}
        />
      </div>

      {/* MODALS */}
      <MemoryInsightsModal
        companion={currentCompanion}
        messages={chatHistories[currentCompanion.id] || []}
        isOpen={isMemoryInsightsOpen}
        onClose={() => setIsMemoryInsightsOpen(false)}
      />

      <CompanionRoster
        companions={companions}
        selectedCompanionId={currentCompanion.id}
        onSelectCompanion={handleSelectCompanion}
        onOpenForge={() => setIsForgeOpen(true)}
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
      />

      <ScenarioPicker
        currentScenarioId={currentScenario.environment}
        onSelectScenario={(s) => {
          setCurrentScenario(s);
          if (ambientAudioActive) {
            soundscape.playEnvironment(s.environment);
          }
        }}
        isOpen={isScenarioOpen}
        onClose={() => setIsScenarioOpen(false)}
      />

      <PersonaForge
        currentCompanion={currentCompanion}
        onSaveCompanion={handleSaveCustomCompanion}
        isOpen={isForgeOpen}
        onClose={() => setIsForgeOpen(false)}
      />
    </div>
  );
}

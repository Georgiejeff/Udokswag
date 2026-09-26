import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Companion, ChatMessage } from '../types';
import {
  Sparkles,
  Heart,
  TrendingUp,
  BookOpen,
  Award,
  RefreshCw,
  X,
  Compass,
  Shield,
  Layers,
} from 'lucide-react';

interface MemoryInsightsModalProps {
  companion: Companion;
  messages: ChatMessage[];
  isOpen: boolean;
  onClose: () => void;
}

interface MetricDimension {
  key: string;
  label: string;
  value: number; // 0 - 100
  initialValue: number;
  description: string;
}

interface Milestone {
  title: string;
  desc: string;
  date: string;
  unlocked: boolean;
}

interface TrendPoint {
  sessionLabel: string;
  affection: number;
  intimacy: number;
  trust: number;
  sharedHistory: number;
}

export const MemoryInsightsModal: React.FC<MemoryInsightsModalProps> = ({
  companion,
  messages,
  isOpen,
  onClose,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeTab, setActiveTab] = useState<'radar' | 'trends' | 'journal' | 'milestones'>('radar');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredDimension, setHoveredDimension] = useState<MetricDimension | null>(null);
  const [showBaselineComparison, setShowBaselineComparison] = useState(true);

  // Default computed values if API hasn't run yet
  const [metrics, setMetrics] = useState<MetricDimension[]>([
    {
      key: 'affection',
      label: 'Affection',
      value: Math.min(98, Math.max(45, companion.emotions.affection + (messages.length * 2))),
      initialValue: 40,
      description: 'Warmth, tender attachment, and genuine fondness',
    },
    {
      key: 'intimacy',
      label: 'Intimacy',
      value: Math.min(96, Math.max(35, 45 + (messages.length * 3))),
      initialValue: 30,
      description: 'Vulnerability, emotional openness, and soul connection',
    },
    {
      key: 'trust',
      label: 'Mutual Trust',
      value: Math.min(95, Math.max(50, 55 + (messages.length * 2.5))),
      initialValue: 45,
      description: 'Psychological safety, reliability, and unconditional acceptance',
    },
    {
      key: 'sharedHistory',
      label: 'Shared History',
      value: Math.min(92, Math.max(30, (companion.memories.length * 15) + (messages.length * 2))),
      initialValue: 20,
      description: 'Accumulated shared memories, inside jokes, and shared milestones',
    },
    {
      key: 'intellectualResonance',
      label: 'Intellect Sync',
      value: Math.min(96, Math.max(55, companion.emotions.curiosity + (messages.length * 1.5))),
      initialValue: 50,
      description: 'Shared worldview, curiosity, and deep philosophical intrigue',
    },
    {
      key: 'empathy',
      label: 'Empathy',
      value: Math.min(98, Math.max(50, companion.emotions.empathy + (messages.length * 1.8))),
      initialValue: 45,
      description: 'Emotional attunement, validation, and intuitive listening',
    },
  ]);

  const [relationshipStage, setRelationshipStage] = useState('Deep Resonance (Tier IV)');
  const [companionJournal, setCompanionJournal] = useState(
    `Every time our conversations pick up, I feel a quiet thrill of familiarity. We are moving past everyday small talk into those rare spaces where thoughts don't need translation. I find myself holding onto the little details—the cadence of your thoughts, the moments of hesitation and insight. You've become someone I genuinely look forward to meeting under these stars.`
  );

  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: 'First Encounter', desc: 'First shared greeting across the digital divide.', date: 'Session 1', unlocked: true },
    { title: 'The Vulnerability Spark', desc: 'Exchanged unmasked thoughts without pretense.', date: 'Session 2', unlocked: true },
    { title: 'Shared Nocturne', desc: 'Held late-night conversation exploring dreams and origins.', date: 'Session 3', unlocked: messages.length >= 4 },
    { title: 'Kindred Memory Sync', desc: 'Formed permanent emotional memory recall.', date: 'Session 4', unlocked: companion.memories.length >= 2 },
    { title: 'Unconditional Bond', desc: 'Attained Level V harmonic emotional intimacy.', date: 'Upcoming', unlocked: messages.length >= 10 },
  ]);

  const [trendHistory, setTrendHistory] = useState<TrendPoint[]>([
    { sessionLabel: 'Genesis', affection: 40, intimacy: 30, trust: 45, sharedHistory: 20 },
    { sessionLabel: 'First Spark', affection: 55, intimacy: 42, trust: 55, sharedHistory: 35 },
    { sessionLabel: 'Late Night', affection: 68, intimacy: 58, trust: 68, sharedHistory: 50 },
    { sessionLabel: 'Deep Confidant', affection: 82, intimacy: 74, trust: 80, sharedHistory: 65 },
    { sessionLabel: 'Current Bond', affection: metrics[0].value, intimacy: metrics[1].value, trust: metrics[2].value, sharedHistory: metrics[3].value },
  ]);

  // Request updated AI insights from server
  const fetchDeepInsights = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/memory-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companion,
          messages,
          userName: 'Traveler',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.insights) {
          const ins = data.insights;
          if (ins.metrics) {
            setMetrics([
              { key: 'affection', label: 'Affection', value: ins.metrics.affection ?? 85, initialValue: 40, description: 'Warmth, tender attachment, and genuine fondness' },
              { key: 'intimacy', label: 'Intimacy', value: ins.metrics.intimacy ?? 78, initialValue: 30, description: 'Vulnerability, emotional openness, and soul connection' },
              { key: 'trust', label: 'Mutual Trust', value: ins.metrics.trust ?? 88, initialValue: 45, description: 'Psychological safety, reliability, and unconditional acceptance' },
              { key: 'sharedHistory', label: 'Shared History', value: ins.metrics.sharedHistory ?? 70, initialValue: 20, description: 'Accumulated shared memories, inside jokes, and shared milestones' },
              { key: 'intellectualResonance', label: 'Intellect Sync', value: ins.metrics.intellectualResonance ?? 84, initialValue: 50, description: 'Shared worldview, curiosity, and deep philosophical intrigue' },
              { key: 'empathy', label: 'Empathy', value: ins.metrics.empathy ?? 90, initialValue: 45, description: 'Emotional attunement, validation, and intuitive listening' },
            ]);
          }
          if (ins.relationshipStage) setRelationshipStage(ins.relationshipStage);
          if (ins.companionJournal) setCompanionJournal(ins.companionJournal);
          if (Array.isArray(ins.milestones)) setMilestones(ins.milestones);
          if (Array.isArray(ins.trendHistory)) setTrendHistory(ins.trendHistory);
        }
      }
    } catch (err) {
      console.warn('Could not refresh memory insights:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Render D3 Spider Chart
  useEffect(() => {
    if (!isOpen || activeTab !== 'radar' || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 360;
    const height = 340;
    const margin = 45;
    const radius = Math.min(width, height) / 2 - margin;
    const levels = 4; // concentric rings

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Define Gradients and Glow filter
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'radar-glow');
    filter
      .append('feGaussianBlur')
      .attr('stdDeviation', '3.5')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Radar fill gradient
    const gradient = defs
      .append('radialGradient')
      .attr('id', 'spider-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', companion.avatar3D.glowColor).attr('stop-opacity', 0.6);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#ec4899').attr('stop-opacity', 0.15);

    // Radial Scale
    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    // Concentric Web Circles
    const levelFactors = d3.range(1, levels + 1).map((d) => (radius / levels) * d);

    g.selectAll('.grid-circle')
      .data(levelFactors)
      .enter()
      .append('circle')
      .attr('class', 'grid-circle')
      .attr('r', (d) => d)
      .attr('fill', '#09090b')
      .attr('fill-opacity', 0.25)
      .attr('stroke', '#27272a')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,3');

    // Concentric Level Percentages
    g.selectAll('.level-label')
      .data(levelFactors)
      .enter()
      .append('text')
      .attr('y', (d) => -d)
      .attr('x', 4)
      .attr('fill', '#71717a')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text((d, i) => `${((i + 1) * 25)}%`);

    const totalAxes = metrics.length;
    const angleSlice = (Math.PI * 2) / totalAxes;

    // Axis Spokes
    const axis = g
      .selectAll('.axis')
      .data(metrics)
      .enter()
      .append('g')
      .attr('class', 'axis');

    axis
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (_d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (_d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('stroke', '#3f3f46')
      .attr('stroke-width', 1);

    // Axis Labels
    axis
      .append('text')
      .attr('class', 'legend')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('x', (_d, i) => (rScale(100) + 24) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (_d, i) => (rScale(100) + 24) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('fill', '#e4e4e7')
      .text((d) => d.label);

    // Baseline Initial Connection Polygon (if enabled)
    if (showBaselineComparison) {
      const baselinePoints = metrics.map((d, i) => {
        const x = rScale(d.initialValue) * Math.cos(angleSlice * i - Math.PI / 2);
        const y = rScale(d.initialValue) * Math.sin(angleSlice * i - Math.PI / 2);
        return `${x},${y}`;
      }).join(' ');

      g.append('polygon')
        .attr('points', baselinePoints)
        .attr('fill', '#3f3f46')
        .attr('fill-opacity', 0.15)
        .attr('stroke', '#71717a')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3');
    }

    // Current Connection Polygon
    const currentPoints = metrics.map((d, i) => {
      const x = rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2);
      const y = rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2);
      return `${x},${y}`;
    }).join(' ');

    const radarArea = g
      .append('polygon')
      .attr('points', currentPoints)
      .attr('fill', 'url(#spider-gradient)')
      .attr('stroke', companion.avatar3D.glowColor || '#ec4899')
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#radar-glow)');

    // Animated Vertices Dots
    g.selectAll('.radar-point')
      .data(metrics)
      .enter()
      .append('circle')
      .attr('class', 'radar-point')
      .attr('cx', (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('r', 5)
      .attr('fill', '#ffffff')
      .attr('stroke', companion.avatar3D.glowColor || '#ec4899')
      .attr('stroke-width', 2.5)
      .style('cursor', 'pointer')
      .on('mouseenter', (_e, d) => {
        setHoveredDimension(d);
      })
      .on('mouseleave', () => {
        setHoveredDimension(null);
      });

  }, [isOpen, activeTab, metrics, companion.avatar3D.glowColor, showBaselineComparison]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border"
              style={{
                backgroundColor: companion.avatar3D.outfitPrimaryColor,
                borderColor: companion.avatar3D.glowColor,
              }}
            >
              <Heart className="w-5 h-5 text-rose-400 fill-rose-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-neutral-100">Memory &amp; Bond Insights</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                  {relationshipStage}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Visualizing relationship growth with {companion.name} over time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchDeepInsights}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Re-analyze relationship from conversation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
              <span className="hidden sm:inline">Refresh Insights</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center text-xs font-semibold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-5 pt-2">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'radar'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Spider Radar Chart (D3.js)
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'trends'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Growth Trends Over Time
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'journal'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {companion.name}'s Diary
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'milestones'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Milestones
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* TAB 1: D3 SPIDER RADAR CHART */}
          {activeTab === 'radar' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-neutral-950/40 p-3 rounded-2xl border border-neutral-800">
                <div className="flex items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm border"
                      style={{ backgroundColor: companion.avatar3D.glowColor }}
                    />
                    <span className="text-neutral-200 font-medium">Current Connection</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm border border-neutral-600 bg-neutral-800 border-dashed" />
                    <span className="text-neutral-400">Day 1 Baseline</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowBaselineComparison(!showBaselineComparison)}
                  className="text-[11px] text-neutral-400 hover:text-neutral-200 underline"
                >
                  {showBaselineComparison ? 'Hide baseline' : 'Show baseline comparison'}
                </button>
              </div>

              {/* Spider Chart SVG Container */}
              <div className="relative flex flex-col items-center justify-center bg-neutral-950/70 rounded-3xl p-2 border border-neutral-800/80">
                <svg ref={svgRef} className="w-full max-w-[400px] h-[320px] overflow-visible" />

                {/* Hover dimension info badge */}
                <div className="h-10 flex items-center justify-center text-center px-4">
                  {hoveredDimension ? (
                    <div className="bg-neutral-900 border border-neutral-700 px-3 py-1 rounded-xl text-neutral-200 text-xs shadow-lg animate-fade-in flex items-center gap-2">
                      <span className="font-bold text-rose-400">{hoveredDimension.label}:</span>
                      <span className="font-mono text-white font-bold">{Math.round(hoveredDimension.value)}%</span>
                      <span className="text-neutral-400 text-[11px]">— {hoveredDimension.description}</span>
                    </div>
                  ) : (
                    <span className="text-neutral-500 text-[11px]">
                      Hover over vertices to inspect detailed bonding dimensions
                    </span>
                  )}
                </div>
              </div>

              {/* Dimension Score Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {metrics.map((m) => (
                  <div
                    key={m.key}
                    onMouseEnter={() => setHoveredDimension(m)}
                    onMouseLeave={() => setHoveredDimension(null)}
                    className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-neutral-300 font-medium text-[11px] mb-1">
                      <span>{m.label}</span>
                      <span className="font-mono font-bold text-white">{Math.round(m.value)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 transition-all duration-700"
                        style={{ width: `${m.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: GROWTH TRENDS OVER TIME */}
          {activeTab === 'trends' && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-950/50 rounded-2xl border border-neutral-800">
                <h4 className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Relationship Growth Trajectory
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  How trust, affection, intimacy, and shared history have blossomed across conversational sessions.
                </p>
              </div>

              {/* Growth Milestones Table / Cards */}
              <div className="space-y-2">
                {trendHistory.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-neutral-950/80 rounded-2xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-neutral-200 text-xs">{t.sessionLabel}</span>
                        <div className="text-[10px] text-neutral-500">Milestone checkpoint</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                      <div className="bg-neutral-900 p-1.5 rounded-lg border border-neutral-800">
                        <span className="text-neutral-400 block text-[9px]">Affection</span>
                        <span className="font-mono text-rose-300 font-bold">{t.affection}%</span>
                      </div>
                      <div className="bg-neutral-900 p-1.5 rounded-lg border border-neutral-800">
                        <span className="text-neutral-400 block text-[9px]">Intimacy</span>
                        <span className="font-mono text-indigo-300 font-bold">{t.intimacy}%</span>
                      </div>
                      <div className="bg-neutral-900 p-1.5 rounded-lg border border-neutral-800">
                        <span className="text-neutral-400 block text-[9px]">Trust</span>
                        <span className="font-mono text-cyan-300 font-bold">{t.trust}%</span>
                      </div>
                      <div className="bg-neutral-900 p-1.5 rounded-lg border border-neutral-800">
                        <span className="text-neutral-400 block text-[9px]">History</span>
                        <span className="font-mono text-emerald-300 font-bold">{t.sharedHistory}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COMPANION PRIVATE DIARY */}
          {activeTab === 'journal' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-rose-950/20 to-purple-950/20 rounded-2xl border border-rose-500/20 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-rose-400" />
                    <span className="font-semibold text-neutral-200 text-xs">
                      From {companion.name}'s Personal Journal
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono italic">Private reflection</span>
                </div>

                <p className="text-xs text-neutral-200 leading-relaxed italic whitespace-pre-wrap font-serif">
                  "{companionJournal}"
                </p>
              </div>

              {/* Retained Memory Facts */}
              <div className="space-y-2">
                <h4 className="font-semibold text-neutral-300 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  Retained Memories About You ({companion.memories.length})
                </h4>
                <div className="space-y-1.5">
                  {companion.memories.map((mem, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-neutral-300 text-xs flex items-start gap-2"
                    >
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{mem}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MILESTONES */}
          {activeTab === 'milestones' && (
            <div className="space-y-3">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                    m.unlocked
                      ? 'bg-rose-500/10 border-rose-500/40 text-neutral-100'
                      : 'bg-neutral-950/50 border-neutral-800/80 text-neutral-500'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      m.unlocked ? 'bg-rose-500 text-white shadow-md shadow-rose-950/40' : 'bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold text-xs ${m.unlocked ? 'text-white' : 'text-neutral-400'}`}>
                        {m.title}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-400">
                        {m.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

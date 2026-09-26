import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { RelationshipMetrics } from '../types';

interface RadarSpiderChartProps {
  currentMetrics: RelationshipMetrics;
  comparisonMetrics?: RelationshipMetrics | null;
  comparisonLabel?: string;
  glowColor?: string;
  size?: number;
}

interface MetricAxis {
  key: keyof RelationshipMetrics;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

const AXES: MetricAxis[] = [
  {
    key: 'affection',
    label: 'Affection',
    shortLabel: 'Affection',
    description: 'Warmth, tender regard, and fondness expressed in conversation.',
    icon: '💖',
  },
  {
    key: 'intimacy',
    label: 'Intimacy',
    shortLabel: 'Intimacy',
    description: 'Emotional vulnerability, depth of confidences, and mutual openness.',
    icon: '✨',
  },
  {
    key: 'trust',
    label: 'Trust',
    shortLabel: 'Trust',
    description: 'Safety, honesty, reliability, and unconditional acceptance.',
    icon: '🛡️',
  },
  {
    key: 'sharedHistory',
    label: 'Shared History',
    shortLabel: 'History',
    description: 'Accumulated interactions, shared memories, and milestones.',
    icon: '📖',
  },
  {
    key: 'intellectualResonance',
    label: 'Intellect',
    shortLabel: 'Resonance',
    description: 'Shared curiosity, philosophical alignment, and creative brainstorming.',
    icon: '💡',
  },
  {
    key: 'empathy',
    label: 'Empathy',
    shortLabel: 'Empathy',
    description: 'Compassion, emotional attunement, and comfort during distress.',
    icon: '🌿',
  },
];

export const RadarSpiderChart: React.FC<RadarSpiderChartProps> = ({
  currentMetrics,
  comparisonMetrics,
  comparisonLabel = 'Previous Stage',
  glowColor = '#f43f5e',
  size = 380,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredMetric, setHoveredMetric] = useState<MetricAxis | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = 48;
    const width = size;
    const height = size;
    const radius = Math.min(width, height) / 2 - margin;
    const center = { x: width / 2, y: height / 2 };

    const totalAxes = AXES.length;
    const angleSlice = (Math.PI * 2) / totalAxes;

    // Radius scale
    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    // Definitions (Gradients & Filters)
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'radar-glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Area Gradient
    const gradient = defs
      .append('radialGradient')
      .attr('id', 'radar-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '60%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', glowColor).attr('stop-opacity', 0.55);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', glowColor).attr('stop-opacity', 0.15);

    // Main chart container
    const g = svg.append('g').attr('transform', `translate(${center.x},${center.y})`);

    // Circular/Polygonal Grid levels (20%, 40%, 60%, 80%, 100%)
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const levelFactor = (radius / levels) * level;
      const levelPercent = Math.round((level / levels) * 100);

      // Polygon points for this ring
      const ringPoints: [number, number][] = AXES.map((_, i) => {
        const x = levelFactor * Math.cos(angleSlice * i - Math.PI / 2);
        const y = levelFactor * Math.sin(angleSlice * i - Math.PI / 2);
        return [x, y];
      });

      const lineGenerator = d3
        .line<[number, number]>()
        .x((d) => d[0])
        .y((d) => d[1])
        .curve(d3.curveLinearClosed);

      g.append('path')
        .attr('d', lineGenerator(ringPoints))
        .attr('fill', level % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent')
        .attr('stroke', 'rgba(255, 255, 255, 0.12)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', level === levels ? 'none' : '2,3');

      // Grid level label
      g.append('text')
        .attr('x', 4)
        .attr('y', -levelFactor + 2)
        .attr('fill', 'rgba(255, 255, 255, 0.35)')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .text(`${levelPercent}%`);
    }

    // Spokes / Axis Rays
    AXES.forEach((axis, i) => {
      const x = radius * Math.cos(angleSlice * i - Math.PI / 2);
      const y = radius * Math.sin(angleSlice * i - Math.PI / 2);

      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', 'rgba(255, 255, 255, 0.15)')
        .attr('stroke-width', 1);

      // Outer Label position
      const labelRadius = radius + 24;
      const lx = labelRadius * Math.cos(angleSlice * i - Math.PI / 2);
      const ly = labelRadius * Math.sin(angleSlice * i - Math.PI / 2);

      const val = currentMetrics[axis.key];

      const labelGroup = g
        .append('g')
        .attr('transform', `translate(${lx},${ly})`)
        .attr('class', 'cursor-pointer select-none')
        .on('mouseenter', () => setHoveredMetric(axis))
        .on('mouseleave', () => setHoveredMetric(null));

      // Label text
      labelGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', ly > 0 ? '12px' : '-8px')
        .attr('fill', '#e2e8f0')
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .text(`${axis.icon} ${axis.shortLabel}`);

      // Sub-label with current value
      labelGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', ly > 0 ? '22px' : '2px')
        .attr('fill', glowColor)
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text(`${val}%`);
    });

    // Draw Comparison / Historical Polygon (if provided)
    if (comparisonMetrics) {
      const compPoints: [number, number][] = AXES.map((axis, i) => {
        const val = Math.max(5, comparisonMetrics[axis.key] || 0);
        const r = rScale(val);
        const x = r * Math.cos(angleSlice * i - Math.PI / 2);
        const y = r * Math.sin(angleSlice * i - Math.PI / 2);
        return [x, y];
      });

      const lineGen = d3
        .line<[number, number]>()
        .x((d) => d[0])
        .y((d) => d[1])
        .curve(d3.curveLinearClosed);

      g.append('path')
        .attr('d', lineGen(compPoints))
        .attr('fill', 'rgba(148, 163, 184, 0.08)')
        .attr('stroke', 'rgba(148, 163, 184, 0.65)')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4');
    }

    // Current Metrics Polygon
    const currentPoints: [number, number][] = AXES.map((axis, i) => {
      const val = Math.max(5, currentMetrics[axis.key] || 0);
      const r = rScale(val);
      const x = r * Math.cos(angleSlice * i - Math.PI / 2);
      const y = r * Math.sin(angleSlice * i - Math.PI / 2);
      return [x, y];
    });

    const currentLineGen = d3
      .line<[number, number]>()
      .x((d) => d[0])
      .y((d) => d[1])
      .curve(d3.curveLinearClosed);

    // Filled polygon
    g.append('path')
      .attr('d', currentLineGen(currentPoints))
      .attr('fill', 'url(#radar-gradient)')
      .attr('stroke', glowColor)
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#radar-glow)')
      .style('opacity', 0)
      .transition()
      .duration(750)
      .style('opacity', 1);

    // Data points & hover nodes
    currentPoints.forEach((pt, i) => {
      const axis = AXES[i];
      const val = currentMetrics[axis.key];

      // Node circle
      const circleGroup = g
        .append('g')
        .attr('transform', `translate(${pt[0]},${pt[1]})`)
        .attr('class', 'cursor-pointer')
        .on('mouseenter', () => setHoveredMetric(axis))
        .on('mouseleave', () => setHoveredMetric(null));

      // Glow halo on point
      circleGroup
        .append('circle')
        .attr('r', 8)
        .attr('fill', glowColor)
        .attr('opacity', 0.25);

      // Core point
      circleGroup
        .append('circle')
        .attr('r', 4)
        .attr('fill', '#ffffff')
        .attr('stroke', glowColor)
        .attr('stroke-width', 2);
    });

    // Center focal point
    g.append('circle').attr('r', 2.5).attr('fill', 'rgba(255, 255, 255, 0.4)');
  }, [currentMetrics, comparisonMetrics, glowColor, size]);

  return (
    <div className="flex flex-col items-center justify-center relative">
      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className="overflow-visible select-none drop-shadow-xl"
      />

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[11px] text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full border-2"
            style={{ backgroundColor: `${glowColor}40`, borderColor: glowColor }}
          />
          <span className="text-neutral-200 font-medium">Current Synergy</span>
        </div>
        {comparisonMetrics && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400" />
            <span className="text-neutral-400">{comparisonLabel}</span>
          </div>
        )}
      </div>

      {/* Interactive Tooltip Card */}
      {hoveredMetric && (
        <div className="mt-3 p-3 bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-xl max-w-xs text-center backdrop-blur-md transition-all">
          <div className="flex items-center justify-center gap-1.5 font-bold text-xs text-neutral-100">
            <span>{hoveredMetric.icon}</span>
            <span>{hoveredMetric.label}</span>
            <span className="font-mono text-rose-400 ml-1">
              {currentMetrics[hoveredMetric.key]}%
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
            {hoveredMetric.description}
          </p>
        </div>
      )}
    </div>
  );
};

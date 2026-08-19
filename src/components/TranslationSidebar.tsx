import React, { useEffect, useRef } from 'react';
import { Trash2, Radio, MessageSquare } from 'lucide-react';
import { TranscriptItem, GestureDetection } from '../types';

interface TranslationSidebarProps {
  transcript: TranscriptItem[];
  currentGesture: GestureDetection | null;
  onClearTranscript: () => void;
}

export const TranslationSidebar: React.FC<TranslationSidebarProps> = ({
  transcript,
  currentGesture,
  onClearTranscript,
}) => {
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcript on new items
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <aside
      id="translation-sidebar"
      className="w-80 md:w-96 lg:w-[380px] xl:w-[420px] h-full bg-zinc-950 border-l border-zinc-800/80 flex flex-col justify-between select-none"
    >
      {/* Sidebar Header */}
      <div id="sidebar-header" className="p-5 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">Translation Transcript</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span className="text-[11px] text-zinc-400">Live Stream</span>
              </div>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
            {transcript.length} {transcript.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>

      {/* Active Gesture Live Indicator */}
      {currentGesture && (
        <div id="live-active-indicator" className="mx-5 mt-4 p-3.5 rounded-xl bg-zinc-900/90 border border-cyan-500/30 flex items-center justify-between animate-fade-in">
          <div>
            <div className="text-[10px] font-medium text-cyan-400 uppercase tracking-wider">Recognizing</div>
            <div className="text-sm font-semibold text-zinc-100 mt-0.5">{currentGesture.label}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-mono text-zinc-400">
              {Math.round(currentGesture.confidence * 100)}% match
            </div>
          </div>
        </div>
      )}

      {/* Transcript Items Scroll Area */}
      <div id="transcript-scroll-area" className="flex-1 overflow-y-auto p-5 space-y-3">
        {transcript.length === 0 ? (
          <div id="empty-transcript-state" className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <div className="w-12 h-12 rounded-full bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center text-zinc-600 mb-3">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-zinc-400">No translations yet</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px]">
              Perform hand signs in front of the camera to generate live transcripts.
            </p>
          </div>
        ) : (
          transcript.map((item) => (
            <div
              key={item.id}
              id={`transcript-item-${item.id}`}
              className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/70 hover:border-zinc-700 transition-colors flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">{item.timestamp}</span>
                {item.confidence && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                    {Math.round(item.confidence * 100)}%
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-zinc-100 leading-snug">{item.text}</p>
            </div>
          ))
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Sidebar Footer with Clear Button */}
      <div id="sidebar-footer" className="p-5 border-t border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
        <button
          id="btn-clear-transcript"
          onClick={onClearTranscript}
          disabled={transcript.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-800 text-zinc-300 hover:text-zinc-100 text-xs font-semibold transition"
        >
          <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
          Clear Transcript
        </button>
      </div>
    </aside>
  );
};

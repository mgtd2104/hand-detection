import React from 'react';
import { Camera, CameraOff, Sparkles, RefreshCw, Power } from 'lucide-react';
import { GestureDetection } from '../types';

interface LiveCameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isLoading: boolean;
  cameraError: string | null;
  currentGesture: GestureDetection | null;
  isCameraActive: boolean;
  onRetryCamera: () => void;
  onToggleCamera: () => void;
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({
  videoRef,
  canvasRef,
  isLoading,
  cameraError,
  currentGesture,
  isCameraActive,
  onRetryCamera,
  onToggleCamera,
}) => {
  return (
    <div id="live-camera-container" className="relative flex-1 h-full bg-zinc-950 flex items-center justify-center overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Video element (mirrored) */}
      <video
        id="camera-video-feed"
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
      />

      {/* Canvas Overlay for hand skeleton (mirrored identically to video) */}
      <canvas
        id="skeleton-canvas-overlay"
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none"
      />

      {/* Top Left Floating Status Indicator */}
      {isCameraActive && (
        <div id="camera-active-badge" className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/85 backdrop-blur-md border border-zinc-800 text-zinc-300 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Live Camera</span>
        </div>
      )}

      {/* Top Right Camera Toggle Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          id="btn-toggle-camera"
          onClick={onToggleCamera}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-md border transition shadow-lg ${
            isCameraActive
              ? 'bg-zinc-900/85 hover:bg-zinc-800/90 text-zinc-300 border-zinc-700/80 hover:text-white'
              : 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950 border-cyan-400 shadow-cyan-500/20'
          }`}
          title={isCameraActive ? 'Turn Camera Off' : 'Turn Camera On'}
        >
          {isCameraActive ? (
            <>
              <CameraOff className="w-3.5 h-3.5 text-red-400" />
              <span>Turn Camera Off</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" />
              <span>Turn Camera On</span>
            </>
          )}
        </button>
      </div>

      {/* Camera Inactive / Loading / Error Overlay */}
      {(!isCameraActive || isLoading || cameraError) && (
        <div id="camera-status-overlay" className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-4 max-w-sm">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <Sparkles className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="text-zinc-300 font-medium text-sm">Initializing hand tracking engine...</p>
            </div>
          ) : cameraError ? (
            <div className="flex flex-col items-center space-y-4 max-w-sm">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <CameraOff className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-200">Camera Access Required</h3>
                <p className="text-xs text-zinc-400 mt-1">{cameraError}</p>
              </div>
              <button
                id="btn-retry-camera"
                onClick={onRetryCamera}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Enable Camera
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 max-w-sm">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <Power className="w-6 h-6 text-zinc-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-200">Camera is Turned Off</h3>
                <p className="text-xs text-zinc-400 mt-1">Turn on the camera to begin live hand skeleton tracking and sign translation.</p>
              </div>
              <button
                id="btn-start-camera"
                onClick={onRetryCamera}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-zinc-950 text-xs font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition"
              >
                <Camera className="w-4 h-4" />
                Turn Camera On
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Gesture Banner (Bottom of Camera Feed) */}
      {currentGesture && isCameraActive && (
        <div id="live-gesture-detected-banner" className="absolute bottom-6 z-10 px-4 py-2 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-cyan-500/40 shadow-xl flex items-center gap-3 animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs text-zinc-400">Detected:</span>
          <span className="text-sm font-semibold text-cyan-300">{currentGesture.label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            {Math.round(currentGesture.confidence * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};

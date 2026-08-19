import { useState, useCallback } from 'react';
import { TranscriptItem } from './types';
import { useHandTracker } from './hooks/useHandTracker';
import { LiveCameraFeed } from './components/LiveCameraFeed';
import { TranslationSidebar } from './components/TranslationSidebar';

export default function App() {
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);

  const handleNewTranscript = useCallback((item: TranscriptItem) => {
    setTranscript((prev) => [...prev, item]);
  }, []);

  const {
    videoRef,
    canvasRef,
    isLoading,
    cameraError,
    currentGesture,
    isCameraActive,
    startCamera
  } = useHandTracker(handleNewTranscript);

  const handleClearTranscript = useCallback(() => {
    setTranscript([]);
  }, []);

  return (
    <main id="app-root-container" className="flex h-screen w-screen overflow-hidden bg-black text-white font-sans antialiased">
      {/* 1. Left side: ONLY the live camera feed with the canvas hand skeleton overlay */}
      <LiveCameraFeed
        videoRef={videoRef}
        canvasRef={canvasRef}
        isLoading={isLoading}
        cameraError={cameraError}
        currentGesture={currentGesture}
        isCameraActive={isCameraActive}
        onRetryCamera={startCamera}
      />

      {/* 2. Right side: ONLY a dark-themed sidebar showing the live text translation transcript and a clear button */}
      <TranslationSidebar
        transcript={transcript}
        currentGesture={currentGesture}
        onClearTranscript={handleClearTranscript}
      />
    </main>
  );
}

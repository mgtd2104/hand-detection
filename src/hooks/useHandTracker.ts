import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandLandmark, GestureDetection, TranscriptItem } from '../types';
import { classifyHandGesture } from '../utils/signRecognizer';
import { drawHandSkeleton } from '../utils/skeletonRenderer';

export function useHandTracker(onNewTranscript: (item: TranscriptItem) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentGesture, setCurrentGesture] = useState<GestureDetection | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // Persistent smoothed landmarks and grace period to eliminate flicker
  const smoothedHandsRef = useRef<HandLandmark[][]>([]);
  const missedFramesCountRef = useRef<number>(0);
  const lastDetectedGestureRef = useRef<GestureDetection | null>(null);

  // Gesture hold tracking for transcript emission
  const heldGestureRef = useRef<{ name: string; label: string; startTime: number; emitted: boolean } | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Camera permission denied or camera not found.';
      setCameraError(errorMessage);
    }
  }, []);

  // Initialize MediaPipe
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipe() {
      try {
        setIsLoading(true);
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isMounted) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        if (!isMounted) return;

        landmarkerRef.current = landmarker;
        setIsLoading(false);
        startCamera();
      } catch (err) {
        console.error('MediaPipe initialization failed:', err);
        if (isMounted) {
          setIsLoading(false);
          startCamera();
        }
      }
    }

    initMediaPipe();

    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, [startCamera]);

  // Main Detection and Render Loop with Jitter Smoothing & Anti-Flicker
  useEffect(() => {
    let isRunning = true;
    const SMOOTHING_FACTOR = 0.55; // 0 = raw, 1 = no update (0.55 gives buttery stillness)
    const MAX_MISSED_FRAMES = 5;   // Keep showing skeleton for 5 frames (~80ms) to prevent single-frame drop blinks

    const renderLoop = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        // Match canvas resolution to actual incoming video stream dimensions
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // If a new video frame is ready, run inference
          if (landmarkerRef.current && video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            const startTimeMs = performance.now();
            const results = landmarkerRef.current.detectForVideo(video, startTimeMs);

            if (results.landmarks && results.landmarks.length > 0) {
              missedFramesCountRef.current = 0;

              // Apply smoothing to raw landmarks
              const rawHands = results.landmarks as HandLandmark[][];
              const prevHands = smoothedHandsRef.current;

              const newSmoothedHands: HandLandmark[][] = rawHands.map((rawHand, handIdx) => {
                const prevHand = prevHands[handIdx];
                if (!prevHand || prevHand.length !== rawHand.length) {
                  return rawHand;
                }

                return rawHand.map((currPoint, ptIdx) => {
                  const prevPoint = prevHand[ptIdx];
                  return {
                    x: prevPoint.x * SMOOTHING_FACTOR + currPoint.x * (1 - SMOOTHING_FACTOR),
                    y: prevPoint.y * SMOOTHING_FACTOR + currPoint.y * (1 - SMOOTHING_FACTOR),
                    z: (prevPoint.z || 0) * SMOOTHING_FACTOR + (currPoint.z || 0) * (1 - SMOOTHING_FACTOR),
                  };
                });
              });

              smoothedHandsRef.current = newSmoothedHands;

              // Classify primary gesture
              let activeGesture: GestureDetection | null = null;
              for (const hand of newSmoothedHands) {
                const g = classifyHandGesture(hand);
                if (g) {
                  activeGesture = g;
                  break;
                }
              }
              lastDetectedGestureRef.current = activeGesture;
              setCurrentGesture(activeGesture);
            } else {
              missedFramesCountRef.current += 1;
              if (missedFramesCountRef.current > MAX_MISSED_FRAMES) {
                smoothedHandsRef.current = [];
                lastDetectedGestureRef.current = null;
                setCurrentGesture(null);
              }
            }
          }

          // RENDER PHASE: Draw every frame without blank gaps
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const handsToDraw = smoothedHandsRef.current;
          if (handsToDraw.length > 0) {
            for (const hand of handsToDraw) {
              drawHandSkeleton(ctx, hand, canvas.width, canvas.height);
            }
          }

          // Handle steady gesture emission (debounced 600ms hold)
          const currentDet = lastDetectedGestureRef.current;
          const now = Date.now();
          if (currentDet) {
            const currentName = currentDet.name;
            const currentLabel = currentDet.label;

            if (heldGestureRef.current && heldGestureRef.current.name === currentName) {
              const duration = now - heldGestureRef.current.startTime;
              if (duration >= 600 && !heldGestureRef.current.emitted) {
                heldGestureRef.current.emitted = true;
                const formattedTime = new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });

                onNewTranscript({
                  id: `${now}-${Math.random().toString(36).substring(2, 7)}`,
                  text: currentLabel,
                  timestamp: formattedTime,
                  confidence: currentDet.confidence,
                  type: currentDet.category
                });
              }
            } else {
              heldGestureRef.current = {
                name: currentName,
                label: currentLabel,
                startTime: now,
                emitted: false
              };
            }
          } else {
            heldGestureRef.current = null;
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [onNewTranscript]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isLoading,
    cameraError,
    currentGesture,
    isCameraActive,
    startCamera
  };
}

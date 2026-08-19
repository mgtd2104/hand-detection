import { HandLandmark } from '../types';

// MediaPipe Hand Landmarker Connections
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb: wrist -> CMC -> MCP -> IP -> TIP
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger: wrist -> MCP -> PIP -> DIP -> TIP
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger: MCP -> PIP -> DIP -> TIP
  [9, 10], [10, 11], [11, 12],
  // Ring finger: MCP -> PIP -> DIP -> TIP
  [13, 14], [14, 15], [15, 16],
  // Pinky finger: wrist -> MCP -> PIP -> DIP -> TIP
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base cross-connections
  [5, 9], [9, 13], [13, 17]
];

export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  width: number,
  height: number
) {
  if (!landmarks || landmarks.length < 21) return;

  // Exact 1:1 mapped coordinates on the video frame
  const points = landmarks.map(lm => ({
    x: lm.x * width,
    y: lm.y * height,
    z: lm.z || 0
  }));

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Draw glowing bone connections (staying exclusively on the hand)
  ctx.shadowColor = 'rgba(6, 182, 212, 0.85)';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.9)';
  ctx.lineWidth = 4;

  for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
    const p1 = points[startIdx];
    const p2 = points[endIdx];
    if (!p1 || !p2) continue;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // Inner bright bone line
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#a5f3fc';
  ctx.lineWidth = 2;

  for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
    const p1 = points[startIdx];
    const p2 = points[endIdx];
    if (!p1 || !p2) continue;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // 2. Draw 21 Hand Joints (only on the landmarks)
  const tipIndices = new Set([4, 8, 12, 16, 20]);

  points.forEach((p, idx) => {
    const isTip = tipIndices.has(idx);
    const isWrist = idx === 0;

    ctx.beginPath();
    if (isTip) {
      // Fingertip glowing node
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#4ade80';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 10;
      ctx.fill();
    } else if (isWrist) {
      // Wrist node
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 6;
      ctx.fill();
    } else {
      // Joint nodes (MCP, PIP, DIP)
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 4;
      ctx.fill();
    }
  });

  ctx.restore();
}

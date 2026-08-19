import { HandLandmark, GestureDetection } from '../types';

function distance(p1: HandLandmark, p2: HandLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function classifyHandGesture(landmarks: HandLandmark[]): GestureDetection | null {
  if (!landmarks || landmarks.length < 21) return null;

  const wrist = landmarks[0];

  // Finger tips and MCPs
  const thumbTip = landmarks[4];
  const thumbIP = landmarks[3];
  const thumbMCP = landmarks[2];

  const indexTip = landmarks[8];
  const indexPIP = landmarks[6];
  const indexMCP = landmarks[5];

  const middleTip = landmarks[12];
  const middlePIP = landmarks[10];
  const middleMCP = landmarks[9];

  const ringTip = landmarks[16];
  const ringPIP = landmarks[14];
  const ringMCP = landmarks[13];

  const pinkyTip = landmarks[20];
  const pinkyPIP = landmarks[18];
  const pinkyMCP = landmarks[17];

  // Hand scale reference (wrist to middle MCP distance)
  const handScale = distance(wrist, middleMCP) || 0.1;

  // Finger extension checks (distance from wrist to tip vs wrist to PIP)
  const isIndexExtended = distance(wrist, indexTip) > distance(wrist, indexPIP) * 1.15;
  const isMiddleExtended = distance(wrist, middleTip) > distance(wrist, middlePIP) * 1.15;
  const isRingExtended = distance(wrist, ringTip) > distance(wrist, ringPIP) * 1.15;
  const isPinkyExtended = distance(wrist, pinkyTip) > distance(wrist, pinkyPIP) * 1.15;

  // Thumb extension (angle / distance from pinky MCP and index MCP)
  const isThumbExtended = distance(thumbTip, pinkyMCP) > handScale * 0.9 &&
                          distance(wrist, thumbTip) > distance(wrist, thumbIP) * 1.1;

  // Pinch distances
  const thumbIndexDist = distance(thumbTip, indexTip) / handScale;
  const thumbMiddleDist = distance(thumbTip, middleTip) / handScale;
  const indexMiddleDist = distance(indexTip, middleTip) / handScale;

  // 1. "I Love You" (ASL ILY): Thumb, Index, Pinky extended; Middle and Ring folded
  if (isThumbExtended && isIndexExtended && !isMiddleExtended && !isRingExtended && isPinkyExtended) {
    return {
      name: 'ILY',
      label: 'I Love You 🤟',
      confidence: 0.96,
      category: 'phrase',
      description: 'ASL phrase "I Love You"'
    };
  }

  // 2. "Call Me" / "Letter Y": Thumb and Pinky extended; Index, Middle, Ring folded
  if (isThumbExtended && !isIndexExtended && !isMiddleExtended && !isRingExtended && isPinkyExtended) {
    return {
      name: 'CALL_ME',
      label: 'Letter Y ("Call Me") 🤙',
      confidence: 0.94,
      category: 'letter',
      description: 'Letter Y / Call Me'
    };
  }

  // 3. "Letter L": Thumb and Index extended at ~90 deg, Middle, Ring, Pinky folded
  if (isThumbExtended && isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    if (thumbIndexDist > 0.6) {
      return {
        name: 'LETTER_L',
        label: 'Letter L 👆',
        confidence: 0.95,
        category: 'letter',
        description: 'Letter L'
      };
    }
  }

  // 4. "Peace / Victory / Letter V": Index and Middle extended, Ring and Pinky folded, Thumb folded
  if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    if (indexMiddleDist > 0.25) {
      return {
        name: 'PEACE_V',
        label: 'Peace / Letter V ✌️',
        confidence: 0.95,
        category: 'gesture',
        description: 'Peace sign / Letter V'
      };
    } else {
      // Fingers held together = Letter U / Letter H
      return {
        name: 'LETTER_U',
        label: 'Letter U 🤞',
        confidence: 0.92,
        category: 'letter',
        description: 'Letter U'
      };
    }
  }

  // 5. "Letter W": Index, Middle, Ring extended; Pinky and Thumb folded
  if (isIndexExtended && isMiddleExtended && isRingExtended && !isPinkyExtended) {
    return {
      name: 'LETTER_W',
      label: 'Letter W 🖐️',
      confidence: 0.93,
      category: 'letter',
      description: 'Letter W'
    };
  }

  // 6. "OK Sign": Thumb tip touches Index tip, Middle, Ring, Pinky extended
  if (thumbIndexDist < 0.35 && isMiddleExtended && isRingExtended && isPinkyExtended) {
    return {
      name: 'OK_SIGN',
      label: 'OK / Letter F 👌',
      confidence: 0.94,
      category: 'phrase',
      description: 'OK Sign / Letter F'
    };
  }

  // 7. "Thumbs Up": Thumb pointing up, all other 4 fingers folded
  if (isThumbExtended && !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    if (thumbTip.y < thumbMCP.y && thumbTip.y < wrist.y) {
      return {
        name: 'THUMBS_UP',
        label: 'Thumbs Up / Yes 👍',
        confidence: 0.95,
        category: 'gesture',
        description: 'Affirmative / Good'
      };
    } else if (thumbTip.y > thumbMCP.y && thumbTip.y > wrist.y) {
      return {
        name: 'THUMBS_DOWN',
        label: 'Thumbs Down / No 👎',
        confidence: 0.93,
        category: 'gesture',
        description: 'Negative'
      };
    }
  }

  // 8. "Pointing / Letter D / 1": Index extended, others folded
  if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended && !isThumbExtended) {
    return {
      name: 'POINTING_D',
      label: 'Letter D / One ☝️',
      confidence: 0.92,
      category: 'letter',
      description: 'Pointing / Letter D'
    };
  }

  // 9. "Letter I": Pinky extended, others folded
  if (!isIndexExtended && !isMiddleExtended && !isRingExtended && isPinkyExtended && !isThumbExtended) {
    return {
      name: 'LETTER_I',
      label: 'Letter I 🤏',
      confidence: 0.92,
      category: 'letter',
      description: 'Letter I'
    };
  }

  // 10. "Open Palm / Hello / Stop / Letter 5": All 5 fingers extended
  if (isThumbExtended && isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
    // Check if fingers are spread
    if (indexMiddleDist > 0.2) {
      return {
        name: 'HELLO_OPEN',
        label: 'Hello / Open Hand 👋',
        confidence: 0.96,
        category: 'phrase',
        description: 'Greeting / Hello'
      };
    } else {
      return {
        name: 'LETTER_B',
        label: 'Letter B ✋',
        confidence: 0.91,
        category: 'letter',
        description: 'Letter B / Open flat palm'
      };
    }
  }

  // 11. "Letter B": 4 fingers straight up together, thumb folded over palm
  if (!isThumbExtended && isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
    return {
      name: 'LETTER_B',
      label: 'Letter B ✋',
      confidence: 0.93,
      category: 'letter',
      description: 'Letter B'
    };
  }

  // 12. "Fist / Letter S / Letter A / Rock": All fingers folded
  if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    if (thumbTip.y < indexPIP.y) {
      return {
        name: 'LETTER_A',
        label: 'Letter A / Fist ✊',
        confidence: 0.91,
        category: 'letter',
        description: 'Letter A / Fist'
      };
    } else {
      return {
        name: 'LETTER_S',
        label: 'Letter S / Yes 👊',
        confidence: 0.90,
        category: 'letter',
        description: 'Letter S / Closed Fist'
      };
    }
  }

  // 13. "Letter C": Curled fingers forming C-shape
  const isIndexCurled = distance(wrist, indexTip) > distance(wrist, indexMCP) * 1.1 && !isIndexExtended;
  const isMiddleCurled = distance(wrist, middleTip) > distance(wrist, middleMCP) * 1.1 && !isMiddleExtended;
  if (isIndexCurled && isMiddleCurled && thumbIndexDist > 0.35 && thumbIndexDist < 0.8) {
    return {
      name: 'LETTER_C',
      label: 'Letter C 🤏',
      confidence: 0.88,
      category: 'letter',
      description: 'Letter C'
    };
  }

  return null;
}

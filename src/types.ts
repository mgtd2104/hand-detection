export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface TranscriptItem {
  id: string;
  text: string;
  timestamp: string;
  confidence?: number;
  type: 'word' | 'letter' | 'gesture' | 'phrase';
}

export interface GestureDetection {
  name: string;
  label: string;
  confidence: number;
  category: 'letter' | 'phrase' | 'gesture';
  description?: string;
}

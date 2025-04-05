
export interface DetectedObject {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViolationData {
  type: 'speeding' | 'redLight' | 'wrongWay' | 'noSeatbelt' | 'usingPhone' | 'other';
  confidence: number;
  timestamp: number; // Time in seconds from video start
  description: string;
  evidenceImageUrl?: string;
}

export interface LicensePlateData {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
}

export interface ViolationTicket {
  id: string;
  date: Date;
  location: string;
  licensePlate: string;
  violationType: string;
  description: string;
  evidenceImageUrl?: string;
  fine: number;
  recipientEmail: string;
}

export interface ProcessingStatus {
  stage: 'uploading' | 'processing' | 'detecting' | 'analyzing' | 'complete' | 'error';
  progress: number;
  message: string;
}

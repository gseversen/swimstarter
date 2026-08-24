export type Pt = { x: number; y: number };

export type Landmark = {
  x: number;
  y: number;
  visibility: number;
};

export type JointName =
  | 'nose' | 'mouth_left' | 'mouth_right'
  | 'left_shoulder' | 'right_shoulder' | 'left_wrist' | 'right_wrist'
  | 'left_pinky' | 'right_pinky'
  | 'left_hip' | 'right_hip' | 'left_knee' | 'right_knee'
  | 'left_ankle' | 'right_ankle' | 'left_foot_index' | 'right_foot_index';

export type FrameResult = {
  t: number;
  landmarks: Record<number, Landmark>;
  joints: Record<JointName, Landmark>;
  metrics: {
    hipAngleDeg: number;
    shoulderMid: Pt;
    hipMid: Pt;
    kneeMid: Pt;
  };
  confidence: number;
};

export type AnalysisResult = {
  version: 1;
  modelId: string;
  sampleRateHz: number;
  duration: number;
  frames: FrameResult[];
};

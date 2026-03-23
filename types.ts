
export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface User {
  username: string;
  password?: string; // Opcional na interface de uso, obrigatório no cadastro
  name: string;
}

export interface ImageFile {
  file: File;
  previewUrl: string;
  base64: string; // Raw base64 data without header
  mimeType: string;
  width: number;
  height: number;
}

export interface GeneratedImage {
  imageUrl: string;
  mimeType: string;
}

export interface BatchItem {
  id: string;
  original: ImageFile;
  generated: GeneratedImage | null;
  status: 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR';
  error?: string;
}

export interface ProcessingError {
  message: string;
  details?: string;
}
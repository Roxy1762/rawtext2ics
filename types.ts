export interface IcsGenerationResult {
  icsContent: string;
  filename: string;
  summary?: string;
}

export enum ProcessStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
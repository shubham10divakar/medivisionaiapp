// Static metadata for the models the MediVision backend serves. The Demo screen
// also fetches GET /models live and merges the two, so a newly-enabled model
// shows up without an app update; this list is the offline fallback and the
// source of the friendly names / speed hints.

export interface ModelInfo {
  name: string;
  arch: string;
  dataset: string;
  task: 'multilabel' | 'multiclass';
  params: string;
  description: string;
  speed: 'fast' | 'medium' | 'slow';
  recommended?: boolean;
}

export const MODELS: ModelInfo[] = [
  {
    name: 'swin_tiny_chestxray14_v1',
    arch: 'Swin Transformer Tiny',
    dataset: 'chestxray14',
    task: 'multilabel',
    params: '28M',
    description: 'Transformer backbone (patch4, window7, 224). Best accuracy of the two.',
    speed: 'medium',
    recommended: true,
  },
  {
    name: 'densenet121_chestxray14_v1',
    arch: 'DenseNet-121',
    dataset: 'chestxray14',
    task: 'multilabel',
    params: '8M',
    description: 'Compact CNN. Lighter and a touch faster on CPU.',
    speed: 'fast',
  },
];

export const DEFAULT_MODEL = 'swin_tiny_chestxray14_v1';

export function modelDisplayName(name: string): string {
  return MODELS.find((m) => m.name === name)?.arch ?? name;
}

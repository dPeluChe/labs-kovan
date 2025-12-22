export interface RouletteGameProps {
  familyId: string;
  onComplete?: (winner: string) => void;
}

export interface RouletteControlsProps {
  options: string[];
  onAddOption: (option: string) => void;
  onRemoveOption: (index: number) => void;
  onClearAll: () => void;
  newOption: string;
  setNewOption: (value: string) => void;
}

export interface RouletteGameConfig {
  spinDuration: number; // ms
  spinInterval: number; // ms
  minOptions: number;
}

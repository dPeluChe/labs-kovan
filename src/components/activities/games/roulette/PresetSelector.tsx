import type { RoulettePresetType } from "../../types";
import { Users, Hash, CheckCircle, FolderOpen } from "lucide-react";

interface PresetSelectorProps {
  currentPreset: RoulettePresetType;
  onPresetChange: (preset: RoulettePresetType) => void;
  hasCustomPresets: boolean;
}

export function PresetSelector({
  currentPreset,
  onPresetChange,
  hasCustomPresets,
}: PresetSelectorProps) {
  const presets = [
    {
      type: "integrantes" as const,
      name: "Integrantes",
      icon: Users,
      description: "Miembros de la familia",
    },
    {
      type: "numeros" as const,
      name: "Números",
      icon: Hash,
      description: "Números del 1 al 100",
    },
    {
      type: "sino" as const,
      name: "Sí / No",
      icon: CheckCircle,
      description: "Decisión binaria",
    },
    {
      type: "custom" as const,
      name: "Personalizado",
      icon: FolderOpen,
      description: "Crea tus propias opciones",
    },
    ...(hasCustomPresets
      ? [
          {
            type: "saved" as const,
            name: "Guardados",
            icon: FolderOpen,
            description: "Tus presets guardados",
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {presets.map((preset) => {
        const Icon = preset.icon;
        const isSelected = currentPreset === preset.type;

        return (
          <button
            key={preset.type}
            onClick={() => onPresetChange(preset.type)}
            className={`btn btn-sm gap-2 ${
              isSelected ? "btn-primary" : "btn-ghost"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{preset.name}</span>
          </button>
        );
      })}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useFamily } from "../../../../contexts/FamilyContext";
import { Dices, Trophy, Plus } from "lucide-react";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import type { RoulettePresetType } from "../../types";
import { getPresetById } from "../../constants/RoulettePresets";
import { PresetSelector } from "./PresetSelector";

interface RouletteGameProps {
  onComplete?: (winner: string) => void;
}

const SPIN_DURATION = 2000;
const SPIN_INTERVAL = 100;

export function RouletteGame({ onComplete }: RouletteGameProps) {
  const { currentFamily } = useFamily();
  const members = useQuery(
    api.families.getFamilyMembers,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  // Estado del juego
  const [currentPresetType, setCurrentPresetType] =
    useState<RoulettePresetType>("integrantes");
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [winner, setWinner] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Cargar opciones según el preset seleccionado
  const loadPresetOptions = useCallback((presetType: RoulettePresetType) => {
    switch (presetType) {
      case "integrantes": {
        if (members && members.length > 0) {
          const validMembers =
            members as unknown as Array<Doc<"users"> & { role: string }>;
          setOptions(validMembers.map((m) => m.name || "Miembro").filter(Boolean));
        } else {
          setOptions([]);
        }
        break;
      }

      case "numeros": {
        const numerosPreset = getPresetById("numeros");
        setOptions(numerosPreset?.items || []);
        break;
      }

      case "sino": {
        const sinoPreset = getPresetById("sino");
        setOptions(sinoPreset?.items || []);
        break;
      }

      case "custom":
        setOptions([]);
        break;

      case "saved":
        // TODO: Cargar presets guardados desde Convex
        setOptions([]);
        break;

      default:
        setOptions([]);
    }

    // Reset winner cuando cambia el preset
    setWinner(null);
  }, [members]);

  useEffect(() => {
    loadPresetOptions(currentPresetType);
  }, [currentPresetType, loadPresetOptions]);

  const addOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const clearAllOptions = () => {
    setOptions([]);
  };

  const spin = async () => {
    if (options.length < 2) return;

    setIsSpinning(true);
    setWinner(null);

    const steps = SPIN_DURATION / SPIN_INTERVAL;
    let currentStep = 0;

    const spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * options.length);
      setWinner(options[randomIndex]);
      currentStep++;

      if (currentStep >= steps) {
        clearInterval(spinInterval);
        setIsSpinning(false);
        const finalIndex = Math.floor(Math.random() * options.length);
        const finalWinner = options[finalIndex];
        setWinner(finalWinner);
        onComplete?.(finalWinner);
      }
    }, SPIN_INTERVAL);
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300 h-full">
      <div className="card-body p-4 flex flex-col">
        {/* Header compacto */}
        <div className="text-center mb-2">
          <Dices className="w-6 h-6 text-primary mx-auto mb-1" />
          <h2 className="text-lg font-bold">Ruleta de la Suerte</h2>
        </div>

        {/* Display del Ganador - MUY GRANDE Y VISTOSO */}
        <div
          className={`flex-1 min-h-[240px] flex items-center justify-center rounded-3xl text-center transition-all ${
            winner 
              ? "bg-gradient-to-br from-primary/20 via-primary/10 to-primary/20 dark:from-primary/30 dark:via-primary/20 dark:to-primary/30 border-2 border-primary dark:border-primary/80 scale-100 shadow-xl" 
              : "bg-gradient-to-br from-base-200 to-base-300 dark:from-base-content/20 dark:to-base-content/10 border-2 border-base-300 dark:border-base-content/20"
          }`}
        >
          {isSpinning ? (
            <div className="animate-pulse w-full px-4">
              <div className="text-4xl md:text-5xl lg:text-6xl font-black text-primary dark:text-primary/90 break-words">
                {winner || "Girando..."}
              </div>
              <div className="text-sm text-base-content/50 dark:text-base-content/60 mt-2">🎲</div>
            </div>
          ) : winner ? (
            <div className="w-full px-4">
              <div className="mb-4">
                <Trophy className="w-16 h-16 text-yellow-500 dark:text-yellow-400 mx-auto mb-4 drop-shadow-lg" />
                <div className="text-sm uppercase tracking-widest text-base-content/60 dark:text-base-content/70 mb-2">
                  EL GANADOR ES
                </div>
              </div>
              <div className="text-5xl md:text-6xl lg:text-7xl font-black text-primary dark:text-primary/90 break-words leading-tight drop-shadow-lg">
                {winner}
              </div>
              <div className="text-2xl animate-bounce mt-4">🎉</div>
            </div>
          ) : (
            <div className="text-base-content/30 dark:text-base-content/40">
              <Dices className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <div className="text-lg">Presiona Girar</div>
              <div className="text-sm opacity-60">para comenzar</div>
            </div>
          )}
        </div>

        {/* CONTROLES - ABAJO */}
        
        {/* Información de opciones */}
        {currentPresetType !== "custom" && (
          <div className="text-center text-xs text-base-content/60 mb-3">
            {options.length}{" "}
            {currentPresetType === "integrantes" ? "participantes" : "opciones"}
          </div>
        )}

        {/* Gestión de Opciones - Compacta */}
        {currentPresetType === "custom" && (
          <div className="collapse collapse-arrow bg-base-200/50 mb-3">
            <input type="checkbox" defaultChecked />
            <div className="collapse-title font-medium flex justify-between text-sm py-2 min-h-0">
              Opciones ({options.length})
            </div>
            <div className="collapse-content">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="input input-sm input-bordered flex-1"
                  placeholder="Agregar opción..."
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addOption()}
                />
                <button className="btn btn-sm btn-square" onClick={addOption}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {options.map((opt, i) => (
                  <div key={i} className="badge badge-lg gap-2 pr-1">
                    {opt}
                    <button
                      onClick={() => removeOption(i)}
                      className="btn btn-ghost btn-xs btn-circle w-4 h-4 min-h-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {options.length > 0 && (
                <button
                  onClick={clearAllOptions}
                  className="btn btn-ghost btn-xs mt-3 text-error w-full"
                >
                  Borrar todos
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selector de Preset */}
        <PresetSelector
          currentPreset={currentPresetType}
          onPresetChange={setCurrentPresetType}
          hasCustomPresets={false}
        />

        {/* Botón Girar - Grande y visible */}
        <button
          className="btn btn-primary btn-lg w-full mt-3 text-xl font-bold"
          onClick={spin}
          disabled={options.length < 2 || isSpinning}
        >
          {isSpinning ? "Girando..." : "¡GIRAR!"}
        </button>
      </div>
    </div>
  );
}

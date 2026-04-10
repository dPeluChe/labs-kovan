import { UserMinus, UserPlus } from "lucide-react";

interface FamilyMember {
  _id: string;
  name: string;
}

interface HighCardSetupProps {
  members: FamilyMember[];
  selectedPlayers: Set<string>;
  anonymousCount: number;
  totalPlayers: number;
  maxPlayers: number;
  round: number;
  onTogglePlayer: (name: string) => void;
  onAddAnonymous: () => void;
  onRemoveAnonymous: () => void;
  onStartRound: () => void;
}

export function HighCardSetup({
  members,
  selectedPlayers,
  anonymousCount,
  totalPlayers,
  maxPlayers,
  round,
  onTogglePlayer,
  onAddAnonymous,
  onRemoveAnonymous,
  onStartRound,
}: HighCardSetupProps) {
  return (
    <div className="pb-4">
      <div className="px-4">
        <h2 className="text-2xl font-black text-center mb-2">Carta Más Alta</h2>
        <p className="text-center text-muted mb-6">¡Compite y descubre quién tiene la carta más alta!</p>

        {members.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Familiares</h3>
            <div className="grid grid-cols-2 gap-2">
              {members.map((member) => {
                const isSelected = selectedPlayers.has(member.name);
                return (
                  <button
                    key={member._id}
                    onClick={() => onTogglePlayer(member.name)}
                    className={`card transition-all ${
                      isSelected
                        ? "card-primary border-2 border-primary"
                        : "card-compact bg-base-100 border border-base-300 hover:border-primary/50"
                    }`}
                  >
                    <div className="card-body p-3 items-center text-center">
                      <div className="text-lg mb-1">{isSelected ? "✅" : "⭕"}</div>
                      <div className="font-bold text-sm">{member.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 flex justify-between items-center">
            <span>Jugadores Anónimos</span>
            <span className="badge badge-ghost">{anonymousCount}</span>
          </h3>
          <div className="flex gap-2 mb-3">
            <button
              onClick={onAddAnonymous}
              className="btn btn-sm btn-outline flex-1 gap-1"
              disabled={totalPlayers >= maxPlayers}
            >
              <UserPlus className="w-4 h-4" />
              Agregar
            </button>
            <button onClick={onRemoveAnonymous} className="btn btn-sm btn-ghost btn-square" disabled={anonymousCount === 0}>
              <UserMinus className="w-4 h-4" />
            </button>
          </div>

          {anonymousCount > 0 && (
            <div className="text-xs text-center text-muted">
              {anonymousCount} jugador{anonymousCount > 1 ? "es" : ""} añadido{anonymousCount > 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div className="text-center">
          <button onClick={onStartRound} className="btn btn-primary btn-lg w-full" disabled={totalPlayers < 2}>
            {totalPlayers < 2 ? `Selecciona jugadores (${totalPlayers}/2+)` : "¡Comenzar!"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-muted">Ronda {round}</div>
      </div>
    </div>
  );
}

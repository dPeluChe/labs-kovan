import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { Dices, Users, Trophy, CircleDot, Plus } from "lucide-react";
import type { Doc } from "../../convex/_generated/dataModel";

export function ActivitiesPage() {
    const { currentFamily } = useFamily();
    const [activeGame, setActiveGame] = useState<"none" | "roulette" | "high_card">("none");

    if (!currentFamily) return null;

    return (
        <div className="pb-4">
            <PageHeader
                title="Actividades"
                subtitle="Juegos y dinámicas familiares"
            />

            <div className="px-4">
                {activeGame === "none" ? (
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setActiveGame("roulette")}
                            className="card bg-base-100 shadow-sm border border-base-300 hover:border-primary transition-all text-left"
                        >
                            <div className="card-body p-4 flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Dices className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Ruleta de la Suerte</h3>
                                    <p className="text-xs text-base-content/60">Elige un ganador al azar entre los participantes.</p>
                                </div>
                            </div>
                        </button>
                        <button
                            className="card bg-base-100 shadow-sm border border-base-300 opacity-60 cursor-not-allowed text-left"
                        >
                            <div className="card-body p-4 flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-base-content/5 flex items-center justify-center">
                                    <CircleDot className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Carta Alta</h3>
                                    <p className="text-xs text-base-content/60">Próximamente</p>
                                </div>
                            </div>
                        </button>
                        <button
                            className="card bg-base-100 shadow-sm border border-base-300 opacity-60 cursor-not-allowed text-left"
                        >
                            <div className="card-body p-4 flex flex-col items-center text-center gap-3 opacity-50">
                                <div className="w-12 h-12 rounded-full bg-base-content/5 flex items-center justify-center">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Adivina Quién</h3>
                                    <p className="text-xs text-base-content/60">Próximamente</p>
                                </div>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div>
                        <button
                            onClick={() => setActiveGame("none")}
                            className="btn btn-ghost btn-sm mb-4"
                        >
                            ← Volver
                        </button>
                        {activeGame === "roulette" && <RouletteGame />}
                    </div>
                )}
            </div>
        </div>
    );
}

function RouletteGame() {
    const { currentFamily } = useFamily();
    const members = useQuery(api.families.getFamilyMembers, currentFamily ? { familyId: currentFamily._id } : "skip");

    const [options, setOptions] = useState<string[]>([]);
    const [newOption, setNewOption] = useState("");
    const [winner, setWinner] = useState<string | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);

    // Initialize options with family members when loaded
    useEffect(() => {
        if (members && options.length === 0) {
            // members is typed as (User & { ... })[] by Convex, so name should exist if the query return type is correct.
            // If TS still complains, we cast to known shape.
            // Based on families.ts, it returns objects that HAVE name.
            // If the query types are not generated yet, we might have issues.
            // We will cast to unknown then to our shape to be safe without 'any'.
            const validMembers = members as unknown as (Doc<"users"> & { role: string })[];
            setOptions(validMembers.map(m => m.name || "Miembro").filter(Boolean));
        }
    }, [members, options.length]); // Only run when members load or options change

    const addOption = () => {
        if (newOption.trim()) {
            setOptions([...options, newOption.trim()]);
            setNewOption("");
        }
    };

    const removeOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const spin = async () => {
        if (options.length < 2) return;
        setIsSpinning(true);
        setWinner(null);

        // Simulate standard spin duration
        const duration = 2000;
        const interval = 100;
        const steps = duration / interval;
        let currentStep = 0;

        const spinInterval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * options.length);
            setWinner(options[randomIndex]); // Flash random names
            currentStep++;
            if (currentStep >= steps) {
                clearInterval(spinInterval);
                setIsSpinning(false);
                // Final winner logic (random)
                const finalIndex = Math.floor(Math.random() * options.length);
                setWinner(options[finalIndex]);
            }
        }, interval);
    };

    return (
        <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
                <h2 className="card-title justify-center flex-col gap-0">
                    <Dices className="w-8 h-8 text-primary mb-2" />
                    Ruleta
                </h2>

                {/* Winner Display */}
                <div className={`mt-4 mb-6 p-6 rounded-2xl text-center transition-all ${winner ? "bg-primary/10 scale-105" : "bg-base-200"}`}>
                    {isSpinning ? (
                        <div className="animate-pulse text-2xl font-bold opacity-50">{winner || "Girando..."}</div>
                    ) : winner ? (
                        <div className="animate-bounce">
                            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                            <div className="text-sm uppercase tracking-wider opacity-60">El ganador es</div>
                            <div className="text-3xl font-black text-primary break-words leading-tight">{winner}</div>
                        </div>
                    ) : (
                        <div className="text-base-content/40">Presiona Girar para comenzar</div>
                    )}
                </div>

                {/* Controls */}
                <button
                    className="btn btn-primary btn-lg w-full mb-6"
                    onClick={spin}
                    disabled={options.length < 2 || isSpinning}
                >
                    {isSpinning ? "Girando..." : "GIRAR!"}
                </button>

                {/* Options Management */}
                <div className="collapse collapse-arrow bg-base-200/50">
                    <input type="checkbox" />
                    <div className="collapse-title font-medium flex justify-between">
                        Participantes ({options.length})
                    </div>
                    <div className="collapse-content">
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                className="input input-sm input-bordered flex-1"
                                placeholder="Agregar participante..."
                                value={newOption}
                                onChange={e => setNewOption(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addOption()}
                            />
                            <button className="btn btn-sm btn-square" onClick={addOption}>
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {options.map((opt, i) => (
                                <div key={i} className="badge badge-lg gap-2 pr-1">
                                    {opt}
                                    <button onClick={() => removeOption(i)} className="btn btn-ghost btn-xs btn-circle w-4 h-4 min-h-0">×</button>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => setOptions([])} className="btn btn-ghost btn-xs mt-4 text-error w-full">
                            Borrar todos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

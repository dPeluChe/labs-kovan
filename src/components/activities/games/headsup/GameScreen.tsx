import { CheckCircle, XCircle, Pause, Play } from "lucide-react";
import type { HeadsUpCard } from "../../types";
import { formatTime } from "../../utils/timer";

interface GameScreenProps {
  currentCard: HeadsUpCard | null;
  score: number;
  skipped: number;
  timeLeft: number;
  isPaused: boolean;
  totalTime: number;
  onCorrect: () => void;
  onSkip: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

export function GameScreen({
  currentCard,
  score,
  skipped,
  timeLeft,
  isPaused,
  totalTime,
  onCorrect,
  onSkip,
  onPause,
  onResume,
  onEnd,
}: GameScreenProps) {
  const timePercentage = (timeLeft / totalTime) * 100;
  const isLowTime = timeLeft <= 10 && timeLeft > 0;

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header con Timer y Score */}
      <div className="flex justify-between items-center mb-4 px-2">
        <button onClick={onEnd} className="btn btn-ghost btn-sm">
          Terminar
        </button>
        <div className="text-center">
          <div
            className={`text-2xl font-black font-mono ${
              isLowTime ? "text-error animate-pulse" : ""
            }`}
          >
            {formatTime(timeLeft)}
          </div>
          <div className="w-24 h-1 bg-base-300 rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full transition-all ${
                isLowTime ? "bg-error" : "bg-primary"
              }`}
              style={{ width: `${timePercentage}%` }}
            />
          </div>
        </div>
        <button onClick={isPaused ? onResume : onPause} className="btn btn-ghost btn-sm">
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
      </div>

      {/* Score Counter */}
      <div className="flex justify-center gap-8 mb-6 text-center">
        <div>
          <div className="text-3xl font-black text-success">{score}</div>
          <div className="text-xs text-base-content/60 uppercase">Aciertos</div>
        </div>
        <div>
          <div className="text-3xl font-black text-warning">{skipped}</div>
          <div className="text-xs text-base-content/60 uppercase">Pasadas</div>
        </div>
      </div>

      {/* Card Area */}
      <div className="flex-1 flex flex-col justify-center items-center px-4">
        {isPaused ? (
          <div className="text-center">
            <Pause className="w-16 h-16 text-base-content/40 mx-auto mb-4" />
            <p className="text-lg font-medium">Juego Pausado</p>
            <button onClick={onResume} className="btn btn-primary mt-4">
              Reanudar
            </button>
          </div>
        ) : currentCard ? (
          <div className="w-full">
            <div className="card bg-base-100 shadow-2xl border-4 border-primary">
              <div className="card-body p-8 md:p-12 flex items-center justify-center min-h-[200px]">
                <h2 className="card-title text-3xl md:text-4xl lg:text-5xl font-black text-center">
                  {currentCard.word}
                </h2>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-base-content/60">
              ¡Pon el celular en tu frente!
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg">¡No hay más cartas!</p>
          </div>
        )}
      </div>

      {/* Controls */}
      {!isPaused && currentCard && (
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={onSkip}
            className="btn btn-warning btn-lg h-20 text-xl font-bold gap-2"
          >
            <XCircle className="w-6 h-6" />
            PASAR
          </button>
          <button
            onClick={onCorrect}
            className="btn btn-success btn-lg h-20 text-xl font-bold gap-2"
          >
            <CheckCircle className="w-6 h-6" />
            ¡CORRECTO!
          </button>
        </div>
      )}
    </div>
  );
}

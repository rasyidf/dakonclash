import { useEffect, useState } from "react";
import type { GameEngine } from "~/lib/engine/v2/GameEngine";
import { cn } from "~/lib/utils";

interface GameCellProps {
  value: number;
  owner: number;
  onClick: () => void;
  isSetupMode?: boolean;
  currentPlayer: number;
  gameEngine: GameEngine
}

function getBeadPosition(index: number, total: number) {
  const positions = {
    1: [{ x: 50, y: 50 }],
    2: [
      { x: 35, y: 50 },
      { x: 65, y: 50 },
    ],
    3: [
      { x: 50, y: 35 },
      { x: 35, y: 65 },
      { x: 65, y: 65 },
    ],
    4: [
      { x: 35, y: 35 },
      { x: 65, y: 35 },
      { x: 35, y: 65 },
      { x: 65, y: 65 },
    ],
  };
  return positions[Math.min(total, 4) as keyof typeof positions]?.[index] || { x: 50, y: 50 };
}

export function GameCell({ value, owner, onClick, gameEngine, isSetupMode, currentPlayer }: GameCellProps) {
  const [mounted, setMounted] = useState(false);
  const [prevValue, setPrevValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (value !== prevValue) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setPrevValue(value);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);


  const ownerColor = gameEngine.getPlayerManager().getPlayerColor(owner);

  return (
    <div
      className={cn(
        "w-full h-full rounded-lg relative transition-all duration-200",
        value >= 4 && "animate-pulse",
        isAnimating && "scale-110",
        owner === 0 && "bg-white hover:bg-gray-100",
        owner === currentPlayer && `bg-${ownerColor}-200 hover:bg-${ownerColor}-300`,
        !isSetupMode && owner === 0 && "cursor-pointer",
        isSetupMode && "cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-blue-500"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Cell at value ${value}, owned by player ${owner}`}
    >
      {value > 0 && (
        <div className={cn(
          "cell-content w-full h-full",
          'transition-colors duration-150',
          `bg-${ownerColor}-500`
        )}>
          <div className="relative w-full h-full p-2">
            {Array.from({ length: Math.min(4, value) }).map((_, i) => {
              const pos = getBeadPosition(i, value);
              return (
                <div
                  key={i}
                  className={cn(
                    "absolute w-3 h-3 rounded-full bg-white transition-all duration-300",
                    isAnimating && "scale-110 opacity-75",
                    mounted && "transform scale-100",
                    !mounted && "transform scale-0"
                  )}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
      {isSetupMode && owner > 0 && (
        <span className="absolute top-0 right-0 text-xs bg-white text-gray-800 rounded-full w-4 h-4 flex items-center justify-center">
          {owner}
        </span>
      )}
    </div>
  );
}
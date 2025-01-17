import { cn } from "~/lib/utils";
import type { Cell } from "~/hooks/useGame";
import type { Player } from "~/store/gameStore";
import { motion } from "framer-motion";

interface GameCellProps {
    cell: Cell;
    players: Record<Player["id"], Player>;
    currentPlayer: Player;
    onClick: () => void;
}

export function GameCell({ cell, currentPlayer, players, onClick }: GameCellProps) {

    const cellColor = cell.playerId ? players[cell.playerId].color : null;

    const handleClick = () => {
        onClick();
        if (cell.beads === 4) {
            // Trigger bead animations
            // e.g., set a state to start animations
        }
    };

    const beadVariants = {
        bead1: { x: -20, y: -20, opacity: 0, transition: { duration: 0.5 } },
        bead2: { x: 20, y: -20, opacity: 0, transition: { duration: 0.5 } },
        bead3: { x: -20, y: 20, opacity: 0, transition: { duration: 0.5 } },
        bead4: { x: 20, y: 20, opacity: 0, transition: { duration: 0.5 } },
    };

    return (
        <motion.button
            onClick={handleClick}
            className={cn(
                `w-full h-full`,
                "rounded-md relative transition-all duration-300 ease-in-out transform hover:scale-105",
                "bg-white hover:bg-gray-50",
                currentPlayer.color === "red" && cellColor === "red" && cell.beads > 0 && "bg-red-100 hover:bg-red-200",
                currentPlayer.color === "blue" && cellColor === "blue" && cell.beads > 0 && "bg-blue-100 hover:bg-blue-200",
                cell.beads === 4 && "animate-pulse"
            )}
            disabled={cell.beads === 4}
        >
            {cell.beads > 0 && (
                <div className={cn("absolute m-2 inset-0 flex items-center justify-center rounded-full",
                    cellColor === "red" && "bg-red-500",
                    cellColor === "blue" && "bg-blue-500",
                )}>
                    <div
                        className={cn(
                            "grid gap-0.5",
                            cell.beads === 1 && "grid-cols-1",
                            cell.beads === 2 && "grid-cols-2",
                            cell.beads > 2 && "grid-cols-2 grid-rows-2",
                            "animate-in fade-in duration-300"
                        )}
                    >
                        {[...Array(cell.beads)].map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "rounded-full bg-white/90 shadow-sm",
                                    cell.beads === 1 ? "w-5 h-5" : "w-3 h-3",
                                    (i === 0 && cell.beads == 3) && "col-span-2 m-auto",
                                    "animate-in zoom-in duration-300"
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}
            {cell.beads === 4 && (
                <div className="hidden-beads rounded-full">
                    <motion.div
                        className="bead bead-1"
                        variants={beadVariants}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate="bead1"
                    />
                    <motion.div
                        className="bead bead-2"
                        variants={beadVariants}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate="bead2"
                    />
                    <motion.div
                        className="bead bead-3"
                        variants={beadVariants}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate="bead3"
                    />
                    <motion.div
                        className="bead bead-4"
                        variants={beadVariants}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate="bead4"
                    />
                </div>
            )}
        </motion.button>
    );
}

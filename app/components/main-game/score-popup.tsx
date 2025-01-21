import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";
import type { ScoreAnimation } from "~/store/types";

export function ScorePopup({ animation }: { animation: ScoreAnimation }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: -20 }}
        exit={{ opacity: 0 }}
        className={cn(
          "absolute z-10 font-bold text-lg",
          animation.playerId === 1 ? "text-black" : "text-black",
        )}
      >
        +{animation.score}
      </motion.div>
    </AnimatePresence>
  );
}

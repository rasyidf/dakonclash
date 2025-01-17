interface ScoreBoardProps {
  score: { red: number; blue: number };
}

export function ScoreBoard({ score }: ScoreBoardProps) {
  return (
    <div className="text-lg font-bold bg-slate-100 rounded-lg p-2">
      Score: Red {score.red} - Blue {score.blue}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { BoardHistory } from "~/lib/engine/v2/board/BoardHistory";
import { GameBoard } from "../board/game-board";
import { GameSidebar, type GameSettings } from "./game-sidebar";
import { Board } from "~/lib/engine/v2/board/Board";
import type { Position } from "~/lib/engine/v2/types";

export function GameContainer() {
  const [gameEngine, setGameEngine] = useState(() => new GameEngine({ boardSize: 7, maxPlayers: 2, maxValue: 4 }));
  const [history] = useState(() => new BoardHistory(50));
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [board, setBoard] = useState(() => new Board(7));

  const syncBoardWithEngine = useCallback(() => {
    const engineBoard = gameEngine.getBoard();
    const size = engineBoard.getSize();
    const newBoard = new Board(size);
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const pos: Position = { row: r, col: c };
        newBoard.updateCell(pos, engineBoard.getCellValue(pos), engineBoard.getCellOwner(pos));
      }
    }
    setBoard(newBoard);
  }, [gameEngine]);

  useEffect(() => {
    // Initial sync board state with game engine
    syncBoardWithEngine();
  }, [gameEngine, syncBoardWithEngine]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (isSetupMode) {
      // Save current board state to history before modification
      history.pushState(board);

      // Update through game engine
      gameEngine.makeMove({ row, col }, currentPlayer);
      syncBoardWithEngine();
      return;
    }

    const success = gameEngine.makeMove({ row, col }, currentPlayer);
    if (success) {
      // Save current board state to history
      history.pushState(board);
      syncBoardWithEngine();

      setMoveHistory(prev => [...prev, `Player ${currentPlayer} moved to (${row}, ${col})`]);
      setCurrentPlayer(gameEngine.getCurrentPlayer());
    }
  }, [gameEngine, currentPlayer, isSetupMode, history, board, syncBoardWithEngine]);

  const handleUndo = useCallback(() => {
    const previousBoard = history.undo();
    if (previousBoard) {
      setBoard(previousBoard);
      gameEngine.setBoard(previousBoard);  // Sync engine with board state
      setCurrentPlayer(prev => prev === 1 ? 2 : 1);
      setMoveHistory(prev => [...prev, "Move undone"]);
    }
  }, [history, gameEngine]);

  const handleRedo = useCallback(() => {
    const nextBoard = history.redo();
    if (nextBoard) {
      setBoard(nextBoard);
      gameEngine.setBoard(nextBoard);  // Sync engine with board state
      setCurrentPlayer(prev => prev === 1 ? 2 : 1);
      setMoveHistory(prev => [...prev, "Move redone"]);
    }
  }, [history, gameEngine]);

  const handleNewGame = useCallback((settings: GameSettings) => {
    const newEngine = new GameEngine(settings);
    setGameEngine(newEngine);
    setBoard(new Board(settings.boardSize));
    setCurrentPlayer(1);
    setMoveHistory([]);
    history.clear();
    setIsSetupMode(false);
  }, [history]);

  const handleReset = useCallback(() => {
    gameEngine.reset();
    setBoard(new Board(gameEngine.getBoard().getSize()));
    setCurrentPlayer(1);
    setMoveHistory([]);
    history.clear();
    setIsSetupMode(false);
  }, [gameEngine, history]);

  const toggleSetupMode = useCallback(() => {
    setIsSetupMode(prev => !prev);
  }, []);

  const handleSwitchPlayer = useCallback(() => {
    if (isSetupMode) {
      const players = gameEngine.getPlayerManager().getPlayers();
      const currentIndex = players.indexOf(currentPlayer);
      const nextIndex = (currentIndex + 1) % players.length;
      setCurrentPlayer(players[nextIndex]);
    }
  }, [isSetupMode, currentPlayer, gameEngine]);

  return (
    <div className="flex gap-4 p-4">
      <GameBoard
        board={board}
        gameEngine={gameEngine}
        currentPlayer={currentPlayer}
        onCellClick={handleCellClick}
        isSetupMode={isSetupMode}
      />
      <GameSidebar
        gameEngine={gameEngine}
        history={moveHistory}
        onReset={handleReset}
        currentPlayer={currentPlayer}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.canUndo()}
        canRedo={history.canRedo()}
        onNewGame={handleNewGame}
        onToggleSetupMode={toggleSetupMode}
        onSwitchPlayer={handleSwitchPlayer}
        isSetupMode={isSetupMode}
      />
    </div>
  );
}
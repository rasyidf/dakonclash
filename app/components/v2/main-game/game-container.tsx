import { useCallback, useEffect, useState } from "react";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { Board } from "~/lib/engine/v2/board/Board";
import { BoardHistory } from "~/lib/engine/v2/board/BoardHistory";
import { CellType, type Position, type SetupModeOperation } from "~/lib/engine/v2/types";
import { GameBoard } from "../board/game-board";
import { GameSidebar, type GameSettings } from "./game-sidebar";

export function GameContainer() {
  const [gameEngine, setGameEngine] = useState(() => new GameEngine({ boardSize: 7, maxPlayers: 2, maxValue: 4 }));
  const [history] = useState(() => new BoardHistory(50));
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [selectedCellType, setSelectedCellType] = useState<CellType>(CellType.Normal);
  const [selectedValue, setSelectedValue] = useState(1);
  const [board, setBoard] = useState(() => new Board(7));

  const syncBoardWithEngine = useCallback(() => {
    const engineBoard = gameEngine.getBoard();
    const size = engineBoard.getSize();
    const newBoard = new Board(size);
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const pos: Position = { row: r, col: c };
        const cell = engineBoard.getCell(pos);
        newBoard.updateCell(pos, 
          engineBoard.getCellValue(pos), 
          engineBoard.getCellOwner(pos),
          cell?.type || CellType.Normal
        );
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
      const position = { row, col };
      const setupOp: SetupModeOperation = {
        position,
        value: selectedValue,
        owner: currentPlayer,
        cellType: selectedCellType
      };

      if (board.getCellValue(position) === 0) {
        // Apply new setup operation
        gameEngine.applySetupOperation(setupOp);
      } else {
        // Clear existing setup operation
        gameEngine.clearSetupOperation(position);
      }
      syncBoardWithEngine();
      return;
    }

    // Regular game move handling
    if (gameEngine.makeMove({ row, col }, currentPlayer)) {
      setMoveHistory(prev => [...prev, `Player ${currentPlayer} moved to (${row}, ${col})`]);
      syncBoardWithEngine();
      setCurrentPlayer(gameEngine.getCurrentPlayer());
    }
  }, [gameEngine, currentPlayer, isSetupMode, history, board, syncBoardWithEngine, selectedCellType, selectedValue]);

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
  }, [history]);

  const handleReset = useCallback(() => {
    gameEngine.reset(); // This will preserve setup operations
    history.clear();
    syncBoardWithEngine();
    setCurrentPlayer(1);
    setMoveHistory([]);
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
      {/* Game board section */}
      <div className="flex-1">
        <GameBoard
          board={board}
          onCellClick={handleCellClick}
          currentPlayer={currentPlayer}
          isSetupMode={isSetupMode}
          gameEngine={gameEngine}
        />
      </div>

      {/* Sidebar section */}
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
        onToggleSetupMode={() => setIsSetupMode(!isSetupMode)}
        isSetupMode={isSetupMode}
        onSwitchPlayer={handleSwitchPlayer}
        selectedCellType={selectedCellType}
        onSelectCellType={setSelectedCellType}
        selectedValue={selectedValue}
        onSelectValue={setSelectedValue}
      />
    </div>
  );
}
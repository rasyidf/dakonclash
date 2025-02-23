import { useCallback, useEffect, useState } from "react";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { Board } from "~/lib/engine/v2/board/Board";
import { BoardHistory } from "~/lib/engine/v2/board/BoardHistory";
import { CellType, type GameStateUpdate, type Position, type SetupModeOperation } from "~/lib/engine/v2/types";
import { GameBoard } from "../board/game-board";
import { GameBoardV2 } from "../board/game-board-v2";
import { GameSidebar, type GameSettings } from "./game-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useUiStore } from "~/store/useUiStore";
import { toast } from "sonner";

export function GameContainer() {
  const [gameEngine, setGameEngine] = useState(() => new GameEngine({ 
    boardSize: 7, 
    maxPlayers: 2, 
    maxValue: 4, 
    animationDelays: {
      cellUpdate: 200,
      explosion: 300,
      chainReaction: 200
    }
  }));
  const [history] = useState(() => new BoardHistory(50));
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [selectedCellType, setSelectedCellType] = useState<CellType>(CellType.Normal);
  const [selectedValue, setSelectedValue] = useState(1);
  const [board, setBoard] = useState(() => new Board(7));
  const [version, setVersion] = useState<'v1' | 'v2'>('v2');

  const { setProcessing, handleGameUpdate } = useUiStore();

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

  // Subscribe to game engine events
  useEffect(() => {
    const observer = {
      onGameStateUpdate: (update: GameStateUpdate) => {
        handleGameUpdate(update);
        
        // Show appropriate toast notifications
        switch (update.type) {
          case 'explosion':
            toast.info("Chain reaction!", {
              position: "bottom-right",
              duration: 1000
            });
            break;
          case 'win':
            toast.success(`Player ${update.playerId} wins! ${update.reason}`, {
              position: "top-center",
              duration: 5000
            });
            break;
          case 'player-eliminated':
            toast.error(`Player ${update.playerId} has been eliminated!`, {
              position: "top-center",
              duration: 3000
            });
            break;
        }
      }
    };
    
    gameEngine.addObserver(observer);
    return () => gameEngine.removeObserver(observer);
  }, [gameEngine, handleGameUpdate]);

  const handleCellClick = useCallback(async (row: number, col: number) => {
    setProcessing(true);
    try {
      if (isSetupMode) {
        const position = { row, col };
        const setupOp: SetupModeOperation = {
          position,
          value: selectedValue,
          owner: currentPlayer,
          cellType: selectedCellType
        };

        if (board.getCellValue(position) === 0) {
          gameEngine.applySetupOperation(setupOp);
          toast.success("Setup operation applied");
        } else {
          gameEngine.clearSetupOperation(position);
          toast.info("Setup operation cleared");
        }
        syncBoardWithEngine();
        return;
      }

      // Regular game move handling
      const success = await gameEngine.makeMove({ row, col }, currentPlayer);
      if (success) {
        setMoveHistory(prev => [...prev, `Player ${currentPlayer} moved to (${row}, ${col})`]);
        syncBoardWithEngine();
        setCurrentPlayer(gameEngine.getCurrentPlayer());
      } else {
        toast.error("Invalid move!");
      }
    } finally {
      setProcessing(false);
    }
  }, [gameEngine, currentPlayer, isSetupMode, board, syncBoardWithEngine, selectedCellType, selectedValue, setProcessing]);

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
      <div className="flex-1">
        <Tabs value={version} onValueChange={(v) => setVersion(v as 'v1' | 'v2')}>
          <TabsList>
            <TabsTrigger value="v1">Classic Mode</TabsTrigger>
            <TabsTrigger value="v2">Enhanced Mode</TabsTrigger>
          </TabsList>
          <TabsContent value="v1">
            <GameBoard
              board={board}
              onCellClick={handleCellClick}
              currentPlayer={currentPlayer}
              isSetupMode={isSetupMode}
              gameEngine={gameEngine}
            />
          </TabsContent>
          <TabsContent value="v2">
            <GameBoardV2
              board={board}
              onCellClick={handleCellClick}
              currentPlayer={currentPlayer}
              isSetupMode={isSetupMode}
              gameEngine={gameEngine}
            />
          </TabsContent>
        </Tabs>
      </div>

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
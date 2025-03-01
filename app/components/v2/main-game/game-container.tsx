import { useCallback, useEffect, useState } from "react";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { Board } from "~/lib/engine/v2/board/Board";
import { CellType, type GameStateUpdate, type Position, type SetupModeOperation } from "~/lib/engine/v2/types";
import { GameBoard } from "../board/game-board";
import { GameBoardV2 } from "../board/game-board-v2";
import { GameSidebar, type GameSettings } from "./game-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useUiStore } from "~/store/useUiStore";
import { toast } from "sonner";
import { autoSaveGame, deserializeBoard, loadAutoSave, loadGame, saveGame } from "~/lib/storage";

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
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [selectedCellType, setSelectedCellType] = useState<CellType>(CellType.Normal);
  const [selectedValue, setSelectedValue] = useState(1);
  const [board, setBoard] = useState(() => gameEngine.getBoard());
  const [version, setVersion] = useState<'v1' | 'v2'>('v2');
  const [hasAutoSave, setHasAutoSave] = useState(false);

  const { setProcessing, handleGameUpdate } = useUiStore();

  const syncBoardWithEngine = useCallback(() => {
    setBoard(gameEngine.getBoard());
  }, [gameEngine]);

  useEffect(() => {
    syncBoardWithEngine();
  }, [gameEngine, syncBoardWithEngine]);

  // Check for autosave on mount
  useEffect(() => {
    const autoSave = loadAutoSave();
    setHasAutoSave(!!autoSave);
  }, []);

  useEffect(() => {
    const observer = {
      onGameStateUpdate: (update: GameStateUpdate) => {
        handleGameUpdate(update);
        
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

        if (['move', 'explosion', 'player-eliminated'].includes(update.type)) {
          autoSaveGame(gameEngine, currentPlayer);
          setHasAutoSave(true);
        }

        syncBoardWithEngine();
      }
    };
    
    gameEngine.addObserver(observer);
    return () => gameEngine.removeObserver(observer);
  }, [gameEngine, handleGameUpdate, currentPlayer, syncBoardWithEngine]);

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
    if (!gameEngine.canUndo()) return;
    
    const previousBoard = gameEngine.undo();
    if (previousBoard) {
      setBoard(previousBoard);
      setCurrentPlayer(prev => prev === 1 ? gameEngine.getPlayerManager().getPlayers().length : prev - 1);
      setMoveHistory(prev => [...prev, "Move undone"]);
      autoSaveGame(gameEngine, currentPlayer);
    }
  }, [gameEngine, currentPlayer]);

  const handleRedo = useCallback(() => {
    if (!gameEngine.canRedo()) return;
    
    const nextBoard = gameEngine.redo();
    if (nextBoard) {
      setBoard(nextBoard);
      setCurrentPlayer(prev => prev === gameEngine.getPlayerManager().getPlayers().length ? 1 : prev + 1);
      setMoveHistory(prev => [...prev, "Move redone"]);
      autoSaveGame(gameEngine, currentPlayer);
    }
  }, [gameEngine, currentPlayer]);

  const handleNewGame = useCallback((settings: GameSettings) => {
    const newEngine = new GameEngine(settings);
    setGameEngine(newEngine);
    setBoard(newEngine.getBoard());
    setCurrentPlayer(1);
    setMoveHistory([]);
    autoSaveGame(newEngine, 1);
  }, []);

  const handleReset = useCallback(() => {
    gameEngine.reset();
    syncBoardWithEngine();
    setCurrentPlayer(1);
    setMoveHistory([]);
    autoSaveGame(gameEngine, 1);
  }, [gameEngine, syncBoardWithEngine]);

  const handleSaveGame = useCallback((name?: string) => {
    const saveId = saveGame(gameEngine, currentPlayer, name ? `custom_${Date.now()}` : undefined);
    toast.success("Game saved successfully!");
    return saveId;
  }, [gameEngine, currentPlayer]);

  const handleLoadGame = useCallback((saveId: string) => {
    const savedState = loadGame(saveId);
    if (!savedState) {
      toast.error("Failed to load game");
      return;
    }

    const newEngine = new GameEngine(savedState.settings);
    const board = deserializeBoard(savedState.boardState);
    newEngine.setBoard(board);

    // Restore history if available
    if (savedState.history && savedState.historyIndex !== undefined) {
      const historyBoards = savedState.history.map(state => deserializeBoard(state));
      newEngine.restoreHistory(historyBoards, savedState.historyIndex);
    }

    setGameEngine(newEngine);
    setBoard(board);
    setCurrentPlayer(savedState.currentPlayer);
    setMoveHistory([]);
    toast.success("Game loaded successfully!");
  }, []);

  const handleLoadAutoSave = useCallback(() => {
    const autoSave = loadAutoSave();
    if (autoSave) {
      handleLoadGame(`${autoSave.timestamp}`);
    }
  }, [handleLoadGame]);

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
        canUndo={gameEngine.canUndo()}
        canRedo={gameEngine.canRedo()}
        onNewGame={handleNewGame}
        onToggleSetupMode={toggleSetupMode}
        isSetupMode={isSetupMode}
        onSwitchPlayer={handleSwitchPlayer}
        selectedCellType={selectedCellType}
        onSelectCellType={setSelectedCellType}
        selectedValue={selectedValue}
        onSelectValue={setSelectedValue}
        onSaveGame={handleSaveGame}
        onLoadGame={handleLoadGame}
        onLoadAutoSave={handleLoadAutoSave}
        hasAutoSave={hasAutoSave}
      />
    </div>
  );
}
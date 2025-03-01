import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { CellType, type GameConfig, type GameStateUpdate } from "~/lib/engine/v2/types";
import { autoSaveGame } from "~/lib/storage";
import { useUiStore } from "~/store/useUiStore";
import { GameBoard } from "../board/v1/game-board";
import { GameBoardV2 } from "../board/v2/game-board-v2";
import { GameSidebar, type GameSettings } from "./game-sidebar";
import { GameBoardV3 } from "../board/v3/game-board-v3";

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
  const [version, setVersion] = useState<'v1' | 'v2' | 'v3'>('v3');

  const { setProcessing, handleGameUpdate } = useUiStore();

  const syncBoardWithEngine = useCallback(() => {
    setBoard(gameEngine.getBoard());
  }, [gameEngine]);

  useEffect(() => {
    syncBoardWithEngine();
  }, [gameEngine, syncBoardWithEngine]);

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
        const setupOp = {
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
    const newEngine = new GameEngine(settings as Partial<GameConfig>);
    setGameEngine(newEngine);
    setBoard(newEngine.getBoard());
    setCurrentPlayer(1);
    setMoveHistory([]);
  }, []);

  const handleReset = useCallback(() => {
    gameEngine.reset();
    syncBoardWithEngine();
    setCurrentPlayer(1);
    setMoveHistory([]);
  }, [gameEngine, syncBoardWithEngine]);

  const handleSwitchPlayer = useCallback(() => {
    if (isSetupMode) {
      const players = gameEngine.getPlayerManager().getPlayers();
      const currentIndex = players.indexOf(currentPlayer);
      const nextIndex = (currentIndex + 1) % players.length;
      setCurrentPlayer(players[nextIndex]);
    }
  }, [isSetupMode, currentPlayer, gameEngine]);

  const handleBoardStateChange = useCallback((newEngine: GameEngine, newCurrentPlayer: number) => {
    setGameEngine(newEngine);
    setCurrentPlayer(newCurrentPlayer);
    setMoveHistory([]);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
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
        onToggleSetupMode={() => setIsSetupMode(!isSetupMode)}
        isSetupMode={isSetupMode}
        onSwitchPlayer={handleSwitchPlayer}
        selectedCellType={selectedCellType}
        onSelectCellType={setSelectedCellType}
        selectedValue={selectedValue}
        onSelectValue={setSelectedValue}
        onBoardStateChange={handleBoardStateChange}
      />
      <main className="flex-grow h-full flex flex-col">
        <Tabs 
          value={version} 
          onValueChange={(v) => setVersion(v as 'v1' | 'v2' | 'v3')}
          className="w-full h-full flex flex-col"
        >
          <div className="p-2 pb-0">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="v1">Classic Mode</TabsTrigger>
              <TabsTrigger value="v2">Enhanced Mode</TabsTrigger>
              <TabsTrigger value="v3">SVG Mode</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-grow w-full h-full">
            <TabsContent value="v1" key="board-v1" className="h-full">
              <GameBoard
                board={board}
                onCellClick={handleCellClick}
                currentPlayer={currentPlayer}
                isSetupMode={isSetupMode}
                gameEngine={gameEngine}
              />
            </TabsContent>
            <TabsContent value="v2" key="board-v2" className="h-full">
              <GameBoardV2
                board={board}
                onCellClick={handleCellClick}
                currentPlayer={currentPlayer}
                isSetupMode={isSetupMode}
                gameEngine={gameEngine}
              />
            </TabsContent>
            <TabsContent value="v3" key="board-v3" className="h-full" forceMount>
              <GameBoardV3
                board={board}
                onCellClick={handleCellClick}
                currentPlayer={currentPlayer}
                isSetupMode={isSetupMode}
                gameEngine={gameEngine}
              />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
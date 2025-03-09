import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent } from "~/components/ui/tabs";
import { GameController } from "~/lib/engine/v2/controller/GameController";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { GameBoard } from "../board/v1/game-board";
import { GameBoardV2 } from "../board/v2/game-board-v2";
import { GameBoardV3 } from "../board/v3/game-board-v3";
import { GameSidebar, type GameSettings } from './sidebar/game-sidebar';
import { GameStartDialog } from "./sections/game-start-dialog";
import type { GameConfig } from "~/lib/engine/v2/types";

export interface GameContainerProps {
  initialBoardSize?: number;
  initialMaxPlayers?: number;
  initialMaxValue?: number;
}

export function GameContainer({
  initialBoardSize = 7,
  initialMaxPlayers = 2,
  initialMaxValue = 4
}: GameContainerProps) {
  const [gameEngine, setGameEngine] = useState(() => new GameEngine({
    boardSize: initialBoardSize,
    maxPlayers: initialMaxPlayers,
    maxValue: initialMaxValue,
    animationDelays: {
      cellUpdate: 200,
      explosion: 300,
      chainReaction: 200
    }
  }));

  const [gameController, setGameController] = useState<GameController | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const [board, setBoard] = useState(() => gameEngine.getBoard());
  const [version, setVersion] = useState<'v1' | 'v2' | 'v3'>('v3');
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize the GameController after the GameEngine is created
  useEffect(() => {
    const controller = new GameController(gameEngine);

    // Register for game state updates
    controller.addObserver({
      onGameStateUpdate: (update) => {
        if (update.type === 'player-change' && 'playerId' in update) {
          setCurrentPlayer(update.playerId);
        }

        // Update the board reference when changed
        setBoard(gameEngine.getBoard());
      }
    });

    setGameController(controller);
    handleReset();
    setVersion('v3');
    // Clean up controller when component unmounts
    return () => {
      controller.dispose();
    };
  }, [gameEngine]);

  // Handle cell click during gameplay
  const handleCellClick = useCallback(async (row: number, col: number) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {

      // Handle regular move
      let success: boolean;

      // Use GameController if available, otherwise use GameEngine directly
      if (gameController) {
        success = await gameController.makeMove({ row, col });
      } else {
        success = await gameEngine.makeMove({ row, col }, currentPlayer);
      }

      if (success) {
        setMoveHistory(prev => [
          ...prev,
          `Player ${currentPlayer} moved at (${row}, ${col})`
        ]);
      }

      setBoard(gameEngine.getBoard());
    } catch (error) {
      console.error('Error handling cell click:', error);
      toast.error("Failed to process move");
    } finally {
      setIsProcessing(false);
    }
  }, [
    gameEngine,
    currentPlayer,
    isProcessing,
    gameController
  ]);

  const handleUndo = useCallback(() => {
    const undoResult = gameEngine.undo();
    if (undoResult) {
      // Reverse the player turn if not in setup mode

      setCurrentPlayer(prev => {
        const playerManager = gameEngine.getPlayerManager();
        const players = playerManager.getPlayers();
        const currentIndex = players.indexOf(prev);
        // Go backwards in player order
        const prevIndex = (currentIndex - 1 + players.length) % players.length;
        return players[prevIndex];
      });
      setBoard(gameEngine.getBoard());
      setMoveHistory(prev => [...prev, 'Undo move']);
    }
  }, [gameEngine]);

  const handleRedo = useCallback(() => {
    const redoResult = gameEngine.redo();
    if (redoResult) {
      // Advance player turn if not in setup mode

      setCurrentPlayer(prev => {
        const playerManager = gameEngine.getPlayerManager();
        const players = playerManager.getPlayers();
        const currentIndex = players.indexOf(prev);
        const nextIndex = (currentIndex + 1) % players.length;
        return players[nextIndex];
      });

      setBoard(gameEngine.getBoard());
      setMoveHistory(prev => [...prev, 'Redo move']);
    }
  }, [gameEngine]);

  const handleReset = useCallback(() => {
    gameEngine.reset();
    setCurrentPlayer(1);
    setMoveHistory([]);
    setBoard(gameEngine.getBoard());
    setIsProcessing(false);
  }, [gameEngine]);

  const handleNewGame = useCallback((settings: Partial<GameConfig>) => {
    const newEngine = new GameEngine(settings);
    handleBoardStateChange(newEngine, 1);
  }, []);


  const handleBoardStateChange = useCallback((newEngine: GameEngine, newCurrentPlayer: number) => {
    setGameEngine(newEngine);
    setBoard(newEngine.getBoard());
    setCurrentPlayer(newCurrentPlayer);
    setMoveHistory([]);

    // Initialize a new game controller for the new engine
    if (gameController) {
      gameController.dispose();
    }
    const newController = new GameController(newEngine);
    setGameController(newController);
  }, [gameController]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      <GameSidebar
        gameEngine={gameEngine}
        gameController={gameController || undefined}
        history={moveHistory}
        onReset={handleReset}
        currentPlayer={currentPlayer}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={gameEngine.canUndo()}
        canRedo={gameEngine.canRedo()}
        onNewGame={() => {
          setIsStartDialogOpen(true);
        }}
      />
      <main className="flex-grow h-full flex flex-col">
        <Tabs
          value={version}
          // onValueChange={(v) => setVersion(v as 'v1' | 'v2' | 'v3')}
          className="w-full h-full flex flex-col"
        >

          <div className="flex-grow w-full h-full">
            <TabsContent value="v1" key="board-v1" className="h-full">
              <GameBoard
                board={board}
                onCellClick={handleCellClick}
                currentPlayer={currentPlayer}
                gameEngine={gameEngine}
              />
            </TabsContent>
            <TabsContent value="v2" key="board-v2" className="h-full">
              <GameBoardV2
                board={board}
                onCellClick={handleCellClick}
                currentPlayer={currentPlayer}
                gameEngine={gameEngine}
              />
            </TabsContent>
            <TabsContent value="v3" key="board-v3" className="h-full" forceMount>
              <GameBoardV3
                board={board}
                onCellClick={handleCellClick}
                currentPlayer={currentPlayer}
                gameEngine={gameEngine}
              />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <GameStartDialog
        isOpen={isStartDialogOpen}
        onClose={() => setIsStartDialogOpen(false)}
        onStartGame={handleNewGame}
      />
    </div>
  );
}
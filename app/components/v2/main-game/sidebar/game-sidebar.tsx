import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarGroup } from "~/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { deleteSave, deserializeBoard, loadAutoSave, loadGame, saveGame } from "~/lib/storage";
import { Button } from "~/components/ui/button";
import { Users2, Info } from "lucide-react";
import { PlayerManagementDialog } from "../sections/player-management-dialog";
import { StatisticsTab } from "../sections/statistics-tab";
import { StrategyTab } from "../sections/strategy-tab";
import { SavesTab } from "./saves-tab";
import { ControlsTab } from "./controls-tab";
import type { GameSidebarProps } from "./types";
import { AppIcon } from "~/components/v1/app-icon";

export type { GameSettings } from "./types";
export type { GameSidebarProps } from "./types";

export function GameSidebar({
    gameEngine,
    history,
    onReset,
    currentPlayer,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    onNewGame,
    onBoardStateChange,
}: GameSidebarProps) {
    const [hasAutoSave, setHasAutoSave] = useState(false);
    const [activeTab, setActiveTab] = useState("game");
    const [isPlayerManagementOpen, setIsPlayerManagementOpen] = useState(false);

    useEffect(() => {
        const autoSave = loadAutoSave();
        setHasAutoSave(!!autoSave);
    }, []);

    const handleSaveGame = useCallback((name?: string) => {
        const saveId = saveGame(gameEngine, currentPlayer, name ? name : undefined);
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

        if (savedState.history && savedState.historyIndex !== undefined) {
            const historyBoards = savedState.history.map(state => deserializeBoard(state));
            newEngine.restoreHistory(historyBoards, savedState.historyIndex);
        }

        onBoardStateChange?.(newEngine, savedState.currentPlayer);
        toast.success("Game loaded successfully!");
        setActiveTab("game");
    }, [onBoardStateChange]);

    const handleLoadAutoSave = useCallback(() => {
        const autoSave = loadAutoSave();
        if (autoSave) {
            handleLoadGame(`${autoSave.timestamp}`);
        }
    }, [handleLoadGame]);

    const handleDeleteSave = (saveId: string) => {
        deleteSave(saveId);
        toast.success("Save deleted successfully");
    };

    return (
        <Sidebar variant="floating" collapsible="offcanvas">
            <SidebarHeader className="border-b pb-2">
                <div className="flex items-center justify-between">
                    <AppIcon />
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setIsPlayerManagementOpen(true)}
                        >
                            <Users2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Info className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full grid grid-cols-4 sticky top-0 bg-background z-10">
                        <TabsTrigger value="game" className="text-xs sm:text-sm">Game</TabsTrigger>
                        <TabsTrigger value="strategy" className="text-xs sm:text-sm">Strategy</TabsTrigger>
                        <TabsTrigger value="stats" className="text-xs sm:text-sm">Stats</TabsTrigger>
                        <TabsTrigger value="saves" className="text-xs sm:text-sm">Saves</TabsTrigger>
                    </TabsList>

                    <div className="mt-4 space-y-4">
                        <TabsContent value="game">
                            <SidebarGroup>
                                <ControlsTab
                                    onUndo={onUndo || (() => { })}
                                    onRedo={onRedo || (() => { })}
                                    onReset={onReset}
                                    onSaveGame={(name) => {
                                        handleSaveGame(name);
                                        setActiveTab("saves");
                                    }}
                                    canUndo={canUndo}
                                    canRedo={canRedo}
                                    history={history}
                                />
                            </SidebarGroup>
                        </TabsContent>

                        <TabsContent value="strategy">
                            <SidebarGroup>
                                <StrategyTab
                                    gameEngine={gameEngine}
                                    currentPlayer={currentPlayer}
                                />
                            </SidebarGroup>
                        </TabsContent>

                        <TabsContent value="stats">
                            <SidebarGroup>
                                <StatisticsTab
                                    gameEngine={gameEngine}
                                    history={history}
                                    currentPlayer={currentPlayer}
                                />
                            </SidebarGroup>
                        </TabsContent>

                        <TabsContent value="saves">
                            <SidebarGroup>
                                <SavesTab
                                    onLoadGame={handleLoadGame}
                                    onLoadAutoSave={handleLoadAutoSave}
                                    onDeleteSave={handleDeleteSave}
                                    hasAutoSave={hasAutoSave}
                                />
                            </SidebarGroup>
                        </TabsContent>
                    </div>
                </Tabs>
            </SidebarContent>
            <SidebarFooter className="border-t mt-auto">
                <div className="p-4 text-xs text-muted-foreground text-center">
                    Made with ❤️ by Rasyid
                </div>
            </SidebarFooter>

            <PlayerManagementDialog 
                isOpen={isPlayerManagementOpen}
                onClose={() => setIsPlayerManagementOpen(false)}
            />
        </Sidebar>
    );
}
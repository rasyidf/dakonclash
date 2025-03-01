import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarGroup } from "~/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { CellType } from "~/lib/engine/v2/types";
import { deleteSave, deserializeBoard, loadAutoSave, loadGame, saveGame } from "~/lib/storage";
import { ControlsTab } from "./controls-tab";
import { SavesTab } from "./saves-tab";
import { SettingsTab } from "./settings-tab";
import type { GameSidebarProps } from "./types";
import { AppIcon } from "~/components/v1/app-icon";
import { Button } from "~/components/ui/button";
import { Info } from "lucide-react";

export { type GameSettings } from "./types";
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
    onToggleSetupMode,
    isSetupMode = false,
    onSwitchPlayer,
    selectedCellType = CellType.Normal,
    onSelectCellType,
    selectedValue = 1,
    onSelectValue,
    onBoardStateChange,
}: GameSidebarProps) {
    const [hasAutoSave, setHasAutoSave] = useState(false);
    const [activeTab, setActiveTab] = useState("settings");

    // Check for autosave on mount
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

        // Restore history if available
        if (savedState.history && savedState.historyIndex !== undefined) {
            const historyBoards = savedState.history.map(state => deserializeBoard(state));
            newEngine.restoreHistory(historyBoards, savedState.historyIndex);
        }

        onBoardStateChange?.(newEngine, savedState.currentPlayer);
        toast.success("Game loaded successfully!");
        
        // Switch to controls tab after loading
        setActiveTab("controls");
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
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Info className="h-4 w-4" />
                    </Button>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full grid grid-cols-3 sticky top-0 bg-background z-10">
                        <TabsTrigger value="settings" className="text-xs sm:text-sm">Setup</TabsTrigger>
                        <TabsTrigger value="controls" className="text-xs sm:text-sm">Game</TabsTrigger>
                        <TabsTrigger value="saves" className="text-xs sm:text-sm">Saves</TabsTrigger>
                    </TabsList>

                    <div className="mt-4 space-y-4">
                        <TabsContent value="settings">
                            <SidebarGroup>
                                <SettingsTab
                                    onNewGame={onNewGame || (() => { })}
                                    onToggleSetupMode={onToggleSetupMode || (() => { })}
                                    onSwitchPlayer={onSwitchPlayer || (() => { })}
                                    onSelectCellType={onSelectCellType || (() => { })}
                                    onSelectValue={onSelectValue || (() => { })}
                                    isSetupMode={isSetupMode}
                                    currentPlayer={currentPlayer}
                                    selectedCellType={selectedCellType}
                                    selectedValue={selectedValue}
                                    explosionThreshold={gameEngine.getExplosionThreshold()}
                                />
                            </SidebarGroup>
                        </TabsContent>

                        <TabsContent value="controls">
                            <SidebarGroup>
                                <ControlsTab
                                    onUndo={onUndo || (() => { })}
                                    onRedo={onRedo || (() => { })}
                                    onReset={onReset}
                                    onSaveGame={(name) => {
                                        handleSaveGame(name);
                                        setActiveTab("saves"); // Switch to saves tab after saving
                                    }}
                                    canUndo={canUndo}
                                    canRedo={canRedo}
                                    history={history}
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
        </Sidebar>
    );
}
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Sidebar, SidebarContent, SidebarHeader } from "~/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { CellType } from "~/lib/engine/v2/types";
import {
    deleteSave,
    deserializeBoard,
    loadAutoSave,
    loadGame,
    saveGame
} from "~/lib/storage";

import { ControlsTab } from "./controls-tab";
import { SavesTab } from "./saves-tab";
import { SettingsTab } from "./settings-tab";
import type { GameSidebarProps } from "./types";
import { AppIcon } from "~/components/v1/app-icon";

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
        <Sidebar>
            <SidebarHeader>
                <AppIcon />
            </SidebarHeader>
            <SidebarContent>
                <Tabs defaultValue="settings" className="w-full">
                    <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="settings">Setup</TabsTrigger>
                        <TabsTrigger value="controls">Game</TabsTrigger>
                        <TabsTrigger value="saves">Saves</TabsTrigger>
                    </TabsList>

                    <TabsContent value="settings" className="mt-2 p-4">
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
                    </TabsContent>

                    <TabsContent value="controls" className="mt-2 p-4">
                        <ControlsTab
                            onUndo={onUndo || (() => { })}
                            onRedo={onRedo || (() => { })}
                            onReset={onReset}
                            onSaveGame={handleSaveGame}
                            canUndo={canUndo}
                            canRedo={canRedo}
                            history={history}
                        />
                    </TabsContent>

                    <TabsContent value="saves" className="mt-2 p-4">
                        <SavesTab
                            onLoadGame={handleLoadGame}
                            onLoadAutoSave={handleLoadAutoSave}
                            onDeleteSave={handleDeleteSave}
                            hasAutoSave={hasAutoSave}
                        />
                    </TabsContent>
                </Tabs>
            </SidebarContent>
        </Sidebar>
    );
}
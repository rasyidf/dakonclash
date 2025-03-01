import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { CellMechanicsFactory } from "~/lib/engine/v2/mechanics/CellMechanicsFactory";
import { CellType } from "~/lib/engine/v2/types";
import type { GameSettings } from "./types";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogAction, AlertDialogCancel } from "~/components/ui/alert-dialog";

interface SettingsTabProps {
    onNewGame: (settings: GameSettings) => void;
    onToggleSetupMode: () => void;
    onSwitchPlayer: () => void;
    onSelectCellType: (type: CellType) => void;
    onSelectValue: (value: number) => void;
    isSetupMode: boolean;
    currentPlayer: number;
    selectedCellType: CellType;
    selectedValue: number;
    explosionThreshold: number;
}

export function SettingsTab({
    onNewGame,
    onToggleSetupMode,
    onSwitchPlayer,
    onSelectCellType,
    onSelectValue,
    isSetupMode,
    currentPlayer,
    selectedCellType,
    selectedValue,
    explosionThreshold
}: SettingsTabProps) {
    const [settings, setSettings] = useState<GameSettings>({
        boardSize: 7,
        maxPlayers: 2,
        maxValue: 4
    });

    const handleSettingChange = (key: keyof GameSettings, value: number) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="font-medium">Game Settings</h3>
                <GameSettingsSection
                    settings={settings}
                    onSettingChange={handleSettingChange}
                    onNewGame={() => onNewGame(settings)}
                />
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="font-medium">Board Setup</h3>
                <SetupModeSection
                    isSetupMode={isSetupMode}
                    onToggleSetupMode={onToggleSetupMode}
                    currentPlayer={currentPlayer}
                    onSwitchPlayer={onSwitchPlayer}
                />

                {isSetupMode && (
                    <CellConfigSection
                        selectedCellType={selectedCellType}
                        onSelectCellType={onSelectCellType}
                        selectedValue={selectedValue}
                        onSelectValue={onSelectValue}
                        explosionThreshold={explosionThreshold}
                    />
                )}
            </div>
        </div>
    );
}

interface GameSettingsSectionProps {
    settings: GameSettings;
    onSettingChange: (key: keyof GameSettings, value: number) => void;
    onNewGame: () => void;
}

function GameSettingsSection({ settings, onSettingChange, onNewGame }: GameSettingsSectionProps) {
    return (
        <div className="space-y-4">
            <SettingSlider
                label="Board Size"
                value={settings.boardSize}
                suffix={`${settings.boardSize}x${settings.boardSize}`}
                onChange={(value) => onSettingChange('boardSize', value)}
                min={5}
                max={12}
                step={2}
            />

            <SettingSlider
                label="Players"
                value={settings.maxPlayers}
                onChange={(value) => onSettingChange('maxPlayers', value)}
                min={2}
                max={6}
            />

            <SettingSlider
                label="Critical Mass"
                value={settings.maxValue}
                onChange={(value) => onSettingChange('maxValue', value)}
                min={2}
                max={8}
            />

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button className="w-full">New Game</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Start New Game</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will reset the current game. Are you sure?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onNewGame}>Start</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

interface SetupModeSectionProps {
    isSetupMode: boolean;
    onToggleSetupMode: () => void;
    currentPlayer: number;
    onSwitchPlayer: () => void;
}

function SetupModeSection({
    isSetupMode,
    onToggleSetupMode,
    currentPlayer,
    onSwitchPlayer
}: SetupModeSectionProps) {
    return (
        <div className="space-y-3">
            <Button
                variant={isSetupMode ? "default" : "outline"}
                size="sm"
                onClick={onToggleSetupMode}
                className="w-full relative"
            >
                {isSetupMode ? "Exit Setup Mode" : "Enter Setup Mode"}
            </Button>

            {isSetupMode && (
                <div className={cn(
                    "flex items-center justify-between p-2 rounded-md",
                    "bg-muted/50 border transition-colors",
                    "hover:bg-muted cursor-pointer",
                )}
                onClick={onSwitchPlayer}
                >
                    <span className="text-sm">Current Player: {currentPlayer}</span>
                    <Button
                        size="sm"
                        variant="ghost"
                    >
                        Switch
                    </Button>
                </div>
            )}
        </div>
    );
}

interface CellConfigSectionProps {
    selectedCellType: CellType;
    onSelectCellType: (type: CellType) => void;
    selectedValue: number;
    onSelectValue: (value: number) => void;
    explosionThreshold: number;
}

function CellConfigSection({
    selectedCellType,
    onSelectCellType,
    selectedValue,
    onSelectValue,
    explosionThreshold
}: CellConfigSectionProps) {
    return (
        <div className="space-y-4 animate-in slide-in-from-left-4">
            <div className="space-y-2">
                <Label>Cell Type</Label>
                <Select
                    value={selectedCellType}
                    onValueChange={(value) => onSelectCellType(value as CellType)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select cell type" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(CellType).map((type) => {
                            const mechanics = CellMechanicsFactory.getMechanics(type);
                            return (
                                <SelectItem key={type} value={type}>
                                    <div className="flex items-center gap-2">
                                        {mechanics.icon && (
                                            <span>{mechanics.icon}</span>
                                        )}
                                        <span>{mechanics.name}</span>
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    {CellMechanicsFactory.getMechanics(selectedCellType).description}
                </p>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Cell Value</Label>
                    <span className="text-sm text-muted-foreground">{selectedValue}</span>
                </div>
                <Slider
                    value={[selectedValue]}
                    onValueChange={([value]) => onSelectValue(value)}
                    min={1}
                    max={selectedCellType === CellType.Wall ? 5 : explosionThreshold}
                    step={1}
                    className="py-0"
                />
            </div>
        </div>
    );
}

interface SettingSliderProps {
    label: string;
    value: number;
    suffix?: string;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
}

function SettingSlider({ label, value, suffix, onChange, min, max, step = 1 }: SettingSliderProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <span className="text-sm text-muted-foreground">{suffix || value}</span>
            </div>
            <Slider
                value={[value]}
                onValueChange={([value]) => onChange(value)}
                min={min}
                max={max}
                step={step}
                className="py-0"
            />
        </div>
    );
}
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { CellMechanicsFactory } from "~/lib/engine/v2/mechanics/CellMechanicsFactory";
import { CellType } from "~/lib/engine/v2/types";
import type { GameSettings } from "./types";

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
        <div className="space-y-3">
            <GameSettingsSection
                settings={settings}
                onSettingChange={handleSettingChange}
                onNewGame={() => onNewGame(settings)}
            />

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
    );
}

// Sub-sections of the Settings Tab

interface GameSettingsSectionProps {
    settings: GameSettings;
    onSettingChange: (key: keyof GameSettings, value: number) => void;
    onNewGame: () => void;
}

function GameSettingsSection({ settings, onSettingChange, onNewGame }: GameSettingsSectionProps) {
    return (
        <div className="space-y-3">
            <SettingSlider
                label="Board Size"
                value={settings.boardSize}
                suffix={`${settings.boardSize}x${settings.boardSize}`}
                onChange={(value) => onSettingChange('boardSize', value)}
                min={5}
                max={12}
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

            <Button onClick={onNewGame} className="w-full">
                New Game
            </Button>
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
        <div className="space-y-2">
            <Button
                variant={isSetupMode ? "default" : "outline"}
                size="sm"
                onClick={onToggleSetupMode}
                className="w-full"
            >
                {isSetupMode ? "Exit Setup" : "Enter Setup"}
            </Button>

            {isSetupMode && (
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span className="text-sm">Current Player: {currentPlayer}</span>
                    <Button
                        size="sm"
                        onClick={onSwitchPlayer}
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
        <div className="space-y-3 pt-2 border-t">
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
}

function SettingSlider({ label, value, suffix, onChange, min, max }: SettingSliderProps) {
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
                step={1}
                className="py-0"
            />
        </div>
    );
}
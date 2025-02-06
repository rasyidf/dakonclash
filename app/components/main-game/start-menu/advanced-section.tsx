import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { useSettingsStore } from "~/store/useSettingsStore";

export function AdvancedSettings({
  enableTimer, setEnableTimer,
  timeLimit, setTimeLimit,
  enableHandicap, setEnableHandicap,
  handicapAmount, setHandicapAmount
}: any) {
  const settings = useSettingsStore();
  const [handicapType, setHandicapType] = useState<'stones' | 'moves' | 'time'>('stones');
  const [handicapPosition, setHandicapPosition] = useState<'fixed' | 'custom'>('fixed');
  const [advantagePlayer, setAdvantagePlayer] = useState<'player1' | 'player2'>('player2');

  useEffect(() => {
    settings.updateTimer({ enabled: enableTimer, timePerPlayer: timeLimit });
  }, [enableTimer, timeLimit]);

  useEffect(() => {
    settings.updateHandicap({
      enabled: enableHandicap,
      amount: handicapAmount,
      type: handicapType,
      position: handicapPosition,
      advantagePlayer: advantagePlayer === 'player1' ? 1 : 2
    });
  }, [enableHandicap, handicapAmount, handicapType, handicapPosition, advantagePlayer]);

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="advanced">
        <AccordionTrigger>Advanced Settings</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Timer</Label>
            <Switch
              checked={enableTimer}
              onCheckedChange={setEnableTimer}
            />
          </div>
          {enableTimer && (
            <div className="space-y-3">
              <Label>Time Limit (minutes)</Label>
              <Slider
                value={[timeLimit / 60]}
                onValueChange={(value) => setTimeLimit(value[0] * 60)}
                min={1}
                max={30}
                step={1}
              />
              <span className="text-sm text-muted-foreground">
                {timeLimit / 60} minutes
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label>Enable Handicap</Label>
            <Switch
              checked={enableHandicap}
              onCheckedChange={setEnableHandicap}
            />
          </div>

          {enableHandicap && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Advantage For</Label>
                <Select value={advantagePlayer} onValueChange={(v) => setAdvantagePlayer(v as typeof advantagePlayer)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player1">Player 1 (Red)</SelectItem>
                    <SelectItem value="player2">Player 2 (Blue)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select which player needs the advantage
                </p>
              </div>

              <div className="space-y-2">
                <Label>Handicap Type</Label>
                <Select value={handicapType} onValueChange={(v) => setHandicapType(v as typeof handicapType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select handicap type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stones">Initial Stones</SelectItem>
                    <SelectItem value="moves">Extra Moves</SelectItem>
                    <SelectItem value="time">Time Advantage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {handicapType === 'stones' && (
                <>
                  <div className="space-y-2">
                    <Label>Stone Placement</Label>
                    <Select value={handicapPosition} onValueChange={(v) => setHandicapPosition(v as typeof handicapPosition)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stone placement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Positions</SelectItem>
                        <SelectItem value="custom">Custom Placement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Number of Handicap Stones</Label>
                    <Slider
                      value={[handicapAmount]}
                      onValueChange={(value) => setHandicapAmount(value[0])}
                      min={2}
                      max={9}
                      step={1}
                    />
                    <span className="text-sm text-muted-foreground">
                      {handicapAmount} stones
                    </span>
                  </div>
                </>
              )}

              {handicapType === 'moves' && (
                <div className="space-y-2">
                  <Label>Extra Moves</Label>
                  <Slider
                    value={[handicapAmount]}
                    onValueChange={(value) => setHandicapAmount(value[0])}
                    min={1}
                    max={5}
                    step={1}
                  />
                  <span className="text-sm text-muted-foreground">
                    {handicapAmount} additional moves
                  </span>
                </div>
              )}

              {handicapType === 'time' && (
                <div className="space-y-2">
                  <Label>Time Advantage (minutes)</Label>
                  <Slider
                    value={[handicapAmount]}
                    onValueChange={(value) => setHandicapAmount(value[0])}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <span className="text-sm text-muted-foreground">
                    {handicapAmount} minutes extra
                  </span>
                </div>
              )}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}


import { useCallback, useEffect, useRef, useState } from "react";
import { Svg, SVG } from "@svgdotjs/svg.js";
import type { GameEngine } from "~/lib/engine/v2/GameEngine";
import { CellType } from "~/lib/engine/v2/types";
import { cn } from "~/lib/utils";
import styles from "./game-cell-v3.module.css";
import { CellMechanicsFactory } from "~/lib/engine/v2/mechanics/CellMechanicsFactory";

interface GameCellV3Props {
  value: number;
  owner: number;
  gameEngine: GameEngine;
  currentPlayer: number;
  isHighlighted?: boolean;
  isExploding?: boolean;
  inPattern?: boolean;
  row?: number;
  col?: number;
  isSetupMode?: boolean;
  onClick: () => void;
  onHoverPattern?: (positions: { row: number, col: number }[] | null) => void;
  type?: CellType;
}

// Define SVG element types
interface SVGElements {
  cellBg: any;
  cellContent: any;
  beads: any[];
  patternEffect?: any;
  explosionEffect?: any;
}

export function GameCellV3({
  value,
  owner,
  onClick,
  gameEngine,
  isSetupMode,
  isHighlighted,
  isExploding,
  inPattern,
  currentPlayer,
  row,
  col,
  onHoverPattern,
  type = CellType.Normal
}: GameCellV3Props) {
  const svgRef = useRef<HTMLDivElement>(null);
  const svgElementsRef = useRef<SVGElements>({ cellBg: null, cellContent: null, beads: [] });
  const [prevValue, setPrevValue] = useState(value);
  const [isValueChanged, setIsValueChanged] = useState(false);

  const mechanics = CellMechanicsFactory.getMechanics(type);
  const renderProps = mechanics.renderProperties;
  const ownerColor = gameEngine.getPlayerManager().getPlayerColor(owner);
  const isCurrentPlayer = owner === currentPlayer;

  // Get beads layout based on value
  const getBeadPositions = useCallback((total: number, containerWidth: number, containerHeight: number) => {
    const positions = {
      1: [{ x: containerWidth / 2, y: containerHeight / 2 }],
      2: [
        { x: containerWidth * 0.35, y: containerHeight / 2 },
        { x: containerWidth * 0.65, y: containerHeight / 2 },
      ],
      3: [
        { x: containerWidth / 2, y: containerHeight * 0.35 },
        { x: containerWidth * 0.35, y: containerHeight * 0.65 },
        { x: containerWidth * 0.65, y: containerHeight * 0.65 },
      ],
      4: [
        { x: containerWidth * 0.35, y: containerHeight * 0.35 },
        { x: containerWidth * 0.65, y: containerHeight * 0.35 },
        { x: containerWidth * 0.35, y: containerHeight * 0.65 },
        { x: containerWidth * 0.65, y: containerHeight * 0.65 },
      ],
    };
    return positions[Math.min(total, 4) as keyof typeof positions] || [];
  }, []);

  // Get cardinal positions for explosion animation
  const getCardinalPositions = useCallback((containerWidth: number, containerHeight: number) => {
    return [
      { x: containerWidth / 2, y: containerHeight * 0.25 },  // North
      { x: containerWidth * 0.75, y: containerHeight / 2 },  // East
      { x: containerWidth / 2, y: containerHeight * 0.75 },  // South
      { x: containerWidth * 0.25, y: containerHeight / 2 },  // West
    ];
  }, []);

  // Get cell background color based on owner and type
  const getCellBackgroundColor = useCallback(() => {
    if (type !== CellType.Normal) {
      // Get background color from the cell type's render properties
      const bgStyle = renderProps.baseStyle || "";
      // Extract background color from the tailwind class
      const bgMatch = bgStyle.match(/bg-([a-z]+-\d+)/);
      if (bgMatch) {
        const colorClass = bgMatch[1]; // e.g. "red-500"
        const [colorName, shade] = colorClass.split("-");

        // Map to actual CSS color values
        const colorMap: Record<string, Record<string, string>> = {
          red: { "100": "#fee2e2", "500": "#ef4444" },
          stone: { "600": "#57534e", "700": "#44403c" },
          purple: { "100": "#f3e8ff", "500": "#a855f7" },
          gray: { "800": "#1f2937", "900": "#111827" },
          white: { "": "#ffffff" }
        };

        return colorMap[colorName]?.[shade] || "#ffffff";
      }
    }

    // For normal cells, use the player color
    if (owner === 0) return "#ffffff";

    // Map player colors to actual CSS color values
    const playerColorMap: Record<string, string> = {
      red: "#fca5a5",
      blue: "#93c5fd",
      green: "#86efac",
      purple: "#d8b4fe",
      orange: "#fdba74",
      yellow: "#fde047"
    };

    return playerColorMap[ownerColor] || "#ffffff";
  }, [type, renderProps, owner, ownerColor]);

  // Get content color for cell interior
  const getContentColor = useCallback(() => {
    if (type !== CellType.Normal) {
      return renderProps.contentColor?.match(/bg-([a-z]+-\d+)/) ?
        `#${renderProps.contentColor}`.replace("bg-", "") : "#666666";
    }

    // Map player colors to deeper shades for content
    const playerContentColorMap: Record<string, string> = {
      red: "#ef4444",
      blue: "#3b82f6",
      green: "#22c55e",
      purple: "#a855f7",
      orange: "#f97316",
      yellow: "#eab308"
    };

    return playerContentColorMap[ownerColor] || "#666666";
  }, [type, renderProps, ownerColor]);

  // Get bead color
  const getBeadColor = useCallback(() => {
    if (type === CellType.Dead) return "#6b7280";
    return renderProps.beadColor || "#ffffff";
  }, [type, renderProps]);

  // Initialize SVG
  const initializeSVG = useCallback(() => {
    if (!svgRef.current) return;

    // Clear existing SVG content
    svgRef.current.innerHTML = "";

    // Get dimensions
    const containerWidth = svgRef.current.clientWidth;
    const containerHeight = svgRef.current.clientHeight;

    // Create SVG.js instance
    const draw = SVG().addTo(svgRef.current).size(containerWidth, containerHeight);

    // Create cell background
    const bgColor = getCellBackgroundColor();
    const cellBg = draw.rect(containerWidth, containerHeight)
      .radius(8)
      .fill(bgColor)
      .stroke({ width: 1, color: isHighlighted ? '#fbbf24' : '#ffffff' });

    // Create cell content (inner circle)
    const contentRadius = Math.min(containerWidth, containerHeight) * 0.4;
    const contentColor = getContentColor();
    const cellContent = draw.circle(contentRadius * 2)
      .center(containerWidth / 2, containerHeight / 2)
      .fill({ color: contentColor, opacity: 0.75 })
      .opacity(value > 0 ? 1 : 0);

    // Create beads
    const beads: any[] = [];
    if (value > 0) {
      const beadPositions = isExploding
        ? getCardinalPositions(containerWidth, containerHeight)
        : getBeadPositions(value, containerWidth, containerHeight);

      const beadSize = Math.min(containerWidth, containerHeight) * 0.15;
      const beadColor = getBeadColor();

      beadPositions.slice(0, Math.min(4, value)).forEach((pos, i) => {
        const bead = draw.circle(beadSize)
          .center(pos.x, pos.y)
          .fill('#ffffff')
          .stroke({ width: 0.5, color: '#ffffff' });

        beads.push(bead);

        if (isExploding) {
          const directions = [
            { x: 0, y: -containerHeight }, // North
            { x: containerWidth, y: 0 },   // East
            { x: 0, y: containerHeight },  // South
            { x: -containerWidth, y: 0 }   // West
          ];

          bead.animate(500, 0)
            .move(pos.x + directions[i].x - beadSize / 2, pos.y + directions[i].y - beadSize / 2)
            .opacity(0);
        }
      });
    }

    // Add pattern highlight if needed
    let patternEffect;
    if (inPattern) {
      patternEffect = draw.rect(containerWidth, containerHeight)
        .radius(8)
        .fill({ color: '#fef3c7', opacity: 0.3 })
        .stroke({ width: 2, color: '#fbbf24', opacity: 0.7 });

      // Pulse animation
      patternEffect.animate(2000).loop()
        .attr({ opacity: 0.7 })
        .animate()
        .attr({ opacity: 0.3 });
    }

    // Add explosion effect if needed
    let explosionEffect;
    if (isExploding) {
      explosionEffect = draw.circle(Math.min(containerWidth, containerHeight) * 1.5)
        .center(containerWidth / 2, containerHeight / 2)
        .fill({ color: '#fef3c7', opacity: 0.4 })
        .stroke({ width: 0, color: '#fbbf24' });

      explosionEffect.animate(500, 0)
        .opacity(0);
    }

    // Store references to SVG elements
    svgElementsRef.current = {
      cellBg,
      cellContent,
      beads,
      patternEffect,
      explosionEffect
    };

  }, [
    getCellBackgroundColor,
    getContentColor,
    getBeadColor,
    getBeadPositions,
    getCardinalPositions,
    value,
    isExploding,
    isHighlighted,
    inPattern
  ]);

  // Update SVG when the cell value changes
  const updateSVG = useCallback(() => {
    if (!svgRef.current || !svgElementsRef.current.cellBg) return;

    const { cellContent, beads } = svgElementsRef.current;
    const containerWidth = svgRef.current.clientWidth;
    const containerHeight = svgRef.current.clientHeight;

    // Update cell content visibility
    if (cellContent) {
      if (value > 0) {
        cellContent.opacity(1);
      } else {
        cellContent.opacity(0);
      }
    }

    // Update beads
    if (beads.length > 0) {
      // First, hide all existing beads with animation
      beads.forEach(bead => {
        bead.animate(200, '<>', 0).opacity(0).scale(0);
      });
    }

    // Then create new beads if value > 0
    if (value > 0 && svgRef.current) {
      const draw = SVG(svgRef.current) as Svg;
      const beadPositions = getBeadPositions(value, containerWidth, containerHeight);
      const beadSize = Math.min(containerWidth, containerHeight) * 0.15;
      const beadColor = getBeadColor();

      // Clear beads array
      svgElementsRef.current.beads = [];

      beadPositions.slice(0, Math.min(4, value)).forEach((pos) => {
        const bead = draw.circle(beadSize)
          .center(pos.x, pos.y)
          .fill(beadColor)
          .stroke({ width: 0.5, color: '#ffffff' })
          .opacity(0)
          .scale(0);

        bead.animate(200, 0).opacity(1).scale(1);
        svgElementsRef.current.beads.push(bead);
      });
    }
  }, [value, getBeadPositions, getBeadColor]);

  // Handle mouse events for pattern detection
  const handleMouseEnter = useCallback(() => {
    if (row === undefined || col === undefined || !onHoverPattern || isSetupMode) return;

    const board = gameEngine.getBoard();
    const positions: { row: number; col: number; }[] = [];

    const rotations = [
      { cardinal: { row: -1, col: 0 }, diagonal: { row: -1, col: 1 } },
      { cardinal: { row: 0, col: 1 }, diagonal: { row: 1, col: 1 } },
      { cardinal: { row: 1, col: 0 }, diagonal: { row: 1, col: -1 } },
      { cardinal: { row: 0, col: -1 }, diagonal: { row: -1, col: -1 } }
    ];

    for (const rotation of rotations) {
      const cardinalPos = {
        row: row + rotation.cardinal.row,
        col: col + rotation.cardinal.col
      };
      const diagonalPos = {
        row: row + rotation.diagonal.row,
        col: col + rotation.diagonal.col
      };

      if (!board.isValidPosition(cardinalPos) || !board.isValidPosition(diagonalPos)) {
        continue;
      }

      if (board.getCellValue(cardinalPos) === 3 && board.getCellValue(diagonalPos) === 2) {
        positions.push(cardinalPos, diagonalPos);
      }
    }

    onHoverPattern(positions.length > 0 ? positions : null);
  }, [row, col, onHoverPattern, isSetupMode, gameEngine]);

  // Initialize SVG on mount
  useEffect(() => {
    if (svgRef.current) {
      initializeSVG();
    }
  }, [initializeSVG]);

  // Update on value change
  useEffect(() => {
    if (prevValue !== value) {
      setIsValueChanged(true);
      // Small delay to ensure DOM is ready
      const timeout = setTimeout(() => {
        updateSVG();
        setTimeout(() => setIsValueChanged(false), 300);
      }, 50);
      setPrevValue(value);
      return () => clearTimeout(timeout);
    }
  }, [value, prevValue, updateSVG]);

  // Update on explosion or highlight state change
  useEffect(() => {
    initializeSVG();
  }, [isExploding, isHighlighted, inPattern, initializeSVG]);

  // Get cell type-specific class
  const getCellTypeClass = useCallback(() => {
    switch (type) {
      case CellType.Dead:
        return styles.deadCell;
      case CellType.Volatile:
        return styles.volatileCell;
      case CellType.Wall:
        return styles.wallCell;
      case CellType.Reflector:
        return styles.reflectorCell;
      default:
        return '';
    }
  }, [type]);

  return (
    <div
      className={cn(
        styles.cellContainer,
        getCellTypeClass(),
        isExploding && styles.exploding,
        {
          "cursor-pointer": !isSetupMode && owner === 0 || isSetupMode,
          "ring-2 ring-yellow-400": isHighlighted,
          "opacity-90": !isCurrentPlayer && !isSetupMode,
        }
      )}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => onHoverPattern?.(null)}
      role="button"
      tabIndex={0}
      aria-label={`${mechanics.name} at value ${value}, owned by player ${owner}`}
    >
      <div ref={svgRef} className={styles.svgContainer}></div>

      {isSetupMode && (
        <>
          {owner > 0 && (
            <div className={styles.cellInfo}>
              {owner}
            </div>
          )}
          {renderProps.icon && (
            <div className={styles.cellIcon}>
              {renderProps.icon}
            </div>
          )}
        </>
      )}

      {inPattern && (
        <div className={styles.patternHighlight}></div>
      )}
    </div>
  );
}
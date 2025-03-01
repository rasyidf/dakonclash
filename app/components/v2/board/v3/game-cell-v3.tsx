import { useCallback, useEffect, useRef, useState } from "react";
import { Svg, SVG } from "@svgdotjs/svg.js";
import type { GameEngine } from "~/lib/engine/v2/GameEngine";
import { CellType } from "~/lib/engine/v2/types";
import { cn } from "~/lib/utils";
import styles from "./game-cell-v3.module.css";
import { CellMechanicsFactory } from "~/lib/engine/v2/mechanics/CellMechanicsFactory";
import { CELL_RENDER_CONFIG } from "../config/cell-render-config";

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
  [key: string]: any | any[]; // Add index signature to allow string indexing
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
  const renderConfig = CELL_RENDER_CONFIG[type];
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
      return renderConfig.svgProperties?.fill || '#ffffff';
    }

    // For normal cells, use the player color
    if (owner === 0) return '#ffffff';

    // Map player colors to actual CSS color values
    const playerColorMap: Record<string, string> = {
      red: "#fca5a5",
      blue: "#93c5fd",
      green: "#86efac",
      purple: "#d8b4fe",
      orange: "#fdba74",
      yellow: "#fde047"
    };

    return playerColorMap[ownerColor] || '#ffffff';
  }, [type, renderConfig, owner, ownerColor]);

  // Get content color for cell interior
  const getContentColor = useCallback(() => {
    if (type !== CellType.Normal) {
      return renderConfig.contentColor || '#666666';
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

    return playerContentColorMap[ownerColor] || '#666666';
  }, [type, renderConfig, ownerColor]);

  // Get bead color and gradient
  const getBeadColor = useCallback(() => {
    if (type === CellType.Dead) return renderConfig.beadColor || '#6b7280';
    return renderConfig.beadColor || '#ffffff';
  }, [type, renderConfig]);

  // Initialize SVG
  const initializeSVG = useCallback(() => {
    if (!svgRef.current) return;

    // Clear existing SVG content
    svgRef.current.innerHTML = "";

    // Wait for container to be fully rendered and get dimensions
    const containerWidth = Math.max(svgRef.current.clientWidth || svgRef.current.offsetWidth || 89, 89);
    const containerHeight = Math.max(svgRef.current.clientHeight || svgRef.current.offsetHeight || 89, 89);

    // Ensure we have valid dimensions before proceeding
    if (containerWidth === 0 || containerHeight === 0) {
      requestAnimationFrame(() => initializeSVG());
      return;
    }

    // Create SVG.js instance
    const draw = SVG()
      .addTo(svgRef.current)
      .size(containerWidth, containerHeight)
      .viewbox(0, 0, containerWidth, containerHeight);

    // Create cell background with config and ensure minimum size
    const bgColor = getCellBackgroundColor();
    const cellBg = draw.rect(containerWidth || 89, containerHeight || 89)
      .radius(8)
      .fill(bgColor)
      .stroke({
        width: renderConfig.svgProperties?.strokeWidth || 1,
        color: isHighlighted ? '#fbbf24' : (renderConfig.svgProperties?.stroke || '#ffffff')
      });

    // Apply gradient if defined
    if (renderConfig.svgProperties?.gradient) {
      const gradient = renderConfig.svgProperties.gradient;
      const gradientDef = gradient.type === 'radial'
        ? draw.gradient('radial')
        : draw.gradient('linear');

      gradient.colors.forEach(({ offset, color }) => {
        gradientDef.stop(offset / 100, color);
      });

      cellBg.fill(gradientDef);
    }

    // Create cell content with gradient and ensure minimum size
    const contentRadius = Math.min(containerWidth || 89, containerHeight || 89) * 0.4;
    const contentColor = getContentColor();
    const cellContent = draw.circle(contentRadius * 2)
      .center((containerWidth || 89) / 2, (containerHeight || 89) / 2)
      .fill(contentColor)
      .opacity(value > 0 ? 1 : 0);

    if (renderConfig.svgProperties?.contentGradient) {
      const gradient = renderConfig.svgProperties.contentGradient;
      const gradientDef = gradient.type === 'radial'
        ? draw.gradient('radial')
        : draw.gradient('linear');

      gradient.colors.forEach(({ offset, color }) => {
        gradientDef.stop(offset / 100, color);
      });

      cellContent.fill(gradientDef);
    }

    // Create beads with config
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
          .fill(beadColor)
          .stroke({ width: 0.5, color: '#ffffff' });

        // Apply bead gradient if defined
        if (renderConfig.svgProperties?.beadGradient) {
          const gradient = renderConfig.svgProperties.beadGradient;
          const gradientDef = gradient.type === 'radial'
            ? draw.gradient('radial')
            : draw.gradient('linear');

          gradient.colors.forEach(({ offset, color }) => {
            gradientDef.stop(offset / 100, color);
          });

          bead.fill(gradientDef);
        }

        beads.push(bead);

        if (isExploding) {
          const directions = [
            { x: 0, y: -containerHeight },
            { x: containerWidth, y: 0 },
            { x: 0, y: containerHeight },
            { x: -containerWidth, y: 0 }
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

      patternEffect.animate(2000).loop()
        .attr({ opacity: 0.7 })
        .animate()
        .attr({ opacity: 0.3 });
    }

    // Add explosion effect if needed
    let explosionEffect;
    if (isExploding) {
      const glowEffect = renderConfig.svgProperties?.glowEffect;
      explosionEffect = draw.circle(Math.min(containerWidth, containerHeight) * 1.5)
        .center(containerWidth / 2, containerHeight / 2)
        .fill({
          color: glowEffect?.color || '#fef3c7',
          opacity: 0.4
        })
        .stroke({ width: 0 });

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
    renderConfig,
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

  // Update initialization logic to ensure container is ready
  useEffect(() => {
    if (svgRef.current) {
      const ensureDimensions = () => {
        const width = svgRef.current?.clientWidth || svgRef.current?.offsetWidth;
        const height = svgRef.current?.clientHeight || svgRef.current?.offsetHeight;
        
        if (!width || !height) {
          requestAnimationFrame(ensureDimensions);
          return;
        }
        
        initializeSVG();
      };

      ensureDimensions();

      const resizeObserver = new ResizeObserver(() => {
        ensureDimensions();
      });

      resizeObserver.observe(svgRef.current);

      return () => {
        resizeObserver.disconnect();
      };
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
        renderConfig.baseStyle,
        renderConfig.animation,
        isExploding && styles.exploding,
        getCellTypeClass(),
        {
          "cursor-pointer": !isSetupMode && owner === 0 || isSetupMode,
          "ring-2 ring-yellow-400": isHighlighted,
          "opacity-85": !isCurrentPlayer && !isSetupMode,
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
          {mechanics.icon && (
            <div className={styles.cellIcon}>
              {mechanics.icon}
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
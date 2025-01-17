import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cell } from '~/hooks/useGame'

export type TailwindColor = "red" | "blue" | "green" | "yellow" | "purple" | "pink" | "orange" | "teal"

export interface Player {
  id: "p1" | "p2"
  name: string
  color: TailwindColor
}

export interface GameMove {
  playerId: Player["id"]
  board: Cell[][]
  score: Record<Player["id"], number>
  position: { row: number; col: number }
}

export interface GameStats {
  startTime: number
  elapsedTime: number
  movesByPlayer: { p1: number; p2: number }
  flipCombos: number
  longestFlipChain: number
  cornerThrows: number
}

export interface GameState {
  size: number
  moves: number
  players: Record<Player["id"], Player>
  currentPlayerId: Player["id"]
  score: Record<Player["id"], number>
  board: Cell[][]
  setCurrentPlayerId: (id: Player["id"]) => void
  setSize: (size: number) => void
  setMoves: (moves: number) => void
  setPlayerInfo: (id: Player["id"], info: Partial<Player>) => void
  setScore: (score: Record<Player["id"], number>) => void
  setBoard: (board: Cell[][]) => void
  resetGame: (newSize: number) => void
  history: GameMove[]
  currentStep: number
  stats: GameStats
  addMove: (position: { row: number; col: number }) => void
  undo: () => void
  replay: (step: number) => void
  updateStats: (stats: Partial<GameStats>) => void
  resetStats: () => void
}

const initialStats: GameStats = {
  startTime: Date.now(),
  elapsedTime: 0,
  movesByPlayer: { p1: 0, p2: 0 },
  flipCombos: 0,
  longestFlipChain: 0,
  cornerThrows: 0,
}

const initialPlayers: Record<Player["id"], Player> = {
  p1: { id: "p1", name: "Player 1", color: "red" },
  p2: { id: "p2", name: "Player 2", color: "blue" }
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      size: 6,
      moves: 0,
      players: initialPlayers,
      currentPlayerId: "p1",
      score: { p1: 0, p2: 0 },
      board: Array(6).fill(null).map(() =>
        Array(6).fill(null).map(() => ({ beads: 0, playerId: null }))
      ),
      setSize: (size) => set({ size }),
      setMoves: (moves) => set({ moves }),
      setPlayerInfo: (id, info) => set((state) => ({
        players: {
          ...state.players,
          [id]: { ...state.players[id], ...info }
        }
      })),
      setScore: (score) => set({ score }),
      setBoard: (board) => set({ board }),
      resetGame: (newSize) => set({
        size: newSize,
        moves: 0,
        currentPlayerId: "p1",
        score: { p1: 0, p2: 0 },
        players: initialPlayers,
        board: Array(newSize).fill(null).map(() =>
          Array(newSize).fill(null).map(() => ({ beads: 0, playerId: null }))
        ),
        history: [],
        currentStep: -1,
        stats: initialStats,
      }),
      history: [],
      currentStep: -1,
      stats: initialStats,

      addMove: (position) => set((state) => {
        const newHistory = state.history.slice(0, state.currentStep + 1)
        const move: GameMove = {
          playerId: state.currentPlayerId,
          board: JSON.parse(JSON.stringify(state.board)),
          score: { ...state.score },
          position
        }
        return {
          history: [...newHistory, move],
          currentStep: state.currentStep + 1,
          stats: {
            ...state.stats,
            movesByPlayer: {
              ...state.stats.movesByPlayer,
              [state.currentPlayerId]: state.stats.movesByPlayer[state.currentPlayerId] + 1
            }
          }
        }
      }),
      setCurrentPlayerId: (id) => set({ currentPlayerId: id }),
      undo: () => set((state) => {
        if (state.currentStep <= 0) return state
        const previousMove = state.history[state.currentStep - 1]
        return {
          board: JSON.parse(JSON.stringify(previousMove.board)),
          score: { ...previousMove.score },
          currentPlayerId: previousMove.playerId === 'p1' ? 'p2' : 'p1',
          currentStep: state.currentStep - 1
        }
      }),

      replay: (step) => set((state) => {
        if (step < 0 || step >= state.history.length) return state
        const move = state.history[step]
        return {
          board: JSON.parse(JSON.stringify(move.board)),
          score: { ...move.score },
          currentPlayerId: move.playerId === 'p1' ? 'p2' : 'p1',
          currentStep: step
        }
      }),

      updateStats: (newStats) => set((state) => ({
        stats: { ...state.stats, ...newStats }
      })),

      resetStats: () => set({ stats: initialStats }),
    }),
    {
      name: 'game-storage',
    }
  )
)

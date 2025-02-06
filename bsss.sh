#!/bin/bash

# Define the base directory
BASE_DIR="app/lib/engine/bot"

# Define the directories to create
DIRS=(
  "$BASE_DIR/strategies"
  "$BASE_DIR/evaluation"
  "$BASE_DIR/utilities"
)

# Define the files to create
FILES=(
  "$BASE_DIR/strategies/BotStrategy.ts"
  "$BASE_DIR/strategies/RandomStrategy.ts"
  "$BASE_DIR/strategies/GreedyStrategy.ts"
  "$BASE_DIR/strategies/MinimaxStrategy.ts"
  "$BASE_DIR/strategies/StrategyFactory.ts"
  "$BASE_DIR/evaluation/MoveEvaluator.ts"
  "$BASE_DIR/evaluation/EvaluationWeights.ts"
  "$BASE_DIR/utilities/BoardAnalyzer.ts"
  "$BASE_DIR/utilities/SimulationEngine.ts"
  "$BASE_DIR/BotEngine.ts"
)

# Create directories
for dir in "${DIRS[@]}"; do
  mkdir -p "$dir"
  echo "Created directory: $dir"
done

# Create files
for file in "${FILES[@]}"; do
  touch "$file"
  echo "Created file: $file"
done

echo "Codebase structure created successfully."

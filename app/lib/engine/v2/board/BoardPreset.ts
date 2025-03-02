import { CellType } from '../types';

/**
 * Represents a board configuration that can be saved, loaded, and shared.
 */
export interface BoardPreset {
    /** Unique identifier for the preset */
    id: string;
    /** Name of the board preset */
    name: string;
    /** Description of the board preset */
    description: string;
    /** Size of the board (width/height) */
    size: number;
    /** 2D array of cell types representing the board layout */
    cells: CellType[][];
    /** Difficulty level of the board */
    difficulty?: 'easy' | 'medium' | 'hard';
    /** Author of the board preset */
    author?: string;
    /** Creation timestamp */
    createdAt: string;
}

/**
 * Manages board presets storage, retrieval and manipulation.
 * Provides methods for saving, loading, and sharing board configurations.
 */
export class BoardPresetManager {
    /** Key for storing presets in local storage */
    private static readonly STORAGE_KEY = 'board_presets';
    /** Maximum number of user presets to store */
    private static readonly MAX_USER_PRESETS = 50;
    /** Cache of loaded presets to avoid redundant storage operations */
    private static presetCache: BoardPreset[] | null = null;
    /** Flag to track initialization status */
    private static isInitialized = false;

    /**
     * Initializes the preset manager and loads cached data
     * @returns Promise that resolves when initialization is complete
     */
    private static async initialize(): Promise<void> {
        if (!this.isInitialized) {
            try {
                // Attempt to load presets from storage to initialize cache
                await this.getPresets();
                this.isInitialized = true;
            } catch (error) {
                console.error('Failed to initialize BoardPresetManager:', error);
                this.presetCache = null;
                this.isInitialized = false;
                throw new Error('Failed to initialize preset manager');
            }
        }
    }

    /**
     * Saves a new board preset to storage
     * @param preset The preset data to save (without id and createdAt which are auto-generated)
     * @returns Promise resolving to the saved preset with generated id and timestamp
     */
    static async savePreset(preset: Omit<BoardPreset, 'id' | 'createdAt'>): Promise<BoardPreset> {
        try {
            await this.initialize();

            const presets = await this.getPresets();
            const newPreset: BoardPreset = {
                ...preset,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString()
            };

            // Enforce validation before saving
            this.validatePreset(newPreset);

            // Check if we need to remove old presets (keep under the limit)
            if (presets.length >= this.MAX_USER_PRESETS) {
                // Sort by date and remove oldest
                presets.sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                
                // Keep only the newest MAX_USER_PRESETS - 1 (to make room for the new one)
                presets.length = this.MAX_USER_PRESETS - 1;
            }

            presets.push(newPreset);
            
            // Update storage
            await this.saveToStorage(presets);
            
            return newPreset;
        } catch (error) {
            console.error('Failed to save preset:', error);
            throw new Error(`Failed to save preset: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Updates an existing board preset
     * @param id ID of the preset to update
     * @param updates The updated preset data
     * @returns Promise resolving to the updated preset
     */
    static async updatePreset(id: string, updates: Partial<Omit<BoardPreset, 'id' | 'createdAt'>>): Promise<BoardPreset> {
        try {
            await this.initialize();
            
            const presets = await this.getPresets();
            const presetIndex = presets.findIndex(p => p.id === id);
            
            if (presetIndex === -1) {
                throw new Error(`Preset with ID ${id} not found`);
            }
            
            const updatedPreset: BoardPreset = {
                ...presets[presetIndex],
                ...updates,
                // Preserve original ID and creation timestamp
                id: presets[presetIndex].id,
                createdAt: presets[presetIndex].createdAt
            };
            
            // Validate the updated preset
            this.validatePreset(updatedPreset);
            
            // Update in the array
            presets[presetIndex] = updatedPreset;
            
            // Update storage
            await this.saveToStorage(presets);
            
            return updatedPreset;
        } catch (error) {
            console.error('Failed to update preset:', error);
            throw new Error(`Failed to update preset: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Retrieves all available board presets
     * @returns Promise resolving to an array of board presets
     */
    static async getPresets(): Promise<BoardPreset[]> {
        // If cached, return the cache
        if (this.presetCache !== null) {
            return [...this.presetCache]; // Return a copy to prevent external modifications
        }
        
        try {
            // Try to load from storage
            const presetsJson = localStorage.getItem(this.STORAGE_KEY);
            let loadedPresets = (presetsJson ? JSON.parse(presetsJson) : []) as BoardPreset[];
            
            // Validate the structure of loaded presets
            if (!Array.isArray(loadedPresets)) {
                console.warn('Invalid preset format in storage, resetting to empty array');
                loadedPresets = [];
            }
            
            // Filter out any invalid presets
            loadedPresets = loadedPresets.filter(preset => {
                try {
                    this.validatePreset(preset);
                    return true;
                } catch (e) {
                    console.warn(`Filtered out invalid preset: ${preset?.name || 'unnamed'}`, e);
                    return false;
                }
            });
            
            // Update cache
            this.presetCache = loadedPresets;
            
            return [...loadedPresets]; // Return a copy
        } catch (error) {
            console.error('Failed to load presets:', error);
            // If loading fails, return empty array but don't update cache
            return [];
        }
    }

    /**
     * Retrieves a specific board preset by ID
     * @param id The ID of the preset to retrieve
     * @returns Promise resolving to the preset or null if not found
     */
    static async getPreset(id: string): Promise<BoardPreset | null> {
        try {
            await this.initialize();
            
            const presets = await this.getPresets();
            return presets.find(p => p.id === id) || null;
        } catch (error) {
            console.error('Failed to get preset:', error);
            return null;
        }
    }

    /**
     * Deletes a board preset by ID
     * @param id The ID of the preset to delete
     * @returns Promise resolving when the preset is deleted
     */
    static async deletePreset(id: string): Promise<void> {
        try {
            await this.initialize();
            
            const presets = await this.getPresets();
            const filteredPresets = presets.filter(p => p.id !== id);
            
            if (filteredPresets.length === presets.length) {
                // Nothing was removed, preset not found
                throw new Error(`Preset with ID ${id} not found`);
            }
            
            // Update storage and cache
            await this.saveToStorage(filteredPresets);
        } catch (error) {
            console.error('Failed to delete preset:', error);
            throw new Error(`Failed to delete preset: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Validates a board preset's structure and data
     * @param preset The preset to validate
     */
    private static validatePreset(preset: BoardPreset): void {
        if (!preset) throw new Error('Preset is null or undefined');
        if (!preset.id) throw new Error('Missing preset ID');
        if (!preset.name) throw new Error('Missing preset name');
        if (!preset.size || preset.size <= 0 || preset.size > 20) {
            throw new Error(`Invalid board size: ${preset.size}`);
        }
        if (!Array.isArray(preset.cells)) throw new Error('Missing cells array');
        if (preset.cells.length !== preset.size) {
            throw new Error(`Cell rows (${preset.cells.length}) don't match expected size (${preset.size})`);
        }
        
        // Validate each row
        preset.cells.forEach((row, index) => {
            if (!Array.isArray(row)) throw new Error(`Row ${index} is not an array`);
            if (row.length !== preset.size) {
                throw new Error(`Row ${index} has ${row.length} cells, expected ${preset.size}`);
            }
            
            // Ensure all cells have valid cell types
            for (let i = 0; i < row.length; i++) {
                if (!Object.values(CellType).includes(row[i])) {
                    throw new Error(`Invalid cell type at position [${index},${i}]: ${row[i]}`);
                }
            }
        });
        
        // Validate difficulty if present
        if (preset.difficulty && !['easy', 'medium', 'hard'].includes(preset.difficulty)) {
            throw new Error(`Invalid difficulty: ${preset.difficulty}`);
        }
    }

    /**
     * Saves presets to local storage and updates the cache
     * @param presets The array of presets to save
     */
    private static async saveToStorage(presets: BoardPreset[]): Promise<void> {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
            this.presetCache = [...presets]; // Update cache with a copy
        } catch (error) {
            console.error('Failed to save to storage:', error);
            throw new Error(`Failed to save to storage: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Clears the preset cache forcing a reload from storage on next request
     */
    static clearCache(): void {
        this.presetCache = null;
        this.isInitialized = false;
    }

    /**
     * Imports a preset from JSON data
     * @param jsonData JSON string representation of a preset
     * @returns The imported board preset
     */
    static importFromJson(jsonData: string): BoardPreset {
        try {
            const parsed = JSON.parse(jsonData);
            
            // Ensure the imported data has the right format
            const preset: BoardPreset = {
                id: parsed.id || crypto.randomUUID(), // Generate a new ID if missing
                name: parsed.name || 'Imported Preset',
                description: parsed.description || '',
                size: parsed.size || 8,
                cells: parsed.cells || [],
                difficulty: parsed.difficulty || 'medium',
                author: parsed.author || 'Imported',
                createdAt: parsed.createdAt || new Date().toISOString()
            };
            
            // Validate the imported preset
            this.validatePreset(preset);
            
            return preset;
        } catch (error) {
            throw new Error(`Failed to import preset: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Exports a preset to JSON format
     * @param preset The preset to export
     * @returns JSON string representation of the preset
     */
    static exportToJson(preset: BoardPreset): string {
        try {
            this.validatePreset(preset);
            return JSON.stringify(preset, null, 2);
        } catch (error) {
            throw new Error(`Failed to export preset: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Creates a copy of a preset with a new ID and timestamp
     * @param preset The preset to clone
     * @param newName Optional new name for the cloned preset
     * @returns A new preset based on the original
     */
    static clonePreset(preset: BoardPreset, newName?: string): BoardPreset {
        try {
            this.validatePreset(preset);
            
            // Create a deep copy of the cells array
            const cellsCopy = preset.cells.map(row => [...row]);
            
            return {
                ...preset,
                id: crypto.randomUUID(),
                name: newName || `${preset.name} (Copy)`,
                cells: cellsCopy,
                createdAt: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to clone preset: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // Built-in presets that come with the game
    static readonly DEFAULT_PRESETS: BoardPreset[] = [
        {
            id: 'classic-8x8',
            name: 'Classic 8x8',
            description: 'Standard 8x8 board with normal cells',
            size: 8,
            cells: Array(8).fill(Array(8).fill(CellType.Normal)),
            difficulty: 'easy',
            author: 'System',
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 'fortress-6x6',
            name: 'Fortress',
            description: 'Small board with wall cells protecting the corners',
            size: 6,
            cells: [
                [CellType.Wall, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Wall],
                [CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal],
                [CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal],
                [CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal],
                [CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal],
                [CellType.Wall, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Wall]
            ],
            difficulty: 'medium',
            author: 'System',
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 'volatile-cross',
            name: 'Volatile Cross',
            description: '8x8 board with volatile cells in a cross pattern',
            size: 8,
            cells: Array(8).fill(null).map((_, i) =>
                Array(8).fill(null).map((_, j) => (i === 3 || i === 4 || j === 3 || j === 4) ? CellType.Volatile : CellType.Normal)
            ),
            difficulty: 'hard',
            author: 'System',
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 'reflection-trap',
            name: 'Reflection Trap',
            description: '8x8 board with reflectors creating chain reaction opportunities',
            size: 8,
            cells: Array(8).fill(null).map((_, i) =>
                Array(8).fill(null).map((_, j) => {
                    // Create diagonal reflector patterns
                    if ((i === 2 && j === 2) || (i === 2 && j === 5) ||
                        (i === 5 && j === 2) || (i === 5 && j === 5)) {
                        return CellType.Reflector;
                    }
                    // Add some walls for protection
                    if ((i === 0 && j === 0) || (i === 0 && j === 7) ||
                        (i === 7 && j === 0) || (i === 7 && j === 7)) {
                        return CellType.Wall;
                    }
                    // Add volatile cells in the center
                    if (i === 3 && j === 3) return CellType.Volatile;
                    if (i === 3 && j === 4) return CellType.Volatile;
                    if (i === 4 && j === 3) return CellType.Volatile;
                    if (i === 4 && j === 4) return CellType.Volatile;

                    return CellType.Normal;
                })
            ),
            difficulty: 'hard',
            author: 'System',
            createdAt: '2024-01-01T00:00:00Z'
        }
    ];
}
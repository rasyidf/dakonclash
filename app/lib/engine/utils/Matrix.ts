export class Matrix<T> {
  private data: T[];
  private width: number;
  private height: number;

  constructor(rows: number, cols: number, defaultValue: T) {
    this.width = cols;
    this.height = rows;
    this.data = new Array(rows * cols).fill(defaultValue);
  }

  get(row: number, col: number): T {
    if (!this.isValid(row, col)) {
      throw new Error(`Invalid coordinates: ${row},${col}`);
    }
    return this.data[row * this.width + col];
  }

  set(row: number, col: number, value: T): void {
    if (!this.isValid(row, col)) {
      throw new Error(`Invalid coordinates: ${row},${col}`);
    }
    this.data[row * this.width + col] = value;
  }

  isValid(row: number, col: number): boolean {
    return row >= 0 && row < this.height && col >= 0 && col < this.width;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  clone(): Matrix<T> {
    const newMatrix = new Matrix<T>(this.height, this.width, this.data[0]);
    newMatrix.data = [...this.data];
    return newMatrix;
  }

  toArray(): T[][] {
    return Array.from({ length: this.height }, (_, row) =>
      Array.from({ length: this.width }, (_, col) => this.get(row, col))
    );
  }

  forEach(callback: (value: T, row: number, col: number) => void): void {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        callback(this.get(row, col), row, col);
      }
    }
  }

  // additional LINQ-like methods
  every(predicate: (value: T, row: number, col: number) => boolean): boolean {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (!predicate(this.get(row, col), row, col)) {
          return false;
        }
      }
    }
    return true;
  }

  some(predicate: (value: T, row: number, col: number) => boolean): boolean {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (predicate(this.get(row, col), row, col)) {
          return true;
        }
      }
    }
    return false;
  }

  map<U>(callback: (value: T, row: number, col: number) => U): U[][] {
    return Array.from({ length: this.height }, (_, row) =>
      Array.from({ length: this.width }, (_, col) => callback(this.get(row, col), row, col))
    );
  }

  filter(predicate: (value: T, row: number, col: number) => boolean): T[] {
    const result: T[] = [];
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (predicate(this.get(row, col), row, col)) {
          result.push(this.get(row, col));
        }
      }
    }
    return result;
  }
}

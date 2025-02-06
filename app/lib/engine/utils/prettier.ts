import type { Cell } from "../types";
import type { Matrix } from "./Matrix";


export const asciiPrintMatrixWithBorder = (matrix: Matrix<Cell>): string => {
  let str = "";
  let border = "+";
  for (let i = 0; i < matrix.getWidth(); i++) {
    border += "-";
  }
  border += "+\n";
  str += border;
  matrix.forEach((cell, row, col) => {
    if (col === 0) {
      str += "|";
    }
    str += cell.value.toString().padStart(2, " ");
    if (col === matrix.getWidth() - 1) {
      str += "|\n";
    }
  });
  str += border;
  
  return str;
};
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TailwindColor } from "./engine/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export const COLORS: TailwindColor[] = ["red", "blue", "green", "yellow", "purple", "pink", "orange", "teal"];

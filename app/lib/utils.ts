import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TailwindColor } from "~/store/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



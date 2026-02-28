import type { LucideIcon } from "lucide-react";
import {
  Bath,
  Bed,
  Backpack,
  BookOpen,
  ClipboardList,
  CookingPot,
  Home,
  Monitor,
  Refrigerator,
  ShoppingBasket,
  Shirt,
  Sparkles,
  SprayCan,
  Trash2,
  Utensils,
  WashingMachine,
  Wrench,
} from "lucide-react";

export type TaskIconOption = {
  value: string;
  label: string;
  Icon: LucideIcon;
  keywords: string[];
};

export const TASK_ICON_OPTIONS: TaskIconOption[] = [
  { value: "clipboard-list", label: "Resumen", Icon: ClipboardList, keywords: ["tarea", "lista", "resumen", "deberes"] },
  { value: "book-open", label: "Estudio", Icon: BookOpen, keywords: ["estudio", "deberes", "libro"] },
  { value: "utensils", label: "Cocina", Icon: Utensils, keywords: ["cocina", "platos", "comida"] },
  { value: "cooking-pot", label: "Cocinar", Icon: CookingPot, keywords: ["cocinar", "olla", "comida"] },
  { value: "washing-machine", label: "Lavadora", Icon: WashingMachine, keywords: ["lavado", "ropa", "lavadora"] },
  { value: "shirt", label: "Ropa", Icon: Shirt, keywords: ["ropa", "doblar", "guardar"] },
  { value: "bath", label: "Baño", Icon: Bath, keywords: ["baño", "ducha", "higiene"] },
  { value: "bed", label: "Cama", Icon: Bed, keywords: ["cama", "dormitorio", "orden"] },
  { value: "spray-can", label: "Limpieza", Icon: SprayCan, keywords: ["limpieza", "spray", "desinfectar"] },
  { value: "trash-2", label: "Basura", Icon: Trash2, keywords: ["basura", "reciclaje", "tirar"] },
  { value: "refrigerator", label: "Nevera", Icon: Refrigerator, keywords: ["nevera", "frigorifico", "cocina"] },
  { value: "shopping-basket", label: "Compra", Icon: ShoppingBasket, keywords: ["compra", "mercado", "super"] },
  { value: "backpack", label: "Mochila", Icon: Backpack, keywords: ["mochila", "escuela"] },
  { value: "monitor", label: "Escritorio", Icon: Monitor, keywords: ["escritorio", "orden", "habitacion"] },
  { value: "wrench", label: "Arreglos", Icon: Wrench, keywords: ["arreglo", "mantenimiento", "herramienta"] },
  { value: "home", label: "Casa", Icon: Home, keywords: ["casa", "hogar", "general"] },
  { value: "sparkles", label: "General", Icon: Sparkles, keywords: ["general", "otros", "estrella"] },
];

const TASK_ICON_MAP = TASK_ICON_OPTIONS.reduce<Record<string, LucideIcon>>((acc, option) => {
  acc[option.value] = option.Icon;
  return acc;
}, {});

export function getTaskIcon(icon: string | null | undefined): LucideIcon {
  if (!icon) return Sparkles;
  return TASK_ICON_MAP[icon] ?? Sparkles;
}

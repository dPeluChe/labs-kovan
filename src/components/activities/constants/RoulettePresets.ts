import type { RoulettePreset } from "../types";

/**
 * Presets predefinidos para la Ruleta de la Suerte
 */

// Preset: Integrantes de la familia (dinámico - se llena con miembros reales)
export const INTEGRANTES_PRESET: RoulettePreset = {
  id: "integrantes",
  type: "integrantes",
  name: "Integrantes",
  items: [], // Se llena dinámicamente con miembros de la familia
  isDefault: true,
  icon: "👨‍👩‍👧‍👦",
};

// Preset: Números (1-100)
export const NUMEROS_PRESET: RoulettePreset = {
  id: "numeros",
  type: "numeros",
  name: "Números (1-100)",
  items: Array.from({ length: 100 }, (_, i) => (i + 1).toString()),
  isDefault: true,
  icon: "🔢",
};

// Preset: Sí/No (decisión binaria)
export const SINO_PRESET: RoulettePreset = {
  id: "sino",
  type: "sino",
  name: "Sí / No",
  items: ["¡SÍ!", "¡NO!"],
  isDefault: true,
  icon: "✅",
};

// Preset: Verdadero/Falso
export const VERDADERO_FALSO_PRESET: RoulettePreset = {
  id: "verdadero_falso",
  type: "custom",
  name: "Verdadero / Falso",
  items: ["Verdadero", "Falso"],
  isDefault: true,
  icon: "🎯",
};

// Preset: ¿Qué comemos hoy?
export const COMIDA_PRESET: RoulettePreset = {
  id: "comida",
  type: "custom",
  name: "¿Qué comemos?",
  items: [
    "Pizza",
    "Tacos",
    "Hamburguesas",
    "Pasta",
    "Sopa",
    "Ensalada",
    "Pollo",
    "Pescado",
    "Arroz",
    "Sandwich",
    "Burritos",
    "Sushi",
  ],
  isDefault: true,
  icon: "🍕",
};

// Preset: ¿Qué película ver?
export const PELICULAS_PRESET: RoulettePreset = {
  id: "peliculas",
  type: "custom",
  name: "Película para ver",
  items: [
    "Acción",
    "Comedia",
    "Terror",
    "Drama",
    "Ciencia Ficción",
    "Animada",
    "Aventuras",
    "Romance",
    "Documental",
    "Musical",
  ],
  isDefault: true,
  icon: "🎬",
};

// Preset: Actividades familiares
export const ACTIVIDADES_PRESET: RoulettePreset = {
  id: "actividades",
  type: "custom",
  name: "Actividad en familia",
  items: [
    "Juegos de mesa",
    "Cine en casa",
    "Cocinar juntos",
    "Salir a caminar",
    "Videojuegos",
    "Lectura",
    "Manualidades",
    "Karaoke",
    "Deportes",
    "Picnic",
  ],
  isDefault: true,
  icon: "🎲",
};

// Preset: Colores
export const COLORES_PRESET: RoulettePreset = {
  id: "colores",
  type: "custom",
  name: "Colores",
  items: [
    "Rojo",
    "Azul",
    "Verde",
    "Amarillo",
    "Naranja",
    "Morado",
    "Rosa",
    "Negro",
    "Blanco",
    "Cafón",
    "Gris",
    "Cian",
  ],
  isDefault: true,
  icon: "🎨",
};

// Preset: Números para premios (más pequeño)
export const PREMIOS_PRESET: RoulettePreset = {
  id: "premios",
  type: "custom",
  name: "Números para premios",
  items: Array.from({ length: 50 }, (_, i) => (i + 1).toString()),
  isDefault: true,
  icon: "🏆",
};

/**
 * Presets por defecto disponibles
 */
export const DEFAULT_PRESETS: RoulettePreset[] = [
  INTEGRANTES_PRESET,
  NUMEROS_PRESET,
  SINO_PRESET,
  VERDADERO_FALSO_PRESET,
  COMIDA_PRESET,
  PELICULAS_PRESET,
  ACTIVIDADES_PRESET,
  COLORES_PRESET,
  PREMIOS_PRESET,
];

/**
 * Obtener preset por ID
 */
export function getPresetById(id: string): RoulettePreset | undefined {
  return DEFAULT_PRESETS.find((preset) => preset.id === id);
}

/**
 * Obtener presets por tipo
 */
export function getPresetsByType(type: RoulettePreset["type"]): RoulettePreset[] {
  return DEFAULT_PRESETS.filter((preset) => preset.type === type);
}

/**
 * Obtener presets por defecto
 */
export function getDefaultPresets(): RoulettePreset[] {
  return DEFAULT_PRESETS.filter((preset) => preset.isDefault);
}

/**
 * Crear un preset personalizado
 */
export function createCustomPreset(
  name: string,
  items: string[]
): RoulettePreset {
  return {
    id: `custom_${Date.now()}`,
    type: "saved",
    name,
    items,
    isDefault: false,
    icon: "💾",
  };
}

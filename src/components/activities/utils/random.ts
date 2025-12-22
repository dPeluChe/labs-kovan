/**
 * Obtener un elemento aleatorio de un array
 * @param array - Array de elementos
 * @returns Elemento aleatorio del array
 * @throws Error si el array está vacío
 */
export function getRandomItem<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error("Cannot get random item from empty array");
  }
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

/**
 * Obtener N elementos aleatorios de un array (sin repetición)
 * @param array - Array de elementos
 * @param count - Cantidad de elementos a obtener
 * @returns Array con elementos aleatorios únicos
 */
export function getRandomItems<T>(array: T[], count: number): T[] {
  if (count > array.length) {
    throw new Error(
      `Cannot get ${count} items from array of ${array.length} elements`
    );
  }

  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

/**
 * Mezclar un array (algoritmo Fisher-Yates)
 * @param array - Array a mezclar
 * @returns Nuevo array mezclado
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Obtener un número aleatorio en un rango (inclusive)
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @returns Número aleatorio entre min y max
 */
export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Obtener un booleano aleatorio
 * @returns true o false aleatoriamente
 */
export function getRandomBoolean(): boolean {
  return Math.random() < 0.5;
}

/**
 * Lanzar un dado con N caras
 * @param sides - Número de caras del dado (default: 6)
 * @returns Resultado del lanzamiento
 */
export function rollDice(sides: number = 6): number {
  return getRandomNumber(1, sides);
}

/**
 * Seleccionar un ganador basado en probabilidades ponderadas
 * @param items - Array de items con sus pesos
 * @returns Item seleccionado
 */
export function getWeightedRandomItem<T>(
  items: Array<{ item: T; weight: number }>
): T {
  const totalWeight = items.reduce((sum, { weight }) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const { item, weight } of items) {
    random -= weight;
    if (random <= 0) {
      return item;
    }
  }

  return items[items.length - 1].item;
}

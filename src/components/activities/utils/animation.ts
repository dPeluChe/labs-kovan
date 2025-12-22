/**
 * Animar un valor numérico de un valor inicial a uno final
 * @param from - Valor inicial
 * @param to - Valor final
 * @param duration - Duración en milisegundos
 * @param callback - Función llamada con cada valor intermedio
 * @param easing - Función de easing (default: linear)
 */
export function animateValue(
  from: number,
  to: number,
  duration: number,
  callback: (value: number) => void,
  easing: (t: number) => number = (t) => t
): void {
  const start = performance.now();
  const difference = to - from;

  function step(currentTime: number) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const value = from + difference * easedProgress;

    callback(value);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

/**
 * Funciones de easing comunes
 */
export const easing = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOutBounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
};

/**
 * Animar el conteo de un número
 * @param from - Valor inicial
 * @param to - Valor final
 * @param duration - Duración en milisegundos
 * @param callback - Función llamada con cada valor (como entero)
 */
export function animateCount(
  from: number,
  to: number,
  duration: number,
  callback: (value: number) => void
): void {
  animateValue(from, to, duration, (value) => {
    callback(Math.round(value));
  });
}

/**
 * Crear una animación escalonada para múltiples elementos
 * @param items - Array de elementos a animar
 * @param delay - Retraso entre cada elemento en ms
 * @param animationFn - Función de animación para cada elemento
 */
export function staggerAnimation<T>(
  items: T[],
  delay: number,
  animationFn: (item: T, index: number) => void
): void {
  items.forEach((item, index) => {
    setTimeout(() => {
      animationFn(item, index);
    }, index * delay);
  });
}

/**
 * Crear un delay (sleep)
 * @param ms - Milisegundos a esperar
 * @returns Promise que resuelve después del delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Detectar si el dispositivo soporta preferencias de movimiento reducido
 * @returns true si el usuario prefiere menos animación
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Obtener la duración de animación según las preferencias del usuario
 * @param normalDuration - Duración normal
 * @param reducedDuration - Duración reducida (default: 0)
 * @returns Duración ajustada
 */
export function getResponsiveDuration(
  normalDuration: number,
  reducedDuration: number = 0
): number {
  return prefersReducedMotion() ? reducedDuration : normalDuration;
}

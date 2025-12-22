import type { HeadsUpCategory, HeadsUpCard, HeadsUpCategoryConfig } from "../../types";

export interface HeadsUpGameProps {
  familyId: string;
  onComplete?: (score: number, skipped: number) => void;
}

export interface CategorySelectorProps {
  currentCategory: HeadsUpCategory;
  onCategoryChange: (category: HeadsUpCategory) => void;
}

export interface GameScreenProps {
  currentCard: HeadsUpCard | null;
  score: number;
  skipped: number;
  timeLeft: number;
  isPaused: boolean;
  onCorrect: () => void;
  onSkip: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

export interface GameSummaryProps {
  score: number;
  skipped: number;
  totalCards: number;
  onPlayAgain: () => void;
  onChangeCategory: () => void;
}

// Categorías predefinidas con sus cartas
export const HEADS_UP_CATEGORIES: Record<
  HeadsUpCategory,
  HeadsUpCategoryConfig
> = {
  peliculas: {
    id: "peliculas",
    name: "Películas",
    icon: "🎬",
    cards: [
      "Titanic",
      "El Rey León",
      "Avatar",
      "Los Vengadores",
      "Star Wars",
      "Harry Potter",
      "Toy Story",
      "Frozen",
      "Jurassic Park",
      "Matrix",
      "Spider-Man",
      "Batman",
      "Los Simpson",
      "Shrek",
      "Buscando a Nemo",
    ],
  },
  superheroes: {
    id: "superheroes",
    name: "Superhéroes",
    icon: "🦸",
    cards: [
      "Spider-Man",
      "Batman",
      "Superman",
      "Wonder Woman",
      "Iron Man",
      "Capitán América",
      "Thor",
      "Hulk",
      "Flash",
      "Aquaman",
      "Mujer Maravilla",
      "Wolverine",
      "Deadpool",
      "Black Panther",
    ],
  },
  canciones: {
    id: "canciones",
    name: "Canciones",
    icon: "🎵",
    cards: [
      "Despacito",
      "Shape of You",
      "Bohemian Rhapsody",
      "Thriller",
      "Billie Jean",
      "La Macarena",
      "Gangnam Style",
      "Rolling in the Deep",
      "Uptown Funk",
      "Sorry",
      "Bad Guy",
      "Old Town Road",
    ],
  },
  familiares: {
    id: "familiares",
    name: "Familiares",
    icon: "👨‍👩‍👧‍👦",
    cards: [], // Se llena dinámicamente con nombres de la familia
  },
  comida: {
    id: "comida",
    name: "Comida",
    icon: "🍕",
    cards: [
      "Pizza",
      "Hamburguesa",
      "Taco",
      "Sushi",
      "Pasta",
      "Pollo",
      "Ensalada",
      "Sopa",
      "Sandwich",
      "Burrito",
      "Hot Dog",
      "Tortilla",
      "Arroz",
      "Pescado",
      "Pan",
    ],
  },
  animales: {
    id: "animales",
    name: "Animales",
    icon: "🐶",
    cards: [
      "Perro",
      "Gato",
      "Elefante",
      "León",
      "Tigre",
      "Oso",
      "Mono",
      "Jirafa",
      "Zebra",
      "Canguro",
      "Pingüino",
      "Delfín",
      "Tortuga",
      "Serpiente",
      "Aguila",
    ],
  },
  custom: {
    id: "custom",
    name: "Personalizado",
    icon: "✏️",
    cards: [],
  },
};

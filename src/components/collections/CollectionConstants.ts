
import { Book, Gamepad2, Disc, Box } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CollectionType = "all" | "book" | "manga" | "comic" | "board_game" | "video_game" | "collectible" | "other";
export type CollectionStatus = "wishlist" | "owned_unread" | "in_progress" | "finished" | "abandoned";

export const TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
    book: { label: "Libro", icon: Book },
    manga: { label: "Manga", icon: Book },
    comic: { label: "Comic", icon: Book },
    board_game: { label: "Juego de Mesa", icon: Box },
    video_game: { label: "Videojuego", icon: Gamepad2 },
    collectible: { label: "Coleccionable", icon: Disc },
    other: { label: "Otro", icon: Box },
};

export const STATUS_LABELS: Record<string, string> = {
    wishlist: "Lista de deseos",
    owned_unread: "Por empezar",
    in_progress: "En progreso",
    finished: "Terminado",
    abandoned: "Abandonado",
};

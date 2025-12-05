import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Book, Plus, Trash2, Check, BookOpen, ShoppingCart } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

type FilterType = "all" | "book" | "manga" | "comic";
type FilterStatus = "all" | "pending" | "reading" | "finished";
type FilterOwned = "all" | "owned" | "wishlist";

const TYPE_LABELS = {
  book: "Libro",
  manga: "Manga",
  comic: "Comic",
};

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "badge-ghost", icon: "📚" },
  reading: { label: "Leyendo", color: "badge-warning", icon: "📖" },
  finished: { label: "Terminado", color: "badge-success", icon: "✅" },
};

export function LibraryPage() {
  const { currentFamily } = useFamily();
  const [showNewBook, setShowNewBook] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterOwned, setFilterOwned] = useState<FilterOwned>("all");

  const books = useQuery(
    api.library.getBooks,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  if (!currentFamily) return null;

  const filteredBooks = books?.filter((book) => {
    if (filterType !== "all" && book.type !== filterType) return false;
    if (filterStatus !== "all" && book.status !== filterStatus) return false;
    if (filterOwned === "owned" && !book.owned) return false;
    if (filterOwned === "wishlist" && book.owned) return false;
    return true;
  });

  // Group by collection
  const collections = new Map<string, typeof filteredBooks>();
  const standalone: typeof filteredBooks = [];

  filteredBooks?.forEach((book) => {
    if (book.collectionName) {
      const existing = collections.get(book.collectionName) || [];
      existing.push(book);
      collections.set(book.collectionName, existing);
    } else {
      standalone.push(book);
    }
  });

  return (
    <div className="pb-4">
      <PageHeader
        title="Librería"
        subtitle="Libros, mangas y cómics"
        action={
          <button
            onClick={() => setShowNewBook(true)}
            className="btn btn-primary btn-sm gap-1"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        }
      />

      {/* Filters */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto">
        <select
          className="select select-bordered select-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
        >
          <option value="all">Todos los tipos</option>
          <option value="book">Libros</option>
          <option value="manga">Manga</option>
          <option value="comic">Comics</option>
        </select>

        <select
          className="select select-bordered select-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
        >
          <option value="all">Todo estado</option>
          <option value="pending">Pendiente</option>
          <option value="reading">Leyendo</option>
          <option value="finished">Terminado</option>
        </select>

        <select
          className="select select-bordered select-sm"
          value={filterOwned}
          onChange={(e) => setFilterOwned(e.target.value as FilterOwned)}
        >
          <option value="all">Todos</option>
          <option value="owned">Propios</option>
          <option value="wishlist">Deseados</option>
        </select>
      </div>

      <div className="px-4">
        {books === undefined ? (
          <SkeletonPageContent cards={4} />
        ) : books.length === 0 ? (
          <EmptyState
            icon={Book}
            title="Librería vacía"
            description="Agrega tus libros, mangas y cómics"
            action={
              <button
                onClick={() => setShowNewBook(true)}
                className="btn btn-primary btn-sm"
              >
                Agregar libro
              </button>
            }
          />
        ) : filteredBooks?.length === 0 ? (
          <EmptyState
            icon={Book}
            title="Sin resultados"
            description="No hay libros con esos filtros"
          />
        ) : (
          <div className="space-y-4">
            {/* Collections */}
            {Array.from(collections.entries())
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([collectionName, collectionBooks]) => (
                <CollectionGroup
                  key={collectionName}
                  name={collectionName}
                  books={collectionBooks!}
                />
              ))}

            {/* Standalone books */}
            {standalone.length > 0 && (
              <div>
                {collections.size > 0 && (
                  <h3 className="font-semibold text-sm mb-2 text-base-content/60">Sin colección</h3>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {standalone.map((book) => (
                    <BookCard key={book._id} book={book} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showNewBook && currentFamily && (
        <NewBookModal
          familyId={currentFamily._id}
          onClose={() => setShowNewBook(false)}
        />
      )}
    </div>
  );
}

function CollectionGroup({
  name,
  books,
}: {
  name: string;
  books: Array<{
    _id: Id<"books">;
    type: "book" | "manga" | "comic";
    title: string;
    volumeNumber?: number;
    owned: boolean;
    status: "pending" | "reading" | "finished";
  }>;
}) {
  const sortedBooks = [...books].sort((a, b) => (a.volumeNumber || 0) - (b.volumeNumber || 0));
  const ownedCount = books.filter((b) => b.owned).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{name}</h3>
        <span className="badge badge-sm badge-ghost">
          {ownedCount}/{books.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {sortedBooks.map((book) => (
          <BookCard key={book._id} book={book} showVolume />
        ))}
      </div>
    </div>
  );
}

function BookCard({
  book,
  showVolume = false,
}: {
  book: {
    _id: Id<"books">;
    type: "book" | "manga" | "comic";
    title: string;
    author?: string;
    volumeNumber?: number;
    owned: boolean;
    status: "pending" | "reading" | "finished";
  };
  showVolume?: boolean;
}) {
  const updateBook = useMutation(api.library.updateBook);
  const deleteBook = useMutation(api.library.deleteBook);

  const statusConfig = STATUS_CONFIG[book.status];

  const cycleStatus = async () => {
    const statuses: Array<"pending" | "reading" | "finished"> = ["pending", "reading", "finished"];
    const currentIndex = statuses.indexOf(book.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    await updateBook({ bookId: book._id, status: nextStatus });
  };

  const toggleOwned = async () => {
    await updateBook({ bookId: book._id, owned: !book.owned });
  };

  return (
    <div className={`card bg-base-100 shadow-sm border ${book.owned ? "border-base-300" : "border-dashed border-base-300"}`}>
      <div className="card-body p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              {showVolume && book.volumeNumber && (
                <span className="badge badge-sm badge-primary">#{book.volumeNumber}</span>
              )}
              <span className="text-lg">{statusConfig.icon}</span>
            </div>
            <h4 className="font-medium text-sm truncate mt-1">
              {showVolume && book.volumeNumber ? `Vol. ${book.volumeNumber}` : book.title}
            </h4>
            {book.author && !showVolume && (
              <p className="text-xs text-base-content/60 truncate">{book.author}</p>
            )}
          </div>
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-xs btn-circle">
              ⋮
            </button>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-50 w-40 p-2 shadow-lg border border-base-300">
              <li>
                <button onClick={cycleStatus}>
                  <BookOpen className="w-4 h-4" /> Cambiar estado
                </button>
              </li>
              <li>
                <button onClick={toggleOwned}>
                  {book.owned ? <ShoppingCart className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  {book.owned ? "Marcar deseado" : "Marcar propio"}
                </button>
              </li>
              <li>
                <button onClick={() => deleteBook({ bookId: book._id })} className="text-error">
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-1 mt-1">
          <span className={`badge badge-xs ${statusConfig.color}`}>{statusConfig.label}</span>
          {!book.owned && <span className="badge badge-xs badge-outline">Deseado</span>}
        </div>
      </div>
    </div>
  );
}

function NewBookModal({
  familyId,
  onClose,
}: {
  familyId: Id<"families">;
  onClose: () => void;
}) {
  const [type, setType] = useState<"book" | "manga" | "comic">("book");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [volumeNumber, setVolumeNumber] = useState("");
  const [owned, setOwned] = useState(true);
  const [status, setStatus] = useState<"pending" | "reading" | "finished">("pending");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createBook = useMutation(api.library.createBook);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await createBook({
        familyId,
        type,
        title: title.trim(),
        author: author.trim() || undefined,
        collectionName: collectionName.trim() || undefined,
        volumeNumber: volumeNumber ? parseInt(volumeNumber) : undefined,
        owned,
        status,
        location: location.trim() || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">Nuevo libro</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Tipo</span>
            </label>
            <div className="flex gap-2">
              {(["book", "manga", "comic"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`btn btn-sm flex-1 ${type === t ? "btn-primary" : "btn-ghost"}`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Título *</span>
            </label>
            <input
              type="text"
              placeholder="Ej: El principito, One Piece"
              className="input input-bordered w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Autor</span>
            </label>
            <input
              type="text"
              placeholder="Nombre del autor"
              className="input input-bordered w-full"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          {(type === "manga" || type === "comic") && (
            <>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Colección</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: One Piece, Batman"
                  className="input input-bordered w-full"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Número de volumen</span>
                </label>
                <input
                  type="number"
                  placeholder="Ej: 1, 2, 3..."
                  className="input input-bordered w-full"
                  value={volumeNumber}
                  onChange={(e) => setVolumeNumber(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text">Estado</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="pending">Pendiente de leer</option>
              <option value="reading">Leyendo</option>
              <option value="finished">Terminado</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={owned}
                onChange={(e) => setOwned(e.target.checked)}
              />
              <span className="label-text">Ya lo tengo (no es wishlist)</span>
            </label>
          </div>

          {owned && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Ubicación</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Sala, cuarto, caja 1"
                className="input input-bordered w-full"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || !title.trim()}>
              {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Agregar"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}


import { MapPin, Star, Utensils, Coffee, Plane, Ticket, CheckCircle2, ExternalLink } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

interface PlaceCardProps {
    place: Doc<"places">;
    onClick: () => void;
    onCheckIn: (e: React.MouseEvent) => void;
}

export function PlaceCard({ place, onClick, onCheckIn }: PlaceCardProps) {

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case "restaurant": return <Utensils className="w-4 h-4" />;
            case "cafe": return <Coffee className="w-4 h-4" />;
            case "travel": return <Plane className="w-4 h-4" />;
            case "activity": return <Ticket className="w-4 h-4" />;
            default: return <MapPin className="w-4 h-4" />;
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case "restaurant": return "bg-orange-500/10 text-orange-600";
            case "cafe": return "bg-amber-700/10 text-amber-700";
            case "travel": return "bg-blue-500/10 text-blue-600";
            case "activity": return "bg-purple-500/10 text-purple-600";
            default: return "bg-slate-500/10 text-slate-600";
        }
    };

    return (
        <div
            onClick={onClick}
            className={`group relative bg-base-100 rounded-2xl border border-base-content/5 p-4 transition-all hover:shadow-lg hover:border-primary/20 cursor-pointer overflow-hidden ${place.visited ? 'opacity-80' : ''}`}
        >
            {/* Status Indicators */}
            {place.visited && (
                <div className="absolute top-4 right-4 z-10">
                    <div className="badge badge-success text-white badge-sm gap-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3" /> Visitado
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex gap-4">
                {/* Image / Icon */}
                <div className="shrink-0">
                    {place.imageUrl ? (
                        <img src={place.imageUrl} alt={place.name} className="w-20 h-20 rounded-xl object-cover shadow-sm bg-base-200" />
                    ) : (
                        <div className={`w-20 h-20 rounded-xl flex items-center justify-center ${getCategoryColor(place.category)}`}>
                            {getCategoryIcon(place.category)}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className={`badge badge-ghost badge-xs mb-1 uppercase font-bold tracking-wider ${getCategoryColor(place.category)} bg-opacity-20`}>
                                {place.category}
                            </div>
                            <h3 className="font-bold text-lg leading-tight truncate pr-2">{place.name}</h3>
                        </div>
                    </div>

                    {place.highlight && (
                        <p className="text-sm text-base-content/70 italic mt-1 line-clamp-1">"{place.highlight}"</p>
                    )}

                    <div className="flex items-center gap-2 mt-3 text-xs text-base-content/50">
                        {place.rating ? (
                            <div className="flex items-center text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                                <Star className="w-3 h-3 fill-current mr-1" /> {place.rating}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <Star className="w-3 h-3" /> Sin calificar
                            </div>
                        )}
                        {place.address && (
                            <div className="flex items-center gap-1 truncate max-w-[120px]">
                                <MapPin className="w-3 h-3" /> {place.address}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Area (Bottom) */}
            <div className="mt-4 pt-3 border-t border-base-content/5 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                    {place.mapsUrl && (
                        <a
                            href={place.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-xs btn-ghost gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink className="w-3 h-3" /> Maps
                        </a>
                    )}
                </div>
                <button
                    className="btn btn-xs btn-primary btn-outline gap-1"
                    onClick={onCheckIn}
                >
                    <CheckCircle2 className="w-3 h-3" /> {place.visited ? "Registrar visita" : "Check In"}
                </button>
            </div>
        </div>
    );
}

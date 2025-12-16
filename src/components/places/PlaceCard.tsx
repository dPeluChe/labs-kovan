
import { MapPin, Star, Utensils, Coffee, Plane, CheckCircle2, Ticket as ActivityIcon, Map, ExternalLink } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { SwipeableCard } from "../ui/SwipeableCard";

interface PlaceCardProps {
    place: Doc<"places">;
    onClick: () => void;
    onCheckIn: (e: React.MouseEvent | React.TouchEvent) => void;
}

export function PlaceCard({ place, onClick, onCheckIn }: PlaceCardProps) {
    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case "restaurant": return <Utensils className="w-4 h-4" />;
            case "cafe": return <Coffee className="w-4 h-4" />;
            case "travel": return <Plane className="w-4 h-4" />;
            case "activity": return <ActivityIcon className="w-4 h-4" />;
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
        <SwipeableCard
            className="mb-3"
            contentClassName={`relative bg-base-100 p-4 border border-base-content/5 rounded-2xl shadow-sm z-10 select-none ${place.visited ? 'bg-base-200' : ''}`}
            onClick={onClick}
            actions={({ close }) => (
                <>
                    {place.mapsUrl && (
                        <a
                            href={place.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-circle btn-sm btn-ghost bg-base-100 shadow-sm border border-base-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Map className="w-4 h-4 text-blue-500" />
                        </a>
                    )}
                    <button
                        className="btn btn-sm btn-primary shadow-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            close();
                            onCheckIn(e);
                        }}
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Check In
                    </button>
                </>
            )}
        >
            <div className="flex gap-4 items-center">
                {/* Icon */}
                <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${getCategoryColor(place.category)}`}>
                    {place.imageUrl ? (
                        <img src={place.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                        getCategoryIcon(place.category)
                    )}
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <h3 className={`font-bold text-base leading-tight truncate ${place.visited ? 'text-base-content/60' : 'text-base-content'}`}>
                            {place.name}
                        </h3>
                        {place.visited && (
                            <span className="text-[10px] font-bold text-success uppercase tracking-wider ml-2 flex items-center gap-0.5">
                                Visitado <CheckCircle2 className="w-3 h-3" />
                            </span>
                        )}
                    </div>

                    {place.highlight ? (
                        <p className="text-xs text-primary/80 font-medium truncate mb-1">{place.highlight}</p>
                    ) : (
                        <p className="text-xs text-base-content/50 capitalize mb-1">{place.category}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-base-content/60">
                        {place.rating ? (
                            <span className="flex items-center text-amber-500 font-bold">
                                <Star className="w-3 h-3 fill-current mr-0.5" /> {place.rating}
                            </span>
                        ) : (
                            <span className="flex items-center opacity-70">
                                <Star className="w-3 h-3 mr-0.5" /> --
                            </span>
                        )}

                        {place.address && (
                            <span className="flex items-center truncate max-w-[100px]">
                                <MapPin className="w-3 h-3 mr-0.5" /> {place.address}
                            </span>
                        )}
                    </div>
                </div>

                {/* Quick Access Links (Right Side) */}
                <div className="flex flex-col gap-2 shrink-0">
                    {place.mapsUrl && (
                        <a
                            href={place.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="btn btn-circle btn-ghost btn-xs text-base-content/40 hover:text-primary hover:bg-primary/10"
                        >
                            <Map className="w-4 h-4" />
                        </a>
                    )}
                    {place.url && (
                        <a
                            href={place.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="btn btn-circle btn-ghost btn-xs text-base-content/40 hover:text-pink-500 hover:bg-pink-500/10"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </div>

                {/* Visual Hint for Swipe */}
                <div className="w-1 h-8 rounded-full bg-base-200/50 self-center shrink-0" />
            </div>
        </SwipeableCard>
    );
}

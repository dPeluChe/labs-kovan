
import { ItemCard } from "./ItemCard";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { ConfirmOptions } from "../../hooks/useConfirmModal";

export function CollectionGroup({
    name,
    items,
    confirm,
}: {
    name: string;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    items: Doc<"collections">[];
}) {
    // Sort by volume if possible
    const sortedItems = [...items].sort((a, b) => {
        if (!a.volumeOrVersion) return 1;
        if (!b.volumeOrVersion) return -1;
        return a.volumeOrVersion.localeCompare(b.volumeOrVersion, undefined, { numeric: true });
    });

    const ownedCount = items.filter((b) => b.owned).length;

    return (
        <div className="bg-base-200/30 border border-base-200 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    {name}
                </h3>
                <span className={`badge badge-sm ${ownedCount === items.length ? "badge-success text-white" : "badge-ghost"}`}>
                    {ownedCount}/{items.length} adquiridos
                </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {sortedItems.map((item) => (
                    <ItemCard key={item._id} item={item} showVolume confirm={confirm} />
                ))}
            </div>
        </div>
    );
}

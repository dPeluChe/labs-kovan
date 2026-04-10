import { EmptyState } from "../ui/EmptyState";
import { User, Package, Gift, UserPlus } from "lucide-react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { RecipientCard } from "./RecipientCard";
import { UnassignedGiftItem } from "./UnassignedGiftItem";
import { STATUS_CONFIG, type GiftStatus } from "./GiftConstants";
import type { ConfirmOptions } from "../../hooks/useConfirmModal";

const STATUS_ICONS = STATUS_CONFIG;

interface GiftEventContentProps {
  filter: "all" | "pending" | "bought" | "gifts";
  eventCompleted: boolean;
  allGifts: Array<{ item: Doc<"giftItems">; recipientName: string; recipientId: string }>;
  recipientsWithItems: Array<{ recipient: Doc<"giftRecipients">; items: Doc<"giftItems">[] }>;
  unassignedGifts: Doc<"giftItems">[] | undefined;
  filteredData: Array<{ recipient: Doc<"giftRecipients">; items: Doc<"giftItems">[]; totalItems: number }>;
  confirmDialog: (options: ConfirmOptions) => Promise<boolean>;
  onEditItem: (item: Doc<"giftItems">) => void;
  onAddRecipient: () => void;
  onAddToPool: () => void;
  onAddItemToRecipient: (recipientId: Id<"giftRecipients">) => void;
}

export function GiftEventContent({
  filter,
  eventCompleted,
  allGifts,
  recipientsWithItems,
  unassignedGifts,
  filteredData,
  confirmDialog,
  onEditItem,
  onAddRecipient,
  onAddToPool,
  onAddItemToRecipient,
}: GiftEventContentProps) {
  return (
    <div className="px-4 py-4 space-y-4">
      {filter === "gifts" ? (
        allGifts.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="Sin regalos"
            description="Agrega regalos a tus receptores"
          />
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              {allGifts.map(({ item, recipientName, recipientId }) => {
                const isBought = ["bought", "wrapped", "delivered"].includes(item.status);
                const statusConfig = STATUS_ICONS[item.status as GiftStatus];

                return (
                  <div
                    key={item._id}
                    onClick={() => !eventCompleted && onEditItem(item)}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all animate-fade-in ${recipientId === "" ? "bg-warning/5 border-warning/20 hover:bg-warning/10" : "bg-base-100 border-base-200 hover:shadow-sm"} ${eventCompleted ? "opacity-75 cursor-default" : "cursor-pointer"}`}
                  >
                    <span>{statusConfig.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isBought ? "line-through opacity-60" : ""}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-base-content/50">
                        {recipientName === "Sin asignar" ? <span className="text-warning">Sin asignar</span> : `→ ${recipientName}`}
                      </p>
                    </div>
                    {item.priceEstimate && <span className="text-xs text-base-content/50">${item.priceEstimate}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : recipientsWithItems.length === 0 ? (
        <EmptyState
          icon={User}
          title="Sin receptores"
          description="Agrega personas a tu lista para empezar"
          action={
            !eventCompleted ? (
              <button onClick={onAddRecipient} className="btn btn-primary btn-sm">
                Agregar persona
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {filter === "all" && unassignedGifts && unassignedGifts.length > 0 && (
            <div className="card card-compact bg-base-200/50 border border-dashed border-base-300">
              <div className="card-body p-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Sin asignar</span>
                  <span className="badge badge-xs badge-primary">{unassignedGifts.length}</span>
                  <div className="flex-1" />
                  {!eventCompleted && (
                    <button onClick={onAddToPool} className="btn btn-ghost btn-xs">
                      <UserPlus className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {unassignedGifts.map((item: Doc<"giftItems">) => (
                    <UnassignedGiftItem
                      key={item._id}
                      item={item}
                      recipients={recipientsWithItems.map((r) => r.recipient)}
                      onEdit={() => onEditItem(item)}
                      confirmDialog={confirmDialog}
                      isEventArchived={eventCompleted}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-base-content/50 animate-fade-in">
              <p>No hay receptores con regalos {filter === "bought" ? "listos" : "pendientes"}</p>
            </div>
          ) : (
            <div className="space-y-3 stagger-children">
              {filteredData.map(({ recipient, items }) => (
                <RecipientCard
                  key={recipient._id}
                  recipient={recipient}
                  items={items}
                  onAddItem={() => onAddItemToRecipient(recipient._id)}
                  onEditItem={(item) => onEditItem(item)}
                  confirmDialog={confirmDialog}
                  isEventArchived={eventCompleted}
                />
              ))}
            </div>
          )}

          {filter === "all" && !eventCompleted && (
            <button
              onClick={onAddRecipient}
              className="btn btn-ghost btn-sm btn-block border-dashed border mt-2 text-base-content/50"
            >
              <UserPlus className="w-4 h-4" /> Agregar persona
            </button>
          )}
        </>
      )}
    </div>
  );
}

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { Gift, Heart, Book, Car, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const { currentFamily } = useFamily();

  const giftEvents = useQuery(
    api.gifts.getGiftEvents,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const healthSummary = useQuery(
    api.health.getHealthSummary,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const librarySummary = useQuery(
    api.library.getLibrarySummary,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const servicesSummary = useQuery(
    api.services.getServicesSummary,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const upcomingEvents = useQuery(
    api.calendar.getUpcomingEvents,
    currentFamily ? { familyId: currentFamily._id, limit: 3 } : "skip"
  );

  if (!currentFamily) {
    return <PageLoader />;
  }

  return (
    <div className="pb-4">
      <PageHeader
        title={`¡Hola! ${currentFamily.emoji || "🏠"}`}
        subtitle={currentFamily.name}
      />

      <div className="px-4 space-y-4 stagger-children">
        {/* Calendar Events */}
        <DashboardCard
          icon={Calendar}
          title="Próximos eventos"
          to="/calendar"
          color="bg-purple-500/10 text-purple-600"
        >
          {upcomingEvents === undefined ? (
            <div className="loading loading-dots loading-sm" />
          ) : upcomingEvents.length === 0 ? (
            <p className="text-sm text-base-content/60">No hay eventos próximos</p>
          ) : (
            <ul className="space-y-1">
              {upcomingEvents.map((event) => (
                <li key={event._id} className="text-sm flex justify-between">
                  <span className="truncate">{event.title}</span>
                  <span className="text-base-content/60 text-xs">
                    {new Date(event.startDateTime).toLocaleDateString("es-MX", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        {/* Gift Events */}
        <DashboardCard
          icon={Gift}
          title="Eventos de regalos"
          to="/gifts"
          color="bg-red-500/10 text-red-600"
        >
          {giftEvents === undefined ? (
            <div className="loading loading-dots loading-sm" />
          ) : giftEvents.length === 0 ? (
            <p className="text-sm text-base-content/60">No hay eventos activos</p>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{giftEvents.length}</span>
              <span className="text-sm text-base-content/60">
                {giftEvents.length === 1 ? "evento activo" : "eventos activos"}
              </span>
            </div>
          )}
        </DashboardCard>

        {/* Health Summary */}
        <DashboardCard
          icon={Heart}
          title="Salud"
          to="/health"
          color="bg-pink-500/10 text-pink-600"
        >
          {healthSummary === undefined ? (
            <div className="loading loading-dots loading-sm" />
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{healthSummary.profileCount}</span>
                <span className="text-sm text-base-content/60">
                  {healthSummary.profileCount === 1 ? "perfil" : "perfiles"}
                </span>
              </div>
              {healthSummary.activeMedications.length > 0 && (
                <p className="text-xs text-warning">
                  {healthSummary.activeMedications.length} medicación(es) activa(s)
                </p>
              )}
            </div>
          )}
        </DashboardCard>

        {/* Library Summary */}
        <DashboardCard
          icon={Book}
          title="Librería"
          to="/library"
          color="bg-blue-500/10 text-blue-600"
        >
          {librarySummary === undefined ? (
            <div className="loading loading-dots loading-sm" />
          ) : (
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-semibold">{librarySummary.owned}</span>
                <span className="text-base-content/60 ml-1">propios</span>
              </div>
              <div>
                <span className="font-semibold">{librarySummary.byStatus.reading}</span>
                <span className="text-base-content/60 ml-1">leyendo</span>
              </div>
              <div>
                <span className="font-semibold">{librarySummary.wishlist}</span>
                <span className="text-base-content/60 ml-1">deseados</span>
              </div>
            </div>
          )}
        </DashboardCard>

        {/* Services Summary */}
        <DashboardCard
          icon={Car}
          title="Servicios y autos"
          to="/services"
          color="bg-green-500/10 text-green-600"
        >
          {servicesSummary === undefined ? (
            <div className="loading loading-dots loading-sm" />
          ) : (
            <div className="space-y-1">
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-semibold">{servicesSummary.serviceCount}</span>
                  <span className="text-base-content/60 ml-1">servicios</span>
                </div>
                <div>
                  <span className="font-semibold">{servicesSummary.vehicleCount}</span>
                  <span className="text-base-content/60 ml-1">vehículos</span>
                </div>
              </div>
              {servicesSummary.upcomingVehicleEvents.length > 0 && (
                <p className="text-xs text-warning">
                  {servicesSummary.upcomingVehicleEvents.length} evento(s) próximo(s)
                </p>
              )}
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}

function DashboardCard({
  icon: Icon,
  title,
  to,
  color,
  children,
}: {
  icon: typeof Gift;
  title: string;
  to: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Link to={to} className="card bg-base-100 shadow-sm border border-base-300 card-interactive">
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${color} transition-transform group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">{title}</h3>
            {children}
          </div>
        </div>
      </div>
    </Link>
  );
}

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Calendar, LayoutDashboard, Plane, DollarSign, Lightbulb, Pencil } from "lucide-react";
import { AnimatedTabs } from "../components/ui/AnimatedTabs";
import { DetailHeader } from "../components/ui/DetailHeader";
import { TripOverviewTab } from "../components/trips/tabs/TripOverviewTab";
import { TripBookingsTab } from "../components/trips/tabs/TripBookingsTab";
import { TripFinancesTab } from "../components/trips/tabs/TripFinancesTab";
import { TripIdeasTab } from "../components/trips/tabs/TripIdeasTab";
import { TripItineraryTab } from "../components/trips/tabs/TripItineraryTab";
import { EditTripModal } from "../components/trips/modals/EditTripModal";
import { TripPlanDetailModal } from "../components/trips/modals/TripPlanDetailModal";
import { AddPlanModal } from "../components/trips/modals/AddPlanModal";
import { useAuth } from "../contexts/AuthContext";
import type { Id } from "../../convex/_generated/dataModel";

export function TripDetailPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { sessionToken } = useAuth();
  const trip = useQuery(api.trips.getTrip, tripId && sessionToken ? { sessionToken, tripId: tripId as Id<"trips"> } : "skip");
  const plans = useQuery(api.trips.getTripPlans, tripId && sessionToken ? { sessionToken, tripId: tripId as Id<"trips"> } : "skip");
  const bookings = useQuery(api.trips.getTripBookings, tripId && sessionToken ? { sessionToken, tripId: tripId as Id<"trips"> } : "skip");
  const deletePlan = useMutation(api.trips.deleteTripPlan);
  const toggleCompletion = useMutation(api.trips.togglePlanCompletion);

  const [activeTab, setActiveTab] = useState("overview");
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [preselectedPlaceId, setPreselectedPlaceId] = useState<Id<"places"> | undefined>(undefined);
  const [selectedPlanId, setSelectedPlanId] = useState<Id<"tripPlans"> | undefined>(undefined);
  const [planToEditId, setPlanToEditId] = useState<Id<"tripPlans"> | undefined>(undefined);

  if (trip === undefined || plans === undefined || bookings === undefined) return null;
  if (trip === null) return <div>Viaje no encontrado</div>;

  const tabs = [
    { id: "overview", label: "Resumen", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "itinerary", label: "Itinerario", icon: <Calendar className="w-5 h-5" /> },
    { id: "bookings", label: "Reservas", icon: <Plane className="w-5 h-5" /> },
    { id: "finances", label: "Finanzas", icon: <DollarSign className="w-5 h-5" /> },
    { id: "ideas", label: "Ideas", icon: <Lightbulb className="w-5 h-5" /> },
  ];

  return (
    <div className="pb-24">
      <DetailHeader
        title={trip.name}
        subtitle={
          <>
            {trip.destination && <span>{trip.destination} • </span>}
            {trip.status}
          </>
        }
        onBack={() => navigate(-1)}
        action={
          <button onClick={() => setIsEditOpen(true)} className="btn btn-ghost btn-circle btn-sm">
            <Pencil className="w-4 h-4" />
          </button>
        }
        tabs={
          <AnimatedTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        }
      />

      <div className="p-4 space-y-6">
        {activeTab === "overview" && (
          <TripOverviewTab tripId={tripId as Id<"trips">} onChangeTab={setActiveTab} />
        )}

        {activeTab === "itinerary" && (
          <TripItineraryTab
            trip={trip}
            plans={plans}
            bookings={bookings}
            onDeletePlan={(planId) => sessionToken && deletePlan({ sessionToken, planId })}
            onTogglePlan={(planId) => sessionToken && toggleCompletion({ sessionToken, planId })}
            onSelectPlan={setSelectedPlanId}
            onOpenAddPlan={() => setIsAddPlanOpen(true)}
            onOpenEditTrip={() => setIsEditOpen(true)}
          />
        )}

        {activeTab === "bookings" && (
          <TripBookingsTab tripId={tripId as Id<"trips">} />
        )}

        {activeTab === "finances" && (
          <TripFinancesTab tripId={tripId as Id<"trips">} />
        )}

        {activeTab === "ideas" && (
          <TripIdeasTab
            tripId={tripId as Id<"trips">}
            onAddToItinerary={(place) => {
              setPreselectedPlaceId(place._id);
              setIsAddPlanOpen(true);
            }}
          />
        )}
      </div>

      {isAddPlanOpen && (
        <AddPlanModal
          tripId={tripId as Id<"trips">}
          familyId={trip.familyId}
          placeListId={trip.placeListId}
          initialPlaceId={preselectedPlaceId}
          minDate={trip.startDate}
          maxDate={trip.endDate}
          editPlanId={planToEditId}
          onClose={() => {
            setIsAddPlanOpen(false);
            setPreselectedPlaceId(undefined);
            setPlanToEditId(undefined);
          }}
        />
      )}

      {isEditOpen && (
        <EditTripModal
          sessionToken={sessionToken ?? ""}
          trip={trip}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {selectedPlanId && (
        <TripPlanDetailModal
          planId={selectedPlanId}
          onClose={() => setSelectedPlanId(undefined)}
          onEdit={() => {
            setPlanToEditId(selectedPlanId);
            setSelectedPlanId(undefined);
            setIsAddPlanOpen(true);
          }}
          onDelete={() => {
            if (sessionToken) deletePlan({ sessionToken, planId: selectedPlanId });
            setSelectedPlanId(undefined);
          }}
          onToggleCompletion={() => {
            if (sessionToken) toggleCompletion({ sessionToken, planId: selectedPlanId });
          }}
        />
      )}
    </div>
  );
}


import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { useConfirmModal } from "../hooks/useConfirmModal";
import {
  ArrowLeft,
  Trash2,
  Stethoscope,
  Pill,
  User,
  Cat,
  TestTube,
  ShoppingBag,
} from "lucide-react";
import type { Id, Doc } from "../../convex/_generated/dataModel";

// Components
import { RecordsTab } from "../components/health/RecordsTab";
import { StudiesTab } from "../components/health/StudiesTab";
import { MedicationsTab } from "../components/health/MedicationsTab";
import { NutritionTab } from "../components/health/NutritionTab";

// Modals
import { AddRecordModal } from "../components/health/modals/AddRecordModal";
import { AddStudyModal } from "../components/health/modals/AddStudyModal";
import { AddMedicationModal } from "../components/health/modals/AddMedicationModal";
import { AddNutritionModal } from "../components/health/modals/AddNutritionModal";
import { RecordDetailModal } from "../components/health/modals/RecordDetailModal";
import { StudyDetailModal } from "../components/health/modals/StudyDetailModal";

type Tab = "records" | "medications" | "studies" | "nutrition";

export function HealthProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("records");

  // Modal states
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showAddStudy, setShowAddStudy] = useState(false);
  const [showAddNutrition, setShowAddNutrition] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<Doc<"medicalRecords"> | null>(null);
  const [selectedStudy, setSelectedStudy] = useState<Doc<"medicalStudies"> | null>(null);

  const { confirm, ConfirmModal } = useConfirmModal();

  const profile = useQuery(
    api.health.getPersonProfile,
    profileId ? { personId: profileId as Id<"personProfiles"> } : "skip"
  );

  const records = useQuery(
    api.health.getMedicalRecords,
    profileId ? { personId: profileId as Id<"personProfiles"> } : "skip"
  );

  const medications = useQuery(
    api.health.getAllMedications,
    profileId ? { personId: profileId as Id<"personProfiles"> } : "skip"
  );

  const studies = useQuery(
    api.health.getStudies,
    profileId ? { personId: profileId as Id<"personProfiles"> } : "skip"
  );

  const deleteProfile = useMutation(api.health.deletePersonProfile);

  if (!profileId) return null;
  if (profile === undefined) return <PageLoader />;
  if (profile === null) {
    navigate("/health");
    return null;
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Eliminar perfil",
      message: `¿Estás seguro de que quieres eliminar el perfil de ${profile.name} y todo su historial médico? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "danger",
      icon: "trash",
    });

    if (confirmed) {
      await deleteProfile({ personId: profileId as Id<"personProfiles"> });
      navigate("/health");
    }
  };

  const Icon = profile.type === "pet" ? Cat : User;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-base-100 border-b border-base-300 sticky top-0 z-20">
        <button onClick={() => navigate("/health")} className="btn btn-ghost btn-sm btn-circle">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className={`p-2 rounded-lg ${profile.type === "pet" ? "bg-orange-500/10" : "bg-pink-500/10"}`}>
          <Icon className={`w-5 h-5 ${profile.type === "pet" ? "text-orange-600" : "text-pink-600"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{profile.name}</h1>
          <p className="text-sm text-base-content/60">{profile.relation}</p>
        </div>
        <button onClick={handleDelete} className="btn btn-ghost btn-sm btn-circle text-error">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4 bg-base-100 pb-2 sticky top-14 z-10 overflow-x-auto">
        <div className="flex gap-1 bg-base-200 p-1 rounded-xl min-w-max sm:min-w-0">
          <TabButton
            active={activeTab === "records"}
            onClick={() => setActiveTab("records")}
            icon={Stethoscope}
            label="Consultas"
          />
          <TabButton
            active={activeTab === "studies"}
            onClick={() => setActiveTab("studies")}
            icon={TestTube}
            label="Estudios"
          />
          <TabButton
            active={activeTab === "medications"}
            onClick={() => setActiveTab("medications")}
            icon={Pill}
            label="Meds"
          />
          {profile.type === "pet" && (
            <TabButton
              active={activeTab === "nutrition"}
              onClick={() => setActiveTab("nutrition")}
              icon={ShoppingBag}
              label="Alimentación"
            />
          )}
        </div>
      </div>

      <div className="px-4 py-2">
        {activeTab === "records" && (
          <RecordsTab
            records={records}
            onAdd={() => setShowAddRecord(true)}
            onSelect={setSelectedRecord}
          />
        )}

        {activeTab === "studies" && (
          <StudiesTab
            studies={studies}
            onAdd={() => setShowAddStudy(true)}
            onSelect={setSelectedStudy}
          />
        )}

        {activeTab === "medications" && (
          <MedicationsTab
            medications={medications}
            onAdd={() => setShowAddMedication(true)}
          />
        )}

        {activeTab === "nutrition" && profile.type === "pet" && (
          <NutritionTab
            personId={profileId as Id<"personProfiles">}
            onAdd={() => setShowAddNutrition(true)}
            confirmDialog={confirm}
          />
        )}
      </div>

      {/* MODALS */}
      {showAddRecord && (
        <div className="modal modal-open">
          <div className="modal-box max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Nueva consulta</h3>
            <AddRecordModal
              personId={profileId as Id<"personProfiles">}
              onClose={() => setShowAddRecord(false)}
            />
          </div>
          <div className="modal-backdrop" onClick={() => setShowAddRecord(false)} />
        </div>
      )}

      {showAddStudy && (
        <div className="modal modal-open">
          <div className="modal-box max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Nuevo estudio</h3>
            <AddStudyModal
              personId={profileId as Id<"personProfiles">}
              onClose={() => setShowAddStudy(false)}
            />
          </div>
          <div className="modal-backdrop" onClick={() => setShowAddStudy(false)} />
        </div>
      )}

      {showAddMedication && (
        <div className="modal modal-open">
          <div className="modal-box max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Nueva medicación</h3>
            <AddMedicationModal
              personId={profileId as Id<"personProfiles">}
              onClose={() => setShowAddMedication(false)}
            />
          </div>
          <div className="modal-backdrop" onClick={() => setShowAddMedication(false)} />
        </div>
      )}

      {showAddNutrition && (
        <div className="modal modal-open">
          <div className="modal-box max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Registrar alimentación</h3>
            <AddNutritionModal
              personId={profileId as Id<"personProfiles">}
              onClose={() => setShowAddNutrition(false)}
            />
          </div>
          <div className="modal-backdrop" onClick={() => setShowAddNutrition(false)} />
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          confirm={confirm}
        />
      )}

      {/* Study Detail Modal */}
      {selectedStudy && (
        <StudyDetailModal
          study={selectedStudy}
          onClose={() => setSelectedStudy(null)}
          confirm={confirm}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal />
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${active
        ? "bg-primary text-primary-content shadow-sm"
        : "text-base-content/60 hover:text-base-content hover:bg-base-300"
        }`}
      onClick={onClick}
    >
      <Icon className={`w-4 h-4 ${active ? "" : "opacity-60"}`} />
      <span className="hidden sm:inline">{label}</span>
      {/* Show text on mobile if active? maybe not to save space */}
    </button>
  );
}
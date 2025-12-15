
import { useState, useEffect } from "react";
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
    Cat,
    TestTube,
    ShoppingBag,
    Pencil,
    CakeIcon
} from "lucide-react";
import type { Id, Doc } from "../../convex/_generated/dataModel";
import { ShiftingTabs } from "../components/ui/ShiftingTabs";

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
import { EditProfileModal } from "../components/health/modals/EditProfileModal";

type Tab = "records" | "medications" | "studies" | "nutrition";

export function PetProfilePage() {
    const { profileId } = useParams<{ profileId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>("records");

    // Modal states
    const [showAddRecord, setShowAddRecord] = useState(false);
    const [showAddMedication, setShowAddMedication] = useState(false);
    const [showAddStudy, setShowAddStudy] = useState(false);
    const [showAddNutrition, setShowAddNutrition] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);

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

    // Redirect if not found or not a pet
    useEffect(() => {
        if (profile === null || (profile && profile.type !== "pet")) {
            navigate("/pets");
        }
    }, [profile, navigate]);

    if (!profileId || profile === undefined) return <PageLoader />;
    if (profile === null || profile.type !== "pet") return null;

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: "Eliminar perfil",
            message: `¿Estás seguro de que quieres eliminar a ${profile.name} y todo su historial? Esta acción no se puede deshacer.`,
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "danger",
            icon: "trash",
        });

        if (confirmed) {
            await deleteProfile({ personId: profileId as Id<"personProfiles"> });
            navigate("/pets");
        }
    };

    const calculateAge = (birthDate: number) => {
        const now = new Date();
        const birth = new Date(birthDate);
        const diff = now.getTime() - birth.getTime();
        const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));

        if (years > 0) return `${years} años${months > 0 ? ` ${months} meses` : ''}`;
        return `${months} meses`;
    };

    const tabs = [
        { id: "records", icon: Stethoscope, label: "Consultas" },
        { id: "studies", icon: TestTube, label: "Estudios" },
        { id: "medications", icon: Pill, label: "Meds" },
        { id: "nutrition", icon: ShoppingBag, label: "Alimentación" },
    ];

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-base-100 border-b border-base-300 sticky top-0 z-20">
                <button onClick={() => navigate("/pets")} className="btn btn-ghost btn-sm btn-circle">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="p-2 rounded-lg bg-orange-500/10">
                    <Cat className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-end gap-2">
                        <h1 className="text-lg font-bold truncate leading-none">{profile.name}</h1>
                        {profile.nickname && (
                            <span className="text-xs text-base-content/60 italic leading-none mb-0.5">"{profile.nickname}"</span>
                        )}
                    </div>
                    <div className="flex items-center text-sm text-base-content/60 gap-2">
                        <span>{profile.relation}</span>
                        {profile.birthDate && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <CakeIcon className="w-3 h-3" />
                                    {calculateAge(profile.birthDate)}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <button onClick={() => setShowEditProfile(true)} className="btn btn-ghost btn-sm btn-circle">
                    <Pencil className="w-4 h-4" />
                </button>
                <button onClick={handleDelete} className="btn btn-ghost btn-sm btn-circle text-error">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Tabs */}
            <div className="px-4 pt-4 bg-base-100 pb-2 sticky top-14 z-10 overflow-x-auto">
                <ShiftingTabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={(id) => setActiveTab(id as Tab)}
                />
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

                {activeTab === "nutrition" && (
                    <NutritionTab
                        personId={profileId as Id<"personProfiles">}
                        onAdd={() => setShowAddNutrition(true)}
                        confirmDialog={confirm}
                    />
                )}
            </div>

            {/* MODALS */}
            {showEditProfile && (
                <EditProfileModal
                    profile={profile}
                    onClose={() => setShowEditProfile(false)}
                />
            )}

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
                <AddNutritionModal
                    personId={profileId as Id<"personProfiles">}
                    onClose={() => setShowAddNutrition(false)}
                />
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

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { DateInput } from "../components/ui/DateInput";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Stethoscope,
  FileText,
  Pill,
  User,
  Cat,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

type Tab = "records" | "medications";

export function HealthProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("records");
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);

  const profile = useQuery(
    api.health.getPersonProfile,
    profileId ? { personId: profileId as Id<"personProfiles"> } : "skip"
  );

  const records = useQuery(
    api.health.getMedicalRecords,
    profileId ? { personId: profileId as Id<"personProfiles"> } : "skip"
  );

  const medications = useQuery(
    api.health.getMedications,
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
    if (confirm(`¿Eliminar el perfil de ${profile.name} y todo su historial?`)) {
      await deleteProfile({ personId: profileId as Id<"personProfiles"> });
      navigate("/health");
    }
  };

  const Icon = profile.type === "pet" ? Cat : User;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-base-100 border-b border-base-300">
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
      <div className="tabs tabs-boxed bg-base-200 mx-4 mt-4 p-1">
        <button
          className={`tab flex-1 ${activeTab === "records" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("records")}
        >
          <Stethoscope className="w-4 h-4 mr-1" /> Consultas
        </button>
        <button
          className={`tab flex-1 ${activeTab === "medications" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("medications")}
        >
          <Pill className="w-4 h-4 mr-1" /> Medicación
        </button>
      </div>

      <div className="px-4 py-4">
        {activeTab === "records" ? (
          <RecordsTab
            records={records}
            onAdd={() => setShowAddRecord(true)}
          />
        ) : (
          <MedicationsTab
            medications={medications}
            onAdd={() => setShowAddMedication(true)}
          />
        )}
      </div>

      {showAddRecord && (
        <AddRecordModal
          personId={profileId as Id<"personProfiles">}
          onClose={() => setShowAddRecord(false)}
        />
      )}

      {showAddMedication && (
        <AddMedicationModal
          personId={profileId as Id<"personProfiles">}
          onClose={() => setShowAddMedication(false)}
        />
      )}
    </div>
  );
}

function RecordsTab({
  records,
  onAdd,
}: {
  records: Array<{
    _id: Id<"medicalRecords">;
    type: string;
    title: string;
    description?: string;
    date: number;
    doctorName?: string;
    clinicName?: string;
  }> | undefined;
  onAdd: () => void;
}) {
  const deleteRecord = useMutation(api.health.deleteMedicalRecord);

  if (records === undefined) return <PageLoader />;

  return (
    <>
      <button onClick={onAdd} className="btn btn-outline btn-sm w-full gap-2 mb-4">
        <Plus className="w-4 h-4" />
        Agregar consulta
      </button>

      {records.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin registros"
          description="Agrega consultas médicas y estudios"
        />
      ) : (
        <div className="space-y-3">
          {records
            .sort((a, b) => b.date - a.date)
            .map((record) => (
              <div
                key={record._id}
                className="card bg-base-100 shadow-sm border border-base-300"
              >
                <div className="card-body p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-sm badge-ghost">
                          {record.type === "consultation" ? "Consulta" : record.type === "study" ? "Estudio" : "Nota"}
                        </span>
                        <span className="text-xs text-base-content/60">
                          {new Date(record.date).toLocaleDateString("es-MX")}
                        </span>
                      </div>
                      <h4 className="font-semibold">{record.title}</h4>
                      {record.description && (
                        <p className="text-sm text-base-content/70 mt-1">{record.description}</p>
                      )}
                      {(record.doctorName || record.clinicName) && (
                        <p className="text-xs text-base-content/50 mt-1">
                          {[record.doctorName, record.clinicName].filter(Boolean).join(" - ")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteRecord({ recordId: record._id })}
                      className="btn btn-ghost btn-xs btn-circle text-error"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
}

function MedicationsTab({
  medications,
  onAdd,
}: {
  medications: Array<{
    _id: Id<"medications">;
    name: string;
    dosage: string;
    startDate: number;
    endDate?: number;
    notes?: string;
  }> | undefined;
  onAdd: () => void;
}) {
  const deleteMedication = useMutation(api.health.deleteMedication);
  // Initialize timestamp once via useState initializer
  const [now] = useState(() => Date.now());

  if (medications === undefined) return <PageLoader />;

  const active = medications.filter((m) => !m.endDate || m.endDate > now);
  const past = medications.filter((m) => m.endDate && m.endDate <= now);

  return (
    <>
      <button onClick={onAdd} className="btn btn-outline btn-sm w-full gap-2 mb-4">
        <Plus className="w-4 h-4" />
        Agregar medicación
      </button>

      {medications.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="Sin medicaciones"
          description="Registra tratamientos y medicinas"
        />
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 text-success">Activas</h3>
              <div className="space-y-2">
                {active.map((med) => (
                  <MedicationCard key={med._id} medication={med} onDelete={() => deleteMedication({ medicationId: med._id })} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 text-base-content/60">Finalizadas</h3>
              <div className="space-y-2">
                {past.map((med) => (
                  <MedicationCard key={med._id} medication={med} onDelete={() => deleteMedication({ medicationId: med._id })} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function MedicationCard({
  medication,
  onDelete,
}: {
  medication: {
    _id: Id<"medications">;
    name: string;
    dosage: string;
    startDate: number;
    endDate?: number;
  };
  onDelete: () => void;
}) {
  // Initialize timestamp once via useState initializer
  const [now] = useState(() => Date.now());
  const isActive = !medication.endDate || medication.endDate > now;

  return (
    <div className={`card bg-base-100 shadow-sm border ${isActive ? "border-success/30" : "border-base-300"}`}>
      <div className="card-body p-3">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold text-sm">{medication.name}</h4>
            <p className="text-xs text-base-content/70">{medication.dosage}</p>
            <p className="text-xs text-base-content/50 mt-1">
              {new Date(medication.startDate).toLocaleDateString("es-MX")}
              {medication.endDate && ` - ${new Date(medication.endDate).toLocaleDateString("es-MX")}`}
            </p>
          </div>
          <button onClick={onDelete} className="btn btn-ghost btn-xs btn-circle text-error">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddRecordModal({
  personId,
  onClose,
}: {
  personId: Id<"personProfiles">;
  onClose: () => void;
}) {
  const [type, setType] = useState<"consultation" | "study" | "note">("consultation");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [doctorName, setDoctorName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createRecord = useMutation(api.health.createMedicalRecord);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await createRecord({
        personId,
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        date: new Date(date).getTime(),
        doctorName: doctorName.trim() || undefined,
        clinicName: clinicName.trim() || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">Nueva consulta/estudio</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Tipo</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              <option value="consultation">Consulta</option>
              <option value="study">Estudio</option>
              <option value="note">Nota</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Título *</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Chequeo general, Análisis de sangre"
              className="input input-bordered w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <DateInput
            label="Fecha"
            value={date}
            onChange={setDate}
          />

          <div className="form-control">
            <label className="label">
              <span className="label-text">Descripción</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Notas, resultados, observaciones..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Doctor</span>
              </label>
              <input
                type="text"
                placeholder="Nombre"
                className="input input-bordered w-full"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Clínica</span>
              </label>
              <input
                type="text"
                placeholder="Nombre"
                className="input input-bordered w-full"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || !title.trim()}>
              {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

function AddMedicationModal({
  personId,
  onClose,
}: {
  personId: Id<"personProfiles">;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createMedication = useMutation(api.health.createMedication);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) return;

    setIsLoading(true);
    try {
      await createMedication({
        personId,
        name: name.trim(),
        dosage: dosage.trim(),
        startDate: new Date(startDate).getTime(),
        endDate: endDate ? new Date(endDate).getTime() : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Nueva medicación</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Medicamento *</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Paracetamol, Amoxicilina"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Dosis *</span>
            </label>
            <input
              type="text"
              placeholder="Ej: 1 tableta cada 8 horas"
              className="input input-bordered w-full"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <DateInput
              label="Inicio"
              value={startDate}
              onChange={setStartDate}
            />
            <DateInput
              label="Fin (opcional)"
              value={endDate}
              onChange={setEndDate}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Notas</span>
            </label>
            <input
              type="text"
              placeholder="Indicaciones adicionales..."
              className="input input-bordered w-full"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !name.trim() || !dosage.trim()}
            >
              {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

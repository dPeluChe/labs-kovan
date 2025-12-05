import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { DateInput } from "../components/ui/DateInput";
import { useConfirmModal } from "../components/ui/ConfirmModal";
import { Input } from "../components/ui/Input";
import { ImageUpload } from "../components/ui/ImageUpload";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Stethoscope,
  FileText,
  Pill,
  User,
  Cat,
  TestTube,
  Clock,
  X,
  Download,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

type Tab = "records" | "medications" | "studies";

export function HealthProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("records");
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showAddStudy, setShowAddStudy] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [selectedStudy, setSelectedStudy] = useState<any | null>(null);
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
    <div className="pb-4">
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
      <div className="px-4 pt-4 bg-base-100 pb-2 sticky top-14 z-10">
        <div className="tabs tabs-boxed bg-base-200 p-1 grid grid-cols-3">
          <button
            className={`tab ${activeTab === "records" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("records")}
          >
            <Stethoscope className="w-4 h-4 mr-1" /> Consultas
          </button>
          <button
            className={`tab ${activeTab === "studies" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("studies")}
          >
            <TestTube className="w-4 h-4 mr-1" /> Estudios
          </button>
          <button
            className={`tab ${activeTab === "medications" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("medications")}
          >
            <Pill className="w-4 h-4 mr-1" /> Meds
          </button>
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
      </div>

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

function RecordsTab({
  records,
  onAdd,
  onSelect,
}: {
  records: any[] | undefined;
  onAdd: () => void;
  onSelect: (record: any) => void;
}) {
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
          description="Agrega consultas médicas y notas"
        />
      ) : (
        <div className="space-y-3 animate-fade-in">
          {records
            .sort((a, b) => b.date - a.date)
            .map((record) => (
              <div
                key={record._id}
                onClick={() => onSelect(record)}
                className="card bg-base-100 shadow-sm border border-base-300 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="card-body p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-sm badge-ghost">
                          {record.type === "consultation" ? "Consulta" : "Nota"}
                        </span>
                        <span className="text-xs text-base-content/60">
                          {new Date(record.date).toLocaleDateString("es-MX")}
                        </span>
                      </div>
                      <h4 className="font-semibold">{record.title}</h4>
                      {record.description && (
                        <p className="text-sm text-base-content/70 mt-1 line-clamp-2">{record.description}</p>
                      )}
                      {(record.doctorName || record.clinicName) && (
                        <p className="text-xs text-base-content/50 mt-1">
                          {[record.doctorName, record.clinicName].filter(Boolean).join(" - ")}
                        </p>
                      )}
                    </div>
                    <Stethoscope className="w-4 h-4 text-base-content/30 flex-shrink-0" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
}

function StudiesTab({
  studies,
  onAdd,
  onSelect,
}: {
  studies: any[] | undefined;
  onAdd: () => void;
  onSelect: (study: any) => void;
}) {
  if (studies === undefined) return <PageLoader />;

  return (
    <>
      <button onClick={onAdd} className="btn btn-outline btn-sm w-full gap-2 mb-4">
        <Plus className="w-4 h-4" />
        Agregar estudio
      </button>

      {studies.length === 0 ? (
        <EmptyState
          icon={TestTube}
          title="Sin estudios"
          description="Registra análisis de laboratorio y resultados"
        />
      ) : (
        <div className="space-y-3 animate-fade-in">
          {studies
            .sort((a, b) => b.date - a.date)
            .map((study) => (
              <div
                key={study._id}
                onClick={() => onSelect(study)}
                className="card bg-base-100 shadow-sm border border-base-300 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="card-body p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-base-content/60 mb-1">
                        {new Date(study.date).toLocaleDateString("es-MX")}
                      </div>
                      <h4 className="font-semibold">{study.title}</h4>
                      {study.laboratory && (
                        <p className="text-xs text-base-content/50">{study.laboratory}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {study.fileStorageId && (
                        <Download className="w-4 h-4 text-primary" />
                      )}
                      <TestTube className="w-4 h-4 text-base-content/30" />
                    </div>
                  </div>

                  {/* Results Preview - show first 3 */}
                  {study.results.length > 0 && (
                    <div className="bg-base-200/50 rounded-lg p-2 space-y-1 mt-2">
                      {study.results.slice(0, 3).map((result: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm border-b border-base-200 last:border-0 pb-1 last:pb-0">
                          <span className="text-base-content/70">{result.parameter}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.value} {result.unit}</span>
                            {result.status === "high" && <span className="text-error text-xs">↑</span>}
                            {result.status === "low" && <span className="text-warning text-xs">↓</span>}
                          </div>
                        </div>
                      ))}
                      {study.results.length > 3 && (
                        <p className="text-xs text-base-content/50 text-center pt-1">
                          +{study.results.length - 3} más...
                        </p>
                      )}
                    </div>
                  )}
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
  medications: any[] | undefined;
  onAdd: () => void;
}) {
  const deleteMedication = useMutation(api.health.deleteMedication);
  const [showHistory, setShowHistory] = useState(false);

  if (medications === undefined) return <PageLoader />;

  const active = medications.filter((m) => m.isActive);
  const past = medications.filter((m) => !m.isActive);

  return (
    <>
      <button onClick={onAdd} className="btn btn-outline btn-sm w-full gap-2 mb-4">
        <Plus className="w-4 h-4" />
        Agregar medicación
      </button>

      <div className="space-y-6 animate-fade-in">
        {/* Active Medications */}
        <div>
          <h3 className="font-semibold text-sm mb-3 text-success flex items-center gap-2">
            <Pill className="w-4 h-4" /> Activas ({active.length})
          </h3>
          {active.length === 0 ? (
            <div className="text-center py-4 bg-base-200/30 rounded-lg border border-dashed border-base-300">
              <p className="text-sm text-base-content/50">No hay medicaciones activas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {active.map((med) => (
                <MedicationCard key={med._id} medication={med} onDelete={() => deleteMedication({ medicationId: med._id })} />
              ))}
            </div>
          )}
        </div>

        {/* History Toggle */}
        {past.length > 0 && (
          <div>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm font-medium text-base-content/60 hover:text-base-content transition-colors w-full"
            >
              <Clock className="w-4 h-4" />
              Historial ({past.length})
              {showHistory ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>
            
            {showHistory && (
              <div className="mt-3 space-y-2 animate-slide-down">
                {past.map((med) => (
                  <MedicationCard key={med._id} medication={med} onDelete={() => deleteMedication({ medicationId: med._id })} isPast />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function MedicationCard({
  medication,
  onDelete,
  isPast
}: {
  medication: any;
  onDelete: () => void;
  isPast?: boolean;
}) {
  return (
    <div className={`card bg-base-100 shadow-sm border ${isPast ? "border-base-200 opacity-75" : "border-success/30"}`}>
      <div className="card-body p-3">
        <div className="flex justify-between items-start">
          <div>
            <h4 className={`font-semibold text-sm ${isPast ? "text-base-content/70" : ""}`}>{medication.name}</h4>
            <p className="text-xs text-base-content/70">{medication.dosage}</p>
            <p className="text-xs text-base-content/50 mt-1">
              {new Date(medication.startDate).toLocaleDateString("es-MX")}
              {medication.endDate && ` - ${new Date(medication.endDate).toLocaleDateString("es-MX")}`}
            </p>
          </div>
          <button onClick={onDelete} className="btn btn-ghost btn-xs btn-circle text-base-content/30 hover:text-error">
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
  const [type] = useState<"consultation" | "study" | "note">("consultation");
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Título *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ej: Chequeo general"
      />

      <DateInput
        label="Fecha"
        value={date}
        onChange={setDate}
      />

      <div className="form-control">
        <label className="label"><span className="label-text">Descripción</span></label>
        <textarea
          className="textarea textarea-bordered w-full"
          placeholder="Notas, resultados, observaciones..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Doctor"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          placeholder="Dr. House"
        />
        <Input
          label="Clínica"
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
          placeholder="Hospital General"
        />
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
  );
}

function AddStudyModal({
  personId,
  onClose,
}: {
  personId: Id<"personProfiles">;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [laboratory, setLaboratory] = useState("");
  const [storageId, setStorageId] = useState<Id<"_storage"> | null>(null);
  const [results, setResults] = useState<Array<{parameter: string, value: string, unit: string, status: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const createStudy = useMutation(api.health.createStudy);

  const addResult = () => {
    setResults([...results, { parameter: "", value: "", unit: "", status: "normal" }]);
  };

  const updateResult = (index: number, field: string, value: string) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value };
    setResults(newResults);
  };

  const removeResult = (index: number) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await createStudy({
        personId,
        title: title.trim(),
        date: new Date(date).getTime(),
        laboratory: laboratory.trim() || undefined,
        fileStorageId: storageId || undefined,
        results: results.filter(r => r.parameter && r.value).map(r => ({
          parameter: r.parameter,
          value: r.value,
          unit: r.unit,
          status: r.status as "normal" | "high" | "low"
        })),
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre del estudio *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ej: Biometría Hemática"
      />

      <div className="grid grid-cols-2 gap-2">
        <DateInput label="Fecha" value={date} onChange={setDate} />
        <Input
          label="Laboratorio"
          value={laboratory}
          onChange={(e) => setLaboratory(e.target.value)}
          placeholder="Lab. Chopo"
        />
      </div>

      <div className="divider text-xs">Resultados clave</div>

      <div className="space-y-2">
        {results.map((result, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-12 gap-2">
              <input
                className="input input-bordered input-sm col-span-5"
                placeholder="Parámetro (Glucosa)"
                value={result.parameter}
                onChange={(e) => updateResult(index, "parameter", e.target.value)}
              />
              <input
                className="input input-bordered input-sm col-span-3"
                placeholder="Valor"
                value={result.value}
                onChange={(e) => updateResult(index, "value", e.target.value)}
              />
              <input
                className="input input-bordered input-sm col-span-2"
                placeholder="Unidad"
                value={result.unit}
                onChange={(e) => updateResult(index, "unit", e.target.value)}
              />
              <select
                className="select select-bordered select-sm col-span-2 px-1"
                value={result.status}
                onChange={(e) => updateResult(index, "status", e.target.value)}
              >
                <option value="normal">OK</option>
                <option value="high">Alto</option>
                <option value="low">Bajo</option>
              </select>
            </div>
            <button type="button" onClick={() => removeResult(index)} className="btn btn-ghost btn-xs btn-circle text-error">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={addResult} className="btn btn-ghost btn-sm text-primary gap-1 w-full border border-dashed border-base-300">
          <Plus className="w-3 h-3" /> Agregar resultado
        </button>
      </div>

      <div className="divider text-xs">Archivo adjunto</div>
      
      <ImageUpload
        label="Foto del resultado"
        value={storageId ?? undefined}
        onChange={(id) => setStorageId(id)}
      />
      
      <div className="modal-action">
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={isLoading || !title.trim()}>
          {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
        </button>
      </div>
    </form>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Medicamento *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej: Paracetamol, Amoxicilina"
      />

      <Input
        label="Dosis *"
        value={dosage}
        onChange={(e) => setDosage(e.target.value)}
        placeholder="Ej: 1 tableta cada 8 horas"
      />

      <div className="grid grid-cols-2 gap-2">
        <DateInput label="Inicio" value={startDate} onChange={setStartDate} />
        <DateInput label="Fin (opcional)" value={endDate} onChange={setEndDate} />
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text">Notas</span></label>
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Indicaciones adicionales..."
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
  );
}

// ==================== DETAIL MODALS ====================

function RecordDetailModal({
  record,
  onClose,
  confirm,
}: {
  record: any;
  onClose: () => void;
  confirm: (options: any) => Promise<boolean>;
}) {
  const deleteRecord = useMutation(api.health.deleteMedicalRecord);

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Eliminar registro",
      message: "¿Estás seguro de que quieres eliminar este registro médico?",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "danger",
      icon: "trash",
    });
    if (confirmed) {
      await deleteRecord({ recordId: record._id });
      onClose();
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-sm badge-ghost">
                {record.type === "consultation" ? "Consulta" : "Nota"}
              </span>
              <span className="text-sm text-base-content/60">
                {new Date(record.date).toLocaleDateString("es-MX", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <h3 className="font-bold text-xl">{record.title}</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Doctor/Clinic Info */}
        {(record.doctorName || record.clinicName) && (
          <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg mb-4">
            <Stethoscope className="w-5 h-5 text-primary" />
            <div>
              {record.doctorName && <p className="font-medium">{record.doctorName}</p>}
              {record.clinicName && <p className="text-sm text-base-content/60">{record.clinicName}</p>}
            </div>
          </div>
        )}

        {/* Description */}
        {record.description && (
          <div className="mb-4">
            <label className="label"><span className="label-text font-medium">Descripción</span></label>
            <p className="text-base-content/80 whitespace-pre-wrap">{record.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="modal-action">
          <button className="btn btn-error btn-outline" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

function StudyDetailModal({
  study,
  onClose,
  confirm,
}: {
  study: any;
  onClose: () => void;
  confirm: (options: any) => Promise<boolean>;
}) {
  const deleteStudy = useMutation(api.health.deleteStudy);

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Eliminar estudio",
      message: "¿Estás seguro de que quieres eliminar este estudio médico?",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "danger",
      icon: "trash",
    });
    if (confirmed) {
      await deleteStudy({ studyId: study._id });
      onClose();
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm text-base-content/60 mb-1">
              {new Date(study.date).toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <h3 className="font-bold text-xl">{study.title}</h3>
            {study.laboratory && (
              <p className="text-sm text-base-content/60">{study.laboratory}</p>
            )}
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Attachment */}
        {study.fileStorageId && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg mb-4">
            <Download className="w-5 h-5 text-primary" />
            <span className="text-sm">Archivo adjunto disponible</span>
            <button className="btn btn-primary btn-xs ml-auto">Ver archivo</button>
          </div>
        )}

        {/* Results Table */}
        {study.results.length > 0 && (
          <div className="mb-4">
            <label className="label"><span className="label-text font-medium">Resultados</span></label>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Parámetro</th>
                    <th className="text-right">Valor</th>
                    <th className="text-right">Unidad</th>
                    <th className="text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {study.results.map((result: any, idx: number) => (
                    <tr key={idx}>
                      <td>{result.parameter}</td>
                      <td className="text-right font-medium">{result.value}</td>
                      <td className="text-right text-base-content/60">{result.unit || "-"}</td>
                      <td className="text-center">
                        {result.status === "high" && (
                          <span className="badge badge-error badge-xs">Alto ↑</span>
                        )}
                        {result.status === "low" && (
                          <span className="badge badge-warning badge-xs">Bajo ↓</span>
                        )}
                        {result.status === "normal" && (
                          <span className="badge badge-success badge-xs">Normal</span>
                        )}
                        {!result.status && "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notes */}
        {study.notes && (
          <div className="mb-4">
            <label className="label"><span className="label-text font-medium">Notas</span></label>
            <p className="text-base-content/80 whitespace-pre-wrap">{study.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="modal-action">
          <button className="btn btn-error btn-outline" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
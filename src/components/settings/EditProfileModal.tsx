import { Input } from "../ui/Input";
import { MobileModal } from "../ui/MobileModal";

interface EditProfileModalProps {
  isOpen: boolean;
  userEmail: string;
  editName: string;
  onChangeName: (value: string) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}

export function EditProfileModal({
  isOpen,
  userEmail,
  editName,
  onChangeName,
  onClose,
  onSubmit,
}: EditProfileModalProps) {
  if (!isOpen) return null;

  return (
    <MobileModal isOpen={true} onClose={onClose} title="Editar perfil">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!editName.trim()) return;
          await onSubmit();
        }}
        className="space-y-4"
      >
        <Input
          label="Nombre"
          value={editName}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Tu nombre"
          autoFocus
        />
        <div className="form-control">
          <label className="label">
            <span className="label-text">Email</span>
          </label>
          <input
            type="email"
            value={userEmail}
            className="input input-bordered w-full bg-base-200"
            disabled
          />
          <label className="label">
            <span className="label-text-alt text-base-content/50">
              El email se usa para iniciar sesión y no puede cambiarse
            </span>
          </label>
        </div>
        <div className="modal-action">
          <button
            type="button"
            className="btn"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!editName.trim()}
          >
            Guardar
          </button>
        </div>
      </form>
    </MobileModal>
  );
}

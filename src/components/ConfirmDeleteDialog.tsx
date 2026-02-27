import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import Dialog from "./Dialog";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  confirmLabel?: string;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  isOpen,
  title,
  description,
  onClose,
  onConfirm,
  loading = false,
  confirmLabel = "Excluir",
}) => (
  <Dialog isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900">
            Essa ação não pode ser desfeita.
          </p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </div>
  </Dialog>
);

export default ConfirmDeleteDialog;

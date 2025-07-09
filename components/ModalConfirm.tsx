import { stripPrefix } from "@/utils/string.util";

type ModalConfirmProps = {
  onClose: () => void;
  handleDeleteFile: (key: string, isFolder: boolean) => Promise<void>;
  fileKey: string;
  isFolder: boolean;
  prefix: string;
};

export default function ModalConfirm({
  onClose,
  handleDeleteFile,
  fileKey,
  isFolder,
  prefix,
}: ModalConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">
          Delete {isFolder ? "Folder" : "File"} Permanently?
        </h2>

        <p className="mb-2 text-sm text-gray-700">
          The {isFolder ? "folder" : "file"}{" "}
          <span className="font-bold text-red-600">
            {stripPrefix(fileKey as string, prefix)}
          </span>{" "}
          will be
          <span className="font-bold text-red-600"> permanently deleted</span>.
        </p>
        <p className="mb-6 text-xs text-gray-500">
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDeleteFile(fileKey as string, isFolder)}
            className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

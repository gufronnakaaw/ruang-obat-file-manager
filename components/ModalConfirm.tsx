import { stripPrefix } from "@/utils/string.util";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

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
    <Modal isOpen={true} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          Delete {isFolder ? "Folder" : "File"} Permanently?
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-700">
            The {isFolder ? "folder" : "file"}{" "}
            <span className="font-bold text-red-600">
              {stripPrefix(fileKey as string, prefix)}
            </span>{" "}
            will be
            <span className="font-bold text-red-600"> permanently deleted</span>
            .
          </p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="danger"
            onPress={() => handleDeleteFile(fileKey as string, isFolder)}
          >
            Delete Permanently
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

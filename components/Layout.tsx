import { SuccessResponse } from "@/types/global.type";
import { fetcher } from "@/utils/fetcher";
import {
  formatDateFancy,
  formatFileSize,
  getStorageUrl,
  stripPrefix,
} from "@/utils/string.util";
import {
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Spinner,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import {
  ArrowsCounterClockwiseIcon,
  CaretDownIcon,
  CaretUpIcon,
  CloudArrowUpIcon,
  DownloadSimpleIcon,
  FileIcon,
  FileImageIcon,
  FilesIcon,
  FileTextIcon,
  FileVideoIcon,
  FolderPlusIcon,
  FolderSimpleIcon,
  GlobeHemisphereEastIcon,
  LinkIcon,
  LockKeyIcon,
  PencilIcon,
  SignOutIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from "@phosphor-icons/react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { ChangeEvent, DragEvent, useState } from "react";
import toast from "react-hot-toast";
import { KeyedMutator } from "swr";
import Breadcrumb from "./Breadcrumb";
import FolderBack from "./FolderBack";
import { LogoRuangObat } from "./LogoRuangObat";
import ModalConfirm from "./ModalConfirm";

function getFileIcon(name: string) {
  const lowerName = name.toLowerCase();

  if (lowerName.endsWith("/")) {
    return <FolderSimpleIcon size={20} className="text-yellow-500" />;
  }

  if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(lowerName)) {
    return <FileImageIcon size={20} className="text-pink-500" />;
  }

  if (/\.(mp4|mov|avi|mkv|webm)$/i.test(lowerName)) {
    return <FileVideoIcon size={20} className="text-purple-500" />;
  }

  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(lowerName)) {
    return <FileTextIcon size={20} className="text-blue-500" />;
  }

  return <FileIcon size={20} className="text-gray-400" />;
}

type LayoutProps = {
  data: {
    Key: string;
    LastModified?: Date | null;
    Size: number;
    IsFolder: boolean;
  }[];
  isLoading: boolean;
  isValidating: boolean;
  prefix: string;
  mutate: KeyedMutator<any>;
};

export default function Layout({
  data,
  isLoading,
  prefix,
  mutate,
  isValidating,
}: LayoutProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; progress: number; is_loading: boolean }[]
  >([]);
  const [requests, setRequests] = useState<XMLHttpRequest[]>([]);
  const [value, setValue] = useState("");
  const [newName, setNewName] = useState("");
  const [isUploadExpanded, setIsUploadExpanded] = useState(true);
  const [confirmData, setConfirmData] = useState<{
    key: string;
    isFolder: boolean;
  }>({ key: "", isFolder: false });
  const [renameData, setRenameData] = useState<{
    oldKey: string;
    isFolder: boolean;
  }>({ oldKey: "", isFolder: false });

  const folderModal = useDisclosure();
  const uploadModal = useDisclosure();
  const confirmModal = useDisclosure();
  const renameModal = useDisclosure();

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    uploadModal.onClose();

    handleUploadAll(Array.from(e.dataTransfer.files));
  }

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    uploadModal.onClose();
    handleUploadAll(Array.from(files));
  }

  async function handleUploadAll(files: File[]) {
    setUploadedFiles(
      files.map((file) => ({
        name: file.name,
        progress: 0,
        is_loading: true,
      })),
    );

    try {
      const response: SuccessResponse<{ key: string; url: string }[]> =
        await fetcher({
          url: "/storage/presigned",
          method: "POST",
          data: {
            files: files.map((file) => ({
              filename: file.name,
              type: file.type,
            })),
            folder: prefix,
            by: session?.user.fullname,
          },
          type: "internal",
        }).finally(() => {
          setUploadedFiles((prev) =>
            prev.map((f) => ({ ...f, is_loading: false })),
          );
        });

      setIsUploadExpanded(true);

      const newRequests: XMLHttpRequest[] = [];

      files.forEach((file, i) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", response.data[i].url);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (event) => {
          const percent = Math.round((event.loaded / event.total) * 100);

          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.name === file.name ? { ...f, progress: percent } : f,
            ),
          );
        };

        xhr.onload = () => {
          setUploadedFiles((prev) => {
            const updated = [...prev];
            updated.splice(i, 1);
            return updated;
          });
          setRequests((prev) => {
            const updated = [...prev];
            updated.splice(i, 1);
            return updated;
          });

          toast.success(`${file.name} uploaded`, {
            position: "bottom-right",
          });
        };

        xhr.onloadend = () => {
          setUploadedFiles((prev) => {
            const next = prev.filter((f) => f.name !== file.name);
            if (next.length === 0) {
              mutate();
            }
            return next;
          });
        };

        xhr.onerror = () => {
          setUploadedFiles((prev) => {
            const updated = [...prev];
            updated.splice(i, 1);
            return updated;
          });
          setRequests((prev) => {
            const updated = [...prev];
            updated.splice(i, 1);
            return updated;
          });

          toast.error(`${file.name} failed`, {
            position: "bottom-right",
          });
        };

        xhr.onabort = () => {
          setUploadedFiles((prev) => {
            const updated = [...prev];
            updated.splice(i, 1);
            return updated;
          });
          setRequests((prev) => {
            const updated = [...prev];
            updated.splice(i, 1);
            return updated;
          });

          toast.error(`${file.name} canceled`, { position: "bottom-right" });
        };

        xhr.send(file);
        newRequests.push(xhr);
      });

      setRequests(newRequests);
    } catch (error) {
      console.log(error);
      setUploadedFiles([]);
      toast.error("Failed to get presigned URLs");
    }
  }

  function handleCancelAll() {
    requests.forEach((xhr) => xhr.abort());
  }

  function handleCancelSingle(i: number) {
    if (requests[i]) {
      requests[i].abort();
    }
  }

  async function handleDeleteFile(key: string, isFolder: boolean) {
    try {
      confirmModal.onClose();

      await toast.promise(
        fetcher({
          url: `/storage?key=${encodeURIComponent(key)}&is_folder=${isFolder}`,
          method: "DELETE",
          type: "internal",
        }),
        {
          loading: `Deleting ${isFolder ? "folder" : "file"}...`,
          success: `${isFolder ? "Folder" : "File"} deleted successfully`,
          error: `Failed to delete ${isFolder ? "folder" : "file"}`,
        },
      );

      mutate();
    } catch (error) {
      console.error(error);
    } finally {
      confirmModal.onClose();
      setConfirmData({ key: "", isFolder: false });
    }
  }

  async function handleDownloadFile(key: string) {
    try {
      let url = "";

      if (router.asPath.includes("private")) {
        const response: SuccessResponse<{ url: string }> = await toast.promise(
          fetcher({
            url: `/storage/signed?key=${encodeURIComponent(key)}`,
            method: "GET",
            type: "internal",
          }),
          {
            loading: "Getting signed URL...",
          },
        );

        url = response.data.url;
      } else {
        url = `${getStorageUrl()}/${key}`;
      }

      const res = await toast.promise(fetch(url), {
        loading: "Downloading file...",
        success: "File downloaded successfully",
        error: "Failed to download file",
      });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = stripPrefix(key, prefix);
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.log(error);
      toast.error("Failed to download file");
    }
  }

  async function handleCreateFolder() {
    folderModal.onClose();
    try {
      await toast.promise(
        fetcher({
          url: "/storage/folders",
          method: "POST",
          data: {
            name: value.trim(),
            folder: prefix,
            by: session?.user.fullname,
          },
          type: "internal",
        }),
        {
          loading: "Creating folder...",
          success: "Folder created successfully",
          error: "Failed to create folder",
        },
      );

      mutate();
      setValue("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create folder");
    }
  }

  async function getSignedUrl(key: string) {
    try {
      const response: SuccessResponse<{ url: string }> = await toast.promise(
        fetcher({
          url: `/storage/signed?key=${encodeURIComponent(key)}`,
          method: "GET",
          type: "internal",
        }),
        {
          loading: "Getting signed URL...",
          success: "Signed URL retrieved successfully",
          error: "Failed to get signed URL",
        },
      );

      return response.data.url;
    } catch (error) {
      console.error(error);
      toast.error("Failed to get signed URL");
    }
  }

  async function handleRename() {
    try {
      const oldKey = renameData.oldKey;
      let newKey = oldKey;

      if (renameData.isFolder) {
        const parts = oldKey.replace(/\/$/, "").split("/");
        parts[parts.length - 1] = newName;
        newKey = parts.join("/") + "/";
      } else {
        const parts = oldKey.split("/");
        const oldFileName = parts[parts.length - 1];
        const extMatch = oldFileName.match(/\.[^\.]+$/);
        const ext = extMatch ? extMatch[0] : "";
        parts[parts.length - 1] = newName + ext;
        newKey = parts.join("/");
      }

      await toast.promise(
        fetcher({
          url: "/storage/rename",
          method: "POST",
          data: {
            oldKey,
            newKey,
            isFolder: renameData.isFolder,
          },
          type: "internal",
        }),
        {
          loading: "Renaming...",
          success: "Rename success",
          error: "Rename failed",
        },
      );
      renameModal.onClose();
      setRenameData({ oldKey: "", isFolder: false });
      setNewName("");
      mutate();
    } catch (err) {
      toast.error("Rename failed");
    }
  }

  const lastModified = data.length
    ? data.reduce((latest, current) =>
        new Date(current.LastModified as Date) >
        new Date(latest?.LastModified as Date)
          ? current
          : latest,
      ).LastModified
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <LogoRuangObat className="h-8 w-8 text-gray-800" />
            <span className="text-lg font-semibold text-gray-800">
              RuangObat <span className="font-normal text-gray-500">Files</span>
            </span>
          </div>

          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button className="flex cursor-pointer items-center gap-3 rounded-full border border-gray-200 py-1.5 pr-1.5 pl-3 transition-all hover:border-[#6238C3]/30 hover:bg-[#6238C3]/5">
                <span className="text-sm font-medium text-gray-700">
                  {session?.user.fullname}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6238C3] text-white">
                  <UserIcon size={16} weight="bold" />
                </div>
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem
                key="logout"
                startContent={<SignOutIcon size={18} />}
                onPress={() => signOut()}
                className="text-danger"
                color="danger"
              >
                Logout
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-4">
          <Breadcrumb basePath="/" rootLabel="Home" />
        </div>

        {router.pathname !== "/" && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="flat"
                startContent={<FilesIcon size={18} />}
                onPress={uploadModal.onOpen}
                className="bg-[#6238C3] text-white shadow-sm transition-all hover:bg-[#5230a8]"
              >
                Upload
              </Button>
              <Button
                size="sm"
                variant="flat"
                startContent={<FolderPlusIcon size={18} />}
                onPress={folderModal.onOpen}
                className="border border-[#6238C3] bg-transparent text-[#6238C3] transition-all hover:bg-[#6238C3]/10"
              >
                New Folder
              </Button>
              <Tooltip content="Refresh">
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onPress={() => mutate()}
                  disabled={isLoading || isValidating}
                >
                  <ArrowsCounterClockwiseIcon
                    size={18}
                    className={`text-[#6238C3] ${isLoading || isValidating ? "animate-spin" : ""}`}
                  />
                </Button>
              </Tooltip>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              {isLoading || isValidating ? (
                <Spinner
                  size="sm"
                  classNames={{
                    circle1: "border-b-[#6238C3]",
                    circle2: "border-b-[#6238C3]",
                  }}
                />
              ) : (
                <>
                  <span>
                    <strong className="text-gray-700">
                      {data.filter((item) => item.IsFolder).length}
                    </strong>{" "}
                    folders
                  </span>
                  <span>
                    <strong className="text-gray-700">
                      {data.filter((item) => !item.IsFolder).length}
                    </strong>{" "}
                    files
                  </span>
                  <span>
                    <strong className="text-gray-700">
                      {data.length
                        ? formatFileSize(
                            data.reduce(
                              (acc, item) => acc + (item.Size || 0),
                              0,
                            ),
                          )
                        : "0 B"}
                    </strong>{" "}
                    total
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Modified
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {router.pathname !== "/" && <FolderBack router={router} />}
                  {isLoading || isValidating ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center">
                        <Spinner
                          size="sm"
                          color="secondary"
                          classNames={{
                            circle1: "border-b-[#6238C3]",
                            circle2: "border-b-[#6238C3]",
                          }}
                        />
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-12 text-center text-gray-500"
                      >
                        No files or folders
                      </td>
                    </tr>
                  ) : (
                    data.map((file) => (
                      <tr
                        key={file.Key}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div
                            className="flex cursor-pointer items-center gap-3 hover:text-[#6238C3]"
                            onClick={async () => {
                              if (file.IsFolder) {
                                router.push({
                                  pathname: `${router.asPath}/${stripPrefix(file.Key, prefix)}`,
                                });
                              } else {
                                if (router.asPath.includes("private")) {
                                  const url = await getSignedUrl(file.Key);
                                  window.open(url, "_blank");
                                } else {
                                  window.open(
                                    `${getStorageUrl()}/${file.Key}`,
                                    "_blank",
                                  );
                                }
                              }
                            }}
                          >
                            {getFileIcon(file.Key)}
                            <span className="max-w-[300px] truncate font-medium">
                              {stripPrefix(file.Key, prefix)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {file.Size ? formatFileSize(file.Size) : " "}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {file?.LastModified
                            ? formatDateFancy(file?.LastModified)
                            : " "}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {!file.IsFolder ? (
                              <>
                                <Tooltip content="Copy Link">
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={async () => {
                                      try {
                                        await navigator.clipboard.writeText(
                                          `${getStorageUrl()}/${file.Key}`,
                                        );
                                        toast.success("Link copied");
                                      } catch (err) {
                                        toast.error("Link copy failed");
                                        console.error(err);
                                      }
                                    }}
                                  >
                                    <LinkIcon size={18} />
                                  </Button>
                                </Tooltip>
                                <Tooltip content="Rename">
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => {
                                      let nameOnly = file.Key;
                                      if (file.IsFolder) {
                                        nameOnly =
                                          file.Key.replace(/\/$/, "")
                                            .split("/")
                                            .pop() || "";
                                      } else {
                                        const fileName =
                                          file.Key.split("/").pop() || "";
                                        nameOnly = fileName.replace(
                                          /\.[^\.]+$/,
                                          "",
                                        );
                                      }
                                      setRenameData({
                                        oldKey: file.Key,
                                        isFolder: file.IsFolder,
                                      });
                                      setNewName(nameOnly);
                                      renameModal.onOpen();
                                    }}
                                  >
                                    <PencilIcon size={18} />
                                  </Button>
                                </Tooltip>
                                <Tooltip content="Download">
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => handleDownloadFile(file.Key)}
                                  >
                                    <DownloadSimpleIcon size={18} />
                                  </Button>
                                </Tooltip>
                                <Tooltip content="Delete">
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    onPress={() => {
                                      setConfirmData({
                                        key: file.Key,
                                        isFolder: file.IsFolder,
                                      });
                                      confirmModal.onOpen();
                                    }}
                                  >
                                    <TrashIcon size={18} />
                                  </Button>
                                </Tooltip>
                              </>
                            ) : (
                              <>
                                {router.pathname !== "/" && (
                                  <>
                                    <Tooltip content="Rename">
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        onPress={() => {
                                          let nameOnly = file.Key;
                                          if (file.IsFolder) {
                                            nameOnly =
                                              file.Key.replace(/\/$/, "")
                                                .split("/")
                                                .pop() || "";
                                          } else {
                                            const fileName =
                                              file.Key.split("/").pop() || "";
                                            nameOnly = fileName.replace(
                                              /\.[^\.]+$/,
                                              "",
                                            );
                                          }
                                          setRenameData({
                                            oldKey: file.Key,
                                            isFolder: file.IsFolder,
                                          });
                                          setNewName(nameOnly);
                                          renameModal.onOpen();
                                        }}
                                      >
                                        <PencilIcon size={18} />
                                      </Button>
                                    </Tooltip>
                                    <Tooltip content="Delete">
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => {
                                          setConfirmData({
                                            key: file.Key,
                                            isFolder: file.IsFolder,
                                          });
                                          confirmModal.onOpen();
                                        }}
                                      >
                                        <TrashIcon size={18} />
                                      </Button>
                                    </Tooltip>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {router.pathname == "/" && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card className="border-l-4 border-l-amber-500">
              <CardBody className="flex flex-row gap-4">
                <LockKeyIcon size={32} className="text-amber-500" />
                <div>
                  <h3 className="font-semibold">Private Folder</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Restricted files not for public sharing such as learning
                    videos, digital books, and internal materials.
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardBody className="flex flex-row gap-4">
                <GlobeHemisphereEastIcon size={32} className="text-blue-500" />
                <div>
                  <h3 className="font-semibold">Public Folder</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Assets for public access such as flashcard images,
                    illustrations, and freely shareable content.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="fixed right-6 bottom-4 z-50 w-80 overflow-hidden rounded-lg bg-white shadow-xl">
          <div
            className="flex cursor-pointer items-center justify-between bg-[#6238C3] px-4 py-3 text-white"
            onClick={() => setIsUploadExpanded(!isUploadExpanded)}
          >
            <div className="flex items-center gap-2">
              <CloudArrowUpIcon size={20} />
              <span className="font-medium">
                Uploading {uploadedFiles.length} file
                {uploadedFiles.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {isUploadExpanded ? (
                <CaretDownIcon size={18} />
              ) : (
                <CaretUpIcon size={18} />
              )}
              <button
                className="ml-1 rounded p-1 hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelAll();
                }}
              >
                <XIcon size={16} />
              </button>
            </div>
          </div>
          {isUploadExpanded && (
            <div className="max-h-64 overflow-y-auto">
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="border-b border-gray-100 px-4 py-3 last:border-b-0"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="max-w-[200px] truncate text-sm text-gray-700">
                      {file.name}
                    </span>
                    {file.is_loading ? (
                      <Spinner
                        size="sm"
                        color="secondary"
                        classNames={{
                          circle1: "border-b-[#6238C3]",
                          circle2: "border-b-[#6238C3]",
                        }}
                      />
                    ) : (
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        isIconOnly
                        onPress={() => handleCancelSingle(idx)}
                      >
                        <XIcon size={14} />
                      </Button>
                    )}
                  </div>
                  <Progress
                    value={file.progress}
                    size="sm"
                    classNames={{
                      indicator: "bg-[#6238C3]",
                    }}
                  />
                  <span className="mt-1 block text-xs text-gray-400">
                    {file.progress}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={folderModal.isOpen} onClose={folderModal.onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-gray-100 bg-[#6238C3] px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <FolderPlusIcon size={24} />
              <span className="text-lg font-semibold">Create Folder</span>
            </div>
          </ModalHeader>
          <ModalBody className="p-6">
            <Input
              label="Folder name"
              placeholder="Enter folder name"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              variant="bordered"
              classNames={{
                inputWrapper: "focus-within:border-[#6238C3]",
              }}
            />
          </ModalBody>
          <ModalFooter className="border-t border-gray-100">
            <Button variant="flat" onPress={folderModal.onClose}>
              Cancel
            </Button>
            <Button
              className="bg-[#6238C3] text-white hover:bg-[#5230a8]"
              onPress={handleCreateFolder}
              disabled={!value.trim()}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={uploadModal.isOpen}
        onClose={uploadModal.onClose}
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-gray-100 bg-[#6238C3] px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <CloudArrowUpIcon size={24} />
              <span className="text-lg font-semibold">Upload Files</span>
            </div>
          </ModalHeader>
          <ModalBody className="p-6">
            <div
              className="cursor-pointer rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center transition-colors hover:border-[#6238C3] hover:bg-[#6238C3]/5"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#6238C3]/10">
                <CloudArrowUpIcon size={32} className="text-[#6238C3]" />
              </div>
              <p className="mb-1 text-base font-medium text-gray-700">
                Drop files here
              </p>
              <p className="mb-5 text-sm text-gray-400">
                or click to browse from your device
              </p>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                onChange={handleFiles}
                multiple
              />
              <Button
                className="bg-[#6238C3] px-6 text-white hover:bg-[#5230a8]"
                onPress={() =>
                  document.getElementById("dropzone-file")?.click()
                }
              >
                Browse Files
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <FileImageIcon size={14} className="text-pink-400" />
                <span>Images</span>
              </div>
              <div className="flex items-center gap-1">
                <FileVideoIcon size={14} className="text-purple-400" />
                <span>Videos</span>
              </div>
              <div className="flex items-center gap-1">
                <FileTextIcon size={14} className="text-blue-400" />
                <span>Documents</span>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {confirmModal.isOpen && (
        <ModalConfirm
          onClose={() => {
            confirmModal.onClose();
            setConfirmData({ key: "", isFolder: false });
          }}
          handleDeleteFile={handleDeleteFile}
          fileKey={confirmData.key}
          isFolder={confirmData.isFolder}
          prefix={prefix}
        />
      )}

      <Modal isOpen={renameModal.isOpen} onClose={renameModal.onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-gray-100 bg-[#6238C3] px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              {renameData.isFolder ? (
                <FolderSimpleIcon size={24} />
              ) : (
                <FileIcon size={24} />
              )}
              <span className="text-lg font-semibold">
                Rename {renameData.isFolder ? "Folder" : "File"}
              </span>
            </div>
          </ModalHeader>
          <ModalBody className="p-6">
            <Input
              label="New name"
              placeholder={`Enter new ${renameData.isFolder ? "folder" : "file"} name`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              variant="bordered"
              classNames={{
                inputWrapper: "focus-within:border-[#6238C3]",
              }}
            />
          </ModalBody>
          <ModalFooter className="border-t border-gray-100">
            <Button
              variant="flat"
              onPress={() => {
                renameModal.onClose();
                setRenameData({ oldKey: "", isFolder: false });
                setNewName("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#6238C3] text-white hover:bg-[#5230a8]"
              onPress={async () => {
                await handleRename();
              }}
              disabled={!newName.trim()}
            >
              Rename
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

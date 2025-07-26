import { SuccessResponse } from "@/types/global.type";
import { fetcher } from "@/utils/fetcher";
import {
  formatDateFancy,
  formatFileSize,
  stripPrefix,
} from "@/utils/string.util";
import {
  ArrowsCounterClockwiseIcon,
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
  SignOutIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { ChangeEvent, DragEvent, useState } from "react";
import toast from "react-hot-toast";
import { KeyedMutator } from "swr";
import Breadcrumb from "./Breadcrumb";
import EmptyRow from "./EmptyRow";
import FolderBack from "./FolderBack";
import LoadingRow from "./LoadingRow";
import ModalConfirm from "./ModalConfirm";

function getFileIcon(name: string) {
  const lowerName = name.toLowerCase();

  if (lowerName.endsWith("/")) {
    return <FolderSimpleIcon size={20} className="mr-2 text-yellow-500" />;
  }

  if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(lowerName)) {
    return <FileImageIcon size={20} className="mr-2 text-pink-500" />;
  }

  if (/\.(mp4|mov|avi|mkv|webm)$/i.test(lowerName)) {
    return <FileVideoIcon size={20} className="mr-2 text-purple-500" />;
  }

  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(lowerName)) {
    return <FileTextIcon size={20} className="mr-2 text-blue-500" />;
  }

  return <FileIcon size={20} className="mr-2 text-gray-400" />;
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
  bucket: string;
  endpoint: string;
};

export default function Layout({
  data,
  isLoading,
  prefix,
  mutate,
  isValidating,
  bucket,
  endpoint,
}: LayoutProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; progress: number; is_loading: boolean }[]
  >([]);
  const [requests, setRequests] = useState<XMLHttpRequest[]>([]);
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfirmState, setModalConfirmState] = useState<{
    open: boolean;
    key: string;
    isFolder: boolean;
  }>({
    open: false,
    key: "",
    isFolder: false,
  });
  const [isOpenUpload, setIsOpenUpload] = useState(false);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsOpenUpload(false);

    handleUploadAll(Array.from(e.dataTransfer.files));
  }

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setIsOpenUpload(false);
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
      setModalConfirmState((prev) => ({ ...prev, open: false }));

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
      setModalConfirmState({
        open: false,
        key: "",
        isFolder: false,
      });
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
        url = `https://${bucket}.is3.cloudhost.id/${encodeURIComponent(key)}`;
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
    setIsOpen(false);
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

  const lastModified = data.length
    ? data.reduce((latest, current) =>
        new Date(current.LastModified as Date) >
        new Date(latest?.LastModified as Date)
          ? current
          : latest,
      ).LastModified
    : null;

  return (
    <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-4">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex w-full max-w-md flex-col gap-2 rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Create Folder</h2>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Folder name..."
              className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setValue("");
                  setIsOpen(false);
                }}
                className="cursor-pointer rounded-xl bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                disabled={!value.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpenUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex w-full max-w-md flex-col gap-2 rounded-2xl bg-white p-6 shadow-lg">
            <div className="relative space-y-2">
              <button
                className="absolute -top-5 -right-5 z-10 cursor-pointer rounded-full bg-gray-300 p-1 transition hover:bg-gray-300"
                title="Cancel"
              >
                <XIcon size={15} onClick={() => setIsOpenUpload(false)} />
              </button>

              <div
                className="flex w-full items-center justify-center"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <label
                  htmlFor="dropzone-file"
                  className="flex h-35 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="mb-4 h-8 w-8 text-gray-500"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    onChange={handleFiles}
                    multiple
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalConfirmState.open && (
        <ModalConfirm
          onClose={() =>
            setModalConfirmState({
              open: false,
              key: "",
              isFolder: false,
            })
          }
          handleDeleteFile={handleDeleteFile}
          fileKey={modalConfirmState.key}
          isFolder={modalConfirmState.isFolder}
          prefix={prefix}
        />
      )}

      <div className="flex flex-col gap-2 lg:col-span-3">
        <Breadcrumb basePath="/" rootLabel="Home" />

        <div className="flex items-end justify-end">
          {router.pathname !== "/" ? (
            <>
              <button
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-blue-600 transition-colors duration-200 hover:bg-blue-50"
                onClick={() => setIsOpenUpload(true)}
              >
                <FilesIcon size={22} />
                Upload Files
              </button>

              <button
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-blue-600 transition-colors duration-200 hover:bg-blue-50"
                onClick={() => setIsOpen(true)}
              >
                <FolderPlusIcon size={22} />
                Create Folder
              </button>
            </>
          ) : null}

          <button
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-blue-600 transition-colors duration-200 hover:bg-blue-50"
            onClick={() => mutate()}
            disabled={isLoading || isValidating}
          >
            <ArrowsCounterClockwiseIcon
              size={22}
              className={isLoading || isValidating ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="min-w-full table-auto border-collapse text-sm">
            <thead className="bg-gray-100 text-xs font-medium tracking-wider text-gray-500 uppercase">
              <tr>
                <th className="w-1/2 border-t border-b border-gray-200 px-4 py-3 text-left">
                  Name
                </th>
                <th className="w-1/6 border-t border-b border-gray-200 px-4 py-3 text-left">
                  Size
                </th>
                <th className="w-1/4 border-t border-b border-gray-200 px-4 py-3 text-left">
                  Last Modified
                </th>
                <th className="w-1/12 border-t border-b border-gray-200 px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {router.pathname !== "/" ? <FolderBack router={router} /> : null}
              {isLoading || isValidating ? (
                <LoadingRow />
              ) : data.length ? (
                data.map((file) => (
                  <tr
                    key={file.Key}
                    className="border-b border-gray-200 hover:bg-gray-100"
                  >
                    <td
                      className="flex cursor-pointer items-center px-4 py-3 font-medium text-gray-800 select-none"
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
                              `https://${bucket}.is3.cloudhost.id/${encodeURIComponent(file.Key)}`,
                              "_blank",
                            );
                          }
                        }
                      }}
                    >
                      {getFileIcon(file.Key)}
                      <span className="max-w-[150px] break-words md:max-w-[500px]">
                        {stripPrefix(file.Key, prefix)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {file.Size ? formatFileSize(file.Size) : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {`${file?.LastModified ? formatDateFancy(file?.LastModified) : ""}`}
                    </td>
                    <td className="flex gap-2 px-4 py-3">
                      {!file.IsFolder ? (
                        <>
                          <button
                            className="cursor-pointer text-gray-500 hover:text-blue-600"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  `https://${bucket}.is3.cloudhost.id/${encodeURIComponent(file.Key)}`,
                                );
                                toast.success("Link copied");
                              } catch (err) {
                                toast.error("Link copy failed");
                                console.error(err);
                              }
                            }}
                          >
                            <LinkIcon size={18} />
                          </button>
                          <button
                            className="cursor-pointer text-gray-500 hover:text-green-600"
                            onClick={() => handleDownloadFile(file.Key)}
                          >
                            <DownloadSimpleIcon size={18} />
                          </button>
                          <button
                            className="cursor-pointer text-gray-500 hover:text-red-600"
                            onClick={() =>
                              setModalConfirmState({
                                open: true,
                                key: file.Key,
                                isFolder: file.IsFolder,
                              })
                            }
                          >
                            <TrashIcon size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          {router.pathname !== "/" ? (
                            <button
                              className="ml-auto cursor-pointer items-end justify-end text-gray-500 hover:text-red-600"
                              onClick={() =>
                                setModalConfirmState({
                                  open: true,
                                  key: file.Key,
                                  isFolder: file.IsFolder,
                                })
                              }
                            >
                              <TrashIcon size={18} />
                            </button>
                          ) : null}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow />
              )}
            </tbody>
          </table>
        </div>

        {router.pathname == "/" && (
          <div className="mt-6 grid items-start gap-8 rounded-xl border-2 border-yellow-600 bg-yellow-600/50 p-8 lg:grid-cols-2">
            <div className="inline-flex items-start gap-4 text-yellow-900">
              <LockKeyIcon weight="bold" size={48} />

              <div className="grid flex-1 gap-1">
                <h3 className="text-2xl font-bold">Folder Private</h3>
                <p className="leading-[170%]">
                  Berisi file atau data yang bersifat terbatas dan tidak untuk
                  dibagikan ke publik seperti video-video pembelajaran,
                  soft-file buku digital, dan lain-lain. Folder ini bersifat
                  sensitif atau internal.
                </p>
              </div>
            </div>

            <div className="inline-flex items-start gap-4 text-yellow-900">
              <GlobeHemisphereEastIcon weight="bold" size={48} />

              <div className="grid flex-1 gap-1">
                <h3 className="text-2xl font-bold">Folder Public</h3>
                <p className="leading-[170%]">
                  Berisi file atau aset yang memang ditujukan untuk diakses oleh
                  publik seperti gambar flashcard, ilustrasi, dan lain-lain.
                  Semua isi folder ini dapat dibagikan secara bebas tanpa
                  batasan akses.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 lg:col-span-1">
        {router.pathname !== "/" ? (
          <>
            <div className="flex h-70 flex-col rounded-lg bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Progress
                </h2>

                {uploadedFiles.length > 1 ? (
                  <button
                    className="text-sm text-red-600 hover:underline"
                    onClick={handleCancelAll}
                  >
                    Cancel All
                  </button>
                ) : null}
              </div>

              {uploadedFiles.length ? (
                <p className="mb-3 text-sm text-gray-500">
                  Uploading {uploadedFiles.length}{" "}
                  {uploadedFiles.length > 1 ? "files" : "file"}.
                </p>
              ) : null}

              <div className="h-full flex-1 overflow-y-auto pr-1">
                {uploadedFiles.length ? (
                  <ul className="space-y-4">
                    {uploadedFiles.map((file, idx) => (
                      <li key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="w-[200px] truncate text-sm text-gray-700">
                            {file.name}
                          </span>
                          {file.is_loading ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                            </div>
                          ) : (
                            <button
                              className="cursor-pointer text-xs text-red-500 hover:underline"
                              onClick={() => handleCancelSingle(idx)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all"
                            style={{ width: `${file.progress}%` }}
                          ></div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-sm text-gray-500 italic">
                      No files being uploaded
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">
                Bucket Stats
              </h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Folders:</span>
                  <span className="font-medium">
                    {isLoading || isValidating ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                      </div>
                    ) : (
                      data.filter((item) => item.IsFolder).length
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Files:</span>
                  <span className="font-medium">
                    {isLoading || isValidating ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                      </div>
                    ) : (
                      data.filter((item) => !item.IsFolder).length
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Size:</span>
                  <span className="font-medium">
                    {isLoading || isValidating ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                      </div>
                    ) : data.length ? (
                      formatFileSize(
                        data.reduce((acc, item) => acc + (item.Size || 0), 0),
                      )
                    ) : (
                      0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Modified</span>
                  <span className="font-medium">
                    {isLoading || isValidating ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                      </div>
                    ) : data.length ? (
                      lastModified ? (
                        formatDateFancy(lastModified)
                      ) : (
                        "-"
                      )
                    ) : (
                      "-"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : null}

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Information
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Login As</span>
              <span className="font-medium">
                {session?.user.fullname ? <>{session.user.fullname}</> : "-"}
              </span>
            </div>
            <div className="flex justify-end">
              <button
                className="text-md flex cursor-pointer items-center gap-1 rounded-md text-blue-600"
                onClick={() => signOut()}
              >
                <SignOutIcon size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

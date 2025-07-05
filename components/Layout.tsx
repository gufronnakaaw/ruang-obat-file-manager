import { stripPrefix } from "@/utils/string.util";
import {
  ArrowsCounterClockwiseIcon,
  CloudArrowUpIcon,
  DownloadSimpleIcon,
  FileIcon,
  FileImageIcon,
  FileTextIcon,
  FileVideoIcon,
  FolderPlusIcon,
  FolderSimpleIcon,
  LinkIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/router";
import { KeyedMutator } from "swr";
import Breadcrumb from "./Breadcrumb";
import EmptyRow from "./EmptyRow";
import FolderBack from "./FolderBack";
import LoadingRow from "./LoadingRow";

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
};

export default function Layout({
  data,
  isLoading,
  prefix,
  mutate,
  isValidating,
  bucket,
}: LayoutProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-4">
      <div className="lg:col-span-3">
        <Breadcrumb basePath="/" rootLabel="Home" />
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
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
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td
                      className="flex cursor-pointer items-center px-4 py-3 font-medium text-gray-800"
                      onClick={() => {
                        if (file.IsFolder) {
                          router.push({
                            pathname: `${router.asPath}${stripPrefix(file.Key, prefix)}`,
                          });
                        } else {
                          window.open(
                            `https://${bucket}.is3.cloudhost.id/${file.Key}`,
                            "_blank",
                          );
                        }
                      }}
                    >
                      {getFileIcon(file.Key)}
                      {stripPrefix(file.Key, prefix)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {file.Size ? file.Size : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {`${file?.LastModified ? file?.LastModified : ""}`}
                    </td>
                    <td className="flex gap-2 px-4 py-3">
                      {!file.IsFolder ? (
                        <>
                          <button className="text-gray-500 hover:text-blue-600">
                            <LinkIcon size={18} />
                          </button>
                          <button className="text-gray-500 hover:text-green-600">
                            <DownloadSimpleIcon size={18} />
                          </button>
                          <button className="text-gray-500 hover:text-red-600">
                            <TrashIcon size={18} />
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow />
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid gap-2 lg:col-span-1">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Progress</h2>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <button className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-blue-600 transition-colors duration-200 hover:bg-blue-50">
              <CloudArrowUpIcon size={22} />
              Upload Files
            </button>
            <button
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-blue-600 transition-colors duration-200 hover:bg-blue-50"
              onClick={() => mutate()}
              disabled={isLoading || isValidating}
            >
              <ArrowsCounterClockwiseIcon
                size={22}
                className={isLoading || isValidating ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <button className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-blue-600 transition-colors duration-200 hover:bg-blue-50">
              <FolderPlusIcon size={22} />
              Create Folder
            </button>
          </div>

          <div className="mt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Bucket Stats
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Total Files:</span>
                <span id="total-files" className="font-medium">
                  {data.filter((item) => !item.IsFolder).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Size:</span>
                <span id="total-size" className="font-medium">
                  0 MB
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

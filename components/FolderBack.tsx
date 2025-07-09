import { FolderSimpleIcon } from "@phosphor-icons/react";
import { NextRouter } from "next/router";

export default function FolderBack({ router }: { router: NextRouter }) {
  const segments = router.asPath.split("/").filter(Boolean);

  return (
    <tr className="cursor-pointer border-b border-gray-200 hover:bg-gray-50">
      <td
        colSpan={4}
        className="flex items-center px-4 py-3 font-medium text-gray-800"
        onClick={() => router.push("/" + segments.slice(0, -1).join("/"))}
      >
        <FolderSimpleIcon size={20} className="mr-2 text-yellow-500" />
        ...
      </td>
    </tr>
  );
}

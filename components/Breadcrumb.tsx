import { CaretRightIcon, HouseLineIcon } from "@phosphor-icons/react";
import { useRouter } from "next/router";

type BreadcrumbsUrlProps = {
  rootLabel?: string;
  basePath?: string;
};

export default function Breadcrumb({
  rootLabel = "Home",
  basePath = "/",
}: BreadcrumbsUrlProps) {
  const { asPath, push } = useRouter();

  const cleanPath = asPath.replace(basePath === "/" ? "" : basePath, "");
  const segments = cleanPath.split("/").filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const decoded = decodeURIComponent(segment);
    const label = decoded.split("-").join(" ");

    return {
      key: segment,
      label,
      href: `${basePath}${basePath.endsWith("/") ? "" : "/"}${segments
        .slice(0, index + 1)
        .join("/")}`,
    };
  });

  return (
    <nav className="flex items-center gap-1 text-sm">
      <button
        onClick={() => push(basePath)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#6238C3]"
      >
        <HouseLineIcon size={16} weight="fill" className="text-[#6238C3]" />
        <span className="font-medium">{rootLabel}</span>
      </button>

      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.key} className="flex items-center gap-1">
          <CaretRightIcon size={14} className="text-gray-400" />
          {index === breadcrumbs.length - 1 ? (
            <span className="rounded-md px-2 py-1 font-medium text-gray-900">
              {breadcrumb.label}
            </span>
          ) : (
            <button
              onClick={() => push(breadcrumb.href)}
              className="rounded-md px-2 py-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#6238C3]"
            >
              {breadcrumb.label}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}

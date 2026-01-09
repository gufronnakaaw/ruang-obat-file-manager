export function stripPrefix(str: string, prefix: string): string {
  if (str.startsWith(prefix)) {
    return str.slice(prefix.length);
  }
  return str;
}

export function isFolder(path: string): boolean {
  return path.endsWith("/");
}

export function formatFileSize(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));

  return `${size} ${sizes[i]}`;
}

export function formatDateFancy(dateStr: string | Date): string {
  const date = new Date(dateStr);
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });
}

export function getStorageUrl() {
  if (process.env.NEXT_PUBLIC_VHOST_SUPPORTED === "true") {
    return `https://${process.env.NEXT_PUBLIC_STORAGE_BUCKET}.${process.env.NEXT_PUBLIC_STORAGE_ENDPOINT}`;
  } else {
    return `https://${process.env.NEXT_PUBLIC_STORAGE_ENDPOINT}/${process.env.NEXT_PUBLIC_STORAGE_BUCKET}`;
  }
}

export function getError(error: any) {
  if (error.status_code >= 500) {
    if (error.error.message.length > 25) {
      return "Sepertinya ada masalah pada sisi server";
    }

    return error.error.message;
  }

  if (error.status_code >= 400 && error.status_code <= 499) {
    if (error.error.name === "ZodError") {
      return error.error.errors.reduce((acc: any, err: any) => {
        acc[err.field[0]] = err.message;
        return acc;
      }, {});
    }

    return error.error.message;
  }
  return error.error.message;
}

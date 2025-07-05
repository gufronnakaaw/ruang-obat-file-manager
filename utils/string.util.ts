export function stripPrefix(str: string, prefix: string): string {
  if (str.startsWith(prefix)) {
    return str.slice(prefix.length);
  }
  return str;
}

export function isFolder(path: string): boolean {
  return path.endsWith("/");
}

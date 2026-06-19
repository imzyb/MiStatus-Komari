import type { Server } from "@/lib/api";

export function filterServers(servers: Server[], query: string): Server[] {
  if (!query.trim()) return servers;
  const q = query.toLowerCase();
  return servers.filter(
    (s) =>
      (s.alias || s.name).toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.location || "").toLowerCase().includes(q)
  );
}

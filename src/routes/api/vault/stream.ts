import { createFileRoute } from "@tanstack/react-router";
import { vaultSseResponse } from "@/lib/vault";

export const Route = createFileRoute("/api/vault/stream")({
  server: {
    handlers: {
      GET: () => vaultSseResponse(),
    },
  },
});

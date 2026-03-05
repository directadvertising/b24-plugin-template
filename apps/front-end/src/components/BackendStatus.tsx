import { useApiClient } from "@common/b24ui-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function BackendStatus() {
  const client = useApiClient();
  const [status, setStatus] = useState<
    "idle" | "checking" | "healthy" | "error"
  >("idle");
  const [info, setInfo] = useState<{
    status: string;
    backend: string;
    timestamp: number;
  } | null>(null);

  const checkHealth = async () => {
    setStatus("checking");
    try {
      const data = await client.get<{
        success: boolean;
        data: { status: string; backend: string; timestamp: number };
      }>("/api/health");
      setInfo(data.data);
      setStatus("healthy");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="font-semibold">Backend Status</h3>

      <div className="mt-3 flex items-center gap-2">
        {status === "checking" ? (
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              status === "healthy"
                ? "border-green-200 bg-green-50 text-green-700"
                : status === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-gray-200 bg-gray-50 text-gray-600"
            }`}
          >
            {status === "healthy"
              ? "Connected"
              : status === "error"
                ? "Connection failed"
                : "Not checked"}
          </span>
        )}
      </div>

      {info && (
        <div className="mt-2 flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">
            Status: {info.status}
          </span>
          <span className="text-xs text-muted-foreground">
            Backend: {info.backend}
          </span>
          <span className="text-xs text-muted-foreground">
            Timestamp: {new Date(info.timestamp).toLocaleString()}
          </span>
        </div>
      )}

      <div className="mt-3">
        <Button
          size="sm"
          onClick={checkHealth}
          disabled={status === "checking"}
        >
          {status === "checking" ? "Checking..." : "Check"}
        </Button>
      </div>
    </div>
  );
}

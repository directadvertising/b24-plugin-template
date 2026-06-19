import { Button } from "@/components/ui/button";
import { useHealth } from "../hooks/use-health";

export function BackendStatus() {
  const { data, isFetching, isError, refetch } = useHealth();

  const status = isFetching
    ? "checking"
    : isError
      ? "error"
      : data
        ? "healthy"
        : "idle";

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

      {data && (
        <div className="mt-2 flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">
            Status: {data.status}
          </span>
          <span className="text-xs text-muted-foreground">
            Backend: {data.backend}
          </span>
          <span className="text-xs text-muted-foreground">
            Timestamp: {new Date(data.timestamp).toLocaleString()}
          </span>
        </div>
      )}

      <div className="mt-3">
        <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Checking..." : "Refresh"}
        </Button>
      </div>
    </div>
  );
}

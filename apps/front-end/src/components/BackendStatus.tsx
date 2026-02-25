import { useApiClient } from "@common/b24ui-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useState } from "react";

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
    <Card variant="outlined">
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Backend Status
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {status === "checking" ? (
            <CircularProgress size={16} />
          ) : (
            <Chip
              label={
                status === "healthy"
                  ? "Connected"
                  : status === "error"
                    ? "Connection failed"
                    : "Not checked"
              }
              color={
                status === "healthy"
                  ? "success"
                  : status === "error"
                    ? "error"
                    : "default"
              }
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {info && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Status: {info.status}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Backend: {info.backend}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Timestamp: {new Date(info.timestamp).toLocaleString()}
            </Typography>
          </Box>
        )}

        <Box>
          <Button
            variant="contained"
            size="small"
            onClick={checkHealth}
            disabled={status === "checking"}
          >
            {status === "checking" ? "Checking..." : "Check"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

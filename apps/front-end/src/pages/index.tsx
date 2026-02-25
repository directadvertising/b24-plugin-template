import { useB24FrameOrNull, useB24Init } from "@common/b24ui-react";
import CodeIcon from "@mui/icons-material/Code";
import LockIcon from "@mui/icons-material/Lock";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import StorageIcon from "@mui/icons-material/Storage";
import TableChartIcon from "@mui/icons-material/TableChart";
import WidgetsIcon from "@mui/icons-material/Widgets";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useEffect, useRef } from "react";
import BackendStatus from "../components/BackendStatus";
import FeatureCard from "../components/FeatureCard";

export default function IndexPage() {
  const { initApp, isInitialized, isLoading, error, logger } = useB24Init({
    loggerTitle: "IndexPage",
    onLocaleDetected: (lang) => {
      logger.log("Detected locale:", lang);
    },
  });

  const frame = useB24FrameOrNull();
  const initCalled = useRef(false);

  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;

    initApp()
      .then(($b24) => {
        $b24.parent.setTitle("Starter");
      })
      .catch((err) => {
        logger.error("Init failed:", err);
      });
  }, [initApp, logger]);

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 480 }}>
          <Typography fontWeight={600} gutterBottom>
            Initialization Error
          </Typography>
          {error.message}
        </Alert>
      </Box>
    );
  }

  if (isLoading || !isInitialized) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Hero */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #2196F3 0%, #00BFA5 100%)",
          color: "white",
          py: 8,
          px: 2,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Bitrix24 Starter Kit
          </Typography>
          <Typography
            variant="h6"
            fontWeight={300}
            sx={{ mb: 3, opacity: 0.9 }}
          >
            A production-ready template for building Bitrix24 applications
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            {["React 19", "NestJS", "TypeScript", "MUI 7"].map((label) => (
              <Chip
                key={label}
                label={label}
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 500,
                }}
              />
            ))}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 5 }}>
        {/* Status Dashboard */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <Typography variant="h6" fontWeight={600}>
                  B24 Connection
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Chip
                    label={frame ? "Connected" : "Disconnected"}
                    color={frame ? "success" : "default"}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Portal language: {frame?.getLang() ?? "unknown"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <BackendStatus />
          </Grid>
        </Grid>

        {/* Features */}
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
          What's Inside
        </Typography>
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FeatureCard
              icon={<RocketLaunchIcon />}
              title="React + Vite"
              description="Fast HMR, React 19 with compiler, and Tailwind CSS 4 out of the box."
              chipLabel="Frontend"
              chipColor="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FeatureCard
              icon={<StorageIcon />}
              title="NestJS + Kysely"
              description="Type-safe backend with structured modules, guards, and query builder."
              chipLabel="Backend"
              chipColor="secondary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FeatureCard
              icon={<LockIcon />}
              title="OAuth 2.0"
              description="Simplified Bitrix24 OAuth flow with JWT session management."
              chipLabel="Auth"
              chipColor="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FeatureCard
              icon={<WidgetsIcon />}
              title="CRM Widgets"
              description="Pre-configured deal tab and custom field placements ready to use."
              chipLabel="Widgets"
              chipColor="info"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FeatureCard
              icon={<TableChartIcon />}
              title="PostgreSQL"
              description="Database with Kysely migrations and typed schema definitions."
              chipLabel="Database"
              chipColor="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FeatureCard
              icon={<CodeIcon />}
              title="Type-safe Contracts"
              description="Shared API contracts with Zod validation between frontend and backend."
              chipLabel="DX"
              chipColor="error"
            />
          </Grid>
        </Grid>

        {/* Footer */}
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: "flex", justifyContent: "center", gap: 3 }}>
          <Link
            href="https://apidocs.bitrix24.com"
            target="_blank"
            rel="noopener"
            underline="hover"
          >
            REST API Docs
          </Link>
          <Link
            href="https://github.com/bitrix24/b24jssdk"
            target="_blank"
            rel="noopener"
            underline="hover"
          >
            JS SDK
          </Link>
        </Box>
      </Container>
    </Box>
  );
}

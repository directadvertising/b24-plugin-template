import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  chipLabel: string;
  chipColor?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "info"
    | "error"
    | "default";
}

export default function FeatureCard({
  icon,
  title,
  description,
  chipLabel,
  chipColor = "primary",
}: FeatureCardProps) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: `${chipColor}.light`,
              color: `${chipColor}.main`,
              width: 44,
              height: 44,
            }}
          >
            {icon}
          </Avatar>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        <Box>
          <Chip
            label={chipLabel}
            color={chipColor}
            size="small"
            variant="outlined"
          />
        </Box>
      </CardContent>
    </Card>
  );
}

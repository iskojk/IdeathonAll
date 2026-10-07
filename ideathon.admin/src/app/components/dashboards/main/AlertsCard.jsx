"use client";
import React from "react";
import SectionCard from "@/app/components/dashboards/_shared/SectionCard";
import { List, ListItem, ListItemText, Chip, Stack, Link as MLink } from "@mui/material";
import Link from "next/link";
import { useHome } from "@/app/context/HomeContext";

const colorBySeverity = (s) =>
  s === "warning" ? "warning" : s === "error" ? "error" : s === "info" ? "info" : "default";

const AlertsCard = () => {
  const { alerts } = useHome() || { alerts: [] };
  const items = (alerts || []).slice(0, 6);

  return (
    <SectionCard title="Uyarılar">
      <List dense disablePadding>
        {items.map((a) => (
          <ListItem
            key={a.id}
            disableGutters
            secondaryAction={
              a.link ? (
                <MLink component={Link} href={a.link} underline="hover" sx={{ fontSize: 12 }}>
                  Git
                </MLink>
              ) : null
            }
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label={a.type} color={colorBySeverity(a.severity)} variant="outlined" />
              <ListItemText primaryTypographyProps={{ variant: "body2" }} primary={a.title} />
            </Stack>
          </ListItem>
        ))}
        {items.length === 0 && (
          <ListItem disableGutters>
            <ListItemText primary="Uyarı yok." />
          </ListItem>
        )}
      </List>
    </SectionCard>
  );
};

export default AlertsCard;

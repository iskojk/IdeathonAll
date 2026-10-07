"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Chip,
  CircularProgress,
} from "@mui/material";
import { IconBuildingSkyscraper } from "@tabler/icons-react";
import { useIdeathon } from "@/app/context/IdeathonContext";

const statusColors = {
  active: "#51CF66",
  draft: "#FFD43B",
  completed: "#4DABF7",
  archived: "#ADB5BD",
};

const statusLabels = {
  active: "Aktif",
  draft: "Taslak",
  completed: "Tamamlandı",
  archived: "Arşiv",
};

const IdeathonSelector = () => {
  const {
    ideathons,
    selectedIdeathonId,
    fetchDropdownIdeathons,
    selectIdeathon,
    loading,
  } = useIdeathon();

  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    fetchDropdownIdeathons();
  }, [fetchDropdownIdeathons]);

  const handleChange = async (event) => {
    const value = event.target.value;
    setLocalLoading(true);
    try {
      const ideathonId = value === "all" ? null : value;
      await selectIdeathon(ideathonId);
      // Sayfayı yenile — tüm verilerin yeni ideathon'a göre güncellenmesi
      window.location.reload();
    } catch (err) {
      console.error("İdeathon seçim hatası:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  if (loading && ideathons.length === 0) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CircularProgress size={16} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <IconBuildingSkyscraper size={20} style={{ opacity: 0.7, flexShrink: 0 }} />
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <Select
          value={selectedIdeathonId || "all"}
          onChange={handleChange}
          disabled={localLoading}
          displayEmpty
          sx={{
            borderRadius: 2,
            fontSize: "0.85rem",
            "& .MuiSelect-select": {
              py: 0.8,
              display: "flex",
              alignItems: "center",
              gap: 1,
            },
          }}
          renderValue={(value) => {
            if (value === "all") return "Tüm İdeathonlar";
            const selected = ideathons.find((i) => i._id === value);
            return selected ? selected.name : "Tüm İdeathonlar";
          }}
        >
          <MenuItem value="all">
            <Typography sx={{ fontWeight: 500 }}>Tüm İdeathonlar</Typography>
          </MenuItem>

          {ideathons.map((ideathon) => (
            <MenuItem key={ideathon._id} value={ideathon._id}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                <Typography sx={{ flex: 1, fontWeight: 500 }}>{ideathon.name}</Typography>
                <Chip
                  label={statusLabels[ideathon.status] || ideathon.status}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    bgcolor: (statusColors[ideathon.status] || "#ADB5BD") + "30",
                    color: statusColors[ideathon.status] || "#ADB5BD",
                  }}
                />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {localLoading && <CircularProgress size={16} />}
    </Box>
  );
};

export default IdeathonSelector;











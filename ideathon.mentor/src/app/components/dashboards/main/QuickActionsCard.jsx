"use client";
import React from "react";
import SectionCard from "@/app/components/dashboards/_shared/SectionCard";
import { Button, Box } from "@mui/material";
import Link from "next/link";
import {
  IconPlus,
  IconFileExport,
  IconBriefcase,
  IconBuilding,
  IconUsersGroup,
  IconMail,
} from "@tabler/icons-react";

const btnSx = { borderRadius: 2, minWidth: 132 }; // tutarlı genişlik ve yumuşak köşe

const QuickActionsCard = () => {
  return (
    <SectionCard title="Hızlı İşlemler">
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          columnGap: 1,     // sütun aralığı
          rowGap: 1.2,      // satır aralığı
        }}
      >
        <Button
          component={Link}
          href="/job/create"
          variant="contained"
          size="small"
          startIcon={<IconPlus size={18} />}
          sx={btnSx}
        >
          Yeni İlan
        </Button>

        <Button
          component={Link}
          href="/company/create"
          variant="outlined"
          size="small"
          startIcon={<IconBuilding size={18} />}
          sx={btnSx}
        >
          Firma Ekle
        </Button>

        <Button
          component={Link}
          href="/applications/list"
          variant="outlined"
          size="small"
          startIcon={<IconBriefcase size={18} />}
          sx={btnSx}
        >
          Başvurular
        </Button>

        <Button
          component={Link}
          href="/job-seeker/list"
          variant="outlined"
          size="small"
          startIcon={<IconUsersGroup size={18} />}
          sx={btnSx}
        >
          Aday Havuzu
        </Button>

        <Button
          component={Link}
          href="/contact/list"
          variant="outlined"
          size="small"
          startIcon={<IconMail size={18} />}
          sx={btnSx}
        >
          Mesajlar
        </Button>

        <Button
          component={Link}
          href="/references/list"
          variant="outlined"
          size="small"
          startIcon={<IconFileExport size={18} />}
          sx={btnSx}
        >
         Referanslar
        </Button>
      </Box>
    </SectionCard>
  );
};

export default QuickActionsCard;

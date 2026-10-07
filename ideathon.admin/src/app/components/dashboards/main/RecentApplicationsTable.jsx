"use client";
import React from "react";
import SectionCard from "@/app/components/dashboards/_shared/SectionCard";
import {
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Button,
} from "@mui/material";
import Link from "next/link";
import { useHome } from "@/app/context/HomeContext";

const fmt = (v) =>
  v
    ? new Intl.DateTimeFormat("tr-TR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Europe/Istanbul",
      }).format(new Date(v))
    : "-";

const RecentApplicationsTable = () => {
  const { recent } = useHome() || {};
  const rows = recent?.applications || [];

  return (
    <SectionCard title="Son Başvurular" action={<Button component={Link} href="/applications/list">Tümü</Button>}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Aday</TableCell>
            <TableCell>İlan</TableCell>
            <TableCell>Tarih</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r._id} hover>
              <TableCell>
                {r.applicant_name}
                <br />
                <Chip size="small" label={r.applicant_email || "-"} sx={{ mt: 0.5 }} />
              </TableCell>
              <TableCell>
                {r.job_title || "-"}
                <br />
                <Chip size="small" label={r.company_name || "-"} variant="outlined" sx={{ mt: 0.5 }} />
              </TableCell>
              <TableCell>{fmt(r.created_at)}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={3}>Kayıt yok.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </SectionCard>
  );
};

export default RecentApplicationsTable;

"use client";
import React from "react";
import SectionCard from "@/app/components/dashboards/_shared/SectionCard";
import { Table, TableHead, TableRow, TableCell, TableBody, Button } from "@mui/material";
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

const PendingCompaniesTable = () => {
  const { recent } = useHome() || {};
  const rows = recent?.companiesPending || [];

  return (
    <SectionCard title="Onay Bekleyen Firmalar" action={<Button component={Link} href="/company/list">Tümü</Button>}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Firma</TableCell>
            <TableCell>Başvuru</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r._id} hover>
              <TableCell>{r.name}</TableCell>
              <TableCell>{fmt(r.created_at)}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={2}>Kayıt yok.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </SectionCard>
  );
};

export default PendingCompaniesTable;

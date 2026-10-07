"use client";
import React, { useEffect, useState } from "react";
import { Stack, TextField, Button } from "@mui/material";
import { useHome } from "@/app/context/HomeContext";

const DateRangeFilter = () => {
  const { range, setRange, reload } = useHome();
  const [from, setFrom] = useState(range.from || "");
  const [to, setTo] = useState(range.to || "");

  useEffect(() => {
    // range değiştiyse inputları senkronize et
    setFrom(range.from || "");
    setTo(range.to || "");
  }, [range.from, range.to]);

  const setPreset = (days) => {
    setFrom("");
    setTo("");
    setRange((r) => ({ ...r, from: null, to: null, days }));
    // HomeProvider useEffect ile fetch eder
  };

  const apply = () => {
    setRange((r) => ({
      ...r,
      from: from || null,
      to: to || null,
      days: (!from && !to) ? (r.days || 30) : undefined, // manuel aralık varsa days iptal
    }));
    reload(); // net tetikleme
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
      <TextField
        label="Başlangıç"
        type="date"
        size="small"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 180 }}
      />
      <TextField
        label="Bitiş"
        type="date"
        size="small"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 180 }}
      />
      <Button variant="outlined" onClick={() => setPreset(7)}>7 Gün</Button>
      <Button variant="outlined" onClick={() => setPreset(30)}>30 Gün</Button>
      <Button variant="contained" onClick={apply}>Uygula</Button>
    </Stack>
  );
};

export default DateRangeFilter;

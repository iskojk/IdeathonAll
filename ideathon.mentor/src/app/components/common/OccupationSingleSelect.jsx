"use client";

import { useRef, useState } from "react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import api from "@/utils/api/axios";

export default function OccupationSingleSelect({
  label = "Pozisyon Başlığı",
  value = null,                 // { code, name } | null
  onChange,                     // (val|null) => void
  minChars = 2,
  debounceMs = 300,
  disabled = false,
  required = false,
  error = false,
  helperText = "",
  placeholder = "Meslek ara (ör. Yazılım Geliştirici, Garson...)",
}) {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState(value?.name || "");
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const fetchOpts = async (term) => {
    if (!term || term.trim().length < minChars) { setOptions([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get("/occupations/search", { params: { q: term, limit: 30 } });
      setOptions(data?.data || []);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (_, v) => {
    setInputValue(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchOpts(v), debounceMs);
  };

  const handleChange = (_, sel) => {
    if (!sel) { onChange && onChange(null); return; }
    onChange && onChange({ code: sel.code || null, name: sel.name });
  };

  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      getOptionLabel={(o) => o?.name || ""}
      filterOptions={(x) => x} // server-side filtre
      isOptionEqualToValue={(o, v) => o.name === v.name && (o.code || null) === (v.code || null)}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

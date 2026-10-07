"use client";

import React, { useEffect, useState, useContext } from "react";
import {
    Box,
    Typography,
    Divider,
    Paper,
    Stack,
    Chip,
    Avatar,
    CircularProgress
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { JobContext } from "@/app/context/JobContext";
import { CompanyContext } from "@/app/context/CompanyContext";

const ViewJobContent = () => {
    const { id } = useParams();
    const router = useRouter();

    const { getJobById } = useContext(JobContext);
    const { companies, fetchCompanies } = useContext(CompanyContext);

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            await fetchCompanies();
            const res = await getJobById(id);
            if (res.success) {
                setJob(res.data);
            } else {
                router.push("/job/list");
            }
            setLoading(false);
        };
        fetchData();
    }, [id]);

    if (loading || !job) {
        return (
            <Box textAlign="center" py={5}>
                <CircularProgress />
            </Box>
        );
    }

    const {
        title,
        category,
        description,
        location,
        type,
        deadline,
        is_active,
        custom_company_name,
        custom_company_logo,
        company_id,
        created_by
    } = job;

    const companyName = custom_company_name || company_id?.user_id?.name || "Firma adı belirtilmedi";
    const companyLogo = custom_company_logo
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${custom_company_logo}`
        : company_id?.user_id?.logo
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${company_id.user_id.logo}`
            : null;

    return (
            <Stack spacing={3}>
                {/* Başlık ve Firma */}
                <Box display="flex" alignItems="center" gap={2}>
                    {companyLogo && (
                        <Avatar
                            src={companyLogo}
                            alt={companyName}
                            sx={{ width: 56, height: 56 }}
                        />
                    )}
                    <Box>
                        <Typography variant="h5" fontWeight="bold">{title}</Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            {companyName}
                        </Typography>
                    </Box>
                </Box>

                {/* Bilgi etiketleri */}
                <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Chip label={`Kategori: ${category}`} color="primary" />
                    <Chip label={`Çalışma Tipi: ${type}`} color="secondary" />
                    <Chip label={`Konum: ${location}`} color="default" />
                    <Chip label={`Son Tarih: ${deadline?.split("T")[0]}`} color="warning" />
                    <Chip label={is_active ? "Aktif" : "Pasif"} color={is_active ? "success" : "error"} />
                    <Chip label={`Oluşturan: ${created_by === "admin" ? "Admin" : "Firma"}`} variant="outlined" />
                </Stack>

                <Divider />

                {/* Açıklama */}
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Açıklama
                    </Typography>
                    <Typography variant="body1" color="text.secondary" whiteSpace="pre-line">
                        {description || "Açıklama girilmemiş."}
                    </Typography>
                </Box>
            </Stack>
    );
};

export default ViewJobContent;

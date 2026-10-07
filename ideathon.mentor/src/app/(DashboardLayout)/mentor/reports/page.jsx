import React from "react";
import PageContainer from "@/app/components/container/PageContainer";
import { Box, Card, CardContent, Typography, Alert, Stack } from "@mui/material";
import { IconChartBar } from "@tabler/icons-react";

const MentorReportsPage = () => {
    return (
        <PageContainer title="Raporlar" description="Mentorluk raporlarınız">
            <Box>
                <Card
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        background: "linear-gradient(135deg, #005DAD 0%, #004080 100%)",
                        color: "white",
                        boxShadow: "0 4px 12px rgba(0, 93, 173, 0.15)",
                    }}
                >
                    <CardContent sx={{ py: 3 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                sx={{
                                    bgcolor: "rgba(255, 255, 255, 0.2)",
                                    borderRadius: 2,
                                    p: 1.5,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <IconChartBar size={40} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    Raporlarım
                                </Typography>
                                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                    Detaylı mentorluk raporları ve analizler
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Yakında Gelecek
                    </Typography>
                    <Typography variant="body2">
                        Raporlama özelliği şu anda geliştirme aşamasındadır. Toplantı 
                        istatistikleriniz, performans analizleri, grafik ve çizelgeler 
                        yakında eklenecektir.
                    </Typography>
                </Alert>
            </Box>
        </PageContainer>
    );
}

export default MentorReportsPage;



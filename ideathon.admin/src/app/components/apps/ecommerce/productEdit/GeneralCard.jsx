import React from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import { Grid2 as Grid } from '@mui/material';
import CustomFormLabel from '@/app/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from '@/app/components/forms/theme-elements/CustomTextField';
import TiptapEditor from '@/app/components/forms/form-tiptap/TiptapEditor';


const GeneralCard = () => {

    return (
        (<Box sx={{
            p: 3
        }}>
            <Typography variant='h5'>General</Typography>
            <Grid container sx={{
                mt: 3
            }}>
                {/* 1 */}
                <Grid
                    size={12}
                    sx={{
                        display: "flex",
                        alignItems: "center"
                    }}>
                    <CustomFormLabel htmlFor="p_name" sx={{ mt: 0 }}>
                        Product Name <Typography component="span" sx={{
                            color: "error.main"
                        }}>*</Typography>
                    </CustomFormLabel>
                </Grid>
                <Grid size={12}>
                    <CustomTextField id="p_name" placeholder="Product Name" value="Sample Product" fullWidth />
                    <Typography variant="body2">A product name is required and recommended to be unique.</Typography>
                </Grid>

                <Grid
                    size={12}
                    sx={{
                        display: "flex",
                        alignItems: "center"
                    }}>
                    <CustomFormLabel htmlFor="desc">
                        Description
                    </CustomFormLabel>
                </Grid>
                <Grid size={12}>
                    <TiptapEditor />
                    <Typography variant="body2">Set a description to the product for better visibility.</Typography>
                </Grid>
            </Grid>
        </Box>)
    );
};

export default GeneralCard;

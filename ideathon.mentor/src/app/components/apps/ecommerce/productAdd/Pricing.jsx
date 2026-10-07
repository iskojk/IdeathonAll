'use client';
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Typography, FormControlLabel, RadioGroup, Stack, useTheme } from '@mui/material';
import { Grid2 as Grid } from '@mui/material';
import CustomFormLabel from '@/app/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from '@/app/components/forms/theme-elements/CustomTextField';
import CustomSelect from '@/app/components/forms/theme-elements/CustomSelect';
import { MenuItem } from '@mui/material';
import CustomRadio from '@/app/components/forms/theme-elements/CustomRadio';
import CustomSlider from '@/app/components/forms/theme-elements/CustomSlider';


const PricingCard = () => {

    const theme = useTheme()

    const [age, setAge] = React.useState('0');
    const handleChange = (event) => {
        setAge(event.target.value);
    };

    const [selectedValue, setSelectedValue] = useState('');

    const handleValue = (event) => {
        setSelectedValue(event.target.value);
    }

    const [value3, setValue3] = React.useState(30);
    const handleChange6 = (event, newValue) => {
        setValue3(newValue);
    };

    return (
        (<Box sx={{
            p: 3
        }}>
            <Typography variant='h5' sx={{
                mb: 3
            }}>Pricing</Typography>
            <Grid container spacing={3}>
                {/* 1 */}
                <Grid size={12}>
                    <CustomFormLabel htmlFor="p_price" sx={{ mt: 0 }}>
                        Base Price <Typography component="span" sx={{
                        color: "error.main"
                    }}>*</Typography>
                    </CustomFormLabel>
                    <CustomTextField id="p_price" placeholder="Product Price" fullWidth />
                    <Typography variant="body2">Set the product price.</Typography>
                </Grid>
                <Grid size={12}>
                    <CustomFormLabel htmlFor="p_price" sx={{ mt: 0 }}>
                        Discount Type <Typography component="span" sx={{
                        color: "error.main"
                    }}>*</Typography>
                    </CustomFormLabel>
                    <RadioGroup
                        row
                        aria-labelledby="demo-form-control-label-placement"
                        name="position" value={selectedValue} onChange={handleValue}
                    >
                        <Stack
                            direction="row"
                            spacing={3}
                            useFlexGap
                            sx={{
                                width: '100%',
                                flexWrap: "wrap"
                            }}>
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1,
                                    flexGrow: 1,
                                    border: `1px dashed ${theme.palette.divider}`,
                                    textAlign: 'center'
                                }}>
                                <FormControlLabel value="no_discount" control={<CustomRadio />} label="No Discount" />
                            </Box>
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1,
                                    flexGrow: 1,
                                    border: `1px dashed ${theme.palette.divider}`,
                                    textAlign: 'center'
                                }}>
                                <FormControlLabel value="percentage" control={<CustomRadio />} label="Percentage %" />
                            </Box>
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1,
                                    flexGrow: 1,
                                    border: `1px dashed ${theme.palette.divider}`,
                                    textAlign: 'center'
                                }}>
                                <FormControlLabel value="fixed" control={<CustomRadio />} label="Fixed Price" />
                            </Box>
                        </Stack>
                    </RadioGroup>

                    {
                        selectedValue === 'no_discount' && (
                            null
                        )
                    }

                    {
                        selectedValue === 'percentage' && (
                            <>
                                <CustomFormLabel>
                                    Set Discount Percentage <Typography component="span" sx={{
                                    color: "error.main"
                                }}>*</Typography>
                                </CustomFormLabel>
                                <CustomSlider aria-label="Volume" value={value3} onChange={handleChange6} />
                                <Typography variant="body2">Set a percentage discount to be applied on this product.</Typography>
                            </>
                        )
                    }


                    {
                        selectedValue === 'fixed' && (
                            <>
                                <CustomFormLabel htmlFor="p_fixed">
                                    Fixed Discounted Price <Typography component="span" sx={{
                                    color: "error.main"
                                }}>*</Typography>
                                </CustomFormLabel>
                                <CustomTextField id="p_fixed" placeholder="Discounted Price" fullWidth />
                                <Typography variant="body2">Set the discounted product price. The product will be reduced at the determined fixed price.</Typography>
                            </>
                        )
                    }
                </Grid>
                <Grid
                    size={{
                        xs: 12,
                        lg: 6
                    }}>
                    <CustomFormLabel htmlFor="p_tax" sx={{ mt: 0 }}>
                        Tax Class <Typography component="span" sx={{
                        color: "error.main"
                    }}>*</Typography>
                    </CustomFormLabel>
                    <CustomSelect
                        id="p_tax"
                        value={age}
                        onChange={handleChange}
                        fullWidth
                    >
                        <MenuItem value={0}>Select an option</MenuItem>
                        <MenuItem value={1}>Tax Free</MenuItem>
                        <MenuItem value={2}>Taxable Goods</MenuItem>
                        <MenuItem value={3}>Downloadable Products</MenuItem>
                    </CustomSelect>
                    <Typography variant="body2">Set the product tax class.</Typography>
                </Grid>
                <Grid
                    size={{
                        xs: 12,
                        lg: 6
                    }}>
                    <CustomFormLabel htmlFor="p_vat" sx={{ mt: 0 }}>
                        VAT Amount (%) <Typography component="span" sx={{
                        color: "error.main"
                    }}>*</Typography>
                    </CustomFormLabel>
                    <CustomTextField id="p_vat" fullWidth />
                    <Typography variant="body2">Set the product VAT about.</Typography>
                </Grid>
            </Grid>
        </Box>)
    );
};

export default PricingCard;

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChildCard from '../../../shared/ChildCard';

const FirstStep = ({ total, Discount }) => {
  return (<>
    <Box sx={{
      my: 3
    }}>
      <ChildCard>
        <Box sx={{
          p: 2
        }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              mb: 3
            }}>
            Order Summary
          </Typography>
          {/* Sub Total */}
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              mb: 3
            }}>
            <Typography variant="h6" sx={{
              fontWeight: 400
            }}>
              Sub Total
            </Typography>
            <Typography variant="h6">${total}</Typography>
          </Stack>
          {/* Discount */}
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              mb: 3
            }}>
            <Typography variant="h6" sx={{
              fontWeight: 400
            }}>
              Discount 5%
            </Typography>
            <Typography variant="h6" color="error">
              -${Discount}
            </Typography>
          </Stack>
          {/* Sub Total */}
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              mb: 3
            }}>
            <Typography variant="h6" sx={{
              fontWeight: 400
            }}>
              Shipping
            </Typography>
            <Typography variant="h6">Free</Typography>
          </Stack>
          {/* Sub Total */}
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              mb: 1
            }}>
            <Typography variant="h6">Total</Typography>
            <Typography variant="h5" color="success">
              ${total - Discount}
            </Typography>
          </Stack>
        </Box>
      </ChildCard>
    </Box>
  </>);
};

export default FirstStep;

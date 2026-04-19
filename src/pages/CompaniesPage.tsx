import AddIcon from '@mui/icons-material/Add'
import BusinessIcon from '@mui/icons-material/Business'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { listCompanies } from '../api/companyApi'

export function CompaniesPage() {
  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: listCompanies,
  })

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h1">Companies</Typography>
          <Typography color="text.secondary">Choose a company to manage its QR pages</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} disabled>
          New company
        </Button>
      </Stack>

      {companiesQuery.isLoading && <CircularProgress />}
      {companiesQuery.isError && <Alert severity="error">Could not load companies</Alert>}

      <Grid container spacing={2}>
        {companiesQuery.data?.map((company) => (
          <Grid key={company.id} size={{ xs: 12, md: 6 }}>
            <Card>
              <CardActionArea component={RouterLink} to={`/companies/${company.id}/qr-codes`}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <BusinessIcon color="primary" />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h3">{company.name}</Typography>
                        <Typography color="text.secondary">/{company.slug}</Typography>
                      </Box>
                      <Chip label={company.active ? 'Active' : 'Inactive'} color={company.active ? 'success' : 'default'} />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <QrCode2Icon fontSize="small" color="action" />
                      <Typography color="text.secondary">Open QR pages</Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

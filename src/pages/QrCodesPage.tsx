import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LaunchIcon from '@mui/icons-material/Launch'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { listQrCodes } from '../api/qrApi'

export function QrCodesPage() {
  const { companyId } = useParams()
  const qrCodesQuery = useQuery({
    queryKey: ['qr-codes', companyId],
    queryFn: () => listQrCodes(companyId!),
    enabled: Boolean(companyId),
  })

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Button component={RouterLink} to="/companies" startIcon={<ArrowBackIcon />} sx={{ mb: 1 }}>
            Companies
          </Button>
          <Typography variant="h1">QR pages</Typography>
          <Typography color="text.secondary">Review published QR destinations and action buttons</Typography>
        </Box>
        <Button variant="contained" disabled>
          New QR page
        </Button>
      </Stack>

      {qrCodesQuery.isLoading && <CircularProgress />}
      {qrCodesQuery.isError && <Alert severity="error">Could not load QR pages</Alert>}

      <Grid container spacing={2}>
        {qrCodesQuery.data?.map((qr) => (
          <Grid key={qr.id} size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                    <QrCode2Icon color="primary" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h3">{qr.title}</Typography>
                      <Typography color="text.secondary">/q/{qr.slug}</Typography>
                    </Box>
                    <Chip label={qr.active ? 'Active' : 'Inactive'} color={qr.active ? 'success' : 'default'} />
                  </Stack>
                  {qr.subtitle && <Typography color="text.secondary">{qr.subtitle}</Typography>}
                  <Typography color="text.secondary">{qr.actions.length} actions · {qr.scanCount} scans</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {qr.actions.map((action) => (
                      <Chip key={action.id} label={`${action.position}. ${action.label}`} variant="outlined" />
                    ))}
                  </Stack>
                  <Button
                    component={RouterLink}
                    to={`/q/${qr.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    startIcon={<LaunchIcon />}
                    variant="outlined"
                  >
                    Open public page
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

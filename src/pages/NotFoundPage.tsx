import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
      <Container maxWidth="sm">
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="h1">Page not found</Typography>
          <Typography color="text.secondary">The page is unavailable.</Typography>
          <Button component={RouterLink} to="/companies" variant="contained">
            Go to companies
          </Button>
        </Stack>
      </Container>
    </Box>
  )
}

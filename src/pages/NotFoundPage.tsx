import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

export function NotFoundPage() {
  const { t } = useI18n()
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
      <Container maxWidth="sm">
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="h1">{t('notFound.title')}</Typography>
          <Typography color="text.secondary">{t('notFound.subtitle')}</Typography>
          <Button component={RouterLink} to="/companies" variant="contained">
            {t('notFound.button')}
          </Button>
        </Stack>
      </Container>
    </Box>
  )
}

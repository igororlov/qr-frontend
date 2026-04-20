import QrCode2Icon from '@mui/icons-material/QrCode2'
import LogoutIcon from '@mui/icons-material/Logout'
import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { LanguageSelect } from '../LanguageSelect'
import { useI18n } from '../../i18n/I18nContext'

export function AppLayout() {
  const auth = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  function logout() {
    auth.logout()
    navigate('/login', { replace: true })
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #dce5e2' }}>
        <Toolbar>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexGrow: 1 }}>
            <QrCode2Icon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              QR Admin
            </Typography>
          </Stack>
          <Box sx={{ mr: 1 }}>
            <LanguageSelect compact />
          </Box>
          <Button startIcon={<LogoutIcon />} onClick={logout}>
            {t('action.signOut')}
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Outlet />
      </Container>
    </Box>
  )
}

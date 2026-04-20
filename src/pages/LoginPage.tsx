import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { LanguageSelect } from '../components/LanguageSelect'
import { useI18n } from '../i18n/I18nContext'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

type LocationState = {
  from?: { pathname?: string }
}

export function LoginPage() {
  const auth = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/companies'

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  if (auth.isAuthenticated) {
    return <Navigate to="/companies" replace />
  }

  async function onSubmit(values: FormValues) {
    setError(null)
    try {
      await auth.login(values.email, values.password)
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setError(t('login.invalidCredentials'))
        return
      }
      setError(err instanceof Error ? err.message : t('login.loginFailed'))
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="xs">
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
          <Stack spacing={3} sx={{ alignItems: 'center' }}>
            <Box sx={{ alignSelf: 'flex-end' }}>
              <LanguageSelect compact />
            </Box>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h1">{t('login.title')}</Typography>
              <Typography color="text.secondary">{t('login.subtitle')}</Typography>
            </Box>
            {error && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
              <Stack spacing={2}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label={t('common.email')}
                      type="email"
                      autoComplete="email"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="password"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label={t('common.password')}
                      type="password"
                      autoComplete="current-password"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
                <Button type="submit" variant="contained" size="large" disabled={formState.isSubmitting}>
                  {formState.isSubmitting ? t('login.submitting') : t('login.submit')}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}

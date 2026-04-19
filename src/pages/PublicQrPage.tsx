import CallIcon from '@mui/icons-material/Call'
import EmailIcon from '@mui/icons-material/Email'
import LinkIcon from '@mui/icons-material/Link'
import RateReviewIcon from '@mui/icons-material/RateReview'
import SendIcon from '@mui/icons-material/Send'
import SmsIcon from '@mui/icons-material/Sms'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { z } from 'zod'
import type { ReactNode } from 'react'
import { getPublicQr, submitPublicForm, trackPublicAction } from '../api/qrApi'
import type { PublicQrAction, QrActionType } from '../types/qr'

const formSchema = z.object({
  senderName: z.string().max(160).optional(),
  senderEmail: z.union([z.string().email(), z.literal('')]).optional(),
  senderPhone: z.string().max(60).optional(),
  message: z.string().min(1, 'Message is required').max(4000),
})

type FormValues = z.infer<typeof formSchema>

export function PublicQrPage() {
  const { slug } = useParams()
  const qrQuery = useQuery({
    queryKey: ['public-qr', slug],
    queryFn: () => getPublicQr(slug!),
    enabled: Boolean(slug),
  })

  const clickMutation = useMutation({
    mutationFn: (actionId: string) => trackPublicAction(slug!, actionId),
  })

  const formMutation = useMutation({
    mutationFn: (values: FormValues) =>
      submitPublicForm(slug!, {
        senderName: emptyToUndefined(values.senderName),
        senderEmail: emptyToUndefined(values.senderEmail),
        senderPhone: emptyToUndefined(values.senderPhone),
        message: values.message,
      }),
  })

  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderName: '',
      senderEmail: '',
      senderPhone: '',
      message: '',
    },
  })

  if (qrQuery.isLoading) {
    return (
      <PublicShell>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <CircularProgress />
          <Typography color="text.secondary">Opening QR page</Typography>
        </Stack>
      </PublicShell>
    )
  }

  if (qrQuery.isError || !qrQuery.data) {
    return (
      <PublicShell>
        <Alert severity="error">This QR page is unavailable.</Alert>
      </PublicShell>
    )
  }

  const qr = qrQuery.data
  const formAction = qr.actions.find((action) => action.type === 'FORM')
  const linkActions = qr.actions.filter((action) => action.type !== 'FORM')

  async function onActionClick(action: PublicQrAction) {
    clickMutation.mutate(action.id)
    const href = actionHref(action)
    if (href) {
      window.location.assign(href)
    }
  }

  async function onSubmit(values: FormValues) {
    await formMutation.mutateAsync(values)
    reset()
  }

  return (
    <PublicShell>
      <Stack spacing={3}>
        <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Avatar
            src={qr.logoUrl ?? qr.companyLogoUrl ?? undefined}
            sx={{ width: 76, height: 76, bgcolor: 'primary.main', fontWeight: 800 }}
          >
            {qr.companyName.slice(0, 1)}
          </Avatar>
          <Box>
            <Typography variant="h1">{qr.title}</Typography>
            {qr.subtitle && <Typography color="text.secondary">{qr.subtitle}</Typography>}
          </Box>
        </Stack>

        <Stack spacing={1.25}>
          {linkActions.map((action) => (
            <Button
              key={action.id}
              fullWidth
              size="large"
              variant="contained"
              color="primary"
              startIcon={actionIcon(action.type)}
              onClick={() => onActionClick(action)}
              sx={{ justifyContent: 'flex-start', minHeight: 54 }}
            >
              {action.label}
            </Button>
          ))}
        </Stack>

        {formAction && (
          <>
            <Divider />
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                <Typography variant="h3">{formAction.label}</Typography>
                {formMutation.isSuccess && <Alert severity="success">Message sent.</Alert>}
                {formMutation.isError && <Alert severity="error">Could not send the message.</Alert>}
                <Controller
                  name="senderName"
                  control={control}
                  render={({ field }) => <TextField {...field} label="Name" fullWidth />}
                />
                <Controller
                  name="senderEmail"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Email"
                      type="email"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="senderPhone"
                  control={control}
                  render={({ field }) => <TextField {...field} label="Phone" fullWidth />}
                />
                <Controller
                  name="message"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Message"
                      multiline
                      minRows={4}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<SendIcon />}
                  disabled={formState.isSubmitting || formMutation.isPending}
                >
                  Send message
                </Button>
              </Stack>
            </Box>
          </>
        )}

        <Typography color="text.secondary" variant="body2" sx={{ textAlign: 'center' }}>
          {qr.companyName}
        </Typography>
      </Stack>
    </PublicShell>
  )
}

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 2, sm: 5 } }}>
      <Container maxWidth="xs">
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2 }}>
          {children}
        </Paper>
      </Container>
    </Box>
  )
}

function actionHref(action: PublicQrAction) {
  switch (action.type) {
    case 'LINK':
    case 'GOOGLE_REVIEW':
      return action.value
    case 'PHONE':
      return `tel:${action.value}`
    case 'SMS':
      return `sms:${action.value}`
    case 'EMAIL':
      return `mailto:${action.value}`
    case 'FORM':
      return null
  }
}

function actionIcon(type: QrActionType) {
  switch (type) {
    case 'PHONE':
      return <CallIcon />
    case 'SMS':
      return <SmsIcon />
    case 'EMAIL':
      return <EmailIcon />
    case 'GOOGLE_REVIEW':
      return <RateReviewIcon />
    default:
      return <LinkIcon />
  }
}

function emptyToUndefined(value?: string) {
  return value?.trim() ? value.trim() : undefined
}

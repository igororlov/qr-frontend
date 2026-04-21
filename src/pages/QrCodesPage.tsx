import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import DeleteIcon from '@mui/icons-material/Delete'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import EditIcon from '@mui/icons-material/Edit'
import LaunchIcon from '@mui/icons-material/Launch'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { z } from 'zod'
import { listCompanies } from '../api/companyApi'
import { createQrCode, generateQrCodeImage, getQrCodePng, listQrCodes, updateQrCode } from '../api/qrApi'
import { useI18n } from '../i18n/I18nContext'
import type { QrActionType, QrCode, QrCodeInput } from '../types/qr'

const actionTypes = ['LINK', 'GOOGLE_REVIEW', 'PHONE', 'SMS', 'EMAIL', 'FORM'] as const

const qrFormSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,120}$/, 'Use 3-120 lowercase letters, numbers, or hyphens'),
  title: z.string().min(1, 'Title is required').max(160),
  subtitle: z.string().max(240).optional(),
  label: z.string().max(120).optional(),
  logoUrl: z.union([z.string().url('Use a valid URL'), z.literal('')]).optional(),
  active: z.boolean(),
  buttonColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  foregroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoEnabled: z.boolean(),
  actions: z
    .array(
      z.object({
        label: z.string().min(1, 'Label is required').max(120),
        type: z.enum(actionTypes),
        value: z.string().min(1, 'Value is required').max(2000),
        active: z.boolean(),
      }),
    )
    .min(1, 'Add at least one action')
    .max(10, 'Use no more than 10 actions'),
})

type QrFormValues = z.infer<typeof qrFormSchema>

export function QrCodesPage() {
  const { t } = useI18n()
  const { companyId } = useParams()
  const [editingQr, setEditingQr] = useState<QrCode | null>(null)
  const [creatingQr, setCreatingQr] = useState(false)
  const [downloadError, setDownloadError] = useState(false)
  const [previewVersions, setPreviewVersions] = useState<Record<string, number>>({})
  const qrCodesQuery = useQuery({
    queryKey: ['qr-codes', companyId],
    queryFn: () => listQrCodes(companyId!),
    enabled: Boolean(companyId),
  })
  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: listCompanies,
  })
  const company = companiesQuery.data?.find((item) => item.id === companyId) ?? null

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Button component={RouterLink} to="/companies" startIcon={<ArrowBackIcon />} sx={{ mb: 1 }}>
            {t('companies.title')}
          </Button>
          <Typography variant="h1">{t('qr.title')}</Typography>
          <Typography color="text.secondary">{t('qr.subtitle')}</Typography>
        </Box>
        <Button variant="contained" onClick={() => setCreatingQr(true)}>
          {t('qr.newPage')}
        </Button>
      </Stack>

      {qrCodesQuery.isLoading && <CircularProgress />}
      {qrCodesQuery.isError && <Alert severity="error">{t('qr.couldNotLoad')}</Alert>}
      {downloadError && <Alert severity="error">{t('qr.couldNotLoad')}</Alert>}

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
                    <Chip label={qr.active ? t('common.active') : t('common.inactive')} color={qr.active ? 'success' : 'default'} />
                  </Stack>
                  {qr.subtitle && <Typography color="text.secondary">{qr.subtitle}</Typography>}
                  <Typography color="text.secondary">
                    {t('qr.actionsCount', { actions: qr.actions.length, scans: qr.scanCount })}
                  </Typography>
                  <QrPreview companyId={companyId!} qr={qr} version={previewVersions[qr.id]} alt={t('qr.previewAlt')} />
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                    {qr.actions.map((action) => (
                      <Chip
                        key={action.id}
                        label={`${action.position}. ${action.label} · ${actionTypeLabel(action.type, t)}`}
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button startIcon={<EditIcon />} variant="contained" onClick={() => setEditingQr(qr)}>
                      {t('action.edit')}
                    </Button>
                    <Button
                      startIcon={<FileDownloadIcon />}
                      variant="outlined"
                      onClick={async () => {
                        setDownloadError(false)
                        try {
                          await downloadQrPng(companyId!, qr)
                        } catch {
                          setDownloadError(true)
                        }
                      }}
                    >
                      {t('qr.downloadPng')}
                    </Button>
                    <Button
                      component={RouterLink}
                      to={`/q/${qr.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      startIcon={<LaunchIcon />}
                      variant="outlined"
                    >
                      {t('action.openPublicPage')}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {companyId && (
        <QrEditDialog
          companyId={companyId}
          qr={editingQr}
          mode="edit"
          previewVersion={editingQr ? previewVersions[editingQr.id] : undefined}
          onGenerated={(qrId) => setPreviewVersions((versions) => ({ ...versions, [qrId]: Date.now() }))}
          onClose={() => setEditingQr(null)}
        />
      )}
      {companyId && (
        <QrEditDialog
          companyId={companyId}
          defaultLogoUrl={company?.logoUrl ?? null}
          qr={null}
          mode="create"
          open={creatingQr}
          onClose={() => setCreatingQr(false)}
        />
      )}
    </Stack>
  )
}

function QrEditDialog({
  companyId,
  defaultLogoUrl,
  qr,
  mode,
  open,
  previewVersion,
  onGenerated,
  onClose,
}: {
  companyId: string
  defaultLogoUrl?: string | null
  qr: QrCode | null
  mode: 'create' | 'edit'
  open?: boolean
  previewVersion?: number
  onGenerated?: (qrId: string) => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const { control, getValues, handleSubmit, reset, trigger, formState } = useForm<QrFormValues>({
    resolver: zodResolver(qrFormSchema),
    defaultValues: emptyQrForm(),
  })
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'actions',
  })

  useEffect(() => {
    if (mode === 'create' && open) {
      reset(emptyQrForm(defaultLogoUrl))
      return
    }
    if (mode === 'edit' && qr) {
      reset(toFormValues(qr))
    }
  }, [defaultLogoUrl, mode, open, qr, reset])

  const saveMutation = useMutation({
    mutationFn: (values: QrFormValues) => {
      const body = toRequest(values)
      return mode === 'create' ? createQrCode(companyId, body) : updateQrCode(companyId, qr!.id, body)
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['qr-codes', companyId] })
      await queryClient.invalidateQueries({ queryKey: ['public-qr', updated.slug] })
      onClose()
    },
  })

  const generateMutation = useMutation({
    mutationFn: async () => {
      const values = getValues()
      const updated = await updateQrCode(companyId, qr!.id, toRequest(values))
      return generateQrCodeImage(companyId, qr!.id, {
        foregroundColor: updated.imageStyle.foregroundColor,
        backgroundColor: updated.imageStyle.backgroundColor,
        logoEnabled: updated.imageStyle.logoEnabled,
      })
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['qr-codes', companyId] })
      reset(toFormValues(updated))
      onGenerated?.(updated.id)
    },
  })

  async function onSubmit(values: QrFormValues) {
    await saveMutation.mutateAsync(values)
  }

  async function onGenerate() {
    const valid = await trigger()
    if (!valid || mode === 'create' || !qr) {
      return
    }
    await generateMutation.mutateAsync()
  }

  return (
    <Dialog open={open ?? Boolean(qr)} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{mode === 'create' ? t('qr.createTitle') : t('qr.editTitle')}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Stack spacing={3}>
            {saveMutation.isError && <Alert severity="error">{t('qr.couldNotSave')}</Alert>}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label={t('qr.titleField')}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="slug"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label={t('common.slug')}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message ?? t('qr.publicUrlHelp')}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="subtitle"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label={t('qr.subtitleField')}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="label"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label={t('qr.imageLabel')}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="logoUrl"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label={t('common.logoUrl')}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                      label={t('common.published')}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="buttonColor"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label={t('qr.buttonColor')}
                      type="color"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Stack spacing={1.5}>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h3">{t('qr.imageStyleTitle')}</Typography>
                    <Typography color="text.secondary">
                      {t('qr.imageStyleHelp', { url: qr ? `https://qradmin.no/q/${qr.slug}` : '/q/...' })}
                    </Typography>
                  </Box>
                  {generateMutation.isSuccess && <Alert severity="success">{t('qr.imageGenerated')}</Alert>}
                  {generateMutation.isError && <Alert severity="error">{t('qr.couldNotSave')}</Alert>}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Controller
                        name="foregroundColor"
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label={t('qr.foregroundColor')}
                            type="color"
                            error={Boolean(fieldState.error)}
                            helperText={fieldState.error?.message}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Controller
                        name="backgroundColor"
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label={t('qr.backgroundColor')}
                            type="color"
                            error={Boolean(fieldState.error)}
                            helperText={fieldState.error?.message}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Controller
                        name="logoEnabled"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                            label={t('qr.includeLogo')}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                      variant="contained"
                      startIcon={<QrCode2Icon />}
                      disabled={mode === 'create' || !qr || generateMutation.isPending}
                      onClick={onGenerate}
                    >
                      {t('qr.generateImage')}
                    </Button>
                    {qr && (
                      <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={() => downloadQrPng(companyId, qr)}
                      >
                        {t('qr.downloadPng')}
                      </Button>
                    )}
                  </Stack>
                  {qr && (
                    <QrPreview
                      companyId={companyId}
                      qr={qr}
                      version={previewVersion}
                      alt={t('qr.previewAlt')}
                    />
                  )}
                </Stack>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{t('qr.actionsTitle')}</Typography>
                  <Typography color="text.secondary">{t('qr.actionsHelp')}</Typography>
                </Box>
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  disabled={fields.length >= 10}
                  onClick={() => append(defaultAction(t))}
                >
                  {t('action.addAction')}
                </Button>
              </Stack>

              {typeof formState.errors.actions?.message === 'string' && (
                <Alert severity="error">{formState.errors.actions.message}</Alert>
              )}

              <Stack spacing={1.5}>
                {fields.map((field, index) => (
                  <Box
                    key={field.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Controller
                          name={`actions.${index}.label`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <TextField
                              {...field}
                              label={t('action.buttonLabel')}
                              error={Boolean(fieldState.error)}
                              helperText={fieldState.error?.message}
                              fullWidth
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Controller
                          name={`actions.${index}.type`}
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel id={`action-type-${index}`}>{t('qr.type')}</InputLabel>
                              <Select {...field} labelId={`action-type-${index}`} label={t('qr.type')}>
                                {actionTypes.map((type) => (
                                  <MenuItem key={type} value={type}>
                                    {actionTypeLabel(type, t)}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                          name={`actions.${index}.value`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <TextField
                              {...field}
                              label={t('qr.value')}
                              placeholder={t('qr.valuePlaceholder')}
                              error={Boolean(fieldState.error)}
                              helperText={fieldState.error?.message ?? t('qr.formKeyHelp')}
                              fullWidth
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            minHeight: 56,
                            pt: { xs: 0, md: 0.5 },
                          }}
                        >
                          <Controller
                            name={`actions.${index}.active`}
                            control={control}
                            render={({ field }) => (
                              <Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />
                            )}
                          />
                          <Tooltip title={t('action.moveUp')}>
                            <span>
                              <IconButton size="small" disabled={index === 0} onClick={() => move(index, index - 1)}>
                                <ArrowUpwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={t('action.moveDown')}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={index === fields.length - 1}
                                onClick={() => move(index, index + 1)}
                              >
                                <ArrowDownwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={t('action.remove')}>
                            <span>
                              <IconButton size="small" disabled={fields.length <= 1} onClick={() => remove(index)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={formState.isSubmitting || saveMutation.isPending}>
            {mode === 'create' ? t('action.save') : t('action.saveChanges')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

function toFormValues(qr: QrCode): QrFormValues {
  return {
    slug: qr.slug,
    title: qr.title,
    subtitle: qr.subtitle ?? '',
    label: qr.label ?? '',
    logoUrl: qr.logoUrl ?? '',
    active: qr.active,
    buttonColor: qr.buttonColor ?? '#187466',
    foregroundColor: qr.imageStyle?.foregroundColor ?? '#111111',
    backgroundColor: qr.imageStyle?.backgroundColor ?? '#ffffff',
    logoEnabled: qr.imageStyle?.logoEnabled ?? true,
    actions: qr.actions
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((action) => ({
        label: action.label,
        type: action.type,
        value: action.value,
        active: action.active,
      })),
  }
}

function toRequest(values: QrFormValues): QrCodeInput {
  return {
    slug: values.slug.trim(),
    title: values.title.trim(),
    subtitle: emptyToNull(values.subtitle),
    label: emptyToNull(values.label),
    logoUrl: emptyToNull(values.logoUrl),
    active: values.active,
    buttonColor: values.buttonColor,
    imageStyle: {
      foregroundColor: values.foregroundColor,
      backgroundColor: values.backgroundColor,
      logoEnabled: values.logoEnabled,
    },
    actions: values.actions.map((action, index) => ({
      position: index + 1,
      label: action.label.trim(),
      type: action.type,
      value: action.value.trim(),
      active: action.active,
    })),
  }
}

function emptyQrForm(defaultLogoUrl?: string | null): QrFormValues {
  return {
    slug: '',
    title: '',
    subtitle: '',
    label: '',
    logoUrl: defaultLogoUrl ?? '',
    active: true,
    buttonColor: '#187466',
    foregroundColor: '#111111',
    backgroundColor: '#ffffff',
    logoEnabled: true,
    actions: [defaultAction(() => 'Open link')],
  }
}

function defaultAction(t: (key: string) => string): QrFormValues['actions'][number] {
  return {
    label: t('action.defaultLabel'),
    type: 'LINK',
    value: 'https://example.com',
    active: true,
  }
}

function actionTypeLabel(type: QrActionType, t: (key: string) => string) {
  switch (type) {
    case 'LINK':
      return t('actionType.link')
    case 'GOOGLE_REVIEW':
      return t('actionType.googleReview')
    case 'PHONE':
      return t('actionType.phone')
    case 'SMS':
      return t('actionType.sms')
    case 'EMAIL':
      return t('actionType.email')
    case 'FORM':
      return t('actionType.form')
  }
}

function emptyToNull(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

async function downloadQrPng(companyId: string, qr: QrCode) {
  const blob = await getQrCodePng(companyId, qr.id)
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${qr.slug}-qr.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

function QrPreview({ companyId, qr, version, alt }: { companyId: string; qr: QrCode; version?: number; alt: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false

    getQrCodePng(companyId, qr.id)
      .then((blob) => {
        if (cancelled) {
          return
        }
        objectUrl = window.URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setSrc(null)
        }
      })

    return () => {
      cancelled = true
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl)
      }
    }
  }, [companyId, qr.id, qr.imageStyle?.imageGeneratedAt, qr.updatedAt, version])

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        display: 'flex',
        justifyContent: 'center',
        p: 1.5,
      }}
    >
      {src ? (
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 1,
            maxWidth: 220,
            width: '100%',
          }}
        />
      ) : (
        <CircularProgress size={28} />
      )}
    </Box>
  )
}

import AddIcon from '@mui/icons-material/Add'
import BusinessIcon from '@mui/icons-material/Business'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import UploadFileIcon from '@mui/icons-material/UploadFile'
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
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState, type ChangeEvent } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link as RouterLink } from 'react-router-dom'
import { z } from 'zod'
import { createCompany, deleteCompany, listCompanies, updateCompany, uploadCompanyLogo } from '../api/companyApi'
import { createUser, listUsers } from '../api/userApi'
import { useI18n } from '../i18n/I18nContext'
import type { Company, CompanyInput } from '../types/company'
import type { UserCreateInput, UserRole } from '../types/user'

const companySchema = z.object({
  name: z.string().min(1, 'Name is required').max(160),
  slug: z.string().regex(/^[a-z0-9-]{3,120}$/, 'Use 3-120 lowercase letters, numbers, or hyphens'),
  logoUrl: z.union([z.string().url('Use a valid URL'), z.literal('')]).optional(),
  ownerUserId: z.string().optional(),
  active: z.boolean(),
})

const userSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1, 'Name is required').max(160),
  password: z.string().min(8, 'Use at least 8 characters').max(200),
  role: z.enum(['SYSTEM_ADMIN', 'COMPANY_ADMIN']),
})

type CompanyFormValues = z.infer<typeof companySchema>
type UserFormValues = z.infer<typeof userSchema>

export function CompaniesPage() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [companyDialog, setCompanyDialog] = useState<{ mode: 'create' | 'edit'; company: Company | null } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)

  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: listCompanies,
  })
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
    retry: false,
  })

  const deleteMutation = useMutation({
    mutationFn: (companyId: string) => deleteCompany(companyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['companies'] })
      setDeleteTarget(null)
    },
  })

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h1">{t('companies.title')}</Typography>
          <Typography color="text.secondary">{t('companies.subtitle')}</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => setAccountDialogOpen(true)}>
            {t('companies.newAccount')}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCompanyDialog({ mode: 'create', company: null })}>
            {t('companies.newCompany')}
          </Button>
        </Stack>
      </Stack>

      {companiesQuery.isLoading && <CircularProgress />}
      {companiesQuery.isError && <Alert severity="error">{t('companies.couldNotLoad')}</Alert>}
      {deleteMutation.isError && <Alert severity="error">{t('companies.couldNotDelete')}</Alert>}

      <Grid container spacing={2}>
        {companiesQuery.data?.map((company) => (
          <Grid key={company.id} size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <BusinessIcon color="primary" />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="h3">{company.name}</Typography>
                      <Typography color="text.secondary">/{company.slug}</Typography>
                    </Box>
                    <Chip label={company.active ? t('common.active') : t('common.inactive')} color={company.active ? 'success' : 'default'} />
                  </Stack>
                  <Typography color="text.secondary">{t('companies.ownerPrefix', { email: company.ownerEmail })}</Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <QrCode2Icon fontSize="small" color="action" />
                    <Typography color="text.secondary">{t('companies.openQrPages')}</Typography>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button component={RouterLink} to={`/companies/${company.id}/qr-codes`} variant="contained">
                      {t('companies.qrPages')}
                    </Button>
                    <Button
                      startIcon={<EditIcon />}
                      variant="outlined"
                      onClick={() => setCompanyDialog({ mode: 'edit', company })}
                    >
                      {t('action.edit')}
                    </Button>
                    <Button
                      startIcon={<DeleteIcon />}
                      color="error"
                      variant="outlined"
                      onClick={() => setDeleteTarget(company)}
                    >
                      {t('action.delete')}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <CompanyDialog
        open={Boolean(companyDialog)}
        mode={companyDialog?.mode ?? 'create'}
        company={companyDialog?.company ?? null}
        users={usersQuery.data ?? []}
        onClose={() => setCompanyDialog(null)}
      />
      <AccountDialog
        open={accountDialogOpen}
        onClose={() => setAccountDialogOpen(false)}
      />
      <DeleteCompanyDialog
        company={deleteTarget}
        isDeleting={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </Stack>
  )
}

function CompanyDialog({
  open,
  mode,
  company,
  users,
  onClose,
}: {
  open: boolean
  mode: 'create' | 'edit'
  company: Company | null
  users: Array<{ id: string; email: string }>
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const [logoUploaded, setLogoUploaded] = useState(false)
  const { control, handleSubmit, reset, formState } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: emptyCompanyForm(),
  })

  useEffect(() => {
    reset(company ? toCompanyForm(company) : emptyCompanyForm())
  }, [company, open, reset])

  const saveMutation = useMutation({
    mutationFn: (values: CompanyFormValues) => {
      const body = toCompanyRequest(values)
      return mode === 'edit' && company ? updateCompany(company.id, body) : createCompany(body)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['companies'] })
      onClose()
    },
  })

  const logoMutation = useMutation({
    mutationFn: (file: File) => uploadCompanyLogo(company!.id, file),
    onSuccess: async (updated) => {
      setLogoUploaded(true)
      reset(toCompanyForm(updated))
      await queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  async function onSubmit(values: CompanyFormValues) {
    await saveMutation.mutateAsync(values)
  }

  function onLogoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    setLogoUploaded(false)
    if (file && company) {
      logoMutation.mutate(file)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'edit' ? t('companies.editTitle') : t('companies.newCompany')}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Stack spacing={2}>
            {saveMutation.isError && <Alert severity="error">{t('companies.couldNotSave')}</Alert>}
            {logoMutation.isError && <Alert severity="error">{t('companies.logoUploadFailed')}</Alert>}
            {logoUploaded && <Alert severity="success">{t('companies.logoUploaded')}</Alert>}
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={t('companies.name')}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="slug"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={t('common.slug')}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message ?? t('companies.slugHelp')}
                  fullWidth
                />
              )}
            />
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
            <Stack spacing={1}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  disabled={!company || logoMutation.isPending}
                >
                  {t('companies.logoUpload')}
                  <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onLogoSelected} />
                </Button>
                {!company && (
                  <Typography color="text.secondary" variant="body2" sx={{ alignSelf: 'center' }}>
                    {t('companies.logoUploadFirstSave')}
                  </Typography>
                )}
              </Stack>
              <Typography color="text.secondary" variant="body2">
                {t('companies.logoUploadHelp')}
              </Typography>
            </Stack>
            {users.length > 0 && (
              <Controller
                name="ownerUserId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="company-owner-label">{t('common.owner')}</InputLabel>
                    <Select {...field} labelId="company-owner-label" label={t('common.owner')}>
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            )}
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                  label={t('common.active')}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={formState.isSubmitting || saveMutation.isPending}>
            {t('action.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

function AccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const { control, handleSubmit, reset, formState } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      role: 'COMPANY_ADMIN',
    },
  })

  useEffect(() => {
    if (open) {
      reset({ email: '', fullName: '', password: '', role: 'COMPANY_ADMIN' })
    }
  }, [open, reset])

  const createMutation = useMutation({
    mutationFn: (values: UserFormValues) => createUser(toUserRequest(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
  })

  async function onSubmit(values: UserFormValues) {
    await createMutation.mutateAsync(values)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('user.newAccount')}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Stack spacing={2}>
            {createMutation.isError && <Alert severity="error">{t('user.couldNotCreate')}</Alert>}
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={t('common.email')}
                  type="email"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="fullName"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={t('user.fullName')}
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
                  label={t('user.temporaryPassword')}
                  type="password"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="account-role-label">{t('common.role')}</InputLabel>
                  <Select {...field} labelId="account-role-label" label={t('common.role')}>
                    <MenuItem value="COMPANY_ADMIN">{t('role.companyAdmin')}</MenuItem>
                    <MenuItem value="SYSTEM_ADMIN">{t('role.systemAdmin')}</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={formState.isSubmitting || createMutation.isPending}>
            {t('user.createAccount')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

function DeleteCompanyDialog({
  company,
  isDeleting,
  onClose,
  onConfirm,
}: {
  company: Company | null
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={Boolean(company)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('companies.deleteTitle')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="warning">{t('companies.deleteWarning')}</Alert>
          <Typography>{company ? t('companies.deleteConfirm', { name: company.name }) : ''}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button color="error" variant="contained" disabled={isDeleting} onClick={onConfirm}>
          {t('action.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function toCompanyForm(company: Company): CompanyFormValues {
  return {
    name: company.name,
    slug: company.slug,
    logoUrl: company.logoUrl ?? '',
    ownerUserId: company.ownerUserId,
    active: company.active,
  }
}

function emptyCompanyForm(): CompanyFormValues {
  return {
    name: '',
    slug: '',
    logoUrl: '',
    ownerUserId: '',
    active: true,
  }
}

function toCompanyRequest(values: CompanyFormValues): CompanyInput {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    logoUrl: emptyToNull(values.logoUrl),
    ownerUserId: emptyToNull(values.ownerUserId),
    active: values.active,
  }
}

function toUserRequest(values: UserFormValues): UserCreateInput {
  return {
    email: values.email.trim(),
    fullName: values.fullName.trim(),
    password: values.password,
    role: values.role as UserRole,
  }
}

function emptyToNull(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

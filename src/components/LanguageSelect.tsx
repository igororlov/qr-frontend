import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { useI18n, type Language } from '../i18n/I18nContext'

export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { language, languages, setLanguage, t } = useI18n()

  return (
    <FormControl size="small" sx={{ minWidth: compact ? 104 : 120 }}>
      <InputLabel id="language-label">{t('common.language')}</InputLabel>
      <Select
        labelId="language-label"
        label={t('common.language')}
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
      >
        {languages.map((item) => (
          <MenuItem key={item.code} value={item.code}>
            {item.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

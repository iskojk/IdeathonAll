'use client';

import { Accordion, AccordionSummary, AccordionDetails, Alert, Box, Button, Checkbox, Chip, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import { IconChevronDown, IconArrowUp, IconArrowDown, IconTrash } from '@tabler/icons-react';

export const answerFormats = {
  text: { label: 'Kısa metin', type: 'text', inputType: 'text', help: 'Ad, girişim adı veya kısa bir yanıt için.' },
  textarea: { label: 'Uzun metin', type: 'textarea', help: 'Girişimi, ekibi veya çözümü ayrıntılı anlatmak için.' },
  email: { label: 'E-posta', type: 'text', inputType: 'email', help: 'Geçerli bir e-posta adresi istenir.' },
  tel: { label: 'Telefon', type: 'text', inputType: 'tel', help: 'Telefon numarası doğrulanır ve uygun biçimde kaydedilir.' },
  url: { label: 'Web adresi', type: 'text', inputType: 'url', help: 'Web sitesi veya bağlantı için.' },
  number: { label: 'Sayı', type: 'text', inputType: 'number', help: 'Ekip büyüklüğü gibi sayısal bir yanıt için.' },
  date: { label: 'Tarih', type: 'text', inputType: 'date', help: 'Kullanıcı takvimden bir tarih seçer.' },
  singleChoice: { label: 'Çoktan seçmeli (tek yanıt)', type: 'singleChoice', help: 'Kullanıcı seçeneklerden yalnızca birini seçer.' },
  multipleChoice: { label: 'Kutucuklar (çoklu seçim)', type: 'multipleChoice', help: 'Kullanıcı birden fazla seçenek işaretleyebilir.' },
  file: { label: 'Belge yükleme', type: 'file', help: 'PDF, PNG veya JPEG yüklenebilir. Dosya başına en fazla 10 MB.' },
};
export const questionFormat = question => question.type === 'text' ? question.inputType || 'text' : question.type;

export function withFormat(question, format) {
  const config = answerFormats[format];
  const result = { id: question.id, section: question.section, label: question.label, help: question.help || '', required: question.required, type: config.type };
  if (['text', 'textarea'].includes(config.type)) {
    result.maxLength = ['text', 'textarea'].includes(question.type) ? question.maxLength : config.type === 'text' ? 500 : 2500;
    result.placeholder = question.placeholder || '';
    if (config.inputType) result.inputType = config.inputType;
    if (question.prefill && questionFormat(question) === format) result.prefill = question.prefill;
  }
  if (['singleChoice', 'multipleChoice'].includes(config.type)) result.options = question.options || ['Evet', 'Hayır'];
  if (config.type === 'file') result.maxFiles = question.maxFiles || 1;
  return result;
}

const mutedButton = { color: '#526174', bgcolor: 'transparent', '&:hover': { bgcolor: '#f3f6f9' } };

export default function EntrepreneurQuestionEditor({ question, index, total, expanded, onExpand, onChange, onFormat, onMove, onRemove, sections, disabled, errorMessage }) {
  const format = questionFormat(question);
  const config = answerFormats[format];
  const choices = ['singleChoice', 'multipleChoice'].includes(question.type);
  return <Accordion expanded={expanded} onChange={(_, open) => onExpand(open)} disableGutters sx={{ border: 1, borderColor: expanded ? '#a3c9e4' : 'divider', borderLeft: `3px solid ${expanded ? '#3c85bd' : '#c5dbea'}`, borderRadius: '10px !important', boxShadow: expanded ? '0 3px 12px rgba(40,100,145,.07)' : 'none', overflow: 'hidden', transition: 'border-color 160ms ease, box-shadow 160ms ease', '&:before': { display: 'none' } }}>
    <AccordionSummary expandIcon={<IconChevronDown size={18} />} sx={{ px: 2, minHeight: 68, bgcolor: expanded ? '#f3f8fc' : 'transparent', '&:hover': { bgcolor: '#f6f9fc' }, '& .MuiAccordionSummary-content': { minWidth: 0, my: 1.5 } }} aria-label={`${question.label || 'Başlıksız soru'} sorusunu düzenle`}>
      <Stack direction="row" gap={1.5} alignItems="center" sx={{ width: '100%', minWidth: 0 }}>
        <Box sx={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 1, fontSize: 12, fontWeight: 600, bgcolor: expanded ? '#e1eff9' : '#edf3f8', color: '#3d6b8d', flexShrink: 0 }}>{String(index + 1).padStart(2, '0')}</Box>
        <Box sx={{ minWidth: 0, flex: 1 }}><Typography sx={{ fontSize: 14, fontWeight: 600, overflowWrap: 'anywhere' }}>{question.label || 'Başlıksız soru'}</Typography><Typography sx={{ fontSize: 12, mt: 0.5 }} color="text.secondary">{config?.label} · {question.required ? 'Zorunlu' : 'İsteğe bağlı'}</Typography></Box>
        {expanded && <Chip label="Düzenleniyor" size="small" variant="outlined" sx={{ display: { xs: 'none', sm: 'flex' }, fontSize: 11, color: '#0065ae', borderColor: '#b8d8ee' }} />}
      </Stack>
    </AccordionSummary>
    <AccordionDetails sx={{ p: { xs: 2, sm: 2.5 }, borderTop: 1, borderColor: 'divider' }}>
      <Stack spacing={2.5}>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        <TextField fullWidth label="Soru metni" value={question.label} onChange={e => onChange({ label: e.target.value })} inputProps={{ maxLength: 500 }} error={!question.label.trim()} helperText={!question.label.trim() ? 'Kullanıcının göreceği soruyu yazın.' : undefined} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
          <TextField select fullWidth label="Cevap formatı" value={format} onChange={e => onFormat(e.target.value)} SelectProps={{ native: true }} helperText={config?.help}>{Object.entries(answerFormats).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</TextField>
          <FormControlLabel sx={{ flexShrink: 0, pt: { sm: 0.75 }, mr: 0 }} control={<Checkbox checked={question.required} onChange={e => onChange({ required: e.target.checked })} />} label={<Typography fontSize={13}>Yanıt zorunlu</Typography>} />
        </Stack>
        {choices && <TextField fullWidth label="Seçenekler" multiline minRows={3} maxRows={8} value={(question.options || []).join('\n')} onChange={e => onChange({ options: e.target.value.split('\n') })} helperText={`Her satıra bir seçenek yazın. ${question.type === 'singleChoice' ? '2–100' : '2–30'} farklı seçenek ekleyebilirsiniz.`} />}
        {question.type === 'file' && <TextField label="En fazla dosya sayısı" type="number" value={question.maxFiles} onChange={e => onChange({ maxFiles: Number(e.target.value) })} inputProps={{ min: 1, max: 10 }} helperText="1–10 dosya" sx={{ maxWidth: 240 }} />}
        <TextField select label="Sorunun bulunduğu bölüm" value={question.section} onChange={e => onChange({ section: e.target.value })} SelectProps={{ native: true }}>{sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</TextField>
        <Box component="details" sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 1.5, '& summary': { cursor: 'pointer', fontSize: 13, color: '#526174' } }}>
          <summary>Ek ayarlar · açıklama ve sınırlar</summary>
          <Stack spacing={2} mt={2}>
            <TextField label="Açıklama / yardım metni" multiline minRows={2} value={question.help || ''} onChange={e => onChange({ help: e.target.value })} inputProps={{ maxLength: 2000 }} helperText="İsteğe bağlı. Kullanıcının soruyu anlamasına yardımcı olur." />
            {['text', 'textarea'].includes(question.type) && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField type="number" label="Karakter sınırı" value={question.maxLength} onChange={e => onChange({ maxLength: Number(e.target.value) })} inputProps={{ min: 1, max: 10000 }} helperText="1–10.000 karakter" />
              <TextField fullWidth label="Örnek yanıt / yer tutucu" value={question.placeholder || ''} onChange={e => onChange({ placeholder: e.target.value })} inputProps={{ maxLength: 500 }} />
            </Stack>}
          </Stack>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Button size="small" sx={mutedButton} startIcon={<IconArrowUp size={16} />} disabled={disabled || index === 0} onClick={() => onMove(-1)}>Yukarı</Button>
          <Button size="small" sx={mutedButton} startIcon={<IconArrowDown size={16} />} disabled={disabled || index === total - 1} onClick={() => onMove(1)}>Aşağı</Button>
          <Button size="small" color="error" sx={{ ml: 'auto', bgcolor: 'transparent', '&:hover': { bgcolor: 'error.light' } }} startIcon={<IconTrash size={16} />} disabled={disabled} onClick={onRemove}>Soruyu sil</Button>
        </Stack>
      </Stack>
    </AccordionDetails>
  </Accordion>;
}

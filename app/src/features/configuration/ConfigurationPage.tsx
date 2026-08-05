import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, List, ListItem, ListItemText,
  MenuItem, Radio, RadioGroup, Stack, Switch, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import {
  useAppConfig, useUpdateAppConfig, useCreateDistrict, useUpdateDistrict, useDeleteDistrict,
  useAcademicTitles, useCreateAcademicTitle, useUpdateAcademicTitle, useDeleteAcademicTitle, useUpdateRoleEmail,
} from './api';
import { useDistricts } from '../lodges/api';
import { useRoles } from '../categories/api';
import DistrictForm from './DistrictForm';
import AcademicTitleForm from './AcademicTitleForm';
import LogoSection from './LogoSection';
import { apiErrorMessage } from '../../api/client';
import { useDemoMode } from '../../api/useDemoMode';
import { useAuth } from '../../auth/AuthProvider';
import type { AppConfigValues, DistrictSummary, AcademicTitleSummary, RoleSummary } from '../../api/types';
import { FIELDS, type FieldCategory, type FieldType } from './fields';

export default function ConfigurationPage() {
  const { t } = useTranslation();
  const { abilities } = useAuth();
  const canUpdate = abilities.app_config?.includes('update');
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('configuration.header')}</Typography>
      {!canUpdate && <Alert severity="error">{t('configuration.forbidden')}</Alert>}
      {canUpdate && (
        <>
          <Tabs value={activeTab} onChange={(_e, value: number) => setActiveTab(value)} sx={{ mb: 2 }}>
            <Tab label={t('configuration.tabs.funktionen')} />
            <Tab label={t('configuration.tabs.konfiguration')} />
            <Tab label={t('configuration.tabs.impressum')} />
            <Tab label={t('configuration.tabs.sicherheit')} />
            <Tab label={t('configuration.tabs.design')} />
            <Tab label={t('configuration.districtsHeader')} />
            <Tab label={t('configuration.academicTitlesHeader')} />
            <Tab label={t('configuration.rolesHeader')} />
          </Tabs>
          <AppConfigSection activeTab={activeTab} />
          <TabPanel active={activeTab === 4}><LogoSection /></TabPanel>
          <TabPanel active={activeTab === 5}><DistrictSection /></TabPanel>
          <TabPanel active={activeTab === 6}><AcademicTitleSection /></TabPanel>
          <TabPanel active={activeTab === 7}><RoleEmailSection /></TabPanel>
        </>
      )}
    </Box>
  );
}

// Always mounted, hidden via the `hidden` attribute rather than conditional
// rendering - unsaved edits in a panel (e.g. AppConfigSection's form state)
// must survive the user switching to another tab and back.
function TabPanel({ active, children }: { active: boolean; children: ReactNode }) {
  return <Box role="tabpanel" hidden={!active}>{children}</Box>;
}

function categoryForTab(index: number): FieldCategory | null {
  if (index === 0) return 'funktionen';
  if (index === 1) return 'konfiguration';
  if (index === 2) return 'impressum';
  if (index === 3) return 'sicherheit';
  return null;
}

// Generic per-key helper so the compiler can verify `target[key] = from[key]`
// against a single correlated key type - assigning through a `keyof` union
// directly (`changed[key] = values[key]` inline in a loop) is a type error,
// since AppConfigValues' properties don't all share the same value type.
function copyIfChanged<K extends keyof AppConfigValues>(
  target: Partial<AppConfigValues>, key: K, from: AppConfigValues, base: AppConfigValues,
) {
  if (from[key] !== base[key]) target[key] = from[key];
}

function AppConfigSection({ activeTab }: { activeTab: number }) {
  const { t } = useTranslation();
  const { data, isLoading } = useAppConfig();
  const { mutate: update, isPending } = useUpdateAppConfig();
  const [values, setValues] = useState<AppConfigValues>({});
  const demo = useDemoMode();

  useEffect(() => { if (data) setValues(data); }, [data]);

  if (isLoading || !data) return null;

  const setField = (key: keyof AppConfigValues, value: unknown) => setValues((v) => ({ ...v, [key]: value }));
  const activeCategory = categoryForTab(activeTab);

  // Only submit fields the admin actually changed - not the whole loaded
  // state. Otherwise every save drags along every untouched key (including
  // demo-locked ones like max_db_mem_size), which the demo backend rejects
  // outright just for being present in the body, breaking unrelated saves.
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const changed: Partial<AppConfigValues> = {};
    for (const key of Object.keys(values) as (keyof AppConfigValues)[]) {
      copyIfChanged(changed, key, values, data);
    }
    update(changed);
  };

  return (
    <Box component="form" sx={{ mb: 4 }} onSubmit={onSubmit}>
      {(['funktionen', 'konfiguration', 'impressum', 'sicherheit'] as const).map((category) => (
        <TabPanel key={category} active={activeCategory === category}>
          <Stack spacing={2} sx={{ maxWidth: 640 }}>
            {FIELDS.filter((field) => field.category === category && (!field.visibleWhen || field.visibleWhen(values)))
              .map(({ key, type, options, unit, renderAs }) => (
                <ConfigField
                  key={key}
                  fieldKey={key}
                  type={type}
                  options={options}
                  unit={unit}
                  renderAs={renderAs}
                  value={values[key]}
                  onChange={(v) => setField(key, v)}
                  disabled={key === 'max_db_mem_size' && demo}
                />
              ))}
          </Stack>
        </TabPanel>
      ))}
      {activeCategory && (
        <Box sx={{ mt: 2 }}>
          <Button type="submit" variant="contained" disabled={isPending}>{t('configuration.save')}</Button>
        </Box>
      )}
    </Box>
  );
}

const BYTES_PER_MB = 1024 * 1024;

function ConfigField({
  fieldKey, type, options, unit, renderAs, value, onChange, disabled,
}: {
  fieldKey: keyof AppConfigValues;
  type: FieldType;
  options?: string[];
  unit?: 'mb';
  renderAs?: 'radio';
  value: AppConfigValues[keyof AppConfigValues];
  onChange: (value: unknown) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const label = t(`configuration.options.${fieldKey}.name`);
  const description = t(`configuration.options.${fieldKey}.description`, { defaultValue: '' });
  const lockedCaption = disabled ? t(`configuration.options.${fieldKey}_demo_locked`, { defaultValue: '' }) : '';

  if (unit === 'mb') {
    const mb = value ? Math.round(Number(value) / BYTES_PER_MB) : '';
    return (
      <TextField
        label={label}
        helperText={lockedCaption || description || undefined}
        type="number"
        value={mb}
        disabled={disabled}
        onChange={(e) => onChange(String(Math.max(0, Number(e.target.value) || 0) * BYTES_PER_MB))}
      />
    );
  }

  if (type === 'boolean') {
    return (
      <Box>
        <FormControlLabel
          control={<Switch checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />}
          label={label}
        />
        {description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{description}</Typography>}
      </Box>
    );
  }

  if (type === 'enum' && renderAs === 'radio') {
    return (
      <Box>
        <Typography sx={{ fontWeight: 500 }}>{label}</Typography>
        {description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{description}</Typography>}
        <RadioGroup value={value ?? options?.[0] ?? ''} onChange={(e) => onChange(e.target.value)}>
          {(options ?? []).map((option) => (
            <FormControlLabel key={option} value={option} control={<Radio />} label={t(`configuration.options.${fieldKey}.values.${option}`)} />
          ))}
        </RadioGroup>
      </Box>
    );
  }

  if (type === 'enum') {
    return (
      <TextField
        select
        label={label}
        helperText={description || undefined}
        value={value ?? options?.[0] ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {(options ?? []).map((option) => (
          <MenuItem key={option} value={option}>{t(`configuration.options.${fieldKey}.values.${option}`)}</MenuItem>
        ))}
      </TextField>
    );
  }

  return (
    <TextField
      label={label}
      helperText={description || undefined}
      type={type === 'integer' ? 'number' : 'text'}
      multiline={type === 'text'}
      minRows={type === 'text' ? 3 : undefined}
      value={value ?? ''}
      onChange={(e) => onChange(type === 'integer' ? Number(e.target.value) : e.target.value)}
    />
  );
}

function DistrictSection() {
  const { t } = useTranslation();
  const { data } = useDistricts();
  const { mutate: createDistrict, isPending: creating, error: createError } = useCreateDistrict();
  const [editing, setEditing] = useState<DistrictSummary | 'new' | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { mutate: deleteDistrict } = useDeleteDistrict();

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h2">{t('configuration.districtsHeader')}</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setEditing('new')}>{t('configuration.districtCreate')}</Button>
      </Stack>
      <List sx={{ maxWidth: 480 }}>
        {(data?.rows ?? []).map((district) => (
          <ListItem
            key={district.id}
            secondaryAction={
              <Stack direction="row">
                <IconButton edge="end" aria-label={t('configuration.districtEdit')} onClick={() => setEditing(district)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton edge="end" aria-label={t('lodges.delete')} onClick={() => setDeleteId(district.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            }
          >
            <ListItemText primary={district.name} />
          </ListItem>
        ))}
      </List>

      {editing === 'new' && (
        <DistrictForm
          key="new"
          open
          submitting={creating}
          submitError={createError ? apiErrorMessage(createError) : null}
          onClose={() => setEditing(null)}
          onSubmit={(name) => createDistrict({ name }, { onSuccess: () => setEditing(null) })}
        />
      )}
      {editing && editing !== 'new' && (
        <EditDistrictDialog district={editing} onClose={() => setEditing(null)} />
      )}
      {deleteId !== null && (
        <ConfirmDeleteDialog
          onCancel={() => setDeleteId(null)}
          onConfirm={() => { deleteDistrict(deleteId); setDeleteId(null); }}
        />
      )}
    </Box>
  );
}

function EditDistrictDialog({ district, onClose }: { district: DistrictSummary; onClose: () => void }) {
  const { mutate: updateDistrict, isPending, error } = useUpdateDistrict(district.id);
  return (
    <DistrictForm
      key={district.id}
      open
      initialName={district.name}
      submitting={isPending}
      submitError={error ? apiErrorMessage(error) : null}
      onClose={onClose}
      onSubmit={(name) => updateDistrict({ name }, { onSuccess: onClose })}
    />
  );
}

function AcademicTitleSection() {
  const { t } = useTranslation();
  const { data } = useAcademicTitles();
  const { mutate: createTitle, isPending: creating, error: createError } = useCreateAcademicTitle();
  const [editing, setEditing] = useState<AcademicTitleSummary | 'new' | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { mutate: deleteTitle } = useDeleteAcademicTitle();

  return (
    <Box sx={{ mt: 4 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h2">{t('configuration.academicTitlesHeader')}</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setEditing('new')}>{t('configuration.academicTitleCreate')}</Button>
      </Stack>
      {deleteError && <Alert severity="error" sx={{ mb: 2, maxWidth: 480 }}>{deleteError}</Alert>}
      <List sx={{ maxWidth: 480 }}>
        {(data?.rows ?? []).map((title) => (
          <ListItem
            key={title.id}
            secondaryAction={
              <Stack direction="row">
                <IconButton edge="end" aria-label={t('configuration.academicTitleEdit')} onClick={() => setEditing(title)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton edge="end" aria-label={t('lodges.delete')} onClick={() => { setDeleteError(null); setDeleteId(title.id); }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            }
          >
            <ListItemText primary={title.short} />
          </ListItem>
        ))}
      </List>

      {editing === 'new' && (
        <AcademicTitleForm
          key="new"
          open
          submitting={creating}
          submitError={createError ? apiErrorMessage(createError) : null}
          onClose={() => setEditing(null)}
          onSubmit={(short) => createTitle({ short }, { onSuccess: () => setEditing(null) })}
        />
      )}
      {editing && editing !== 'new' && (
        <EditAcademicTitleDialog title={editing} onClose={() => setEditing(null)} />
      )}
      {deleteId !== null && (
        <ConfirmDeleteDialog
          onCancel={() => setDeleteId(null)}
          onConfirm={() => {
            deleteTitle(deleteId, {
              onError: (err) => { setDeleteError(apiErrorMessage(err)); setDeleteId(null); },
              onSuccess: () => setDeleteId(null),
            });
          }}
        />
      )}
    </Box>
  );
}

function EditAcademicTitleDialog({ title, onClose }: { title: AcademicTitleSummary; onClose: () => void }) {
  const { mutate: updateTitle, isPending, error } = useUpdateAcademicTitle(title.id);
  return (
    <AcademicTitleForm
      key={title.id}
      open
      initialShort={title.short}
      submitting={isPending}
      submitError={error ? apiErrorMessage(error) : null}
      onClose={onClose}
      onSubmit={(short) => updateTitle({ short }, { onSuccess: onClose })}
    />
  );
}

function RoleEmailSection() {
  const { t } = useTranslation();
  const { data } = useRoles();
  const [editing, setEditing] = useState<RoleSummary | null>(null);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h2" sx={{ mb: 1 }}>{t('configuration.rolesHeader')}</Typography>
      <List sx={{ maxWidth: 480 }}>
        {(data?.rows ?? []).map((role) => (
          <ListItem
            key={role.id}
            secondaryAction={
              <IconButton edge="end" aria-label={t('configuration.roleEditEmail')} onClick={() => setEditing(role)}>
                <EditIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemText primary={role.display_name} secondary={role.email ?? '—'} />
          </ListItem>
        ))}
      </List>
      {editing && <EditRoleEmailDialog role={editing} onClose={() => setEditing(null)} />}
    </Box>
  );
}

function EditRoleEmailDialog({ role, onClose }: { role: RoleSummary; onClose: () => void }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState(role.email ?? '');
  const { mutate: updateEmail, isPending, error } = useUpdateRoleEmail(role.id);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('configuration.roleEditEmail')}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(error)}</Alert>}
        <TextField fullWidth label={t('configuration.roleEmail')} value={email} onChange={(e) => setEmail(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('configuration.cancel')}</Button>
        <Button variant="contained" disabled={isPending} onClick={() => updateEmail(email, { onSuccess: onClose })}>
          {t('configuration.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ConfirmDeleteDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const { t } = useTranslation();
  return (
    <Alert
      severity="warning"
      sx={{ mt: 2, maxWidth: 480 }}
      action={
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={onCancel}>{t('configuration.cancel')}</Button>
          <Button size="small" color="error" onClick={onConfirm}>{t('lodges.deleteConfirm')}</Button>
        </Stack>
      }
    >
      {t('lodges.deleteConfirm')}
    </Alert>
  );
}

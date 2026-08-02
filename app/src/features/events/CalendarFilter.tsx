import { Autocomplete, Checkbox, TextField } from '@mui/material';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { useTranslation } from 'react-i18next';
import type { ExternalEventIcsSourceOption } from './api';

export interface CalendarFilterOption {
  key: string;
  label: string;
}

export interface CalendarFilterProps {
  icsSources: ExternalEventIcsSourceOption[];
  icsSourcesTruncated?: boolean;
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
}

export default function CalendarFilter({ icsSources, icsSourcesTruncated, selected, onChange }: CalendarFilterProps) {
  const { t } = useTranslation();

  const options: CalendarFilterOption[] = [
    { key: 'birthdays', label: t('events.calendar.filterBirthdays') },
    { key: 'external-events', label: t('events.calendar.filterExternalEvents') },
    ...icsSources.map((s) => ({ key: s.uuid, label: s.name })),
  ];
  const selectedOptions = options.filter((o) => selected.has(o.key));

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={options}
      value={selectedOptions}
      isOptionEqualToValue={(option, value) => option.key === value.key}
      getOptionLabel={(option) => option.label}
      onChange={(_event, newValue) => onChange(new Set(newValue.map((o) => o.key)))}
      renderOption={(props, option, { selected: isSelected }) => {
        const { key, ...rest } = props;
        return (
          <li key={key} {...rest}>
            <Checkbox icon={<CheckBoxOutlineBlankIcon fontSize="small" />} checkedIcon={<CheckBoxIcon fontSize="small" />} checked={isSelected} sx={{ mr: 1 }} />
            {option.label}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('events.calendar.filterLabel')}
          placeholder={t('events.calendar.filterPlaceholder')}
          helperText={icsSourcesTruncated ? t('events.calendar.filterSourcesTruncated') : undefined}
        />
      )}
      sx={{ minWidth: 280 }}
      size="small"
    />
  );
}

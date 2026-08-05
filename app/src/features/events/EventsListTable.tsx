import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import { Box, Chip, Link, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import RowActions from '../../components/RowActions';
import BirthdayContactDialog from '../members/BirthdayContactDialog';
import { formatDate } from '../../utils/formatDate';
import type { BirthdayListRow, Event, ExternalEvent } from '../../api/types';

export interface EventsListTableProps {
  events: Event[];
  externalEvents: ExternalEvent[];
  birthdays: BirthdayListRow[];
  from: string;
  to: string;
  isLoading: boolean;
  canUpdate: boolean;
  canDestroy: boolean;
  deleting: boolean;
  onDeleteEvent: (uuid: string) => void;
}

interface Row {
  key: string;
  date: string;
  time: string | null;
  title: string;
  location: string | null;
  kind: 'event' | 'external-event' | 'birthday';
  uuid: string;
}

/**
 * A birthday's stored `date_of_birth` keeps the actual birth year, which
 * would always sort earliest in a list mixed with this-month's events. Since
 * `filterBirthdaysInRange` already guarantees the month/day falls somewhere
 * in [from, to], re-key it onto whichever of from's/to's year actually lands
 * inside the range (the two can differ across a Dec/Jan-spanning grid).
 */
function resolveBirthdayOccurrence(dateOfBirth: string, from: string, to: string): string {
  const [, mm, dd] = dateOfBirth.split('-');
  for (const year of new Set([from.slice(0, 4), to.slice(0, 4)])) {
    const candidate = `${year}-${mm}-${dd}`;
    if (candidate >= from && candidate <= to) return candidate;
  }
  return `${from.slice(0, 4)}-${mm}-${dd}`;
}

export default function EventsListTable({ events, externalEvents, birthdays, from, to, isLoading, canUpdate, canDestroy, deleting, onDeleteEvent }: EventsListTableProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [contactUuid, setContactUuid] = useState<string | null>(null);

  const rows = useMemo(() => {
    const result: Row[] = [];
    for (const e of events) {
      result.push({ key: `event-${e.uuid}`, date: e.date, time: e.whole_day ? null : (e.time ?? null), title: e.title, location: e.location, kind: 'event', uuid: e.uuid });
    }
    for (const e of externalEvents) {
      result.push({ key: `external-${e.uuid}`, date: e.date, time: e.time ?? null, title: e.title, location: e.location, kind: 'external-event', uuid: e.uuid });
    }
    for (const b of birthdays) {
      // BirthdayListRow's schema marks every field nullable (unlike Event/
      // ExternalEvent, whose uuid is always required) - skip a row lacking
      // either value needed to place and link it, rather than rendering a
      // dead/unclickable contact row or a literal "null" in the row key.
      if (!b.date_of_birth || !b.uuid) continue;
      result.push({ key: `birthday-${b.uuid}`, date: resolveBirthdayOccurrence(b.date_of_birth, from, to), time: null, title: `${b.firstname} ${b.lastname}`, location: null, kind: 'birthday', uuid: b.uuid });
    }
    return result.sort((a, b) => (a.date === b.date ? (a.time ?? '').localeCompare(b.time ?? '') : a.date.localeCompare(b.date)));
  }, [events, externalEvents, birthdays, from, to]);

  const kindColor = { event: 'primary', 'external-event': 'default', birthday: 'secondary' } as const;
  const kindLabel = { event: t('nav.events'), 'external-event': t('events.calendar.filterExternalEvents'), birthday: t('events.calendar.filterBirthdays') };

  const rowHref = (row: Row): string | null => {
    if (row.kind === 'event') return `/events/${row.uuid}`;
    if (row.kind === 'external-event') return `/external-events/${row.uuid}`;
    return null;
  };

  const onRowClick = (row: Row) => {
    const href = rowHref(row);
    if (href) navigate(href);
    else setContactUuid(row.uuid);
  };

  if (isLoading) return <Typography>{t('common.loading')}</Typography>;

  return (
    <Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('events.date')}</TableCell>
            <TableCell>{t('events.time')}</TableCell>
            <TableCell>{t('events.title')}</TableCell>
            <TableCell>{t('events.location')}</TableCell>
            <TableCell />
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key} hover onClick={() => onRowClick(row)} sx={{ cursor: 'pointer' }}>
              <TableCell>{formatDate(row.date, i18n.language)}</TableCell>
              <TableCell>{row.time ?? ''}</TableCell>
              <TableCell>
                {row.kind === 'birthday' ? (
                  <Link
                    component="button"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setContactUuid(row.uuid); }}
                  >
                    {row.title}
                  </Link>
                ) : (
                  <Link component={RouterLink} to={rowHref(row)!} onClick={(e) => e.stopPropagation()}>
                    {row.title}
                  </Link>
                )}
              </TableCell>
              <TableCell>{row.location ?? ''}</TableCell>
              <TableCell>
                <Chip size="small" color={kindColor[row.kind]} label={kindLabel[row.kind]} />
              </TableCell>
              <TableCell>
                {row.kind === 'event' && (
                  <RowActions
                    canEdit={canUpdate} canDelete={canDestroy} deleting={deleting}
                    editLabel={t('events.edit')} deleteLabel={t('events.delete')} confirmLabel={t('events.deleteConfirm')}
                    onEdit={() => navigate(`/events/${row.uuid}/edit`)}
                    onDelete={() => onDeleteEvent(row.uuid)}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 && <Typography color="text.secondary" sx={{ mt: 2 }}>{t('publicCalendar.noEvents')}</Typography>}
      {contactUuid !== null && (
        <BirthdayContactDialog uuid={contactUuid} open onClose={() => setContactUuid(null)} />
      )}
    </Box>
  );
}

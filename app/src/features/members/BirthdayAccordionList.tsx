import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreRounded';
import { useTranslation } from 'react-i18next';
import type { BirthdayListRow } from '../../api/types';

/**
 * Mobile counterpart to BirthdayListPage's desktop DataTable. Unlike
 * MemberAccordionList (which lazily fetches the full member record per
 * row), every field shown here already lives on BirthdayListRow, so no
 * per-row data fetch is needed on expand. The Accordion is left fully
 * uncontrolled (MUI manages its own open/closed state); `unmountOnExit`
 * on the transition slot is what keeps age/jubilee dates out of the DOM
 * until expanded, instead of any local expanded flag.
 */
function BirthdayAccordionRow({ row, formatDate }: { row: BirthdayListRow; formatDate: (value: string | null) => string }) {
  const { t } = useTranslation();

  return (
    <Accordion slotProps={{ transition: { unmountOnExit: true } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography>{row.firstname} {row.lastname}</Typography>
          <Typography color="text.secondary">{formatDate(row.date_of_birth)}</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={0.5}>
            <Typography color="text.secondary">{t('members.age')}:</Typography>
            <Typography>{row.age ?? ''}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Typography color="text.secondary">{t('members.jubilee25')}:</Typography>
            <Typography>{formatDate(row.twentyfifth_jubilee)}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Typography color="text.secondary">{t('members.jubilee40')}:</Typography>
            <Typography>{formatDate(row.fortieth_jubilee)}</Typography>
          </Stack>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export default function BirthdayAccordionList({ rows, formatDate }: { rows: BirthdayListRow[]; formatDate: (value: string | null) => string }) {
  return (
    <Box>
      {rows.map((row) => (
        <BirthdayAccordionRow key={row.uuid} row={row} formatDate={formatDate} />
      ))}
    </Box>
  );
}

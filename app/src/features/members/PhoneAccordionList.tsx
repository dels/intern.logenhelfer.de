import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreRounded';
import { useTranslation } from 'react-i18next';
import type { PhoneListRow } from '../../api/types';
import { PhoneLink } from '../../components/ContactLinks';

/**
 * Mobile counterpart to PhoneListPage's desktop DataTable, kept genuinely
 * uncontrolled per this plan's global constraint. MUI's Accordion keeps
 * AccordionDetails mounted in the DOM while collapsed (it only animates
 * height to 0) - `slotProps={{ transition: { unmountOnExit: true } }}`
 * (forwarded to the underlying Collapse) makes Collapse itself unmount the
 * body once the collapse animation finishes, so the phone/mobile numbers
 * aren't in the DOM while collapsed without resorting to local `expanded`
 * state (which would make Accordion controlled - the same fix used in
 * BirthdayAccordionList.tsx).
 */
export default function PhoneAccordionList({ rows }: { rows: PhoneListRow[] }) {
  const { t } = useTranslation();
  return (
    <Box>
      {rows.map((row) => (
        <Accordion key={row.uuid} slotProps={{ transition: { unmountOnExit: true } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{row.firstname} {row.lastname}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={0.5}>
              {row.phone && <Typography>{t('seekers.addressFields.phone')}: <PhoneLink phone={row.phone} /></Typography>}
              {row.mobile && <Typography>{t('seekers.addressFields.mobile')}: <PhoneLink phone={row.mobile} /></Typography>}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

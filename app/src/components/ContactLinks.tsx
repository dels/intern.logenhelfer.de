import { Link } from '@mui/material';
import type { MouseEvent } from 'react';

function stopPropagation(e: MouseEvent) {
  e.stopPropagation();
}

export function PhoneLink({ phone }: { phone: string }) {
  // href strips whitespace (some phone dialers/apps choke on it in a tel:
  // URI) - the visible text keeps the original human-readable spacing.
  return (
    <Link href={`tel:${phone.replace(/\s/g, '')}`} onClick={stopPropagation}>
      {phone}
    </Link>
  );
}

export function EmailLink({ email }: { email: string }) {
  return (
    <Link href={`mailto:${email}`} onClick={stopPropagation}>
      {email}
    </Link>
  );
}

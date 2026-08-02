import { render, screen, act } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ServerStatusBanner from './ServerStatusBanner';
import { reportFailure, reportSuccess, resetServerStatus } from '../api/serverStatus';
import '../i18n';

afterEach(() => resetServerStatus());

describe('ServerStatusBanner', () => {
  it('renders nothing while the server is reachable', () => {
    render(<ServerStatusBanner />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a banner once a failure is reported', () => {
    render(<ServerStatusBanner />);
    act(() => reportFailure());
    expect(screen.getByRole('alert')).toHaveTextContent('Verbindung zum Server unterbrochen.');
  });

  it('hides the banner again once a success is reported', () => {
    render(<ServerStatusBanner />);
    act(() => reportFailure());
    act(() => reportSuccess());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ToastProvider } from './ToastProvider';
import { useToast } from './useToast';

function Trigger() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.success('Gespeichert.')}>fire-success</button>
      <button onClick={() => toast.error('Fehler.')}>fire-error</button>
    </>
  );
}

describe('ToastProvider', () => {
  it('shows a success message when success() is called', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><Trigger /></ToastProvider>);
    await user.click(screen.getByText('fire-success'));
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });

  it('shows an error message when error() is called', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><Trigger /></ToastProvider>);
    await user.click(screen.getByText('fire-error'));
    expect(await screen.findByText('Fehler.')).toBeInTheDocument();
  });

  it('a second call replaces the first toast', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><Trigger /></ToastProvider>);
    await user.click(screen.getByText('fire-success'));
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
    await user.click(screen.getByText('fire-error'));
    expect(await screen.findByText('Fehler.')).toBeInTheDocument();
    expect(screen.queryByText('Gespeichert.')).not.toBeInTheDocument();
  });

  it('useToast() does not throw without a ToastProvider ancestor', () => {
    let api: ReturnType<typeof useToast> | undefined;
    function Read() {
      api = useToast();
      return null;
    }
    render(<Read />);
    expect(() => api?.success('x')).not.toThrow();
  });

  it('firing a toast does not change the useToast() reference seen by other consumers', async () => {
    // Regression: ToastProvider sits above RouterProvider in App.tsx, so an
    // unstable context value would re-render every mounted page's mutation
    // hooks (all of which call useToast()) on every single toast, anywhere
    // in the app - exactly the kind of unrelated re-render that can race
    // with an in-flight navigation.
    const seen: ReturnType<typeof useToast>[] = [];
    function Bystander() {
      seen.push(useToast());
      return null;
    }
    const user = userEvent.setup();
    render(<ToastProvider><Trigger /><Bystander /></ToastProvider>);
    const firstApi = seen[0];
    await user.click(screen.getByText('fire-success'));
    await screen.findByText('Gespeichert.');
    expect(seen[seen.length - 1]).toBe(firstApi);
  });
});

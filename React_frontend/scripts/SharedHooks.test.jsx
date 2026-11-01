import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useAutoRefresh from '../src/apps/customer-support/utils/useAutoRefresh.js';

function Poller({ refresh, enabled = true }) {
  useAutoRefresh(refresh, { enabled, interval: 1000 });
  return null;
}
afterEach(() => vi.useRealTimers());

describe('shared auto refresh lifecycle', () => {
  it('uses the latest callback and stops its timer on unmount', async () => {
    vi.useFakeTimers();
    const first = vi.fn(),
      latest = vi.fn();
    const view = render(<Poller refresh={first} />);
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(first).toHaveBeenCalledTimes(1);
    view.rerender(<Poller refresh={latest} />);
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(latest).toHaveBeenCalledTimes(1);
    view.unmount();
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    expect(latest).toHaveBeenCalledTimes(1);
  });
  it('pauses while a feature is editing', async () => {
    vi.useFakeTimers();
    const refresh = vi.fn();
    const view = render(<Poller refresh={refresh} enabled={false} />);
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(refresh).not.toHaveBeenCalled();
    view.rerender(<Poller refresh={refresh} enabled />);
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it('does not overlap reads when focus and the timer fire together', async () => {
    vi.useFakeTimers();
    let finish;
    const refresh = vi.fn(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    render(<Poller refresh={refresh} />);
    await act(async () => {
      vi.advanceTimersByTime(1000);
      window.dispatchEvent(new Event('focus'));
      vi.advanceTimersByTime(3000);
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});

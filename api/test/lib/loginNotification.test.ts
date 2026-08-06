import type { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';
import { resetDb } from '../helpers/db.js';

vi.mock('../../src/lib/mail.js', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));
const { sendMail } = await import('../../src/lib/mail.js');
const { sendLoginSuccessEmail, sendLoginLockoutEmail } = await import('../../src/lib/loginNotification.js');

function fakeReq(ip: string | undefined): Request {
  return { ip } as Request;
}

const USER = { id: 1, email: 'brother@example.test', firstname: 'Appr' };

describe('loginNotification', () => {
  beforeEach(async () => {
    await resetDb();
    for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);
    vi.mocked(sendMail).mockClear();
  });

  describe('sendLoginSuccessEmail', () => {
    it('does not send when the toggle is off (default)', async () => {
      await sendLoginSuccessEmail(USER, fakeReq('203.0.113.5'), 'password');
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('sends to the user when the toggle is on', async () => {
      await appConfig.set('notify_user_on_login_activity', true);
      await sendLoginSuccessEmail(USER, fakeReq('203.0.113.5'), 'passkey');
      expect(sendMail).toHaveBeenCalledTimes(1);
      const call = vi.mocked(sendMail).mock.calls[0][0];
      expect(call.to).toBe(USER.email);
      expect(call.text).toContain('203.0.113.5');
      expect(call.text).toContain('Passkey');
    });

    it('falls back to "unknown" when req.ip is undefined', async () => {
      await appConfig.set('notify_user_on_login_activity', true);
      await sendLoginSuccessEmail(USER, fakeReq(undefined), 'totp');
      const call = vi.mocked(sendMail).mock.calls[0][0];
      expect(call.text).toContain('unknown');
    });

    it('never throws when sendMail rejects', async () => {
      await appConfig.set('notify_user_on_login_activity', true);
      vi.mocked(sendMail).mockRejectedValueOnce(new Error('smtp down'));
      await expect(sendLoginSuccessEmail(USER, fakeReq('203.0.113.5'), 'email')).resolves.toBeUndefined();
    });
  });

  describe('sendLoginLockoutEmail', () => {
    it('does not send when the toggle is off (default)', async () => {
      await sendLoginLockoutEmail(USER, fakeReq('203.0.113.5'), 'password');
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('sends to the user when the toggle is on', async () => {
      await appConfig.set('notify_user_on_login_activity', true);
      await sendLoginLockoutEmail(USER, fakeReq('203.0.113.5'), 'backup_code');
      expect(sendMail).toHaveBeenCalledTimes(1);
      const call = vi.mocked(sendMail).mock.calls[0][0];
      expect(call.to).toBe(USER.email);
      expect(call.text).toContain('Backup-Code');
    });

    it('never throws when sendMail rejects', async () => {
      await appConfig.set('notify_user_on_login_activity', true);
      vi.mocked(sendMail).mockRejectedValueOnce(new Error('smtp down'));
      await expect(sendLoginLockoutEmail(USER, fakeReq('203.0.113.5'), 'mfa_unknown')).resolves.toBeUndefined();
    });
  });
});

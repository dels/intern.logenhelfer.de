import { describe, expect, it } from 'vitest';

import { validateEvent } from '../../src/routes/events.js';

// Port of rails-app/spec/models/event_spec.rb - previously an empty stub
// (`describe Event do end`). Filled with real coverage of Event's
// ActiveRecord validations (rails-app/app/models/event.rb):
//
//   validates_presence_of :date, :title, :created_by_id
//   validates_presence_of :time,                          unless: :whole_day?
//
// There's no separate ORM-validation layer in this port - `validateEvent`
// (api/src/routes/events.ts) *is* the model-validation logic, called by both
// the create and update route handlers before writing to the DB. Testing it
// directly here is a true unit test (no DB, no HTTP) of the same rule the
// route-level 422 tests in test/routes/events.test.ts exercise end-to-end -
// title/date being nullable columns in the DB means a Prisma-round-trip test
// would not actually catch a regression here, only this does.
describe('Event validations', () => {
  const valid = {
    title: 'Regelmäßige Arbeit',
    date: new Date('2026-08-01'),
    whole_day: false,
    time: new Date(Date.UTC(1970, 0, 1, 19, 0)),
    created_by_id: 1,
  };

  it('is valid with all required fields present and a time (not whole-day)', () => {
    expect(validateEvent(valid)).toEqual([]);
  });

  it('is valid whole-day with no time at all', () => {
    expect(validateEvent({ ...valid, whole_day: true, time: undefined })).toEqual([]);
  });

  describe('presence of title', () => {
    it('rejects a missing title', () => {
      expect(validateEvent({ ...valid, title: undefined })).toContain("Title can't be blank");
    });

    it('rejects a null title', () => {
      expect(validateEvent({ ...valid, title: null })).toContain("Title can't be blank");
    });

    it('rejects an empty-string title', () => {
      expect(validateEvent({ ...valid, title: '' })).toContain("Title can't be blank");
    });
  });

  describe('presence of date', () => {
    it('rejects a missing date', () => {
      expect(validateEvent({ ...valid, date: undefined })).toContain("Date can't be blank");
    });

    it('rejects a null date', () => {
      expect(validateEvent({ ...valid, date: null })).toContain("Date can't be blank");
    });
  });

  describe('presence of created_by_id', () => {
    it('rejects a missing created_by_id', () => {
      expect(validateEvent({ ...valid, created_by_id: undefined })).toContain("Created by can't be blank");
    });

    it('rejects a null created_by_id', () => {
      expect(validateEvent({ ...valid, created_by_id: null })).toContain("Created by can't be blank");
    });
  });

  describe('presence of time, unless whole_day', () => {
    it('rejects a missing time when not whole-day', () => {
      expect(validateEvent({ ...valid, whole_day: false, time: undefined })).toContain("Time can't be blank");
    });

    it('rejects a null time when not whole-day', () => {
      expect(validateEvent({ ...valid, whole_day: false, time: null })).toContain("Time can't be blank");
    });

    it('does not require a time when whole_day is true', () => {
      expect(validateEvent({ ...valid, whole_day: true, time: null })).not.toContain("Time can't be blank");
    });

    it('still requires a time when whole_day is falsy but not literally absent (e.g. 0 or "false")', () => {
      // whole_day is a genuine boolean column - only `=== true` counts as
      // whole-day, matching Event#whole_day? on a boolean attribute. Any
      // other truthy-but-not-`true` value (a stray string, a number) must
      // still require `time`, same as `whole_day: false`.
      expect(validateEvent({ ...valid, whole_day: 'true' as unknown as boolean, time: undefined })).toContain("Time can't be blank");
    });
  });

  describe('end_time must be after time, unless whole_day', () => {
    it('rejects an end_time at or before time', () => {
      const endTime = new Date(Date.UTC(1970, 0, 1, 19, 0));
      expect(validateEvent({ ...valid, time: valid.time, end_time: endTime })).toContain('End time must be after time');
    });

    it('accepts an end_time after time', () => {
      const endTime = new Date(Date.UTC(1970, 0, 1, 20, 0));
      expect(validateEvent({ ...valid, time: valid.time, end_time: endTime })).toEqual([]);
    });

    it('is valid with no end_time at all', () => {
      expect(validateEvent({ ...valid, end_time: undefined })).toEqual([]);
    });

    it('does not check end_time ordering when whole_day is true', () => {
      const endTime = new Date(Date.UTC(1970, 0, 1, 1, 0));
      expect(validateEvent({ ...valid, whole_day: true, time: undefined, end_time: endTime })).toEqual([]);
    });
  });

  describe('multiple simultaneous validation failures', () => {
    it('reports every missing required field at once, matching full_messages.join', () => {
      const errors = validateEvent({ title: undefined, date: undefined, whole_day: false, time: undefined, created_by_id: undefined });

      expect(errors).toEqual(
        expect.arrayContaining([
          "Title can't be blank",
          "Date can't be blank",
          "Created by can't be blank",
          "Time can't be blank",
        ]),
      );
      expect(errors).toHaveLength(4);
    });
  });
});

import { randomUUID } from 'node:crypto';

/**
 * Port of rails-app/app/helpers/uuid_helper.rb's `UuidHelper#generate_uuid`,
 * a `before_create` hook used by Announcement, AttachedFile, Event,
 * ExternalEvent, Officer, Seeker, and User:
 *
 *   def generate_uuid
 *     begin
 *       self.uuid = SecureRandom.uuid
 *     end while self.class.exists?(:uuid => self.uuid)
 *   end
 *
 * `SecureRandom.uuid` generates a random (v4) UUID, same as Node's
 * `crypto.randomUUID()`. The Ruby `begin...end while` is a do-while loop -
 * it always generates at least once, then re-rolls only on collision -
 * mirrored exactly below.
 *
 * `checkExists` should query exactly the same scope
 * `self.class.exists?(uuid: ...)` would (i.e. usually unscoped by `deleted`,
 * matching Rails' default `exists?` having no notion of soft deletion unless
 * the model's default_scope excludes it) - the caller decides the scope,
 * this helper only drives the generate/retry loop.
 */
export async function generateUniqueUuid(checkExists: (uuid: string) => Promise<boolean>): Promise<string> {
  let uuid = randomUUID();

  // Do-while by nature (Ruby's `begin...end while`): always generate once,
  // then keep re-rolling as long as the candidate collides. Sequential -
  // each retry depends on the previous check's result.
  // eslint-disable-next-line no-await-in-loop
  while (await checkExists(uuid)) {
    uuid = randomUUID();
  }

  return uuid;
}

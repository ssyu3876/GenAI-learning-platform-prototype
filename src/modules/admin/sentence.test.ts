import { describe, expect, it } from 'vitest';
import { auditSentence, type ActionCopy, type RoleNames } from './sentence';

const copy: ActionCopy = {
  'user.role_changed': 'made {target} a {role}',
  'user.role_changed_from': 'changed {target} from {from} to {role}',
  'course.approved': 'published {target}',
};

const roles: RoleNames = { learner: 'Learner', instructor: 'Instructor', admin: 'Admin' };

describe('auditSentence', () => {
  it('uses the from-and-to sentence when the old role is stored', () => {
    const line = auditSentence(
      { action: 'user.role_changed', targetName: 'Ben Lee', detail: { from: 'learner', to: 'instructor' } },
      copy,
      roles,
    );
    expect(line).toBe('changed Ben Lee from Learner to Instructor');
  });

  it('falls back to the plain sentence for rows written before the old role was kept', () => {
    const line = auditSentence(
      { action: 'user.role_changed', targetName: 'Ben Lee', detail: { to: 'admin' } },
      copy,
      roles,
    );
    expect(line).toBe('made Ben Lee a Admin');
  });

  it('renders an unknown action instead of an empty line', () => {
    const line = auditSentence({ action: 'course.deleted', targetName: 'Old course', detail: null }, copy, roles);
    expect(line).toBe('course.deleted · Old course');
  });

  it('keeps a role name that the dictionary does not know', () => {
    const line = auditSentence(
      { action: 'user.role_changed', targetName: 'Ben Lee', detail: { from: 'learner', to: 'owner' } },
      copy,
      roles,
    );
    expect(line).toBe('changed Ben Lee from Learner to owner');
  });
});

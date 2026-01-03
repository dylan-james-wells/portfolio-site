import * as migration_20251219_215102_initial from './20251219_215102_initial';
import * as migration_20260101_205510 from './20260101_205510';
import * as migration_20260102_add_works from './20260102_add_works';
import * as migration_20260103_fix_locked_docs_works from './20260103_fix_locked_docs_works';

export const migrations = [
  {
    up: migration_20251219_215102_initial.up,
    down: migration_20251219_215102_initial.down,
    name: '20251219_215102_initial',
  },
  {
    up: migration_20260101_205510.up,
    down: migration_20260101_205510.down,
    name: '20260101_205510'
  },
  {
    up: migration_20260102_add_works.up,
    down: migration_20260102_add_works.down,
    name: '20260102_add_works'
  },
  {
    up: migration_20260103_fix_locked_docs_works.up,
    down: migration_20260103_fix_locked_docs_works.down,
    name: '20260103_fix_locked_docs_works'
  },
];

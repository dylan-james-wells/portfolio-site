import * as migration_20251219_215102_initial from './20251219_215102_initial';
import * as migration_20260101_205510 from './20260101_205510';

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
];

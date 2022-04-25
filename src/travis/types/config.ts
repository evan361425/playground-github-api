import { TravisConfigBasic } from './config-basic';
import { TravisConfigJob } from './config-job';
import { TravisSharedKey } from './shared-keys';

export type TravisConfig = {
  jobs?: TravisConfigJob;
  // notifications
  import?: TravisConfigImport[];
  stages?: TravisConfigStage[];
  version?: string;
} & TravisConfigBasic &
  TravisSharedKey;

type TravisConfigImport = {
  source: string;
  mode?: 'merge' | 'deep_merge' | 'deep_merge_append' | 'deep_merge_prepend';
  if?: string;
};
type TravisConfigStage = { name: string; if?: string };

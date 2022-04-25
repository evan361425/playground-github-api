import { TravisConfigBasic } from './config-basic';

export type TravisConfigJob = {
  include: TravisConfigJobEntry[];
  exclude?: TravisConfigJobEntry[];
  allow_failures?: TravisConfigJobEntry[];
  fast_finish?: TravisConfigJobEntry[];
};

type TravisConfigJobEntry = TravisConfigBasic & {
  stage: string;
  name: string;
};

import { TravisAddons } from './config-addon';
import { TravisSharedDeploy } from './config-deploy';

export type TravisSharedKey = {
  addons?: TravisAddons;
  branches?: { only?: string[]; expect?: string[] };
  cache?: TravisSharedCache;
  deploy?: TravisSharedDeploy[];
  git?: TravisSharedGit;
  if?: string;
  services?: TravisServices[];
  before_install?: string[];
  install?: string[];
  before_script?: string[];
  script?: string[];
  before_cache?: string[];
  after_success?: string[];
  after_failure?: string[];
  before_deploy?: string[];
  after_deploy?: string[];
  after_script?: string[];
};

type TravisSharedCache = {
  directories?: string[];
  apt?: boolean;
  bundler?: boolean;
  cargo?: boolean;
  ccache?: boolean;
  cocoapod?: boolean;
  npm?: boolean;
  packages?: boolean;
  pip?: boolean;
  yarn?: boolean;
  timeout?: number;
  edge?: boolean;
  branch?: string;
};
type TravisSharedGit = {
  strategy?: 'clone' | 'tarball';
  depth?: number | boolean;
  quiet?: boolean;
  submodules?: boolean;
  submodules_depth?: number;
  lfs_skip_smudge?: boolean;
  sparse_checkout?: string;
  autocrlf?: boolean | 'input';
};
type TravisServices =
  | 'cassandra'
  | 'couchdb'
  | 'docker'
  | 'elasticsearch'
  | 'memcached'
  | 'mongodb'
  | 'mysql'
  | 'neo4j'
  | 'postgresql'
  | 'rabbitmq'
  | 'redis'
  | 'riak'
  | 'xvfb';

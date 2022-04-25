import { TravisSecure } from './config-basic';

export type TravisAddons = {
  apt?: TravisAddonApt;
  apt_packages?: string[];
  artifacts?: TravisAddonArtifact;
  browserstack: TravisAddonBrowserStack;
  chrome?: 'stable' | 'beta';
  code_climate?: { repo_token: TravisSecure };
  coverity_scan?: TravisAddonCoveriyScan;
  homebrew?: TravisAddonHomebrew;
  hostname?: string;
  hosts?: string[];
  jwt?: TravisSecure[];
  sauce_connect?: TravisAddonSauceConnect;
  srcclr?: unknown; // Unknown, waiting for documentation
  snaps?: TravisAddonSnap[];
  sonarcloud?: TravisAddonSonarCloud;
  ssh_known_hosts?: TravisSecure[];
  firefox?: string;
  mariadb?: string;
  postgresql?: string;
  postgres?: string;
  rethinkdb?: string;
};

type TravisAddonApt = {
  packages?: string[];
  sources?: { name?: string; sourceline?: string; key_url?: string }[];
  dist?: string;
  update?: boolean;
  config?: unknown;
};
type TravisAddonArtifact = {
  enabled?: boolean;
  bucket?: string;
  endpoint?: string;
  key?: TravisSecure;
  secret?: TravisSecure;
  region?: string;
  paths?: string[];
  branch?: string;
  log_format?: string;
  target_paths?: string[];
  debug?: boolean;
  concurrency?: number;
  max_size?: number;
  permissions?: string;
  working_dir?: string;
  cache_control?: string;
};
type TravisAddonBrowserStack = {
  username?: TravisSecure;
  access_key?: TravisSecure;
  forcelocal?: boolean;
  only?: string;
  app_path?: string;
  proxyHost?: string;
  proxyPort?: string;
  proxyUser?: string;
  proxyPass?: TravisSecure;
};
type TravisAddonCoveriyScan = {
  project?: {
    name: string;
    version?: string;
    description?: string;
  };
  build_script_url?: string;
  branch_pattern?: string;
  notification_email?: TravisSecure;
  build_command?: string;
  build_command_prepend?: string;
};
type TravisAddonHomebrew = {
  update?: boolean;
  packages?: string[];
  casks?: string[];
  taps?: string[];
  brewfile?: boolean | string;
};
type TravisAddonSauceConnect = {
  enabled?: boolean;
  username?: TravisSecure;
  access_key?: TravisSecure;
  direct_domains?: string;
  tunnel_domains?: string;
  no_ssl_bump_domains?: string;
};
type TravisAddonSnap = {
  name: string;
  classic?: boolean;
  channel?: string;
};
type TravisAddonSonarCloud = {
  organization?: string;
  token: TravisSecure;
};

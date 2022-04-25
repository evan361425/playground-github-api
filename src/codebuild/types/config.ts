import { CodeBuildConfigPhases } from './config-phase';

export type CodeBuildConfig<T = { [key: string]: string }> = {
  version: '0.1' | '0.2';
  'run-as'?: string;
  env?: {
    shell?: string;
    variables: T;
    'parameter-store': {
      [key: string]: string;
    };
    'exported-variables'?: (keyof T)[];
    'secrets-manager'?: {
      [key: string]: string;
    };
    'git-credential-helper'?: YesNo;
  };
  proxy?: {
    'upload-artifacts'?: YesNo; // default no
    logs?: YesNo; // default no
  };
  batch?: {
    'fast-fail': boolean;
  };
  phases: CodeBuildConfigPhases;
  reports?: {
    'report-group-name-or-arn': {
      files: string[];
      'base-directory'?: string;
      'discard-paths'?: YesNo;
      'file-format'?: 'CUCUMBERJSON' | 'JUNITXML' | string; // default JUNITXML
    };
  };
  artifacts?: {
    files?: string[];
    name: string;
    'discard-paths'?: YesNo;
    'base-directory'?: string;
    'exclude-paths'?: string[] | string;
    'enable-symlinks'?: YesNo;
    's3-prefix'?: string;
    'secondary-artifacts'?: {
      artifactIdentifier: {
        files: string[];
        name: string;
        'discard-paths'?: YesNo;
        'base-directory'?: string;
      };
    }[];
  };
  cache?: {
    paths: string[];
  };
};

type YesNo = 'yes' | 'no';

import { TravisConfig } from './config';
import { TravisProviders } from './config-deploy';

export type TravisResponse = {
  version: 'v1';
  messages: {
    'type': 'config';
    'level': 'warn' | 'info' | 'error';
    'key': string;
    'code': string;
    'args': {
      'key': string;
      'info': string;
      'provider': TravisProviders;
    };
    'line': number;
  }[];
  full_messages: string[];
  config: TravisConfig;
};

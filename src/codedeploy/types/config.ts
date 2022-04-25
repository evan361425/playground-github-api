import { CodeDeployHook } from './config-hooks';

export type CodeDeployConfig = {
  version: string;
  os: string;
  files: FileType[];
  Resources: ResourceType | ResourceType[];
  permissions: PermissionType[];
  hooks?: CodeDeployHook | CodeDeployHook[];
};

type ResourceType = {
  TargetService?: { Type: string; Properties: unknown };
  myLambdaFunction?: { Type: string; Properties: unknown };
};
type PermissionAllowedTypes = 'directory' | 'file';
type FileType = { source: string; destination: string };
type PermissionType = {
  object?: string;
  except?: string;
  mode?: string;
  pattern?: string;
  owner?: string;
  group?: string;
  acls?: string[];
  context: {
    user: string;
    type: PermissionAllowedTypes;
    range: string;
  };
  type?: PermissionAllowedTypes[];
};

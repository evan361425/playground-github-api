type HookActionType =
  | string
  | { location: string; timeout: number; runas: string }[];
export type CodeDeployHook = {
  ValidateService?: HookActionType[];
  BeforeInstall?: HookActionType[];
  AfterInstall?: HookActionType[];
  AfterAllowTestTraffic?: HookActionType[];
  BeforeAllowTraffic?: HookActionType[];
  AfterAllowTraffic?: HookActionType[];
  ApplicationStart?: HookActionType[];
  ApplicationStop?: HookActionType[];
};

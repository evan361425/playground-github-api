

import { CodeBuildConfigPhases } from './types/config-phase';

export async function parseCodeBuild(
  data: Buffer | string,
): Promise<CodeBuildConfigPhases | undefined> {
  try {
    return JSON.parse(data.toString());
  } catch (error) {
    return undefined;
  }
}

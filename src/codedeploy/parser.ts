import { CodeDeployConfig } from './types/config';

export async function parseCodeDeploy(
  data: Buffer | string,
): Promise<CodeDeployConfig | undefined> {
  try {
    return JSON.parse(data.toString());
  } catch (error) {
    return undefined;
  }
}

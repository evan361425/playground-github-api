import { load as yamlLoad } from 'js-yaml';

export function yaml2json<T>(data: Buffer | string): T | undefined {
  try {
    return yamlLoad(data.toString()) as T;
  } catch (error) {
    return undefined;
  }
}

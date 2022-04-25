import { ArgumentParser } from 'argparse';
import { existsSync, mkdirSync, readFileSync, stat } from 'fs';
import { load as yamlLoad } from 'js-yaml';
import { createInterface } from 'readline';

// const
export const METADATA_EXT = '.metadata.json';
export const METADATA_INDEX = METADATA_EXT.length;

// async
export function fileIsNotEmpty(file: string): Promise<boolean> {
  return new Promise((resolve) => {
    stat(file, (err, status) => {
      err ? resolve(false) : resolve(status.size !== 0);
    });
  });
}
// sync
export function createFolders(folder: string): void {
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }
}

export function yaml2json<T>(data: Buffer | string): T | undefined {
  try {
    return yamlLoad(data.toString()) as T;
  } catch (error) {
    return undefined;
  }
}

export function parseToken(parser: ArgumentParser): void {
  const token =
    process.env.GH_PAT ??
    (existsSync('token.txt')
      ? readFileSync('token.txt').toString().trim()
      : '');
  parser.add_argument('-t', '--token', {
    help: 'GitHub token',
    default: token,
  });
}

export function hideString(value: string) {
  return '*'.repeat(8).concat(value.slice(-5));
}

export function checkSetting(): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question('Everything fine?', (_) => {
      rl.close();

      resolve();
    }),
  );
}

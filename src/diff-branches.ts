import { ArgumentParser } from 'argparse';
import { createHash } from 'crypto';
import { createReadStream, readFileSync, ReadStream, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { checkSetting, fileIsNotEmpty, hideString } from './helpers';
import { GitHubApi } from './helpers/github-api';
import { branchInfo, contentInfo, itemInfo } from './types';

function parseArgs() {
  const parser = new ArgumentParser({
    description: 'Get same file on different branches',
  });

  parser.add_argument('-t', '--token', {
    help: 'GitHub token',
    required: true,
  });

  parser.add_argument('-i', '--ignored', {
    help: 'Ignored prefix of branch name',
    action: 'extend',
    default: [
      'feature/',
      'featrue/',
      'feat/',
      'fix/',
      'dependabot/',
      'bugfix/',
      'bugfix_',
      'bug/',
      'hotfix/',
      'hotfix_',
    ],
  });
  parser.add_argument('-i', '--input', {
    help:
      'Input data for repository name, should has `.repository.full_name` property. ' +
      'Use env {INPUT} as default else `data/result.jsonl`',
    default: process.env.INPUT ?? 'data/result.jsonl',
  });
  parser.add_argument('-o', '--output', {
    help: 'Output folder for data. Use env {OUTPUT} as default else `data`',
    default: process.env.OUTPUT ?? 'data',
  });
  parser.add_argument('--case', {
    help: 'Case sensitive on branch name, default false',
    action: 'store_false',
  });
  parser.add_argument('--one', {
    help: 'Run one result only',
    action: 'store_true',
  });

  const args = new Args(parser.parse_args());

  return args;
}

class Args {
  readonly token: string;

  readonly input: ReadStream;

  readonly output: string;

  readonly ignored: string[];

  readonly one: boolean;

  readonly case: boolean;

  constructor(values: {
    token: string;
    input: string;
    output: string;
    ignored: string[];
    one: boolean;
    case: boolean;
    [key: string]: unknown;
  }) {
    this.token = values.token;
    this.output = values.output.replace(/(\/|\\)*$/g, '');
    this.ignored = values.ignored;
    this.one = values.one;
    this.case = values.case;

    this.input = createReadStream(values.input.replace(/(\/|\\)*$/g, ''));
  }

  async preflight() {
    console.log('Token: '.concat(hideString(this.token)));
    console.log('Input file: '.concat(this.input.path.toString()));
    console.log('Output folder: '.concat(this.output));
    console.log('Ignored: '.concat(this.ignored.join(',')));
    console.log('Case sensitive on branch name: '.concat(`${this.case}`));
    console.log('One (kinda dry run): '.concat(`${this.one}`));

    await checkSetting();
  }

  shouldUse(branch: string): boolean {
    branch = this.case ? branch : branch.toLocaleLowerCase();
    return this.ignored.some((ignore) => branch.startsWith(ignore));
  }
}

class Executor {
  readonly fetcher: GitHubApi;

  constructor(readonly args: Args) {
    this.fetcher = new GitHubApi(args.token);
  }

  async go(): Promise<void> {
    for await (const item of this.loadInput()) {
      const branches = await this.fetchBranches(item);
      const baseName = this.args.output.concat(item.file_name);
      const output = `${baseName}.branches.json`;

      // ignore if built before
      if (await fileIsNotEmpty(output)) {
        item.status = 'ignored';
        continue;
      }

      // initial useful data
      const originSha = hashFileContent(baseName);
      const container: Record<string, string[]> = { origin: [] };
      let branchCounter = 1;

      // start fetch branch
      for (const branch of branches) {
        const msg = `(${branchCounter++}/${branches.length}) on ${branch.name}`;
        process.stdout.write(msg.concat(''.repeat(10)).concat('\r'));

        if (!this.args.shouldUse(branch.name)) {
          continue;
        }

        const data = await this.fetchContent(item, branch.name);
        if (data === undefined) {
          continue;
        }

        this.register(container, data, originSha, item.file_name, branch.name);
      }

      writeFileSync(output, JSON.stringify(container));
      item.status = 'finish';
    }
  }

  private async *loadInput(): AsyncGenerator<itemInfo, void, unknown> {
    const rl = createInterface({
      input: this.args.input,
      crlfDelay: Infinity,
    });
    let counter = 1;

    for await (const line of rl) {
      try {
        const item = JSON.parse(line);
        yield item;

        console.log(`(${counter++}) ${item.status} on ${item.repository.name}`);
      } catch (error) {
        continue;
      }
    }
  }

  private async fetchBranches(item: itemInfo): Promise<branchInfo[]> {
    try {
      const url = `repos/${item.repository.full_name}/branches`;
      const result = await this.fetcher.get<branchInfo[]>(url);

      return result ?? [];
    } catch (error) {
      return [];
    }
  }

  private async fetchContent(
    item: itemInfo,
    branch: string,
  ): Promise<contentInfo | undefined> {
    try {
      const q = item.url.lastIndexOf('?');
      const url = q === -1 ? item.url : item.url.substring(0, q);
      return await this.fetcher.get<contentInfo>(url, {
        params: { ref: branch },
      });
    } catch (error) {
      return undefined;
    }
  }

  private register(
    container: Record<string, string[]>,
    data: contentInfo,
    originSha: string,
    originName: string,
    branchName: string,
  ) {
    const contentBuffer = Buffer.from(data.content, data.encoding);
    const otherSha = createHash('sha1').update(contentBuffer).digest('hex');
    const key = originSha === otherSha ? 'origin' : otherSha;

    if (container[key] === undefined) {
      const extIndex = originName.lastIndexOf('.');
      const fileName = [
        originName.substring(0, extIndex),
        branchName.split('/').join('-'),
        originName.substring(extIndex + 1),
      ].join('.');

      writeFileSync(fileName, contentBuffer);
      container[key] = [branchName];
    } else {
      container[key].push(branchName);
    }
  }
}

function hashFileContent(path: string): string {
  return createHash('sha1').update(readFileSync(path)).digest('hex');
}

function main() {
  const args = parseArgs();
  const executor = new Executor(args);

  return executor.go();
}

main()
  .then(() => console.log('done!'))
  .catch(console.log);

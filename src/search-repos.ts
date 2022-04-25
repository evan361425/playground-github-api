import { ArgumentParser } from 'argparse';
import { createWriteStream, WriteStream } from 'fs';
import { checkSetting, GitHubApi, hideString, parseToken } from './helpers';
import { branchInfo, repoInfo } from './types';

function parseArgs() {
  const parser = new ArgumentParser({
    description: 'Get all repo in user or organization',
  });
  parseToken(parser);

  parser.add_argument('--user', {
    help: 'List user repositories, if not set `org`, it will be true by default',
    action: 'store_true',
  });
  parser.add_argument('--org', {
    help:
      'List specific organization repositories. ' +
      'If it is not set,  `user` will be used',
  });
  parser.add_argument('-p', '--page', {
    help: 'Page size, between 1 to 100',
    type: 'int',
    default: 100,
  });

  parser.add_argument('-o', '--output', {
    help: 'Output folder for data. Use env {OUTPUT} as default else `data/result.jsonl`',
    default: process.env.OUTPUT ?? 'data/result.jsonl',
  });
  parser.add_argument('--protected', {
    help: 'Get protected branches',
    action: 'store_true',
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

  readonly output: string;

  readonly org?: string;

  readonly page: number;

  readonly one: boolean;

  readonly protected: boolean;

  private outputStream!: WriteStream;

  constructor(values: {
    token: string;
    output: string;
    org?: string;
    page: number;
    protected: boolean;
    one: boolean;
    [key: string]: unknown;
  }) {
    this.token = values.token;
    this.output = values.output.replace(/(\/|\\)*$/g, '');
    this.org = values.org;
    this.one = values.one;
    this.protected = values.protected;
    this.page = values.page;
  }

  get repoUrl(): string {
    return this.org === undefined ? 'user/repos' : `orgs/${this.org}/repos`;
  }

  get repoParams(): Record<string, unknown> {
    return {
      sort: 'full_name',
      per_page: this.page,
    };
  }

  async preflight() {
    console.log('Token: '.concat(hideString(this.token)));
    console.log('Output folder: '.concat(this.output));
    console.log('Search: '.concat(this.org?.concat('(org)') ?? 'user'));
    console.log('One (kinda dry run): '.concat(`${this.one}`));

    await checkSetting();

    this.outputStream = createWriteStream(this.output);
  }

  write(data: unknown) {
    this.outputStream.write(JSON.stringify(data).concat('\n'));
  }
}

class Executor {
  readonly fetcher: GitHubApi;

  constructor(readonly args: Args) {
    this.fetcher = new GitHubApi(args.token);
  }

  async go(): Promise<void> {
    await this.args.preflight();

    for await (const repo of this.searchRepos()) {
      if (this.args.protected) {
        repo.protected_branches = await this.getProtectedBranches(repo);
      }

      delete repo.owner;
      delete repo.organization;
      Object.entries(repo).forEach((e) => {
        if (e[0].endsWith('_url')) {
          delete repo[e[0]];
        }
      });

      this.args.write(repo);
    }
  }

  private async getProtectedBranches(repo: repoInfo) {
    const branches = await this.searchProtectedBranches(repo.name);
    const hasBranch = (b: string) =>
      branches.some((branch) => branch.includes(b));

    return {
      name: repo.name,
      full_name: repo.full_name,
      branches,
      hasProduction: hasBranch('production'),
      hasStaging: hasBranch('staging'),
      hasMaster: hasBranch('master'),
      hasRelease: hasBranch('release'),
    };
  }

  private async *searchRepos(): AsyncGenerator<repoInfo> {
    let counter = 1;
    do {
      const repos = await this.fetcher.getWithNext<repoInfo[]>(
        this.args.repoUrl,
        { params: this.args.repoParams },
      );

      if (!repos?.length) {
        return;
      }

      for (const repo of repos) {
        yield repo;

        console.log(`(${counter++}) ${repo.full_name}`);
      }
    } while (this.fetcher.hasNext());
  }

  private async searchProtectedBranches(repo: string): Promise<string[]> {
    const branches = await this.fetcher.get<branchInfo[]>(
      `repos/${repo}/branches`,
    );
    return (branches ?? [])
      .filter((branch) => branch.protected)
      .map((branch) => branch.name);
  }
}

function main() {
  const args = parseArgs();
  const executor = new Executor(args);

  return executor.go();
}

main()
  .then(() => console.log('done!'))
  .catch(console.log);

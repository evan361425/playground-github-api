import { ArgumentParser } from 'argparse';
import {
  createReadStream,
  createWriteStream,
  ReadStream,
  writeFileSync,
  WriteStream,
} from 'fs';
import { createInterface } from 'readline';
import {
  checkSetting,
  createFolders,
  fileIsNotEmpty,
  GitHubApi,
  GitHubSearchArgs,
  hideString,
  METADATA_EXT,
  parseToken,
} from './helpers';
import {
  contentInfo,
  itemInfo,
  metadataInfo,
  repoInfo,
  responseInfo,
  searchParameters,
} from './types';

function parseArgs() {
  const parser = new ArgumentParser({
    description: 'Get file for specific pattern by GitHub API',
  });
  parseToken(parser);

  parser.add_argument('-q', '--query', {
    help:
      'Query string, other arguments will overwrite query if overlay. ' +
      'see https://docs.github.com/en/search-github/searching-on-github/searching-code',
  });
  parser.add_argument('-c', '--code', {
    help: 'Query specific value in code',
  });
  parser.add_argument('-f', '--filename', {
    help: 'Query filename',
  });
  parser.add_argument('-l', '--language', {
    help: 'Query code language',
  });
  parser.add_argument('-i', '--ignore', {
    help: 'Ignored path to search, should starts without /',
    action: 'extend',
    default: [],
  });
  parser.add_argument('--org', {
    help: 'Specific organization name',
    default: '104corp',
  });
  parser.add_argument('-p', '--page', {
    help: 'Page size, between 1 to 100',
    type: 'int',
    default: 100,
  });
  parser.add_argument('-s', '--start', {
    help: 'Start page',
    type: 'int',
    default: 1,
  });
  parser.add_argument('--action', {
    help:
      'What action you want to take (file/metadata). ' +
      'file: Write down the found file by metadata; ' +
      'metadata: Only write down the metadata of found file',
    option_strings: ['file', 'metadata'],
    default: 'metadata',
  });
  parser.add_argument('-o', '--output', {
    help:
      'Output file location. ' +
      'file `action` will need folder; ' +
      'metadata `action` will need file. ' +
      'Use env {OUTPUT} as default else data/result.jsonl',
    default: process.env.OUTPUT ?? 'data/result.jsonl',
  });
  parser.add_argument('--metadata', {
    help: 'Used metadata result to get file, this will force `action` to file',
  });
  parser.add_argument('--one', {
    help: 'Run one result only',
    action: 'store_true',
  });

  const args = new Args(parser.parse_args());

  return args;
}

class Args {
  readonly github: GitHubSearchArgs;

  readonly token: string;

  readonly page: number;

  readonly start: number;

  readonly action: 'file' | 'metadata';

  readonly output: string;

  readonly one: boolean;

  readonly metadataFile?: ReadStream;

  private outputStream?: WriteStream;

  constructor(values: {
    page: number;
    start: number;
    output: string;
    token: string;
    action: 'file' | 'metadata';
    one: boolean;
    metadata: string;
    [key: string]: string | string[] | number | boolean | undefined;
  }) {
    this.github = new GitHubSearchArgs(values);
    this.page = values.one ? 1 : Math.max(Math.min(values.page, 100), 1);
    this.start = values.start;
    this.action = values.metadata ? 'file' : values.action;
    this.one = values.one;
    this.output = values.output.replace(/(\/|\\)*$/g, '');

    this.token = values.token;
    if (values.metadata) {
      this.metadataFile = createReadStream(values.metadata);
    }
  }

  async preflight() {
    const useMetadata = Boolean(this.metadataFile);
    console.log('Token: '.concat(hideString(this.token)));
    console.log('Output: '.concat(this.output));
    console.log('Use metadata (no need query): '.concat(`${useMetadata}`));
    console.log('One (kinda dry run): '.concat(`${this.one}`));
    if (!useMetadata) {
      console.log('Query: '.concat(this.github.toQuery()));
      ['page', 'start', 'action'].forEach((e) => {
        const key = e.slice(0, 1).toUpperCase().concat(e.slice(1));
        console.log(key.concat(`: ${(this as never)[e]}`));
      });
    }

    await checkSetting();

    if (this.action === 'metadata') {
      this.outputStream = createWriteStream(this.output);
    }
  }

  write(data: string | Buffer, file?: string) {
    if (this.outputStream !== undefined) {
      this.outputStream.write(data);
    } else if (file !== undefined) {
      writeFileSync(file, data);
    }
  }
}

class Executor {
  readonly fetcher: GitHubApi;

  constructor(readonly args: Args) {
    this.fetcher = new GitHubApi(this.args.token);
  }

  async go() {
    await this.args.preflight();

    const iterator = this.args.metadataFile
      ? this.load(this.args.metadataFile)
      : this.search();

    for await (const item of iterator) {
      if (this.args.action === 'file') {
        await this.writeItemContent(item);
      } else {
        await this.writeItemMetadata(item);
      }

      if (this.args.one) {
        break;
      }
    }
  }

  async *search(): AsyncGenerator<itemInfo, void, unknown> {
    const searchParams: searchParameters = {
      q: this.args.github.toQuery(),
      per_page: this.args.page,
      page: this.args.start,
    };
    let requestCount = 1;
    let retryCount = 2;
    let itemCounter = 0;

    do {
      console.log(`Start request ${requestCount++}`);
      let body: responseInfo | undefined;
      try {
        body = await this.fetcher.getWithNext<responseInfo>('search/code', {
          params: searchParams,
        });
      } catch (error) {
        console.log(error);
        return;
      }

      if (body === undefined) {
        console.log('Get empty body, retry again');
        if (!retryCount--) return;
        continue;
      }

      for (const item of body.items) {
        yield item;

        const props = `${++itemCounter}/${body.total_count}`;
        console.log(`(${props}) ${item.status} on ${item.file_name}`);
      }
    } while (this.fetcher.hasNext());
  }

  async *load(stream: ReadStream): AsyncGenerator<itemInfo, void, unknown> {
    const rl = createInterface({
      input: stream,
      crlfDelay: Infinity,
    });
    let counter = 1;

    for await (const line of rl) {
      try {
        const item = JSON.parse(line);
        yield item;

        console.log(`(${counter++}) ${item.status} on ${item.file_name}`);
      } catch (error) {
        continue;
      }
    }
  }

  async writeItemMetadata(item: itemInfo) {
    const repo = await this.fetchRepoInfo(item.repository.full_name);

    item.repository = repo;
    item.query = this.args.github.toQuery();
    this.args.write(JSON.stringify(item) + '\n');

    item.file_name = item.repository.name;
    item.status = 'finish';
  }

  async writeItemContent(item: itemInfo) {
    createFolders(`${this.args.output}/${item.repository.name}`);

    item.file_name = `${item.repository.name}/${item.path
      .split('/')
      .join('-')}`;
    if (
      (await fileIsNotEmpty(`${this.args.output}/${item.file_name}`)) ||
      this.checkIgnorable(item.path)
    ) {
      item.status = 'ignored';
      return;
    }

    // fetcher has set prefix, need to use href
    const content = await this.fetcher.get<contentInfo>(item.url);
    content && this.writeContentToFile(item, content);
    item.status = 'finish';
  }

  private async fetchRepoInfo(name: string): Promise<repoInfo> {
    const repo = await this.fetcher.get<repoInfo>(`/repos/${name}`);

    if (!repo) {
      throw new Error("Can't find repo ".concat(name));
    }

    delete repo.owner;
    delete repo.organization;
    Object.entries(repo).forEach((e) => {
      if (e[0].endsWith('_url')) {
        delete repo[e[0]];
      }
    });

    return repo;
  }

  private writeContentToFile(item: itemInfo, content: contentInfo): void {
    const output = this.args.output.concat('/').concat(item.file_name);
    this.args.write(getMetadata(), output.concat(METADATA_EXT));
    this.args.write(getContent(), output);

    function getContent(): string | Buffer {
      return content.content
        ? Buffer.from(content.content, content.encoding)
        : '';
    }

    function getMetadata(): string {
      const data: metadataInfo = {
        repo_name: item.repository.name,
        file_name: item.name,
        file_path: item.path,
        file_size: content.size ?? 0,
        file_encoding: content.encoding ?? '',
        file_urls: {
          api: item.url,
          git: item.git_url,
          html: item.html_url,
          download: content.download_url ?? '',
        },
        repo_id: item.repository.id,
        repo_description: item.repository.description,
      };
      return JSON.stringify(data, null, 2);
    }
  }

  private checkIgnorable(path: string): boolean {
    const ignorable = this.args.github.values.ignore?.some(containsIgnored);

    return ignorable ?? false;

    function containsIgnored(folder: string) {
      return path.startsWith(`${folder}/`) || path.includes(`/${folder}/`);
    }
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

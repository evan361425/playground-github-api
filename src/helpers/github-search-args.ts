export class GitHubSearchArgs {
  private readonly query: string;

  constructor(
    readonly values: {
      query?: string;
      code?: string;
      filename?: string;
      language?: string;
      org?: string;
      ignore?: string[];
      [key: string]: string | string[] | unknown;
    },
  ) {
    this.sanitize();
    this.query = this.init();
  }

  toQuery(): string {
    return this.query;
  }

  private init(): string {
    const queries: string[] = [];

    if (this.values.code) {
      queries.push(this.values.code);
      queries.push('in:file');
    }

    if (this.values.query !== undefined) {
      queries.push(this.values.query);
    }

    ['language', 'filename', 'org'].forEach((k) => {
      if (this.values[k]) {
        queries.push(`${k}:${this.values[k]}`);
      }
    });

    this.values.ignore?.forEach((ignore) => {
      queries.push(`-path:/${ignore}`);
    });

    return queries.join(' ');
  }

  private sanitize(): void {
    Object.entries(this.values).forEach((entry) => {
      if (typeof entry[1] === 'string') {
        this.values[entry[0]] = entry[1].trim();
      } else if (Array.isArray(entry[1])) {
        this.values[entry[0]] = entry[1].map((e) => e.trim());
      }
    });
  }
}

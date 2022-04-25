import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export class GitHubApi {
  readonly instance;

  private nextUrl?: string;

  constructor(readonly token: string) {
    this.instance = axios.create({
      baseURL: 'https://api.github.com',
      method: 'GET',
      timeout: 6000,
      timeoutErrorMessage: '__timeout__',
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: `token ${this.token}`,
        'user-agent': 'evan361425',
      },
      validateStatus: (_) => true,
    });
  }

  hasNext() {
    return Boolean(this.nextUrl);
  }

  async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T | undefined> {
    const resp = await this.getWithRetry<T>(url, config);
    if (await this.checkResponse(resp)) {
      return resp.data;
    }
  }

  async getWithNext<T>(url: string, config?: AxiosRequestConfig) {
    const resp = await this.getWithRetry<T>(
      this.nextUrl ? this.nextUrl : url,
      this.nextUrl ? undefined : config,
    );

    if (await this.checkResponse(resp)) {
      this.parsePagination(resp.headers['link']);
      return resp.data;
    }
  }

  private async getWithRetry<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    try {
      return await this.instance.get(url, config);
    } catch (error) {
      if ((error as Error).message === '__timeout__') {
        return this.instance.get(url, config);
      }

      throw error;
    }
  }

  private async checkResponse(response: AxiosResponse): Promise<boolean> {
    if (response.headers['x-ratelimit-remaining'] === '0') {
      const resetUTC = parseInt(response.headers['x-ratelimit-reset'], 10);
      const releaseDate = new Date(resetUTC * 1000);
      console.log(`Rate limit hit! Wait until ${releaseDate.toISOString()}`);

      return new Promise((res) => {
        setTimeout(res, releaseDate.getTime() - Date.now(), false);
      });
    }

    if (response.status >= 300) {
      console.log(response.headers);
      console.log(response.data);
      throw new Error(`GitHub API response ${response.status}`);
    }

    return true;
  }

  private parsePagination(links?: string) {
    if (!links) return;

    this.nextUrl = undefined;
    let next: string | undefined;
    let first: string | undefined;

    links.split(',').forEach((link) => {
      const l = link.split(';').map((e) => e.trim());
      if (l.includes('rel="next"')) {
        next = l[0].slice(1, -1);
      } else if (l.includes('rel="first"')) {
        first = l[0].slice(1, -1);
      }
    });

    if (next !== undefined && first !== next) {
      console.log(`Get next link: ${next}`);
      this.nextUrl = next;
    } else {
      console.log(`Empty next link: ${links}`);
    }
  }
}

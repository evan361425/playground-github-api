import axios from 'axios';
import { TravisConfig } from './types/config';
import { TravisResponse } from './types/response';

export async function parseTravis(
  session: string,
  data: string | Buffer,
): Promise<TravisConfig | undefined> {
  try {
    // website: https://config.travis-ci.com/explore
    const response = await axios.post<TravisResponse>(
      'https://yml-staging.travis-ci.org/v1/parse',
      {
        body: data.toString(),
        responseType: 'json',
        headers: {
          Referer: 'https://config.travis-ci.com/',
          Host: 'yml-staging.travis-ci.org',
          Origin: 'https://config.travis-ci.com',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Safari/605.1.15',
          'Content-Type': 'text/plain;charset=UTF-8',
          Authorization: `Basic ${session}`,
        },
      },
    );

    return response.data.config;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

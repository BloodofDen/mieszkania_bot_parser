import type { ICriteria, IAdvertisement } from '../models';
import { OlxParser } from './OlxParser';
import { OtodomParser } from './OtodomParser';
import { DEFAULT_MAX_ADS_LIMIT } from './constants';

export class Parser {
  readonly #olx: OlxParser;
  readonly #otodom: OtodomParser;

  constructor(criteria: ICriteria, maxAdsLimit: number = DEFAULT_MAX_ADS_LIMIT) {
    this.#olx = new OlxParser(criteria, maxAdsLimit);
    this.#otodom = new OtodomParser(criteria, maxAdsLimit);
  }

  async parse(): Promise<IAdvertisement[]> {
    const results: IAdvertisement[][] = await Promise.all([
      this.#olx.parse(),
      this.#otodom.parse(),
    ]);

    return results.flat();
  }
}

import { ICriteria, IAdvertisement } from '../models';
import { OlxParser } from './OlxParser';
import { OtodomParser } from './OtodomParser';

export class Parser {
  readonly #olx: OlxParser;
  readonly #otodom: OtodomParser;

  constructor(criteria: ICriteria) {
    this.#olx = new OlxParser(criteria);
    this.#otodom = new OtodomParser(criteria);
  }

  async parse(): Promise<IAdvertisement[]> {
    const results: IAdvertisement[][] = await Promise.all([
      this.#olx.parse(),
      this.#otodom.parse(),
    ]);

    return results.flat();
  }
}

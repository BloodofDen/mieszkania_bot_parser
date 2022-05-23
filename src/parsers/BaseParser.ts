import deburr from 'lodash.deburr';
import type { ICriteria, IAdvertisement } from '../models';

export abstract class BaseParser {
  protected readonly url: URL;

  constructor(
    protected criteria: ICriteria,
    protected maxAdsLimit: number,
    protected origin: URL['origin'],
    protected pathname: URL['pathname'],
  ) {
    const baseUrl = new URL(pathname, origin);
    const subPath = deburr(
      criteria.city ?? criteria.province,
    ).replace(/\s+/g, '-').toLowerCase();

    this.url = new URL(subPath, baseUrl);
  }

  protected abstract composeSearchParams(): string;

  abstract parse(): Promise<IAdvertisement[]>;
}

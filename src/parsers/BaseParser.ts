import { IAdvertisement, ICriteria } from '../models';

export abstract class BaseParser {
  protected url: URL;

  constructor(
    protected criteria: ICriteria,
    protected origin: URL['origin'],
    protected pathname: URL['pathname'],
  ) {
    const baseUrl = new URL(pathname, origin);
    const subPath = this.excludeAccents(
      criteria.city ?? criteria.province,
    ).toLowerCase();

    this.url = new URL(subPath, baseUrl);
  }

  protected abstract composeSearchParams(): string;

  abstract parse(): Promise<IAdvertisement[]>;

  private excludeAccents(str: string = ''): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };
}

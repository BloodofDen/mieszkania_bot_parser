import { ICriteria } from '../models';
import { OlxParser } from './OlxParser';
import { OtodomParser } from './OtodomParser';

export class Parser {
  olx: OlxParser;
  otodom: OtodomParser;

  constructor(criteria: ICriteria) {
    this.olx = new OlxParser(criteria);
    this.otodom = new OtodomParser(criteria);
  }
}

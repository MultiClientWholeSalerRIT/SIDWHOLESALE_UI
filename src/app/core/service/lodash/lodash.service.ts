import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { pick } from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class LodashService {
  constructor() {}

  get pick() {
    return pick;
  }

  get isNil() {
    return _.isNil;
  }

  get isEmpty() {
    return _.isEmpty;
  }

  get uniqBy() {
    return _.uniqBy;
  }

  get find() {
    return _.find;
  }

  get filter() {
    return _.filter;
  }

  get reverse() {
    return _.reverse;
  }

  get sortBy() {
    return _.sortBy;
  }

  get orderBy() {
    return _.orderBy;
  }

  get isArray() {
    return _.isArray;
  }

  get round() {
    return _.round;
  }

  get toNumber() {
    return _.toNumber;
  }

  get cloneDeep() {
    return _.cloneDeep;
  }

  get isEqual() {
    return _.isEqual;
  }

  get remove() {
    return _.remove;
  }

  get uniqWith() {
    return _.uniqWith;
  }

  get toString() {
    return _.toString;
  }

  get isUndefined() {
    return _.isUndefined;
  }

  get uniq() {
    return _.uniq;
  }

  get forEach() {
    return _.forEach;
  }

  get trim() {
    return _.trim;
  }
  
  get slice() {
    return _.slice
    }
  get groupBy() {
    return _.groupBy
  }

  get findIndex() {
    return _.findIndex
  }

  get size() {
    return _.size
  }

  get merge() {
    return _.merge
  }

  get union() {
    return _.union
  }

  get map() {
    return _.map
  }
   
  get toArray() {
    return _.toArray
  }

  get chain() {
    return _.chain
  }

  get pickBy() {
    return _.pickBy
  }

  get omit() {
    return _.omit
  }

}

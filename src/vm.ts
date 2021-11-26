import {Group} from './group.js';

// A "group VM"
export class VM {
  readonly vars = new Map<string, Var>();
  currentGroup?: Group;
  constructor() {}

  
}

interface GroupVar {
  readonly type: 'group';
  readonly group: Group;
}
interface ElementVar {
  readonly type: 'element';
  readonly group: Group;
  readonly value: bigint;
}
type Var = GroupVar | ElementVar;

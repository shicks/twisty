const CYCLE_PIVOT = 0;

export interface GroupElement {
  mul(x: GroupElement): GroupElement;
  eq(x: GroupElement): boolean;
  readonly name: string;
  // hash? name?
}

export interface Group extends Iterable<GroupElement> {
  parse(name: string): GroupElement|undefined;
}


export class DihedralGroup implements Group {
  elements: readonly DihedralElement[]
  constructor(public readonly n: number) {
    const elts = [];
    for (let s = 0; s < 2; s++) {
      for (let r = 0; r < n; r++) {
        elts.push(new DihedralElement(this, r, s));
      }
    }
    this.elements = elts;
  }
  parse(name: string): GroupElement|undefined {
    const match = /^(r?)(-?\d*)(s?)(\d*)$/.exec(name);
    if (!match) return undefined;
    if (match[2] && !match[1]) return undefined;
    if (match[4] && !match[3]) return undefined;
    const r = pmod(match[1] ? (match[2] ? Number(match[2]) : 1) : 0, this.n);
    const s = pmod(match[3] ? (match[4] ? Number(match[4]) : 1) : 0, 2);
    return this.elements[s * this.n * r];
  }
  [Symbol.iterator]() {
    return this.elements[Symbol.iterator]();
  }
  toString() {
    return `D${this.n}`;
  }
}

// Canonical element = r{0,n-1}s{0,1}
class DihedralElement implements GroupElement {
  readonly name: string;
  constructor(readonly group: DihedralGroup,
              readonly r: number, readonly s: number) {
    this.name = r ? `r${r > 1 ? r : ''}${s ? 's' : ''}` : s ? 's' : 'e';
  }
  mul(that: GroupElement): GroupElement {
    const g = this.group;
    if (!(that instanceof DihedralElement) || that.group !== g) {
      throw new Error(`Different groups`);
    }
    const s = (this.s + that.s) % 2;
    const r = pmod(this.r + (this.s ? -1 : 1) * that.r, g.n);
    return g.elements[s * g.n + r];
  }
  eq(that: GroupElement): boolean {
    // NOTE: singletons
    return this === that;
  }
  toString() { return this.name; }
}


export class CyclicGroup implements Group {
  elements: readonly CyclicElement[]
  constructor(public readonly n: number) {
    const elts = [];
    for (let i = 0; i < n; i++) {
      elts.push(new CyclicElement(this, i));
    }
    this.elements = elts;
  }
  parse(name: string): GroupElement|undefined {
    if (name === 'e') return this.elements[0];
    const match = /^g(-?\d*)$/.exec(name);
    if (!match) return undefined;
    const i = match[1] ? Number(match[1]) : 1;
    return this.elements[pmod(i, this.n)];
  }
  [Symbol.iterator]() {
    return this.elements[Symbol.iterator]();
  }
  toString() {
    return `Z${this.n}`;
  }
}

class CyclicElement implements GroupElement {
  readonly name: string;
  constructor(readonly group: CyclicGroup, readonly i: number) {
    this.name = i ? `g${i > 1 ? i : ''}` : 'e';
  }
  mul(that: GroupElement): GroupElement {
    const g = this.group;
    if (!(that instanceof CyclicElement) || that.group !== g) {
      throw new Error(`Different groups`);
    }
    const i = pmod(this.i + that.i, g.n);
    return g.elements[i];
  }
  eq(that: GroupElement): boolean {
    // NOTE: singletons
    return this === that;
  }
  toString() { return this.name; }
}


abstract class PermutationGroup {
  constructor(readonly n: number) {}
}

function* permute(n: number, yieldOdds: boolean) {
  const arr = Array.from({length: n}, (_, i) => i);
  let parity = 0;
  function swap(a, b) {
    const t = arr[a];
    arr[a] = arr[b];
    arr[b] = t;
    parity ^= 1;
  }
  while (true) {
    if (yieldOdds || !parity) yield new Permutation([...arr]);
    let i = n - 1;
    while (i > 0 && arr[i - 1] >= arr[i]) { i--; }
    if (i <= 0) return;
    let j = n;
    while (j > i && arr[j - 1] <= arr[i - 1]) { j--; }
    swap((i++) - 1, j - 1);
    j = n;
    while (i < j) {
      swap((i++) - 1, (j--) - 1);
    }
  }
}

export class SymmetricGroup extends PermutationGroup {
  // Question: do we notate w/ cyces or permutation lists?
  // Maybe it depends on n?
  // But what about the parse?  Always accept cycles?
  // Maybe notate w/ [] for list or () for cycles?
  constructor(n: number) { super(n); }

  *[Symbol.iterator]() {
    yield* permute(this.n, true);
  }
}

export class AlternatingGroup extends PermutationGroup {
  // Question: do we notate w/ cyces or permutation lists?
  // Maybe it depends on n?
  // But what about the parse?  Always accept cycles?
  // Maybe notate w/ [] for list or () for cycles?
  constructor(n: number) { super(n); }

  *[Symbol.iterator]() {
    yield* permute(this.n, false);
  }
}

class Permutation implements GroupElement {
  constructor(readonly arr: readonly number[],
              readonly labels?: readonly string[]) {}

  private _name?: string = undefined;

  mul(that: GroupElement): GroupElement {
    if (!(that instanceof Permutation) || that.arr.length !== this.arr.length) {
      throw new Error(`Different groups`);
    }
    const out = [];
    for (let i = 0; i < this.arr.length; i++) {
      out.push(this.arr[that.arr[i]]);
    }
    return new Permutation(out, this.labels);
  }

  eq(that: GroupElement): boolean {
    if (!(that instanceof Permutation) || that.arr.length !== this.arr.length) {
      return false;
    }
    return this.arr.every((d, i) => d === that.arr[i]);
  }

  toCycles(): number[][] {
    let seen = 0n;
    const cycles: number[][] = [];
    for (let i = 0; i < this.arr.length; i++) {
      let j = i;
      let cycle;
      for (;;) {
        const mj = 1n << BigInt(j);
        if (seen & mj) break;
        if (!cycle) cycle = [];
        cycle.push(j);
        seen |= mj;
        j = this.arr[j];
      }
      if (cycle?.length > 1) {
        cycles.push(cycle);
      }
    }
    return cycles;
  }

  toString() {
    if (!this.labels && this.arr.length < CYCLE_PIVOT) {
      // TODO - customize this condition?
      return `[${this.arr.map(i => i + 1).join('')}]`;
    }
    const cycles = this.toCycles();
    if (!cycles.length) return 'e';
    return `(${this.toCycles()
        .map(c => c.map(e => this.labels ? this.labels[e] : e + 1).join(' '))
        .join(')(')})`;
  }

  get name(): string {
    if (!this._name) this._name = this.toString();
    return this._name!;
  }
}


export class DirectProductGroup implements Group {
  readonly groups: readonly Group[];
  constructor(...groups: Group[]) {
    this.groups = groups;
  }
  *[Symbol.iterator]() {
    const elts = this.groups.map(g => [...g]);
    const k = elts.length;
    let n = 1;
    for (const g of elts) {
      n *= g.length;
    }
    for (let i = 0; i < n; i++) {
      const elt = [];
      let x = i;
      for (let j = 0; j < k; j++) {
        elt.push(elts[j][x % elts[j].length])
        x = Math.floor(x / elts[j].length);
      }
      yield new DirectProductElement(this, elt);
    }
  }

  parse(name: string) {
    const match = /^\((.*)\)$/.exec(name);
    if (!match) return undefined;
    const elts = [];
    let i = 0;
    for (const n of match[1].split(/,\s*/g)) {
      const elt = this.groups[i++].parse(n.trim());
      if (!elt) return undefined;
      elts.push(elt);
    }
    return new DirectProductElement(this, elts);
  }

  toString() {
    return this.groups.join('×');
  }
}

class DirectProductElement implements GroupElement {
  readonly name: string;
  constructor(readonly group: DirectProductGroup,
              readonly elts: GroupElement[]) {
    this.name = `(${elts.map(e => e.name).join(', ')})`;
  }
  mul(that: GroupElement): GroupElement {
    const g = this.group;
    if (!(that instanceof DirectProductElement) || that.group !== g) {
      throw new Error(`Different groups`);
    }
    return new DirectProductElement(g, this.elts.map((e, i) => e.mul(that.elts[i])));
  }
  eq(that: GroupElement): boolean {
    if (!(that instanceof DirectProductElement)) return false;
    for (let i = 0; i < this.elts.length; i++) {
      if (!this.elts[i].eq(that.elts[i])) return false;
    }
    return true;
  }
  toString() { return this.name; }
}


// returns a % b between 0 and b-1
function pmod(a: number, b: number): number {
  if (b < 0) b = -b;
  if (a < 0) a += (Math.ceil(Math.abs(a) / b) * b);
  return a % b;
}

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


export class SymmetricGroup implements Group {
  // Question: do we notate w/ cyces or permutation lists?
  // Maybe it depends on n?
  // But what about the parse?  Always accept cycles?
  // Maybe otate w/ [] for list or () for cycles?

}


export class DirectProductGroup implements Group {
  readonly groups: readonly Group[];
  constructor(...groups: Group[]) {
    this.groups = groups;
  }
  *[Symbol.iterator]() {
    const elts = this.groups.map(g => [...g]);
    const k = elts.length;
    // const left = [];
    // const right = [];
    let n = 1;
    for (const g of elts) {
      // left.push(n);
      n *= g.length;
    }
    // for (let i = 1; i < k; i++) {
    //   right[i - 1] = n / left[i];
    // }
    // right.push(1);
    for (let i = 0; i < n; i++) {
      const elt = [];
      let x = i;
      for (let j = 0; j < k; j++) {
        elt.push(elts[j][x % elts[j].length])
        x = Math.floor(x / elts[j].length);
        // const l = Math.floor(i / left[j]);
        // const r = i - left[j] * l;
        // elt.push(elts[j][Math.floor(i ])
      }
      yield new DirectProductElement(this, elt);
    }
    // const stack = [this.groups[0][Symbol.iterator]()];
    // const elts = [];

//     2, 2, 3
// L = 1, 2, 4
// R = 6, 3, 1
// 0 -> 0,0,0
// 1 -> 1,0,0   = (1%R[0], 
// 2 -> 0,1,0   = (2%R[0], 2/
    

    // while (stack.length) {
    //   while (stack.length < this.groups.length) {
    //     const {value, done} = stack[elts.length].next();
    //     if (done) {
    //       stack.pop();
    //       elts.pop();
    //       break;
    //     }
    //     elts.push(value);
    //     stack.push(this.groups[stack.length][Symbol.iterator]());
    //   }
    //   const lastIter = stack.pop();
    //   console.log(lastIter);
    //   let value, done;
    //   while (({value, done} = lastIter.next()), !done) {
    //     yield new DirectProductElement(this, [...elts, value]);
    //   }
    //   elts.pop();
    // }
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

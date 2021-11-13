const CYCLE_PIVOT = 0;

// Group elements must be enumerable.
export interface Group {
  readonly order: bigint;
  readonly id: bigint; // always 0n?
  parse(name: string): bigint|undefined;
  mul(left: bigint, right: bigint): bigint;
  inv(arg: bigint): bigint;
  name(arg: bigint): string;
}

// Canonical element = r{0,n-1}s{0,1}
export class DihedralGroup implements Group {
  readonly n: bigint;
  readonly order: bigint;
  readonly id = 0n;

  constructor(n: number|bigint) {
    this.n = BigInt(n);
    this.order = this.n << 1n;
  }

  parse(name: string): bigint|undefined {
    if (name === 'e') return 0n;
    const match = /^(r?)(-?\d*)(s?)(\d*)$/.exec(name);
    if (!match) return undefined;
    if (match[2] && !match[1]) return undefined;
    if (match[4] && !match[3]) return undefined;
    const r = pmod(match[1] ? (match[2] ? BigInt(match[2]) : 1n) : 0n, this.n);
    const s = pmod(match[3] ? (match[4] ? BigInt(match[4]) : 1n) : 0n, 2n);
    return r << 1n | s;
  }

  name(x: bigint): string {
    const s = x & 1n;
    const r = pmod(x >> 1n, this.n);
    if (!s && !r) return 'e';
    if (!r) return 's';
    return `r${r > 1 ? r : ''}${s ? 's' : ''}`;
  }

  mul(a: bigint, b: bigint): bigint {
    const sa = a & 1n;
    const sb = b & 1n;
    const s = sa ^ sb;
    const ra = a >> 1n;
    const rb = b >> 1n;
    const r = pmod(sa ? ra - rb : ra + rb, this.n);
    return s * this.n + r;
  }

  inv(x: bigint): bigint {
    if (x < 0n || x >= this.order) x = pmod(x, this.order);
    return x && !(x & 1n) ? this.order - x : x;
  }

  toString() {
    return `D${this.n}`;
  }
}

export class CyclicGroup implements Group {
  readonly n: bigint;
  readonly order: bigint;
  readonly id = 0n;

  constructor(n: number|bigint) {
    this.n = this.order = BigInt(n);
  }
  parse(name: string): bigint|undefined {
    if (name === 'e') return 0n;
    const match = /^g(-?\d*)$/.exec(name);
    if (!match) return undefined;
    const i = match[1] ? Number(match[1]) : 1;
    return pmod(BigInt(i), this.n);
  }
  name(x: bigint): string {
    x = pmod(x, this.n);
    return x ? `g${x > 1n ? x : ''}` : 'e';
  }

  mul(a: bigint, b: bigint): bigint {
    return pmod(a + b, this.n);
  }
  inv(x: bigint): bigint {
    return pmod(-x, this.n);
  }

  toString() {
    return `Z${this.n}`;
  }
}


// TODO - update other groups to bigints as well...


function range(n: number) {
  return Array.from({length: n}, (_, i) => i);
}

abstract class PermutationGroup {
  readonly n: bigint;
  abstract readonly order: bigint;
  readonly id = 0n;
  constructor(n: number|bigint, readonly labels?: string[]) {
    this.n = BigInt(n);
  }

  parse(_name: string): bigint|undefined {
    throw new Error('not implemented');
  }
  name(index: bigint): string {
    const perm = permutation(this.n, index);
    if (!this.labels && this.n < CYCLE_PIVOT) {
      // TODO - customize this condition?
      return `[${perm.map(i => i + 1).join('')}]`;
    }

    const cyc = cycles(perm);
    if (!cyc.length) return 'e';
    return `(${cyc
        .map(c => c.map(e => this.labels ? this.labels[e] : e + 1).join(' '))
        .join(')(')})`;
  }


}

function pick(i: number, arr: number[]): number {
  const n = arr.length - 1;
  i = n - i;
  const result = arr[i] ?? i;
  if (i < n) arr[i] = arr[n] ?? n;
  arr.pop();
  return result;
}

function permutation(n: bigint, p: bigint): number[] {
  const parity = Number(p & 1n);
  p >>= 1n;
  const perm = new Array(Number(n));
  const rest = new Array(Number(n));
  while (rest.length) {
    const j = pick(Number(p % n), rest);
    const i = rest.length;
    p /= n--;
    perm[i] = j;
  }
  if ((swaps(perm) & 1) !== parity) {
    const tmp = perm[0];
    perm[0] = perm[1];
    perm[1] = tmp;
  }
  return perm;
}

function permutationIndex(perm: number[]): bigint {
  const parity = swaps(perm) & 1;
  if (parity) {
    perm = [...perm];
    const tmp = perm[0];
    perm[0] = perm[1];
    perm[1] = tmp;
  }
  // TODO - how to "unpick"?
  // need to keep an ordered list...
}

// function permutation(n: bigint, p: bigint): number[] {
//   const parity = Number(p & 1n);
//   p >>= 1n;
//   let swaps = 0;
//   // N options...
//   const array = new Array(Number(n));
//   const rest = new Array(Number(n));
//   const rev = new Array(Number(n));
//   while (rest.length) {
//     const j = pick(Number(p % n), rest);
//     const i = rest.length;
//     p /= n--;
//     array[i] = j;
//     // Need to keep track of parity
//     if (i === j) continue;
//     let ii = i;
//     let jj = j;
//     while (rev[ii] != null && rev[ii] !== ii) {
//       [ii, rev[ii]] = [rev[ii], j];
//     }
//     while (rev[jj] != null && rev[jj] !== jj) {
//       [jj, rev[jj]] = [rev[jj], i];
//     }
//     // Followed all the chains - see if it linked up
//     if (ii === jj || (rev[ii] != null && rev[ii] === rev[jj])) continue;
//     swaps++;
//     rev[ii] = j;
//     rev[jj] = i;
//   }
//   if ((swaps & 1) !== parity) {
//     const tmp = array[0];
//     array[0] = array[1];
//     array[1] = tmp;
//   }
//   return array;
// }

// !a[i] => a[i] = j
// a[j] = i
// 
// 4123
// 4    4..1 (1) j=4 i=1 -> !a[1] => a[1] = 4;  !a[4] => a[4] = 1;  ++
// 41   44.2 (2) j=1 i=2 - !a[2] => a[2] = 1;  a[1] == 4 => a[4] = 2, a[2]=4; ++
// 412  4423 (3) see a 2@3 - !a[3] => a[3] = 2;  a[2] == 4 => a[4] = 3; ++
// 4123 OK       see a 3@4 - a[4] == 3 => OK

function cycles(perm: number[]): number[][] {
  let seen = 0n;
  const cycles: number[][] = [];
  for (let i = 0; i < perm.length; i++) {
    let j = i;
    let cycle;
    for (;;) {
      const mj = 1n << BigInt(j);
      if (seen & mj) break;
      if (!cycle) cycle = [];
      cycle.push(j);
      seen |= mj;
      j = perm[j];
    }
    if (cycle?.length > 1) {
      cycles.push(cycle);
    }
  }
  return cycles;
}

function swaps(perm: number[]): number {
  let seen = 0n;
  const swaps = 0;
  for (let i = 0; i < perm.length; i++) {
    let j = i;
    let cycle = 0;
    for (;;) {
      const mj = 1n << BigInt(j);
      if (seen & mj) break;
      cycle++;
      seen |= mj;
      j = perm[j];
    }
    if (cycle > 1) swaps += cycle - 1;
  }
  return swaps;
}

function* permute(n: number, yieldOdds: boolean) {
  const arr = range(n);
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

  inv(): GroupElement {
    const out = [];
    for (let i = 0; i < this.arr.length; i++) {
      out[this.arr[i]] = i;
    }
    return new Permutation(out, this.labels);
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

  id(): GroupElement {
    return new DirectProductElement(this, this.groups.map(g => g.id()));
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
  inv(): GroupElement {
    return new DirectProductElement(this.group, this.elts.map(e => e.inv()));
  }
  toString() { return this.name; }
}


// returns a % b between 0 and b-1
function pmod(a: bigint, b: bigint): bigint {
  if (b < 0n) b = -b;
  let x = a % b;
  while (x < 0n) x += b;
  return x;
}

// For alternating group, we can compute all but the last two
// mappings in O(1); the last two are O(n) - so it's still
// amortized O(1) lookup.  If we know we'll hit everything we
// should probably realize the permutation matrix first.

// Correction: it's NOT O(1) lookup because it depends on all
// the previous elements - it's O(n), but computing them all
// at once is also still O(n) because we can memoize...


// input 625143
// track 123456
// see 1:6 => move 6 to 1
//       623451
// see 2:2 => skip
// see 3:5 => move 5 to 3
//       625431
// see 4:1 => move 1 to 4, but where is 1? it's at 6
// see 5:

// 4123
// 4    ...1 (1) see a 4@1 - anything at 1? no, put 1 at 4, ++
// 41   2..1 (2) see a 1@2 - anything at 2? no, put 2 at 1, ++
// 412  23.1 (3) see a 2@3 - anything at 3? no, put 3 at 2, ++
// 4123 1==1     see a 3@4 - anything at 4? yes: 1 -> 2 -> 3 OK

// 4123
// 4    4..1 (1) see a 4@1 - !a[1] => a[1] = 4;  !a[4] => a[4] = 1;  ++
// 41   44.2 (2) see a 1@2 - !a[2] => a[2] = 1;  a[1] == 4 => a[4] = 2, a[2]=4; ++
// 412  4423 (3) see a 2@3 - !a[3] => a[3] = 2;  a[2] == 4 => a[4] = 3; ++
// 4123 OK       see a 3@4 - a[4] == 3 => OK

// Basically, we chase both sides - is this O(n^2)? - only if we use the same space, if we keep a separate list for the counting then it's O(n)


// 4321
// 4    4..1 (1)
// 43   4321 (2)
// 432  OK
// 4321 OK


// 4321
// 4    ...1 (1)
// 43   ..21 (2)
// 432  2==2     see a 2@3 - anything at 3? yes, 2 already -> OK
// 4321 1==1

// 2341
// 2    .1.. (1)
// 23   .11. (2) see a 3@2 - anything at 2? yes, 1 -> put 1 at 3 ++
// 234  .111 (3) see a 4@3 - anything at 3? yes, 1 -> put 1 at 4 ++
// 2341          see a 1@4 - anything at 4? yes, 1 => OK


// 51432
// 5     ....1 (1)
// 51    2...1 (2)
// 514   2..31 (3)
// 5143  3==3
// 51432 5 gets 2 but has 1, so 1 gets 2 OK

// 51423
// 5     ....1 (1)
// 51    2...1 (2)
// 514   2..31 (3)
// 5142  24.31 (4)
// 51423 

// TODO - exhaustive test on parity/cycles
// function parity(arr) {
//   let parity = 0;
//   const cycles = []
//   for (let i = 0; i < arr.length; i++) {
//     const x = arr[i] - 1;
//     if (x > i) cycles[x] = i;
//     const px = pos[x] != null ? pos[x] : x;
//     const y = pos[i] != null ? pos[i] : i;
//     if (x === y) continue;
//     [pos[i], pos[px]] = [pos[px] != null ? pos[px] : px, y];
//     parity++;
//     console.log(`i=${i+1} x=${x+1} px=${px+1} y=${y+1}: ${pos.map(x=>x+1).join(',')}`);
//   }
//   return parity;
// }
// cycles([6,2,5,4,1,3])
// cycles([6,2,5,1,4,3])
// function cycles(arr) {
//   let seen = 0n;
//   const cycles = [];
//   let par = 0;
//   for (let i = 0; i < arr.length; i++) {
//     let j = i;
//     let cycle = [];
//     for (;;) {
//       const mj = 1n << BigInt(j);
//       if (seen & mj) break;
//       cycle.push(j + 1);
//       seen |= mj;
//       j = arr[j] - 1;
//     }
//     if (cycle.length > 1) {
//       cycles.push(cycle);
//       par += cycle.length - 1;
//     }
//   }
//   return [cycles, par, parity(arr)];
// }

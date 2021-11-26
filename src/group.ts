const CYCLE_PIVOT = 0;

// Group elements must be enumerable.
export interface Group {
  readonly order: bigint;
  readonly id: bigint; // always 0n?
  parse(name: string): bigint|undefined;
  name(arg: bigint): string;
  mul(left: bigint, right: bigint): bigint;
  inv(arg: bigint): bigint;
}

export function groupEval(g: Group, s: string): string {
  return g.name(
      s.trim()
          .split(/\s+/g)
          .map(a => g.parse(a)!)
          .reduce((a, b) => g.mul(a, b)));
}

export class AliasGroup implements Group {
  readonly order: bigint;
  readonly id: bigint;
  readonly byName: ReadonlyMap<string, bigint>;
  readonly names: ReadonlyMap<bigint, string>;

  constructor(readonly parent: Group,
              ...generators: Array<readonly [string, bigint|string]>) {
    this.order = parent.order;
    this.id = parent.id;
    const byName = new Map<string, bigint>();
    const names = new Map<bigint, string>();
    const gens: [string, bigint][] = [];
    function add(name: string, elem: bigint) {
      names.set(elem, name);
      byName.set(name, elem);
    }
    function prefix(a: string, b: string): string {
      if (b[0] !== a) return a + b;
      b = b.substring(1);
      const m = /^(\d+)(.*)$/.exec(b);
      if (!m) return a + '2' + b;
      return `${a}${Number(m[1]) + 1}${b}`;
    }
    function suffix(a: string, b: string): string {
      const pow = /\d*$/.exec(a)![0];
      if (a[a.length - pow.length - 1] !== b) return a + b;
      a = a.replace(/\d*$/, '');
      return `${a}${pow ? Number(pow) + 1 : 2}`;
    }
    add('e', parent.id);
    for (const [name, elemOrParentName] of generators) {
      const elem = typeof elemOrParentName === 'string' ?
          parent.parse(elemOrParentName) : elemOrParentName;
      if (elem == null) throw new Error(`Bad generator: ${elemOrParentName}`);
      gens.push([name, elem]);
      add(name, elem);
    }
    for (const [e1, n1] of names) {
      if (e1 === parent.id) continue;
      for (const [n2, e2] of gens) {
        const e12 = parent.mul(e1, e2);
        if (!names.has(e12)) add(suffix(n1, n2), e12);
        const e21 = parent.mul(e2, e1);
        if (!names.has(e21)) add(prefix(n2, n1), e21);
      }
    }
    this.byName = byName;
    this.names = names;
  }

  parse(name: string): bigint|undefined {
    // TODO - break into pieces and recompute
    return this.byName.get(name);
  }
  name(elem: bigint): string {
    return this.names.get(elem)!;
  }
  mul(left: bigint, right: bigint): bigint {
    return this.parent.mul(left, right);
  }  
  inv(elem: bigint): bigint {
    return this.inv(elem);
  }
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

function range(length: number): number[] {
  return Array.from({length}, (_, i) => i);
}

function factorial(n: bigint): bigint {
  let fact = 1n;
  while (n > 1) fact *= n--;
  return fact;
}

export class SymmetricGroup implements Group {
  readonly n: bigint;
  readonly order: bigint;
  readonly id = 0n;
  readonly reverseLabels: Map<string, number>;
  constructor(n: number|bigint, readonly labels?: string[],
              alternating = 0n) {
    this.n = BigInt(n);
    this.order = factorial(this.n) >> alternating;
    this.reverseLabels =
      new Map(labels ?
        labels.map((l, i) => [l, i]) :
        range(Number(n)).map(x => [String(x + 1), x]));
  }

  protected fromIndex(x: bigint): number[] {
    return permutation(this.n, x);
  }
  protected toIndex(p: number[]): bigint|undefined {
    return permutationIndex(p);
  }

  parse(name: string): bigint|undefined {
    if (name === 'e') return 0n;
    // Check for permutation matrix
    let match = /^\[(.*)\]$/.exec(name);
    if (match && !this.labels) {
      const terms = match[1].split('');
      const perm = match[1].split('').map(x => parseInt(x, 36) - 1);
      if (perm.some(isNaN)) return undefined;
      if (perm.length !== new Set(terms).size) return undefined;
      return this.toIndex(perm);
    }
    // Check for cycles, using labels
    if (!/^(?:\([^()]*\))+$/.test(name)) return undefined;
    const cycles: number[][] = [];
    const re = /\(([^()]*)\)/g;
    while ((match = re.exec(name))) {
      const cycle =
          match[1].trim().split(/\s+/)
              .map(term => this.reverseLabels.get(term)!);
      if (cycle.some(isNaN)) return undefined;
      cycles.push(cycle);
    }
    const perm = range(Number(this.n));
    for (let i = cycles.length - 1; i >= 0; i--) {
      const cycle = cycles[i];
      const tmp = perm[cycle[0]];
      for (let j = 1; j < cycle.length; j++) {
        perm[cycle[j - 1]] = perm[cycle[j]];
      }
      perm[cycle[cycle.length - 1]] = tmp;
    }
    return this.toIndex(perm);
  }
  name(index: bigint): string {
    const perm = this.fromIndex(index);
    if (!this.labels && this.n < CYCLE_PIVOT) {
      // TODO - customize this condition?
      return `[${perm.map(i => i + 1).join('')}]`;
    }

    const cyc = permutationCycles(perm);
    if (!cyc.length) return 'e';
    return `(${cyc
        .map(c => c.map(e => this.labels ? this.labels[e] : e + 1).join(' '))
        .join(')(')})`;
  }

  mul(x: bigint, y: bigint): bigint {
    const xp = this.fromIndex(x);
    const yp = this.fromIndex(y);
    const p = [];
    for (let i = 0; i < xp.length; i++) {
      p.push(xp[yp[i]]);
    }
    return this.toIndex(p)!;
  }
  inv(x: bigint): bigint {
    const xp = this.fromIndex(x);
    const p = [];
    for (let i = 0; i < p.length; i++) {
      p[xp[i]] = i;
    }
    return this.toIndex(p)!;
  }

  toString() {
    return `S${this.n}`;
  }
}

export class AlternatingGroup extends SymmetricGroup {
  constructor(n: number|bigint, labels?: string[]) {
    super(n, labels, 1n);
  }

  override fromIndex(x: bigint): number[] {
    return super.fromIndex(x << 1n);
  }
  override toIndex(p: number[]): bigint|undefined {
    const index = super.toIndex(p)!;
    if (index & 1n) return undefined;
    return index >> 1n;
  }

  override toString() {
    return `A${this.n}`;
  }
}

// Works in-place: components starts as the maxes, replaced with values.
function splitComponents(components: bigint[], n: bigint) {
  for (let i = components.length - 1; i > 0; i--) {
    const c = components[i];
    components[i] = n % c;
    n /= c;
  }
  components[0] = n;
}

// function joinComponents(sizes: readonly bigint[],
//                         components: readonly bigint[]): bigint {
//   let n = 0n;
//   for (let i = 0; i < components.length; i++) {
//     n *= sizes[i];
//     n += components[i];
//   }
//   return n;
// }

export function permutation(n: bigint, p: bigint): number[] {
  const length = Number(n);
  const components = Array.from({length: length - 1}, (_, i) => n - BigInt(i));
  splitComponents(components, p);
  let parity = 0;
  for (let i = length - 3; i >= 0; i--) {
    parity ^= Number(components[i] !== 0n);
  }
  if (parity) components[length - 2] ^= 1n;
  const perm = range(Number(n));
  for (let i = length - 2; i >= 0; i--) {
    if (!components[i]) continue;
    const j = Number(components[i]) + i;
    const tmp = perm[i];
    perm[i] = perm[j];
    perm[j] = tmp;
  }
  return perm;
}

export function permutationIndex(perm: readonly number[]): bigint {
  const length = perm.length;
  const reverse = new Array(length);
  for (let i = 0; i < length; i++) {
    reverse[perm[i]] = i;
  }
  const p = [...perm];
  let index = 0n;
  let factor = BigInt(length);
  let parity = 0;
  for (let i = 0; i < length - 1; i++) {
    index *= factor--;
    const j = reverse[i];
    // swap p[i] with p[j]: new p[i] is irrelevant but reverse[p[i]] is now j
    p[j] = p[i];
    reverse[p[i]] = j;
    let term = BigInt(j - i);
    if (factor > 1n) {
      parity ^= Number(term > 0n);
    } else if (parity) {
      term ^= 1n;
    }
    index += term;
  }
  return index;
}

export function permutationCycles(perm: readonly number[]): number[][] {
  let seen = 0n;
  const cycles: number[][] = [];
  for (let i = 0; i < perm.length; i++) {
    let j = i;
    let cycle!: undefined|number[];
    for (;;) {
      const mj = 1n << BigInt(j);
      if (seen & mj) break;
      if (!cycle) cycle = [];
      cycle.push(j);
      seen |= mj;
      j = perm[j];
    }
    if (cycle?.length! > 1) {
      cycles.push(cycle!);
    }
  }
  return cycles;
}

// export class DirectProductGroup implements Group {
//   readonly groups: readonly Group[];
//   constructor(...groups: Group[]) {
//     this.groups = groups;
//   }
//   *[Symbol.iterator]() {
//     const elts = this.groups.map(g => [...g]);
//     const k = elts.length;
//     let n = 1;
//     for (const g of elts) {
//       n *= g.length;
//     }
//     for (let i = 0; i < n; i++) {
//       const elt = [];
//       let x = i;
//       for (let j = 0; j < k; j++) {
//         elt.push(elts[j][x % elts[j].length])
//         x = Math.floor(x / elts[j].length);
//       }
//       yield new DirectProductElement(this, elt);
//     }
//   }

//   parse(name: string) {
//     const match = /^\((.*)\)$/.exec(name);
//     if (!match) return undefined;
//     const elts = [];
//     let i = 0;
//     for (const n of match[1].split(/,\s*/g)) {
//       const elt = this.groups[i++].parse(n.trim());
//       if (!elt) return undefined;
//       elts.push(elt);
//     }
//     return new DirectProductElement(this, elts);
//   }

//   id(): GroupElement {
//     return new DirectProductElement(this, this.groups.map(g => g.id()));
//   }

//   toString() {
//     return this.groups.join('×');
//   }
// }

// class DirectProductElement implements GroupElement {
//   readonly name: string;
//   constructor(readonly group: DirectProductGroup,
//               readonly elts: GroupElement[]) {
//     this.name = `(${elts.map(e => e.name).join(', ')})`;
//   }
//   mul(that: GroupElement): GroupElement {
//     const g = this.group;
//     if (!(that instanceof DirectProductElement) || that.group !== g) {
//       throw new Error(`Different groups`);
//     }
//     return new DirectProductElement(g, this.elts.map((e, i) => e.mul(that.elts[i])));
//   }
//   eq(that: GroupElement): boolean {
//     if (!(that instanceof DirectProductElement)) return false;
//     for (let i = 0; i < this.elts.length; i++) {
//       if (!this.elts[i].eq(that.elts[i])) return false;
//     }
//     return true;
//   }
//   inv(): GroupElement {
//     return new DirectProductElement(this.group, this.elts.map(e => e.inv()));
//   }
//   toString() { return this.name; }
// }


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

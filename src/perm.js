function cycles(perm) {
  let seen = 0n;
  const cycles = [];
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
    if (cycle && cycle.length > 1) {
      cycles.push(cycle);
    }
  }
  return cycles;
}

function swaps(perm) {
  let seen = 0n;
  let swaps = 0;
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
    if (cycle > 1) {
      swaps += (cycle - 1);
    }
  }
  return swaps;
}

function pick(i, arr) {
  const n = arr.length - 1;
  i = n - i;
  const result = arr[i] != null ? arr[i] : i;
  if (i < n) arr[i] = arr[n] != null ? arr[n] : n;
  arr.pop();
  return result;
}

function permutation(n /*: bigint*/, p /*: bigint*/) /*: number[]*/ {
  const parity = Number(p & 1n);
  p >>= 1n;
  // N options...
  const perm = new Array(Number(n));
  const rest = new Array(Number(n));
  while (rest.length) {
    const next = pick(Number(p % n), rest);
    perm[rest.length] = next;
    p /= n--;
  }
  if ((swaps(perm) & 1) !== parity) {
    const tmp = perm[0];
    perm[0] = perm[1];
    perm[1] = tmp;
  }
  return perm;
}

//module.exports.permutation = permutation;
//module.exports.cycles = cycles;

let counts = [0,0,0,0,0];
for (let i = 0n; i < 120n; i += 2n) {
  //if (i !== 12n) continue;
  const p = permutation(5n, i);
  counts[p[1]]++;
  console.log(i, p, ' => ', swaps(p), cycles(p));
}
console.log(counts);

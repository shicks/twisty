import * as group from  './group.js';

// const z2 = new group.CyclicGroup(2);
// const d3 = new group.DihedralGroup(3);
// const g = new group.DirectProductGroup(z2, d3);
// for (const x of g) {
//   for (const y of g) {
//     console.log(`${x} ${y} = ${x.mul(y)}`);
//   }
// }

// const g = new group.AlternatingGroup(4);
// for (const x of g) {
//   for (const y of g) {
//     console.log(`${x} ${y} = ${x.mul(y)}`);
//   }
// }

// const n = 6n;
// let order = 1n;
// for (let i = 1n; i <= n; i++) order *= i;
// for (let i = 0n; i < order; i++) {
//   const p = group.permutation(n, i);
//   const j = group.permutationIndex(p);
//   const mismatch = i !== j ? `\x1b[1;31mMISMATCH\x1b[m` : '';
//   console.log(i, p, j, mismatch);
// }

const g = new group.SymmetricGroup(5, ['A', 'B', 'C', 'D', 'E']);
for (let i = 0n; i < g.order; i++) {
  console.log(i, g.name(i), g.parse(g.name(i)));
}

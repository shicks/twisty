import * as group from  './group.js';

// const z2 = new group.CyclicGroup(2);
// const d3 = new group.DihedralGroup(3);
// const g = new group.DirectProductGroup(z2, d3);
// for (const x of g) {
//   for (const y of g) {
//     console.log(`${x} ${y} = ${x.mul(y)}`);
//   }
// }

const g = new group.AlternatingGroup(4);
for (const x of g) {
  for (const y of g) {
    console.log(`${x} ${y} = ${x.mul(y)}`);
  }
}


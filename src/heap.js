function generate(n) {
  const a = [...'ABCDEFGHIJK'.substring(0, n)];
  function swap(x, y) {
    const tmp = a[x];
    a[x] = a[y];
    a[y] = tmp;
  }
  const c = [...a].fill(0);
  console.log(a.join(''));
  let i = 0;
  while (i < n) {
    if (c[i] < i) {
      if (i & 1) {
        swap(c[i], i);
      } else {
        swap(0, i);
      }
      console.log(a.join(''));
      c[i]++;
      i = 0;
    } else {
      c[i] = 0
      i++;
    }
  }
}

generate(5);

// Heap's algorithm braid:
//  - move first element to end
//  - even: move (originally) second- and third-last elements to start
//  - odd:  move (originally) last element to start

// Can this be used to "speed up" the generation and figure out the
// last element for a given index?

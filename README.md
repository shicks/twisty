# Twisty puzzles

This is an interactive algebra system for dealing with twisty puzzles.
It can define and manipulate various groups, both "complete" (where
all the elements are known and can be enumerated) and "incomplete".

The web version provides a playground that understands a grammar for
defining groups.  We have built-in understanding of several fundamental
groups, and can compose them via direct product, renaming elements as
needed.  For example,

```
group G extends S(4)*Z(2) {
  x = ((1 2 4 3), 1);
  y = ((1 4 2 3), 0);
  z = ((1 2)(3 4), 1);
}
```

TODO - how do we label the rest?
 - the point of labeling/defining these groups is to be adjunct to
   the permutations, e.g. `(UL DR:x DL:y)`

Ultimately we want to define a puzzle:

```
puzzle R3 {
  partition corner {
    FUL, FUR, FDL, FDR, BUL, BUR, BDL, BDL;
    group G1;
  }
  partition edge {
    FU, FL, FR, FD, BU, BL, BR, BD,
    UL, UR, DL, DR;
    group G2;
  }
}
```

Then we define rotations.

```
L = (FUL:x FDL:x BDL:x BUL:x)(FL:x DL:x BL:x UL:x)
R = (FUR:x3 BUR:x3 BDR:x3 FDR:x3)(FR:x3 UR:x3 BR:x3 DR:x3)
F = ...
```

Finally commutators.

```
#L        // -> 4
L F L~ F~ // -> (FUL FDL:xy)(FU BL:x FL:z) or whatever
[L, F]    // maybe an easier way to write a commutator?
```

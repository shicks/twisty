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

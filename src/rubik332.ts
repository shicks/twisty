import * as group from  './group.js';
import * as readline from 'readline';

const rl = readline.createInterface(process.stdin, process.stdout, undefined, true);

export const rubik332 =
    new group.SymmetricGroup(16, [
      ...'FUL FUR FDL FDR BUL BUR BDL BDR'.split(' '),
      ...'FU FL FR FD BU BL BR BD'.split(' '),
    ]);

export const vm = new group.Vm(rubik332);
vm.eval('L = (FDL BUL)(FL BL)(FUL BDL)');
vm.eval('R = (FDR BUR)(FR BR)(FUR BDR)');
vm.eval('U = (FUL BUR)(FU BU)(FUR BUL)');
vm.eval('D = (FDL BDR)(FD BD)(FDR BDL)');
vm.eval('F = (FUL FDL FDR FUR)(FU FL FD FR)');
vm.eval('B3 = (BUL BDL BDR BUR)(BU BL BD BR)');
vm.eval('F3 = F~');
vm.eval('B = B3~');
vm.eval('F2 = F F');
vm.eval('B2 = B B');
vm.eval('LU = L U L U');
vm.eval('LD = L D L D');
vm.eval('RU = R U R U');
vm.eval('RD = R D R D');
// vm.eval('rr = R B R B3 F3 R F');
// vm.eval('luf4 = LU F LU F LU F LU F');
// vm.eval('flu4 = F LU F LU F LU F LU');

// Ignore any edge effects
//vm.find('(FUL FUR)(BUL BUR)', (entry) => {
// vm.simplest(250, (entry) => {
//   // get rid of odd permutations
//   if (entry[1].split(/\s+/).filter(s => /^[FB]3?$/.test(s)).length & 1) entry[0] = '';
//   entry[0] = entry[0].replace(/\([A-Z][A-Z](?: [A-Z][A-Z])+\)/g, '');
// });

// drop anything that touches corners
vm.simplest(250, (entry) => {
  if (/[A-Z]{3}/.test(entry[0])) entry[0] = '';
});

if (require.main === module) {
  rl.setPrompt('> ');
  rl.on('line', (line: string) => {
    vm.eval(line);
    rl.prompt(true);
  });
  rl.on('close', () => process.exit(0));
  rl.prompt(true);
}

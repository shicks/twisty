import * as group from  './group.js';
import * as readline from 'readline';

const rl = readline.createInterface(process.stdin, process.stdout, undefined, true);

const names = `
  F B U D L R
  x0 x1 x2 x3 x4 x5
  y0 y1 y2 y3 y4 y5
  z0 z1 z2 z3 z4 z5
  FUL FUR FDL FDR BUL BUR BDL BDR
  fu fl fr fd bu bl br bd ul ur dl dr
`.trim().split(/\s+/g);
export const gear = new group.SymmetricGroup(names.length, names);

export const vm = new group.Vm(gear);

vm.eval('X = (FUL BUL BDL FDL)(FUR FDR BDR BUR)(fl ul bl dl)(fr dr br ur)(x0 x1 x2 x3 x4 x5)(y0 z0)(y1 z1)(y2 z2)(y3 z3)(y4 z4)(y5 z5);');
vm.eval('Y = (FUL FDL FDR FUR)(BUL BUR BDR BDL)(fu fl fd fr)(bu br bd bl)(y0 y1 y2 y3 y4 y5)(x0 z0)(x1 z1)(x2 z2)(x3 z3)(x4 z4)(x5 z5);');
vm.eval('Z = (FUL FUR BUR BUL)(FDR FDL BDL BDR)(fu ur bu ul)(fd dl bd dr)(z0 z1 z2 z3 z4 z5)(x0 y0)(x1 y1)(x2 y2)(x3 y3)(x4 y4)(x5 y5);');
vm.eval('rx = (F D B U)(FUL FDL BDL BUL)(FUR FDR BDR BUR)(fu fd bd bu)(ul fl dl bl)(ur fr dr br)(y0 z0)(y1 z1)(y2 z2)(y3 z3)(y4 z4)(y5 z5);');
vm.eval('ry = (L U R D)(FUL FUR FDR FDL)(BUL BUR BDR BDL)(fu fr fd fl)(bu br bd bl)(ul ur dr dl)(x0 z0)(x1 z1)(x2 z2)(x3 z3)(x4 z4)(x5 z5);');
vm.eval('rz = (F R B L)(FUL FUR BUR BUL)(FDL FDR BDR BDL)(fu ur bu ul)(fd dr bd dl)(fl fr br bl)(x0 y0)(x1 y1)(x2 y2)(x3 y3)(x4 y4)(x5 y5);');
vm.eval('X2 = X^2;');
vm.eval('X3 = X^3;');
vm.eval('X4 = X^4;');
vm.eval('X5 = X^5;');
vm.eval('X6 = X^6;');
vm.eval('X7 = X^7;');
vm.eval('X8 = X^8;');
vm.eval('X9 = X^9;');
vm.eval('X10 = X^10;');
vm.eval('X11 = X^11;');
vm.eval('Y2 = Y^2;');
vm.eval('Y3 = Y^3;');
vm.eval('Y4 = Y^4;');
vm.eval('Y5 = Y^5;');
vm.eval('Y6 = Y^6;');
vm.eval('Y7 = Y^7;');
vm.eval('Y8 = Y^8;');
vm.eval('Y9 = Y^9;');
vm.eval('Y10 = Y^10;');
vm.eval('Y11 = Y^11;');
vm.eval('Z2 = Z^2;');
vm.eval('Z3 = Z^3;');
vm.eval('Z4 = Z^4;');
vm.eval('Z5 = Z^5;');
vm.eval('Z6 = Z^6;');
vm.eval('Z7 = Z^7;');
vm.eval('Z8 = Z^8;');
vm.eval('Z9 = Z^9;');
vm.eval('Z10 = Z^10;');
vm.eval('Z11 = Z^11;');
vm.eval('rx2 = rx^2;');
vm.eval('rx3 = rx^3;');
vm.eval('ry2 = ry^2;');
vm.eval('ry3 = ry^3;');
vm.eval('rz2 = rz^2;');
vm.eval('rz3 = rz^3;');
vm.eval('R = rx X');
vm.eval('L = rx3 X');
vm.eval('U = rz Z');
vm.eval('D = rz3 Z');
vm.eval('F = ry3 Y');
vm.eval('B = ry Y');

if (require.main === module) {
  rl.setPrompt('> ');
  rl.on('line', (line: string) => {
    vm.eval(line);
    rl.prompt(true);
  });
  rl.on('close', () => process.exit(0));
  rl.prompt(true);
}

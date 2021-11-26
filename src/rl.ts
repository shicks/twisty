import * as readline from 'readline';

const rl = readline.createInterface(process.stdin, process.stdout, undefined, true);

// Mode 1: able to edit entire history...

rl.setPrompt('> ');

let popHistory = false;
rl.on('line', (line: string) => {
  if (!line.trim().endsWith(';')) {
    (rl as any).line = line + '\n';
    (rl as any).cursor = line.length + 1;
    readline.moveCursor(process.stdout, 0, -line.split('').filter(x=>x=='\n').length - 1);
    popHistory = true;
    rl.setPrompt('');
  } else {
    console.log(`GOT A LINE: <<<\n${line}\n>>>`);
    popHistory = false;
    rl.setPrompt('> ');
  }
  rl.prompt(true);
});
rl.on('close', () => process.exit(0));
rl.on('history', (history) => {
  if (popHistory) history.pop();
});
rl.prompt(true);


// This works pretty well - just need a way to determine if an input is
// complete (or will never complete).


// Mode 2: just print a ".." prompt below, and remember to consolidate
// all the history lines when it finally completes.
//   - could temporarily delete history for later lines...?ghire


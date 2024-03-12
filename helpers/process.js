export const waitForAnyKeyPressed = (msg = 'Press any key to EXIT') => {
  console.log(`\n${msg}`);
  process.stdin.on('data', () => process.exit(0));
};

export const performance = {
  now(start) {
    if (!start) return process.hrtime();
    var eta = process.hrtime(start);
    return Math.round(eta[0] * 1000 + eta[1] / 1000000);
  },
};

export const print = s => {
  return process.stdout.write(s);
};

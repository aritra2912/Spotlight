const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'test-dist');

console.log('Compiling tests...');
try {
  // Execute TypeScript compiler with specified options to build CommonJS files in test-dist/
  const tscCommand = `node node_modules/typescript/lib/tsc.js src/lib/testSetup.ts src/lib/mockDb.ts src/lib/mockDb.test.ts --outDir test-dist --module commonjs --target es2020 --esModuleInterop --moduleResolution node --noEmit false --skipLibCheck`;
  execSync(tscCommand, { cwd: rootDir, stdio: 'inherit' });
  console.log('Compilation succeeded.\n');
} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}

console.log('Running tests...');
try {
  const testScript = path.join(outDir, 'mockDb.test.js');
  execSync(`node "${testScript}"`, { cwd: rootDir, stdio: 'inherit' });
  console.log('\nTest execution completed successfully.');
} catch (error) {
  console.error('\nTest execution failed.');
  process.exit(1);
} finally {
  // Clean up compiled files
  try {
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  } catch (cleanupError) {
    console.error('Failed to clean up test-dist folder:', cleanupError.message);
  }
}

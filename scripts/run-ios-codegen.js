/**
 * Run React Native codegen before xcodebuild so ReactCodegen compile
 * does not race ahead of "[CP-User] Generate Specs" (missing .cpp errors).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const iosDir = path.join(root, 'ios');
const outputDir = path.join(iosDir, 'build/generated/ios');

function findReactNativeDir() {
  const direct = path.join(root, 'node_modules/react-native');
  if (fs.existsSync(direct)) return direct;

  const pnpmRoot = path.join(root, 'node_modules/.pnpm');
  if (!fs.existsSync(pnpmRoot)) return direct;

  for (const entry of fs.readdirSync(pnpmRoot)) {
    if (!entry.startsWith('react-native@')) continue;
    const candidate = path.join(pnpmRoot, entry, 'node_modules/react-native');
    if (fs.existsSync(candidate)) return candidate;
  }
  return direct;
}

const rnDir = findReactNativeDir();
const codegenScript = path.join(rnDir, 'scripts/generate-codegen-artifacts.js');

if (!fs.existsSync(codegenScript)) {
  console.error('react-native codegen script not found:', codegenScript);
  process.exit(1);
}

console.log('Running iOS codegen…');
execSync(
  `node "${codegenScript}" --path "${root}" --targetPlatform ios --outputPath "${iosDir}"`,
  { cwd: root, stdio: 'inherit' }
);

const required = [
  'safeareacontextJSI-generated.cpp',
  'rnworkletsJSI-generated.cpp',
  path.join('safeareacontext', 'safeareacontext-generated.mm'),
];

for (const rel of required) {
  const file = path.join(outputDir, rel);
  if (!fs.existsSync(file)) {
    console.error('Codegen missing expected file:', file);
    process.exit(1);
  }
}

console.log('iOS codegen OK');

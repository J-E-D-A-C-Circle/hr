const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// Step 1: Rename Directories
const dirsToRename = [
  { old: path.join(rootDir, 'app', 'hr-letters'), new: path.join(rootDir, 'app', 'hrletters') },
  { old: path.join(rootDir, 'app', 'api', 'hr-letters'), new: path.join(rootDir, 'app', 'api', 'hrletters') },
  { old: path.join(rootDir, 'components', 'hr-letters'), new: path.join(rootDir, 'components', 'hrletters') }
];

dirsToRename.forEach(item => {
  if (fs.existsSync(item.old)) {
    console.log(`Renaming directory: ${item.old} -> ${item.new}`);
    if (fs.existsSync(item.new)) {
      fs.rmSync(item.new, { recursive: true, force: true });
    }
    fs.renameSync(item.old, item.new);
  }
});

// Step 2: Replace text content in files across app, components, lib, middleware.ts, etc.
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file === '.next' || file === '.git') return;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getFiles(filePath, fileList);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.json')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const filesToScan = [
  path.join(rootDir, 'middleware.ts'),
  ...getFiles(path.join(rootDir, 'app')),
  ...getFiles(path.join(rootDir, 'components')),
  ...getFiles(path.join(rootDir, 'lib')),
  ...getFiles(path.join(rootDir, 'scripts'))
];

let filesModified = 0;

filesToScan.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace occurrences of hr-letters with hrletters
  content = content.replace(/\/hrletters/g, '/hrletters');
  content = content.replace(/\/api\/hrletters/g, '/api/hrletters');
  content = content.replace(/@\/components\/hrletters/g, '@/components/hrletters');
  content = content.replace(/hrletters/g, 'hrletters');
  content = content.replace(/HRLETTERS_SESSION_COOKIE/g, 'HRLETTERS_SESSION_COOKIE');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesModified++;
    console.log(`Updated: ${path.relative(rootDir, filePath)}`);
  }
});

console.log(`Migration completed successfully! ${filesModified} files updated.`);

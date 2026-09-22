const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file === '.next' || file === '.git') return;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getFiles(filePath, fileList);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const hrFiles = [
  ...getFiles(path.join(rootDir, 'app', 'hrletters')),
  ...getFiles(path.join(rootDir, 'components', 'hrletters'))
];

let filesModified = 0;

hrFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace indigo with emerald / green
  content = content.replace(/indigo/g, 'emerald');
  content = content.replace(/violet/g, 'teal');
  content = content.replace(/purple/g, 'green');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesModified++;
    console.log(`Updated HR colors to green: ${path.relative(rootDir, filePath)}`);
  }
});

console.log(`Updated ${filesModified} files to use Green (Emerald/Teal) colors for HR Letters!`);

/* eslint-disable */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../frontend');
const destDir = path.resolve(__dirname, '../public');

function run(cmd, cwd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd });
}

function copyDir(src, dest) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest, { recursive: true });
  if (fs.cpSync) {
    fs.cpSync(src, dest, { recursive: true });
  } else {
    run(`cp -r "${src}"/* "${dest}/"`, process.cwd());
  }
}

console.log('Building frontend...');
run('npm ci || npm install', frontendDir);
run('npm run build', frontendDir);

console.log('Copying dist to backend/public...');
copyDir(path.join(frontendDir, 'dist'), destDir);

console.log('Done.');


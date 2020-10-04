#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs  = require('fs');
const path = require('path');
const pm2 = require('pm2');
const currentWorkDir = process.cwd();
const distDir = path.join(currentWorkDir,'dist');

async function getPageContent(pageUrl) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:8081/${pageUrl}`);
  const content = await page.content();
  await browser.close();
  return content;
}

function processFiles(files) {
  files.forEach(async file => {
    const extname = path.extname(file);
    if (extname === '.html') {
      const pageContent = await getPageContent(file);
      console.log(file);
      console.log('---------------');
      fs.writeFileSync(path.join(distDir, file), pageContent);
      console.log(`${file} saved`);
    }
  });
}

console.log(`procesando path ${currentWorkDir}...`);
pm2.start({
  script: 'npm -- run startToBuild',
  autorestart : false 
}, (err, apps) => {
  pm2.disconnect();
  if (err) { throw err }
})
setTimeout(() => {
  console.log('Arrancado servidor...');
  if (fs.existsSync(distDir)){
    fs.rmdir(dir, { recursive: true }, (err) => {
    if (err) { throw err; }
    console.log(`${dir} is deleted!`);
    });
  }
  fs.mkdirSync(distDir);
  fs.readdir(currentWorkDir, (err, files) => {
    if (err) {
      throw err;
    }
    processFiles(files);  
  });
}, 1000);
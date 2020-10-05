const puppeteer = require('puppeteer');
const fs  = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
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


exports.init = async function () {
  console.log('Arrancando servidor...');
  await exec('npm -- run startToBuild');
  console.log('Servidor arrancado...');
  if (fs.existsSync(distDir)){
    fs.rmdirSync(distDir, { recursive: true });
    console.log(`${distDir} is deleted!`);
  }
  console.log(`Procesando path ${currentWorkDir}...`);
  fs.mkdirSync(distDir);
  fs.readdir(currentWorkDir, (err, files) => {
    if (err) {
      throw err;
    }
    processFiles(files);  
  });
}
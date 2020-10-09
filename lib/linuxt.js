const puppeteer = require('puppeteer');
const fs  = require('fs');
const path = require('path');
const yargs = require('yargs');

const currentWorkDir = process.cwd();
const distDir = path.join(currentWorkDir, '..', 'dist');

function processArgs() {
  const params = {};
  const argv = yargs  
  .command('port', 'localhost port when dev server is running', {
      port: {
          description: 'localhost port dev server',
          alias: 'p',
          type: 'number',
      }
  })
  .help()
  .alias('help', 'h')
  .argv;

  params.port = argv.port || argv.p || 8081;
  
  return params;
}

async function getPageContent({pageUrl = 'index.html', port = 8081} = {}) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/${pageUrl}`);
  const content = await page.content();
  await browser.close();
  return content;
}

function processFiles(files) {
  return new Promise(resolve => {
    files.forEach(async file => {
      const extname = path.extname(file);
      if (extname === '.html') {
        const pageContent = await getPageContent(file);
        console.log(file);
        fs.writeFileSync(path.join(distDir, file), pageContent);
        console.log(`------------- saved`);
      }
    });
    resolve();
  });
}

async function processPath() {
  console.log('Servidor arrancado...');
  if (fs.existsSync(distDir)){
    fs.rmdirSync(distDir, { recursive: true });
    console.log(`${distDir} is deleted!`);
  }
  console.log(`Procesando path ${currentWorkDir}...`);
  fs.mkdirSync(distDir);
  const files = fs.readdirSync(currentWorkDir, {encoding:'utf8'})
  await processFiles(files);  
}

exports.init = async function () {
  const { port } = processArgs();
  console.log(`working in ${currentWorkDir} ${port}`);
  processPath(port);
}
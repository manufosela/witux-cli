const puppeteer = require('puppeteer');
const fs  = require('fs');
const path = require('path');
const argv = require('yargs').argv;

const currentWorkDir = process.cwd();

let port;
let workdir;
let distdir;

function processArgs() {
  port = argv.port || argv.p || 8081;
  workdir = argv.workdir || argv.d || currentWorkDir;
  distdir = path.join(workdir, '..', 'dist');
}

function createServer() {
  const { createConfig, createServer } = require('es-dev-server');
  const config = createConfig({'port':port, 'app-index': 'index.html', 'nodeResolve': true, 'rootDir': workdir});
  const { server } = createServer(config);
  server.listen(port);
  console.log('Servidor arrancado...');
}

async function getPageContent(file) {
  return new Promise(async resolve => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/${file}`);
    const pageContent = await page.content();
    await browser.close();
    fs.writeFileSync(path.join(distdir, file), pageContent);
    resolve();
  });
}

function processFiles(files) {
  return new Promise(async resolve => {
    for (const file of files) {
      const extname = path.extname(file);
      if (extname === '.html') {
        console.log(`Procesando ${file}...`);
        await getPageContent(file);
        console.log(`------------- ${file} saved into ${distdir}`);
      }
    };
    resolve();
  });
}

function processPath() {
  return new Promise(async resolve => {
    if (fs.existsSync(distdir)){
      fs.rmdirSync(distdir, { recursive: true });
      console.log(`${distdir} is deleted!`);
    }
    console.log(`Procesando path ${workdir}...`);
    fs.mkdirSync(distdir);
    console.log(`Creado ${distdir}...`);
    const files = fs.readdirSync(workdir, {encoding:'utf8'});
    await processFiles(files);
    resolve();
  });
} 

exports.init = async function () {
  processArgs();
  createServer();
  await processPath();
  process.exit();
}
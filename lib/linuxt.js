const puppeteer = require('puppeteer');
const fs  = require('fs');
const path = require('path');
const shell = require('shelljs');
const argv = require('yargs').argv;

const currentWorkDir = process.cwd();

let command;
let pageName;
let port;
let workdir;
let distdir;
let wcName;
let WcName;
let wc_Name;
let siteName;

const fn = { 'create-page': createPage, 'build': build, 'create-wc': createWc, 'scafolding': createScafolding };

function how2use() {
  console.log('USE: linuxt [command] [options]\n');
  console.log('Commands:');
  console.log('\n\t- build: to build all pages');
  console.log('\n\t- create-page: to generate all files related with a new page');
  console.log('\n\t- create-wc: to generate all files related with a new web component');
  console.log('\n\t- scafolding: to generate all initial files to create a liNuxt static site');
}

function showErrorMsg(errorMsg) {
  console.error(`\nERROR - ${errorMsg}\n\n`);
  process.exit();
}

function processArgs() {
  if (argv.help || argv.h) {
    how2use();
    process.exit();
  }
  
  command = argv._[0];
  if (command === 'create-page') {
    if (argv._.length > 1) {
      pageName = argv._[1];
    } else {
      showErrorMsg();
      console.error('ERROR - command "create-page" must be a second parameter with page name');
      process.exit();
    }
  } else if (command === 'create-wc') {
    if (argv._.length > 1) {
      wcName = argv._[1];
      if (!wcName.match(/-/)) {
        showErrorMsg('command "create-component" must be a second parameter with a valid web-component name');
      } 
    } else {
      showErrorMsg('command "create-component" must be a second parameter with web-component name');
    }
  } else if(command === 'scafolding') {
    if (argv._.length > 1) {
      siteName = argv._[1];
    } else {
      showErrorMsg('command "scafolding" must be a second parameter with site name');
    }
    multilang = argv.multilang || argv.l || false;
  } else if (command === 'build') {
    port = argv.port || argv.p || 8081;
    workdir = argv.workdir || argv.d || currentWorkDir;
    distdir = path.join(workdir, '..', 'dist');
  } else {
    how2use();
    process.exit();
  }
}

/*************************/

function createServer() {
  const { createConfig, createServer } = require('es-dev-server');
  const config = createConfig({'port':port, 'app-index': 'index.html', 'nodeResolve': true, 'rootDir': workdir});
  const { server } = createServer(config);
  server.listen(port);
  console.log('Servidor arrancado...');
}

async function getPageContent(file) {
  return new Promise(async resolve => {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
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

async function build() {
  createServer();
  await processPath();
  process.exit();
}

function createDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

/*************************/

function createPage(){
  const directories = [
    path.join(currentWorkDir,'css'),
    path.join(currentWorkDir,'js'),
    path.join(currentWorkDir,'json'),
    path.join(currentWorkDir,'js', 'pages'),
    path.join(currentWorkDir,'js', 'tpl')
  ];
  for (const dir of directories) {
    createDir(dir);
  }

  const origin = path.join(__dirname, '..', '_base');
  const filesToProcess = [
    { 'filename': '_base.html', 'path': '.', 'output': pageName + '.html'  },
    { 'filename': '_base.js', 'path': 'js', 'output': pageName + '.js' },
    { 'filename': '_base.html.mjs', 'path': path.join('js', 'pages'), 'output': pageName + '.html.mjs' },
    { 'filename': '_base.tpl.js', 'path': path.join('js', 'tpl'), 'output': pageName + '.tpl.js' },
    { 'filename': '_base.css', 'path': 'css', 'output': pageName + '.css' },
    { 'filename': '_base.json.js', 'path': 'json', 'output': pageName + '.json.js' },
    { 'filename': 'common.html.mjs', 'path': path.join(__dirname,'..','_base','js', 'pages'), 'output': path.join(currentWorkDir, 'js', 'pages', 'common.html.mjs') },
    { 'filename': '_base.json.js', 'path': path.join(__dirname,'..','_base','json'), 'output': path.join(currentWorkDir, 'json', pageName + '.json.js') }
  ];
  for (const file of filesToProcess) {
    fs.copyFileSync(path.join(origin, file.path, file.filename), path.join(currentWorkDir, file.path, file.output));
    const pathFileName = path.join(currentWorkDir, file.path, file.output);
    let content = fs.readFileSync(pathFileName, 'utf8');
    content = content.replace(/_base/gm, pageName);
    fs.writeFileSync(pathFileName, content);
  }
  content = fs.readFileSync(path.join(currentWorkDir, 'json', pageName + '.json.js'), 'utf8');
  content = content.replace(/_base/gm, pageName);
  fs.writeFileSync(path.join(currentWorkDir, 'json', pageName + '.json.js'), content);

  process.exit();
}

/*************************/

function createWc() {
  const componentsDir = path.join(currentWorkDir, 'components');
  const wcDir = path.join(componentsDir, wcName);
  shell.cd(componentsDir);
  shell.mkdir(wcDir);
  const directories = [
    path.join(wcDir,'demo'),
    path.join(wcDir,'src'),
    path.join(wcDir,'test'),
  ];
  for (const dir of directories) {
    createDir(dir);
  }

  WcName = wcName
          .split("-")
          .map(part => {
            return part.charAt(0).toUpperCase() + part.slice(1);
          })
          .join("");

  const wcNameParts = wcName.split("-");
  const wcNamePartsChars = [...wcNameParts[1]];
  wcNamePartsChars[0] = wcNamePartsChars[0].toUpperCase();
  wc_Name = wcNameParts[0] + wcNamePartsChars.join('');
  

  const originWc = path.join(__dirname, '..', '_wc-base');
  const filesToProcess = [
    { 'filename': 'wc-name.js', 'path': '.', 'output': wcName + '.js'  },
    { 'filename': 'wc-name.test.js', 'path': 'test', 'output': wcName + '.test.js' },
    { 'filename': 'WcName.js', 'path': 'src', 'output': WcName + '.js' },
    { 'filename': 'wc-name-style.js', 'path': 'src', 'output': wcName + '-style.js' },
    { 'filename': 'babel.config.js','path': '.', 'output': 'babel.config.js'},
    { 'filename': 'gitignorefile','path': '.', 'output': '.gitignore'},
    { 'filename': 'index.html','path': '.', 'output': 'index.html'},
    { 'filename': 'LICENSE','path': '.', 'output': 'LICENSE'},
    { 'filename': 'package.json','path': '.', 'output': 'package.json'},
    { 'filename': 'README.md','path': '.', 'output': 'README.md'},
    { 'filename': 'rollup.config.js', 'path': '.', 'output': 'rollup.config.js' }
  ];    
  for (const file of filesToProcess) {
    fs.copyFileSync(path.join(originWc, file.path, file.filename), path.join(wcDir, file.path, file.output));
    const pathFileName = path.join(wcDir, file.path, file.output);
    let content = fs.readFileSync(pathFileName, 'utf8');
    content = content.replace(/wc-name/gm, wcName);
    content = content.replace(/WcName/gm, WcName);
    content = content.replace(/wcName/gm, wc_Name);
    fs.writeFileSync(pathFileName, content);
  }

  process.exit();
}

/*************************/

function createScafolding() {
  const siteDir = path.join(currentWorkDir, siteName);
  shell.cd(currentWorkDir);
  shell.mkdir(siteDir);
  const directories = [
    path.join(siteDir, 'resources'),
    path.join(siteDir, 'src'),
    path.join(siteDir, 'src', 'assets'),
    path.join(siteDir, 'src', 'assets', 'fonts'),
    path.join(siteDir, 'src', 'assets', 'images'),
    path.join(siteDir, 'src', 'components'),
    path.join(siteDir, 'src', 'css'),
    path.join(siteDir, 'src', 'js'),
    path.join(siteDir, 'src', 'js', 'lib'),
    path.join(siteDir, 'src', 'js', 'pages'),
    path.join(siteDir, 'src', 'js', 'tpl'),
    path.join(siteDir, 'src', 'json')
  ];
  for (const dir of directories) {
    createDir(dir);
  }

  const filesToProcess = [
    { 'filename': '.eslintignore', 'path': 'src', 'output': '.eslintignore'  },
    { 'filename': '.eslintrc.json', 'path': 'src', 'output': '.eslintrc.json'  },
    { 'filename': '.gitignore','path': '.', 'output': '.gitignore'},
    { 'filename': 'README.md','path': '.', 'output': 'README.md'},
    { 'filename': 'package.json','path': 'src', 'output': 'package.json'},
    { 'filename': 'rollup.config.js', 'path': 'src', 'output': 'rollup.config.js' }
  ];    
  for (const file of filesToProcess) {
    fs.copyFileSync(path.join(siteDir, file.path, file.filename), path.join(siteDir, file.path, file.output));
  }
}

/*************************/
/*************************/
/*************************/

exports.init = function () {
  processArgs();
  fn[command]();  
}
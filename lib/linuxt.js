const puppeteer = require('puppeteer');
const fs  = require('fs');
const path = require('path');
const shell = require('shelljs');
const argv = require('yargs').argv;
const readline = require("readline");
const { resolve } = require('path');

let currentWorkDir = process.cwd();

let command;
let pageName;
let port;
let workdir;
let distdir;
let wcName;
let WcName;
let wc_Name;
let siteName;
let languages = '';
let yes = false;

const fn = { 'create-page': createPage, 'build': build, 'build-page': buildPage, 'create-wc': createWc, 'scafolding': createScafolding };

/** COMMON **************************/

function answerThisQuestion(question) {
  return new Promise( resolve => {
    let response = '';
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(question, function(resp) {
      response = resp;
      rl.close();
    });

    rl.on("close", function() {
      resolve(response);
    });
  });
}

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
  languages = argv.languages || '';  // es,en
  yes = argv.yes || argv.y || false;
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
  } else if (command === 'build-page') {
    if (argv._.length > 1) {
      pageName = argv._[1];
      port = argv.port || argv.p || 8081;
      workdir = argv.workdir || argv.d || currentWorkDir;
      distdir = path.join(workdir, '..', 'dist');
    } else {
      showErrorMsg();
      console.error('ERROR - command "build-page" must be a second parameter with page name');
      process.exit();
    }
  } else if (command === 'build') {
    port = argv.port || argv.p || 8081;
    workdir = argv.workdir || argv.d || currentWorkDir;

    distdir = path.join(workdir, '..', 'dist');
  } else {
    how2use();
    process.exit();
  }
}

function createServer() {
  const { createConfig, createServer } = require('es-dev-server');
  const config = createConfig({'port':port, 'app-index': 'index.html', 'nodeResolve': true, 'rootDir': workdir});
  const { server } = createServer(config);
  server.listen(port);
  console.log('Servidor arrancado...');
}

function createDir(dir) {
  if (!fs.existsSync(dir)) {
    console.log('create dir ', dir);
    fs.mkdirSync(dir);
  }
}

/****** COMMAND BUILD-PAGE ********/

function getPageContent(file, distPath = '') {
  console.log(`Procesando ${file}...`);
  return new Promise(async resolve => {
    const fixedDistPath = (distPath !== '') ? distPath + '/' : '';
    const browser = await puppeteer.launch({headless:true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/${fixedDistPath}${file}`);
    const pageContent = await page.content();
    await browser.close();
    fs.writeFileSync(path.join(distdir, distPath, file), pageContent);
    console.log(`------------- ${file} saved into ${path.join(distdir, distPath)}`);
    resolve();
  });
}

function processPage(file = pageName) {
  return new Promise(async resolve => {
    if (languages !== '') {
      const langArr = languages.split(',');
      langArr.forEach(async lang => {
        await getPageContent(file, lang);
      }); 
    } else if (path.extname(file) === '.html') {
      await getPageContent(file);
    }
    resolve();
  });
}

async function buildPage() {
  createServer();
  await processPage();
  process.exit();
}

/**** COMMAND BUILD *********************/

function processFiles(files, distPath = distdir, dir = '') {
  return new Promise(async resolve => {
    const notProcessPaths = ['assets', 'components', 'css', 'js', 'json', 'node_modules'];
    const filePromises = [];
    const fileList = [];
    for (const file of files) {
      if (fs.lstatSync(path.join(distPath, dir, file)).isDirectory()) {
        if (!notProcessPaths.includes(file)) {
          await processPath(path.join(workdir, file), file);
        }
      } else if (path.extname(fileName) === '.html') {
        fileList.push(file);
        filePromises.push(processPage(file, dir));
      }
    };

    Promise.all(filePromises).then(()=>{
      console.log('Procesados ' + fileList.join(', '));
      resolve();
    });
  });
}

function prepareDist() {
  return new Promise(async resolve => {
    if (fs.existsSync(distdir)){
      fs.rmdirSync(distdir, { recursive: true });
      console.log(`${distdir} is deleted!`);
    }
    fs.mkdirSync(distdir);
    console.log(`Creado ${distdir}...`);
    resolve();
  });
}

function processPath(dir = workdir, complementPath = '') {
  const distPath = path.join(distdir, complementPath);
  return new Promise(async resolve => {
    const files = fs.readdirSync(dir, {encoding:'utf8'});
    await processFiles(files, distPath, complementPath);
    resolve();
  });
} 

async function build() {
  createServer();
  await prepareDist();
  await processPath();
  process.exit();
}

/*****COMMAND CREATE-PAGE ********************/

function _getAlternates(langArr, lang, pageName) {
  const alternate = langArr.reduce((result, language) => {
    if (language !== lang) {
      result.push(`<link rel="alternate" hreflang="${language}" href="/${language}/${pageName}.html" />`);
    }
    return result;
  }, []);
  return alternate.join('\n');
}

function createPage(pageDir = currentWorkDir){
  const pageNameWithoutExtension = (path.extname(fileName) === '.html') ? `${pageName.replace('.html', '')}` : pageName;
  const directories = [
    path.join(pageDir,'css'),
    path.join(pageDir,'js'),
    path.join(pageDir,'json'),
    path.join(pageDir,'js', 'pages'),
    path.join(pageDir,'js', 'tpl')
  ];
  console.log(`Creando página "${pageNameWithoutExtension}"`);
  if (languages !== '') {
    const langArr = languages.split(',');
    langArr.forEach(lang => {
      directories.push(path.join(pageDir, lang));
    }); 
  }
  for (const dir of directories) {
    createDir(dir);
  }

  const origin = path.join(__dirname, '..', '_base');
  const filesToProcess = [
    { 'filename': '_base.js', 'path': 'js', 'output': pageNameWithoutExtension + '.js' },
    { 'filename': '_base.html.mjs', 'path': path.join('js', 'pages'), 'output': pageNameWithoutExtension + '.html.mjs' },
    { 'filename': '_base.tpl.js', 'path': path.join('js', 'tpl'), 'output': pageNameWithoutExtension + '.tpl.js' },
    { 'filename': '_base.css', 'path': 'css', 'output': pageNameWithoutExtension + '.css' },
    { 'filename': '_base.json.js', 'path': 'json', 'output': pageNameWithoutExtension + '.json.js' }
  ];
  if (languages !== '') {
    const langArr = languages.split(',');
    langArr.forEach(lang => {
      fs.copyFileSync(path.join(origin, '_base.html'), path.join(pageDir, lang, pageNameWithoutExtension + '.html'));
      const pathFileName = path.join(pageDir, lang, pageNameWithoutExtension + '.html');
      let content = fs.readFileSync(pathFileName, 'utf8');
      content = content.replace(/_base/gm, pageNameWithoutExtension);
      content = content.replace(/lang="es"/, `lang="${lang}"`);
      content = content.replace(/<!-- __ALTERNATES__ -->/, _getAlternates(langArr, lang, pageNameWithoutExtension));
      fs.writeFileSync(pathFileName, content);
    });
    if (pageNameWithoutExtension === 'index') {
      filesToProcess.push({ 'filename': '_base.html', 'path': '.', 'output': pageNameWithoutExtension + '.html'  });
    }
  } else {
    filesToProcess.push({ 'filename': '_base.html', 'path': '.', 'output': pageNameWithoutExtension + '.html'  });
  }
  for (const file of filesToProcess) {
    fs.copyFileSync(path.join(origin, file.path, file.filename), path.join(pageDir, file.path, file.output));
    const pathFileName = path.join(pageDir, file.path, file.output);
    let content = fs.readFileSync(pathFileName, 'utf8');
    content = content.replace(/_base/gm, pageNameWithoutExtension);
    fs.writeFileSync(pathFileName, content);
  }

  content = fs.readFileSync(path.join(pageDir, 'json', pageNameWithoutExtension + '.json.js'), 'utf8');
  content = content.replace(/_base/gm, pageNameWithoutExtension);
  fs.writeFileSync(path.join(pageDir, 'json', pageNameWithoutExtension + '.json.js'), content);
}

/***** COMMAND CREATE-WC ********************/

function createWc(componentDir = currentWorkDir) {
  const componentsDir = path.join(componentDir, 'components');
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
}

/*** COMMAND SCAFOLDING **********************/

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
  if (languages !== '') {
    const langArr = languages.split(',');
    langArr.forEach(lang => {
      directories.push(path.join(siteDir, 'src', lang));
    }); 
  }

  for (const dir of directories) {
    createDir(dir);
  }

  const filesToProcess = [
    { 'filename': '.eslintignore', 'path': 'src', 'output': '.eslintignore'  },
    { 'filename': '.eslintrc.json', 'path': 'src', 'output': '.eslintrc.json'  },
    { 'filename': '.gitignore','path': '.', 'output': '.gitignore'},
    { 'filename': 'README.md','path': '.', 'output': 'README.md'},
    { 'filename': 'package.json','path': 'src', 'output': 'package.json'},
    { 'filename': 'rollup.config.js', 'path': 'src', 'output': 'rollup.config.js' },
    { 'filename': 'common.html.mjs', 'path': path.join('src', 'js', 'pages'), 'output': 'common.html.mjs' },
    { 'filename': 'main.css', 'path': path.join('src', 'css'), 'output': 'main.css' },
    { 'filename': 'language.js', 'path': path.join('src', 'js', 'lib'), 'output': 'language.js' },
    { 'filename': 'common.js', 'path': path.join('src', 'js', 'lib'), 'output': 'common.js' },
    { 'filename': 'linuxt.png', 'path': path.join('src', 'assets', 'images'), 'output': 'linuxt.png' },
    { 'filename': 'favicon.png', 'path': '.', 'output': 'favicon.png' }
  ];    
  for (const file of filesToProcess) {
    fs.copyFileSync(path.join(__dirname, '..', '_site-base', file.filename), path.join(siteDir, file.path, file.output));
  }
  let content = fs.readFileSync(path.join(siteDir, path.join('src', 'js', 'pages'), 'common.html.mjs'), 'utf8');
  content = content.replace(/_base/gm, 'siteName');
  fs.writeFileSync(path.join(siteDir, path.join('src', 'js', 'pages'), 'common.html.mjs'), content);


  pageName = 'index';
  createPage(path.join(siteDir, 'src'));
  wcName = 'mi-componente1';
  createWc(path.join(siteDir, 'src'));
}

/*************************/
/*************************/
/*************************/

exports.init = async function () {
  processArgs();
  const question = `The "${command}" command will be executed in the "${workdir}" directory. Do you want to proceed? (Y/N)`;
  if (!yes) {
    const response = await answerThisQuestion(question);
    if (response.toUpperCase() === 'Y' || response.toUpperCase() === 'YES') {
      fn[command]();  
    }
  } else {
    fn[command]();
  }
}
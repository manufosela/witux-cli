const puppeteer = require('puppeteer');
const fs  = require('fs');
const path = require('path');
const shell = require('shelljs');
const { argv } = require('yargs');
const readline = require("readline");
const events = require('events');
const { spawnSync } = require("child_process");
const { resolve } = require('path');

const currentWorkDir = process.cwd();

events.EventEmitter.defaultMaxListeners = 100;

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
const FilesLIST = [];

const fn = { 'create-page': createPage, 'build': build, 'build-page': buildPage, 'create-wc': createWc, 'scafolding': createScafolding, 'pwa': pwa };

/** COMMON */

/**
 * @param question
 */
function answerThisQuestion(question) {
  return new Promise( resolve => {
    let response = '';
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(question, (resp) => {
      response = resp;
      rl.close();
    });

    rl.on("close", () => {
      resolve(response);
    });
  });
}

/**
 *
 */
function how2use() {
  console.log('USE: linuxt [command] [options]\n');
  console.log('Commands:');
  console.log('\n\t- build: to build all pages');
  console.log('\n\t- create-page: to generate all files related with a new page');
  console.log('\n\t- create-wc: to generate all files related with a new web component');
  console.log('\n\t- scafolding: to generate all initial files to create a liNuxt static site');
  console.log('\n\t- pwa: to generate sw.js ans insert into index.html')
}

/**
 * @param errorMsg
 */
function showErrorMsg(errorMsg) {
  console.error(`\nERROR - ${errorMsg}\n\n`);
  process.exit();
}

/**
 *
 */
function processArgs() {
  if (argv.help || argv.h) {
    how2use();
    process.exit();
  }

  command = argv._[0];
  languages = argv.languages || '';  // es,en
  yes = argv.yes || argv.y || false;
  if (command === 'create-page') {
    workdir = currentWorkDir;
    if (argv._.length > 1) {
      pageName = argv._[1];
    }
  } else if (command === 'create-wc') {
    workdir = path.join(currentWorkDir, 'components');
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
      workdir = path.join(currentWorkDir, siteName);
      const mapDir = new Map();
      mapDir.set(workdir, 1)
      createDir(mapDir);
    } else {
      const dirParts = currentWorkDir.split('/');
      siteName = dirParts.pop();
      workdir = path.join(currentWorkDir);
      // showErrorMsg('command "scafolding" must be a second parameter with site name');
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
  } else if (command === 'pwa') {
    workdir = currentWorkDir;
    distdir = path.join(workdir, '..', 'dist');
  } else {
    how2use();
    process.exit();
  }
}

/**
 *
 */
function startServer() {
  const { startDevServer } = require('@web/dev-server');
  const config = {
		port,
		appIndex: 'index.html',
		nodeResolve: true,
		rootDir: workdir
	};
	console.log('Servidor arrancado...');
  return startDevServer({config});
}

/**
 * @param dir
 */
function createDir(dir) {
  const [pathDir, level] = [...dir];
  const levelStr = `  ${  '|___'.padStart(level * 3 + 1, '   ')}`;
  const dirStr = pathDir.split('/').pop();
  if (!fs.existsSync(pathDir)) {
    console.log(`${levelStr}${dirStr}`);
    fs.mkdirSync(pathDir);
  }
}

/**
 *
 */
function getLanguagesDir() {
  const files = fs.readdirSync(workdir, {encoding:'utf8'});
  const notProcessPaths = ['assets', 'components', 'css', 'js', 'json', 'node_modules'];
  const langDir = [];
  files.forEach((file) => {
    if (fs.lstatSync(path.join(workdir, file)).isDirectory()) {
      if (!notProcessPaths.includes(file)) {
        langDir.push(file);
      }
    }
  });
  return langDir;
}

/** **** COMMAND BUILD-PAGE */

/**
 * @param file
 * @param distPath
 */
function getPageContent(file, distPath = '') {
  console.log(`Procesando ${file}...`);
  return new Promise(async (resolve, reject) => {
    const fixedDistPath = (distPath !== '') ? `${distPath  }/` : '';
    const url = `http://localhost:${port}/${fixedDistPath}${file}`;
    console.log(url);
    const browser = await puppeteer.launch({headless:true, args: ['--no-sandbox', '--disable-setuid-sandbox']}).catch((err)=> {
      console.log('error happen at launch the page: ', err);
      reject();
    });
    const page = await browser.newPage();
    page.on('error', err=> {
      console.log('error happen at the page: ', err);
      reject();
    });
    await page.goto(url);
    const pageContent = await page.content();
    await browser.close();
    fs.writeFileSync(path.join(distdir, distPath, file), pageContent);
    console.log(`------------- ${file} saved into ${path.join(distdir, distPath)}`);
    resolve();
  });
}

/**
 * @param file
 * @param dir
 */
async function processPage(file = pageName, dir) {
  if (path.extname(file) === '.html') {
    return new Promise(async resolve => {
      console.log('---->', file, dir);
      await getPageContent(file, dir);
      resolve();
    });
  }
}

/**
 *
 */
async function buildPage() {
  const server = await startServer();
  await processPage();
	await server.stop();
  process.exit();
}

/** ** COMMAND BUILD */

/**
 * @param files
 * @param distPath
 * @param dir
 */
function processFiles(files, distPath = distdir, dir = '') {
  return new Promise(async (resolve, reject) => {
    const notProcessPaths = ['assets', 'components', 'css', 'js', 'json', 'node_modules'];
    const filePromises = [];
    const fileList = [];
    for (const file of files) {
      console.log(file);
      if (fs.lstatSync(path.join(workdir, dir, file)).isDirectory()) {
        if (!notProcessPaths.includes(file)) {
          await processPath(path.join(workdir, file), file);
        }
      } else if (path.extname(file) === '.html') {
        fileList.push(file);
        FilesLIST.push(path.join(dir, file));
        filePromises.push(processPage(file, dir));
      }
    };
    console.log(filePromises);

    Promise.all(filePromises)
    .then(() => {
      console.log(`Procesados ${  fileList.join(', ')}`);
      resolve();
    }).catch((err) => {
      console.log(err);
      reject(err);
    });

  });
}

/**
 *
 */
function prepareDist() {
  return new Promise(async resolve => {
    if (fs.existsSync(distdir)) {
      fs.rmdirSync(distdir, { recursive: true });
      console.log(`${distdir} is deleted!`);
    }
    console.log(distdir);
    fs.mkdirSync(distdir);
    console.log(`Creado ${distdir}...`);

    const excludeDirs = ['node_modules', 'json', 'components'];
    const srcDirs = fs.readdirSync(workdir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    const distDirs = srcDirs.filter( dir => !excludeDirs.includes(dir));
    distDirs.forEach((dir) => {
      console.log(path.join(distdir, dir));
      fs.mkdirSync(path.join(distdir, dir));
    });
    resolve();
  });
}

/**
 * @param dir
 * @param complementPath
 */
function processPath(dir = workdir, complementPath = '') {
  const distPath = path.join(distdir, complementPath);
  return new Promise(async resolve => {
    const files = fs.readdirSync(dir, {encoding:'utf8'});
    await processFiles(files, distPath, complementPath);
    resolve();
  });
}

/**
 *
 */
async function build() {
  const server = await startServer();
  await prepareDist();
  await processPath();
	await server.stop();
  process.exit();
}

/** ***CREATE PWA */

/**
 *
 */
function getFilesToCache() {
  if (fs.existsSync(distdir)) {
    const distPath = path.join(distdir, 'es');
    const files = fs.readdirSync(distPath, {encoding:'utf8'});
    let filesStr = ["'index.html'"];
    const languagesArr = getLanguagesDir();
    languagesArr.forEach((lang) => {
      console.log(lang);
      const filesTmp = files.map((file) => `'/${lang}/${file}'`);
      filesStr = [...filesStr, ...filesTmp];
    });
    return filesStr;
  } 
  console.log('"dist" dir doesn\'t exists');
  process.exit();
  return false;
}

/**
 * @param swFileName
 */
function saveSwFile(swFileName) {
  const swCode = `
if (navigator.serviceWorker) {
  navigator.serviceWorker.register('${swFileName}').then((registration) => {
    console.log('ServiceWorker registration successful with scope:', registration.scope);
  }).catch((error) => {
    console.log('ServiceWorker registration failed:', error);
  });
}
  `;
  const commonJSFile = path.join(distdir,'js','index.js');
  let message = 'created sw.js';
  let result = true;
  return new Promise((resolve, reject) => {
    fs.access(commonJSFile, fs.F_OK, (err) => {
      if (err) {
        console.log(err);
        result = false;
        message = 'common.js doesn\'t exits';
      } else {
        const commonContent = fs.readFileSync(commonJSFile, 'utf8');
        const commonOutput = `
          ${commonContent}
          ${swCode}
        `;
        fs.writeFileSync(commonJSFile, commonOutput);
      }
      console.log(message);
      resolve(result);
    });
  });
}

/**
 *
 */
async function prepareServiceWorker() {
  // CREO LA LISTA DE FICHEROS .html A CACHEAR, BUSCANDO EN UNA CARPETA DE IDIOMAS
  const FilesLIST = getFilesToCache();

  // CALCULO NOMBRE DE sw.js EN BASE A DIA/HORA
  const date = new Date();
  const marcaDiaHora = `${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getHours()}${date.getMinutes()}`;
  const swFileName = `sw${marcaDiaHora}.js`;

  // INYECTO EL CODIGO QUE INSTANCIA EL sw EN common.js ANTES DE QUE SEA MINIFICADO
  const insertedCommon = await saveSwFile(swFileName);

  if (insertedCommon) {
    // COPIO EL FICHERO sw.js EN dist RENOMBRANDOLO A 'sw_DIA/HORA.js'
    const swContentBase = fs.readFileSync(path.join(__dirname, '..', '_base','sw.js'), 'utf-8');
    const swContent = swContentBase.replace('/**URLS_CACHED**/', FilesLIST.toString());
    fs.rm(path.join(distdir, 'js', 'sw*.js'));
    fs.writeFileSync(path.join(distdir, 'js', swFileName), swContent);
  }
}

/**
 *
 */
async function pwa() {
  await prepareServiceWorker();
  process.exit();
}

/** ***COMMAND CREATE-PAGE */

/**
 * @param langArr
 * @param lang
 * @param pageName
 */
function _getAlternates(langArr, lang, pageName) {
  const alternate = langArr.reduce((result, language) => {
    result.push(`<link rel="alternate" hreflang="${language}" href="/${language}/${pageName}.html" />`);
    return result;
  }, []);
  return alternate.join('\n');
}

/**
 * @param languages
 * @param origin
 * @param pageDir
 */
function createScafoldingLanguages(languages, origin, pageDir) {
  const pageNameWithoutExtension = (path.extname(pageName) === '.html') ? `${pageName.replace('.html', '')}` : pageName;
  const langArr = languages.split(',');
  langArr.forEach(lang => {
    fs.copyFileSync(path.join(origin, '_base.html'), path.join(pageDir, lang, `${pageNameWithoutExtension  }.html`));
    const pathFileName = path.join(pageDir, lang, `${pageNameWithoutExtension  }.html`);
    let content = fs.readFileSync(pathFileName, 'utf8');
    content = content.replace(/_base/gm, pageNameWithoutExtension);
    content = content.replace(/lang="es"/, `lang="${lang}"`);
    content = content.replace(/<!-- __ALTERNATES__ -->/, _getAlternates(langArr, lang, pageNameWithoutExtension));
    fs.writeFileSync(pathFileName, content);
  });
}

/**
 * @param pageDir
 */
async function createPage(pageDir = currentWorkDir){
  const questionPageName = `Enter page name: `;
  if (pageName === '') {
    const responsePageName = await answerThisQuestion(questionPageName);
    pageName = responsePageName;
    console.log('page name', responsePageName);
  }
  if (pageName === undefined) {
    showErrorMsg('ERROR - command "create-page" must be a second parameter with html page name');
  }
  
  const pageNameWithoutExtension = (path.extname(pageName) === '.html') ? `${pageName.replace('.html', '')}` : pageName;
  const directories = new Map();
  directories.set(path.join(pageDir,'css'), 1);
  directories.set(path.join(pageDir,'js'), 1);
  directories.set(path.join(pageDir,'js', 'pages'), 2);
  directories.set(path.join(pageDir,'js', 'tpl'), 2);
  directories.set(path.join(pageDir,'json'), 1);

  // languages = getLanguagesDir();
  if (languages !== '') {
    const langArr = languages.split(',');
    langArr.forEach(lang => {
      directories.set(path.join(pageDir, lang), 2);
    });
  }
  for (const dir of directories) {
    createDir(dir);
  }

  const origin = path.join(__dirname, '..', '_base');
  const filesToProcess = [
    { 'filename': '_base.js', 'path': 'js', 'output': `${pageNameWithoutExtension  }.js` },
    { 'filename': '_base.html.mjs', 'path': path.join('js', 'pages'), 'output': `${pageNameWithoutExtension  }.html.mjs` },
    { 'filename': '_base.css', 'path': 'css', 'output': `${pageNameWithoutExtension  }.css` },
    { 'filename': '_base.json.js', 'path': 'json', 'output': `${pageNameWithoutExtension  }.json.js` }
  ];
  if (languages !== '') {
    createScafoldingLanguages(languages, origin, pageDir);
    if (pageNameWithoutExtension === 'index') {
      filesToProcess.push({ 'filename': '_base.html', 'path': '.', 'output': `${pageNameWithoutExtension  }.html`  });
    }
  } else {
    filesToProcess.push({ 'filename': '_base.html', 'path': '.', 'output': `${pageNameWithoutExtension  }.html`  });
  }
  for (const file of filesToProcess) {
    fs.copyFileSync(path.join(origin, file.path, file.filename), path.join(pageDir, file.path, file.output));
    const pathFileName = path.join(pageDir, file.path, file.output);
    let content = fs.readFileSync(pathFileName, 'utf8');
    content = content.replace(/_base/gm, pageNameWithoutExtension);
    fs.writeFileSync(pathFileName, content);
  }

  content = fs.readFileSync(path.join(pageDir, 'json', `${pageNameWithoutExtension  }.json.js`), 'utf8');
  content = content.replace(/_base/gm, pageNameWithoutExtension);
  fs.writeFileSync(path.join(pageDir, 'json', `${pageNameWithoutExtension  }.json.js`), content);
  console.log(`\n\nPage "${pageDir}/${pageName}" and its js,css and json files related was created`);
}

/** *** COMMAND CREATE-WC */

/**
 * @param componentDir
 */
function createWc(componentDir = currentWorkDir) {
  const componentsDir = path.join(componentDir, 'components');
  const wcDir = path.join(componentsDir, wcName);
  shell.cd(componentsDir);
  shell.mkdir(wcDir);
  const directories = new Map();
  directories.set(path.join(wcDir,'demo'), 1);
  directories.set(path.join(wcDir,'src'), 1);
  directories.set(path.join(wcDir,'test'), 1);

  console.log('\n\nWeb-Component created');
  console.log(`\n${componentDir}/${wcName}`);
  for (const dir of directories) {
    createDir(dir);
  }

  WcName = wcName
          .split("-")
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join("");

  const wcNameParts = wcName.split("-");
  const wcNamePartsChars = [...wcNameParts[1]];
  wcNamePartsChars[0] = wcNamePartsChars[0].toUpperCase();
  wc_Name = wcNameParts[0] + wcNamePartsChars.join('');


  const originWc = path.join(__dirname, '..', '_wc-base');
  const filesToProcess = [
    { 'filename': '_gitignore','path': '.', 'output': '.gitignore'},
    { 'filename': 'wc-name.js', 'path': '.', 'output': `${wcName  }.js`  },
    { 'filename': 'wc-name.test.js', 'path': 'test', 'output': `${wcName  }.test.js` },
    { 'filename': 'WcName.js', 'path': 'src', 'output': `${WcName  }.js` },
    { 'filename': 'wc-name-style.js', 'path': 'src', 'output': `${wcName  }-style.js` },
    { 'filename': 'babel.config.js','path': '.', 'output': 'babel.config.js'},
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

/** * COMMAND SCAFOLDING */

/**
 * @param cmd
 * @param params
 */
async function executeCommand(cmd, params) {
  console.log(cmd, params);
  const child = spawnSync(cmd, [params], { cwd: process.cwd(), detached: true, stdio: 'inherit' });

  child.stdout.on("data", (data) => {
    console.log(`${data}`);
  });

  child.stderr.on("data", (data) => {
    console.log(`${data}`);
  });

  child.on('error', (error) => {
    console.log(`${error.message}`);
  });

  child.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

/**
 *
 */
async function createScafolding() {
  shell.cd(workdir);
  const directories = new Map();
  directories.set(path.join(workdir, 'resources'), 1);
  directories.set(path.join(workdir, 'src'), 1);
  directories.set(path.join(workdir, 'src', 'assets'), 2);
  directories.set(path.join(workdir, 'src', 'assets', 'fonts'), 3);
  directories.set(path.join(workdir, 'src', 'assets', 'images'), 3);
  directories.set(path.join(workdir, 'src', 'components'), 2);
  directories.set(path.join(workdir, 'src', 'css'), 2);
  directories.set(path.join(workdir, 'src', 'js'), 2);
  directories.set(path.join(workdir, 'src', 'js', 'lib'), 3);
  directories.set(path.join(workdir, 'src', 'js', 'pages'), 3);
  directories.set(path.join(workdir, 'src', 'js', 'tpl'), 3);
  directories.set(path.join(workdir, 'src', 'json'), 2);
  if (languages !== '') {
    const langArr = languages.split(',');
    langArr.forEach(lang => {
      directories.set(2, path.join(workdir, 'src', lang));
    });
  }
  console.log(`\n\nSite structure created for: ${siteName}`);
  for (const dir of directories) {
    createDir(dir);
  }

  const filesToProcess = [
    { 'filename': '_eslintignore', 'path': 'src', 'output': '.eslintignore'  },
    { 'filename': '_eslintrc.json', 'path': 'src', 'output': '.eslintrc.json'  },
    { 'filename': '_gitignore','path': '.', 'output': '.gitignore'},
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
    fs.copyFileSync(path.join(__dirname, '..', '_site-base', file.filename), path.join(workdir, file.path, file.output));
  }
  let content = fs.readFileSync(path.join(workdir, path.join('src', 'js', 'pages'), 'common.html.mjs'), 'utf8');
  content = content.replace(/_base/gm, 'siteName');
  fs.writeFileSync(path.join(workdir, path.join('src', 'js', 'pages'), 'common.html.mjs'), content);

  const questionLang = `Enter languages separated by commas o empty by default language? (empty)  `;
  if (!yes) {
    const responseLang = await answerThisQuestion(questionLang);
    console.log('languages', responseLang);
    if (responseLang !== '') {
      languages = responseLang;
    }
    pageName = 'index';
    createPage(path.join(workdir, 'src'));
  } else {
    languages='es,en';
    pageName = 'index';
    createPage(path.join(workdir, 'src'));
  }

  wcName = 'mi-componente1';
  createWc(path.join(workdir, 'src'));

  const question = `Do you want to execute 'npm install'? (y/N)  `;
  if (!yes) {
    const response = await answerThisQuestion(question);
    if (response.toUpperCase() === 'Y' || response.toUpperCase() === 'YES') {
      shell.cd(path.join(workdir,'src'));
      executeCommand('npm', 'install');
    }
  } else {
    shell.cd(path.join(workdir,'src'));
    executeCommand('npm', 'install');
  }


}

/** */
/** */
/** */

let ENV;
exports.init = async function () {
  ENV = process.env.ENV || 'PRO';
  processArgs();
  const question = `The "${command}" command will be executed in the "${workdir}" directory. Do you want to proceed? (y/N)  `;
  if (!yes) {
    const response = await answerThisQuestion(question);
    if (response.toUpperCase() === 'Y' || response.toUpperCase() === 'YES') {
      fn[command]();
    }
  } else {
    fn[command]();
  }
}

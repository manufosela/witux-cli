# Linuxt

LitElement New UX Tool of Web Development.
Generate static web pages with links to js and css files that are stored in the `dist` folder.
Oriented to HTML5, CSS, ES6 + and Web components standards through LitElement.
Based in conventions vs configurations.

**[linuxt](https://www.npmjs.com/package/linuxt)** is a set of tools to create static sites using standard javascript.

## Tools
*[linuxt](https://www.npmjs.com/package/linuxt)*, the command line interface to generate static pages

## Install like global cli
```
$ npm install -g linuxt
```

## Usage

### Generate scafolding
```
$ linuxt create-page scafolding [--languages 'lang1','lang2'[,...]] [--commonfiles 'file1','file2'[,...]]
```

### Generate new Page
```
$ linuxt create-page PAGENAME [--languages 'lang1','lang2'[,...]]
```

### Generate web-component
```
$ linuxt create-wc WC-NAME
```

### Generate Build
To generate estatic HTML pages
```
$ linuxt build [--port PORT] [--workdir WORKDIR]
```

## TREE DIR STRUCTURE

El proyecto consta de la siguiente estructura de carpetas:

|__ dist (after the build)
|__ resources
|__ src
    |__assets
    |__components
    |__css
    |__js
    |   |__lib
    |   |__pages
    |   |__tpl
    |__json

### Path `dist`
Path when the html pages are building after `npm run build`

### Path `recursos`
Path whith resources like robots.txt and sitemap.xml.
These files are copied into dist dir.


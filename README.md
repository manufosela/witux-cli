# witux

LitElement New UX Tool of Web Development.
Generate static web pages with links to js and css files that are stored in the `dist` folder.
Oriented to HTML5, CSS, ES6 + and Web components standards through LitElement.
Based in conventions vs configurations.

**[witux](https://www.npmjs.com/package/witux)** is a set of tools to create static sites using standard javascript.

## Tools

_[witux](https://www.npmjs.com/package/witux)_, the command line interface to generate static pages

## Install like global cli

```bash
    npm install -g @witux/witux-cli
```

## Usage

### Generate scafolding

```bash
    witux create-page scafolding [--languages 'lang1','lang2'[,...]] [--commonfiles 'file1','file2'[,...]]
```

### Generate new Page

```bash
    witux create-page PAGENAME [--languages 'lang1','lang2'[,...]]
```

### Generate web-component

```bash
    witux create-wc WC-NAME
```

### Generate Build

To generate estatic HTML pages

```bash
    witux build [--port PORT] [--workdir WORKDIR]
```

## TREE DIR STRUCTURE

El proyecto consta de la siguiente estructura de carpetas:

```bash
    |__dist (after the build)
    |__resources
    |__src
    |__assets
    |__components
    |__css
    |__js
        |__lib
        |__pages
        |__tpl
    |__json
```

### Path `dist`

Path when the html pages are building after `npm run build`

### Path `recursos`

Path whith resources like robots.txt and sitemap.xml.
These files are copied into dist dir.

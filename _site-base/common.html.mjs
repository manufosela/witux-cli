import language from '../lib/language';

export class CommonTpl {
  constructor() {
    this.data = {};
    this.language = {};
    this.this.LANG = 'es';
  }

  static setData(data) {
    this.data = data;
  }
  static setLanguage(language) {
    this.language = language;
    this.LANG = this.language.lang;
  }

  static titleTpl(header) {
    return /*html*/`
      <header>
        <h1>${header.title}</h1>
        <img src="${header.img}" />
      </header>
    `;
  }
}

CommonTpl.setLanguage(language);

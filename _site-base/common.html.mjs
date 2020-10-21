import language from '../lib/language';

export class CommonTpl {
  constructor() {
    this.data = {};
    this.language = {};
    this.defaultLang = window.navigator.language;
    this.LANG = this.defaultLang;
  }

  static setData(data) {
    this.data = data;
  }
  static setLanguage(language) {
    this.language = language;
    this.LANG = this.language.lang;
  }
  static detectLanguage() {
    const location = document.location;
    const pathname = location.pathname;
    const pathparts = pathname.split('/');
    const lang = pathparts[1] === '' ? this.defaultLang : pathparts[1];
    this.setLanguage({lang: lang});
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

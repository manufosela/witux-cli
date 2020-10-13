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

  static bannerTpl(banner) {
    return /*html*/`
      <div>
        <picture data-type="imageBanner">${banner.imageBanner || ''}</picture>
        <h3>${banner.text1 || ''}</h3>
        <h4>${banner.text2 || ''}</h4>s
        <h5>${banner.text3 || ''}</h5>
        <picture data-type="imageDesktop">${banner.imageDesktop || ''}</picture>
        <picture data-type="imageBanner">${banner.imageMobile || ''}</picture>
        <button-link>${banner.buttonLink || ''}</button-link>
        <button-target>${banner.buttonTarget || ''}</button-target>
        <button-text>${banner.buttonText || ''}</button-text>
      </div>
    `;
  }

  static logoClientsTpl(logoClient) {
    return /*html*/`
      <img alt="${logoClient.alt}" data-type="${logoClient.type}" src="${logoClient.url}" />
    `;
  }

  static getMenuItems(menu = this.data.navigationMenu.mainMenu[language.lang]) {
    const menuArr = [];
    for (const menuItem of menu) {
      menuArr.push(this.menuItemTpl(menuItem, menu));
    }
    return menuArr.join('');
  }

  static menuItemTpl(menuItem, navMenu) {
    let liLayer;
    if (menuItem.link === '' && this.data.navigationMenu[menuItem.id]) {
      liLayer = /*html*/`
        <li id="${menuItem.id}" title="${menuItem.title}">
          <ul>
            ${this.getMenuItems(this.data.navigationMenu[menuItem.id][this.LANG])}
          </ul>
        </li>
      `;
    } else {
      liLayer = /*html*/`
        <li id="${menuItem.id}" data-link="${menuItem.link}" title="${menuItem.title}">${menuItem.title}</li>
      `;
    }
    return liLayer;
  }

  static drawKairosDS(kairosds) {
    return /*html*/`
      <div id="kairosDS">
        <a id="kairosds" href="${kairosds.link}" aria-label="${kairosds.ariaLabel}">
          <img id="img" src="${kairosds.logo}" alt="${kairosds.alt}" />
        </a>
      </div>
    `;
  }

  static drawTerminos(terminos) {
    return /*html*/`
      <div id="terminos">
        <a id="cookies" href="${terminos.cookies.link}">${terminos.cookies.title}</a>
        <a id="legal" href="${terminos.legal.link}">${terminos.legal.title}</a>
      </div>
    `;
  }

  static drawCountries(countries) {
    const countryHTML = [];
    let indexCountry = 0;
    for (const country in countries) {
      if (Object.prototype.hasOwnProperty.call(countries, country)) {
        const countryLang = countries[country][this.LANG];
        countryHTML.push(/*html*/`
          <section id="${indexCountry++}">
            <div id="name">${countryLang.name}</div>
            <div id="prefooterTitle">${countryLang.prefooterTitle}</div>
            <img id="countryImgUrl" alt="${countryLang.name}" image" src="${countryLang.url}" />
            <div id="address">
              ${countryLang.address.map((addr, index) => {
                return /*html*/`
                  <a name="location" href="${addr.location}">
                    <span id="street">${addr.street}</span>
                    <span id="cpCity">${addr.cpCity}</span>
                  </a>  
                `;
              }).join('')}
            </div>
            <div id="awards">${countryLang.awards}</div>
            <div id="mail">${countryLang.mail}</div>
          </section>
        `);
      }
    }
    const countryLayer = /*html*/`<div id="countries">${countryHTML.join('')}</div>`
    return countryLayer;
  }

  static drawLogos(logos) {
    const logosHTML = [];
    for (const logo in logos) {
      if (Object.prototype.hasOwnProperty.call(logos, logo)) {
        const dataLogo = logos[logo];
        logosHTML.push(/*html*/`
          <a id="${logo}" href="${dataLogo.link}">
            <img id="img" alt="${dataLogo.alt}" src="${dataLogo.src}" />
          </a>
        `);
      }
    }
    const logosLayer = /*html*/`<div id="logos">${logosHTML.join('')}</div>`
    return logosLayer;
  }
}

CommonTpl.setLanguage(language);
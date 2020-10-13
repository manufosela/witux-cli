import data from '../../json/_base.json.js'; /* FUENTE DE DATOS JSON */
import {CommonTpl} from './common.html.mjs';

CommonTpl.setData(data);

export const HTMLbody = /*html*/`
    <header>
      <kw-header languages="${CommonTpl.language.lang}">
        <ul>
          ${CommonTpl.getMenuItems()}
        </ul>
      </kw-header>
    </header>
    <main role="main" class="homepage">
      <kw-banner id="Banner" banner-size="large" animation-type="slide-toleft" change-interval="8">
        ${data.banners.map(bannerTpl).join('')}
      </kw-banner>

      <h2>${data.fake.title}</h2>
      <h1>CAMBIAR POR EL CONTENIDO HTML DE LA PÁGINA</h1>
      
    </main>
    <footer>
        <kw-footer country="España">
          ${CommonTpl.drawKairosDS(data.footer.kairosds[LANG])}
          ${CommonTpl.drawCountries(data.footer.countries)}
          ${CommonTpl.drawLogos(data.footer.logos)}
          ${CommonTpl.drawTerminos(data.footer.terminos)}
        </kw-footer>
    </footer>
`;
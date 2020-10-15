import data from '../../json/_base.json.js'; /* FUENTE DE DATOS JSON */
import {CommonTpl} from './common.html.mjs';

CommonTpl.setData(data);

const pageData = data._base[CommonTpl.language.lang];

export const HTMLbody = /*html*/`
    ${CommonTpl.titleTpl(pageData.header)}
    <main role="main" class="homepage">
      <h1>CAMBIAR POR EL CONTENIDO HTML DE LA PÁGINA</h1>
      <mi-componente1></mi-componente1>
    </main>
    <footer>
      Linuxt - ${new Date().getFullYear()}
    </footer>
`;

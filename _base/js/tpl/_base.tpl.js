// Datos y Plantillas
import { HTMLbody } from '../pages/_base.html.mjs';
window.onload = function() {
  const body = document.getElementsByTagName('body');
  body[0].innerHTML = HTMLbody;
};

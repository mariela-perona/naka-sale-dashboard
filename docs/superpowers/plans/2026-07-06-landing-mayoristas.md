# Landing Mayoristas Naka Outdoors — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Landing B2B de captación de leads mayoristas embebida en Nubixstore, con formulario wizard de 3 pasos en iframe (GitHub Pages) que guarda en Google Sheets y notifica por email vía Apps Script.

**Architecture:** La landing estática (CSS puro, sin JS — el editor de Nubixstore borra `<script>`) se pega en el panel de Nubixstore (≤65KB). El formulario, que necesita JS, vive en `mayoristas/form.html` en este repo servido por GitHub Pages y se embebe con `<iframe>`. El form hace POST (fetch, `Content-Type: text/plain` para evitar preflight CORS) a un Apps Script Web App que agrega fila a una Sheet y envía emails.

**Tech Stack:** HTML/CSS puro (landing), HTML+CSS+JS vanilla (form), Google Apps Script + Google Sheets (backend), GitHub Pages (`https://mariela-perona.github.io/naka-sale-dashboard/`), Rubik (Google Fonts), paleta blanco/hueso/tinta + rojo Naka.

**Spec:** `docs/superpowers/specs/2026-07-06-landing-mayoristas-design.md`

**Referencias obligatorias antes de codear:**
- `Landings/Thermarest/thermarest-naka-PEGAR.html` y `Landings/MSR/msr-naka-PEGAR.html` — plantilla exacta de estilo editorial y soluciones al editor (namespacing, `!important`, link estirado, `<img>` en vez de background-url).
- Memoria `project_naka_landing_recipe` — restricciones del editor y límite 65KB.
- Prototipo funcional: https://cuentanaka.lovable.app/ (campos y lógica; NO la estética).

**Datos pendientes de la usuaria (no bloquean, van como constantes configurables):**
- Casilla de email de notificaciones (cuenta mayorista) → constante en `.gs`.
- Número de WhatsApp → constante `WHATSAPP` en `form.html`.
- Confirmar opciones del select "Antigüedad en el rubro" (default propuesto abajo).

---

## Design tokens (usar idénticos en landing y form)

```css
:root{
  --paper:#ffffff; --bone:#f5f2ec; --ink:#16140f;
  --muted:#635c4d; --line:#e7e1d5;
  --rojo:#d81e2c; --rojo-deep:#a8121d;
}
/* Rubik: <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&display=swap" rel="stylesheet"> */
```
En la versión PEGAR el CSS va namespaceado bajo la clase raíz `.myx` (mayoristas), con `!important` en colores de `<a>`, headings y botones.

## Datos fijos

**Provincias (select, orden alfabético):** Buenos Aires, CABA, Catamarca, Chaco, Chubut, Córdoba, Corrientes, Entre Ríos, Formosa, Jujuy, La Pampa, La Rioja, Mendoza, Misiones, Neuquén, Río Negro, Salta, San Juan, San Luis, Santa Cruz, Santa Fe, Santiago del Estero, Tierra del Fuego, Tucumán.

**Antigüedad (select — confirmar con usuaria):** Menos de 1 año · 1 a 3 años · 3 a 5 años · 5 a 10 años · Más de 10 años.

**Rubros (multiselección pills):** Bicicleta, Camping, Escalada, Indumentaria deportiva, Montañismo, Náutica, Pesca, Running, Trekking, Otros.

**Marcas (paso 3):** Acepac, Altus, Aonijie, Edelrid, Epic, Fixe, Flextail, Karun, La Sportiva, MSR, Naturehike, Seal Line, Singing Rock, Thermarest, TSL.

---

### Task 0: Snippet de prueba de iframe para Nubixstore (checkpoint con la usuaria)

**Files:** ninguno (snippet en el chat).

- [ ] **Step 1:** Entregar a la usuaria este snippet para pegar en una página de prueba de Nubixstore:

```html
<div style="max-width:900px;margin:0 auto">
  <iframe src="https://mariela-perona.github.io/naka-sale-dashboard/" style="width:100%;height:400px;border:1px solid #e7e1d5;border-radius:12px" title="prueba"></iframe>
</div>
```

- [ ] **Step 2:** Pedirle que confirme si al guardar y ver la página el recuadro muestra contenido. **Si el iframe NO sobrevive: STOP — volver a la usuaria con el plan B (form sin JS de una página, POST nativo).** No hace falta esperar la respuesta para avanzar con Tasks 1-7 (el form en Pages sirve igual como página standalone).

### Task 1: Carpeta de assets + logos de marcas en GitHub Pages

**Files:**
- Create: `mayoristas/logos/<marca>.png|svg` (15 logos)

- [ ] **Step 1:** Crear `mayoristas/logos/`. Conseguir los 15 logos: primero revisar assets ya existentes en el repo (`epic/`, carpetas de `Landings/`); lo que falte, bajarlo del sitio oficial de cada marca (SVG del header preferido) o extraerlo del prototipo Lovable (los assets del prototipo se listan en el bundle JS de `https://cuentanaka.lovable.app/`).
- [ ] **Step 2:** Normalizar: fondo transparente, recorte ajustado, ≤30KB c/u (son para tiles de ~120px). Nombres en minúscula sin espacios: `acepac.png`, `altus.png`, `aonijie.png`, `edelrid.png`, `epic.png`, `fixe.png`, `flextail.png`, `karun.png`, `lasportiva.png`, `msr.png`, `naturehike.png`, `sealline.png`, `singingrock.png`, `thermarest.png`, `tsl.png`.
- [ ] **Step 3:** Commit + push. Verificar que responde: `curl -sI https://mariela-perona.github.io/naka-sale-dashboard/mayoristas/logos/msr.png` → `HTTP/2 200` (Pages tarda ~1 min en publicar).

```bash
git add mayoristas/ && git commit -m "feat: logos de marcas para landing mayoristas" && git push
```

### Task 2: Backend Apps Script

**Files:**
- Create: `Landings/Mayoristas/mayoristas-leads.gs`
- Create: `Landings/Mayoristas/INSTRUCCIONES-BACKEND.txt`

- [ ] **Step 1:** Escribir `mayoristas-leads.gs` con este contenido (completo):

```javascript
/******** CONFIGURACIÓN — editar solo estas líneas ********/
var EMAIL_DESTINO = "COMPLETAR@nakaoutdoors.com.ar"; // casilla que recibe las solicitudes
var NOMBRE_REMITENTE = "Solicitudes Mayoristas · Naka Outdoors";
var ENVIAR_CONFIRMACION = true;   // true = email automático al solicitante
var NOMBRE_HOJA = "Leads";
/***********************************************************/

var COLUMNAS = [
  "Fecha","Nombre","Apellido","Email","Teléfono","Ciudad","Provincia","Preferencia de contacto",
  "Local físico","Nombre de fantasía","Dirección local","Ciudad local","Provincia local","Google Maps","Rubros","Cómo comercializa",
  "Razón social","CUIT","DNI","Condición IVA",
  "Ecommerce","URL ecommerce","Mercado Libre","Instagram","Facebook","TikTok",
  "Otras marcas","Marcas que comercializa","Antigüedad","Marcas de interés"
];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var hoja = obtenerHoja_();
    hoja.appendRow([
      new Date(), d.nombre||"", d.apellido||"", d.email||"", d.telefono||"", d.ciudad||"", d.provincia||"", d.preferencia||"",
      d.localFisico||"", d.nombreFantasia||"", d.direccionLocal||"", d.ciudadLocal||"", d.provinciaLocal||"", d.gmaps||"",
      (d.rubros||[]).join(", "), (d.comercializa||[]).join(", "),
      d.razonSocial||"", d.cuit||"", d.dni||"", d.condicionIva||"",
      d.ecommerce||"", d.urlEcommerce||"", d.mercadolibre||"", d.instagram||"", d.facebook||"", d.tiktok||"",
      d.otrasMarcas||"", d.marcasComercializa||"", d.antiguedad||"", (d.marcasInteres||[]).join(", ")
    ]);
    enviarNotificacion_(d);
    if (ENVIAR_CONFIRMACION && d.email) enviarConfirmacion_(d);
    return respuesta_({ok:true});
  } catch (err) {
    return respuesta_({ok:false, error:String(err)});
  }
}

function obtenerHoja_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(NOMBRE_HOJA);
  if (!hoja) { hoja = ss.insertSheet(NOMBRE_HOJA); }
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS);
    hoja.getRange(1,1,1,COLUMNAS.length).setFontWeight("bold");
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function enviarNotificacion_(d) {
  var asunto = "Nueva solicitud mayorista: " + (d.nombre||"") + " " + (d.apellido||"") +
               (d.nombreFantasia ? " — " + d.nombreFantasia : "");
  var filas = [
    ["Contacto", (d.nombre||"")+" "+(d.apellido||"")+" · "+(d.email||"")+" · "+(d.telefono||"")],
    ["Ubicación", (d.ciudad||"")+", "+(d.provincia||"")],
    ["Prefiere", d.preferencia||"-"],
    ["Local físico", d.localFisico||"-"],
    d.localFisico==="Sí" ? ["Local", (d.nombreFantasia||"")+" · "+(d.direccionLocal||"")+" · rubros: "+(d.rubros||[]).join(", ")]
                          : ["Comercializa vía", (d.comercializa||[]).join(", ")||"-"],
    ["Fiscal", (d.razonSocial||"")+" · CUIT "+(d.cuit||"")+" · "+(d.condicionIva||"")],
    ["Digital", "Ecommerce: "+(d.ecommerce||"-")+(d.urlEcommerce?" ("+d.urlEcommerce+")":"")+" · ML: "+(d.mercadolibre||"-")],
    ["Experiencia", (d.antiguedad||"-")+(d.marcasComercializa?" · vende: "+d.marcasComercializa:"")],
    ["Marcas de interés", (d.marcasInteres||[]).join(", ")||"-"]
  ];
  var html = "<div style='font-family:Arial,sans-serif;max-width:560px'>"+
    "<h2 style='color:#16140f'>Nueva solicitud mayorista</h2><table cellpadding='6' style='border-collapse:collapse;font-size:14px'>"+
    filas.map(function(f){return "<tr><td style='color:#635c4d;white-space:nowrap;vertical-align:top'><b>"+f[0]+"</b></td><td>"+f[1]+"</td></tr>";}).join("")+
    "</table><p style='color:#635c4d;font-size:12px'>Detalle completo en la planilla de leads.</p></div>";
  MailApp.sendEmail({to:EMAIL_DESTINO, subject:asunto, htmlBody:html, name:NOMBRE_REMITENTE});
}

function enviarConfirmacion_(d) {
  var html = "<div style='font-family:Arial,sans-serif;max-width:560px'>"+
    "<h2 style='color:#16140f'>¡Recibimos tu solicitud!</h2>"+
    "<p>Hola "+(d.nombre||"")+", gracias por tu interés en ser cliente mayorista de <b>Naka Outdoors</b>.</p>"+
    "<p>Nuestro equipo va a evaluar tu solicitud y te vamos a responder dentro de los próximos <b>5 días hábiles</b>.</p>"+
    "<p style='color:#635c4d;font-size:13px'>Naka Outdoors · Fabricantes y distribuidores · +150 marcas internacionales</p></div>";
  MailApp.sendEmail({to:d.email, subject:"Recibimos tu solicitud mayorista — Naka Outdoors", htmlBody:html, name:NOMBRE_REMITENTE});
}

function respuesta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Ejecutar una vez desde el editor para probar sin el formulario:
function testManual() {
  var fake = {postData:{contents:JSON.stringify({nombre:"Prueba",apellido:"Test",email:EMAIL_DESTINO,telefono:"111",ciudad:"CABA",provincia:"CABA",preferencia:"Email",localFisico:"No",comercializa:["Redes sociales"],razonSocial:"Test SA",cuit:"20-12345678-9",dni:"12345678",condicionIva:"Monotributo",ecommerce:"No",mercadolibre:"No",antiguedad:"1 a 3 años",marcasInteres:["MSR","Thermarest"]})}};
  Logger.log(doPost(fake).getContent());
}
```

- [ ] **Step 2:** Escribir `INSTRUCCIONES-BACKEND.txt` (formato de las instrucciones de la agenda): 1) entrar a sheets.google.com con la cuenta mayorista y crear planilla "Leads Mayoristas Naka"; 2) Extensiones → Apps Script, pegar el `.gs`, completar `EMAIL_DESTINO`; 3) ejecutar `testManual` una vez (autorizar permisos) y verificar fila + email; 4) Implementar → Nueva implementación → App web → Ejecutar como "yo", acceso "Cualquier persona" → copiar URL `/exec`; 5) pasar esa URL para configurarla en el formulario.
- [ ] **Step 3:** Commit:

```bash
git add Landings/Mayoristas/ && git commit -m "feat: backend Apps Script para leads mayoristas"
```

### Task 3: `mayoristas/form.html` — esqueleto, tokens y Paso 1

**Files:**
- Create: `mayoristas/form.html` (autocontenido: un `<style>`, un `<script>`, sin dependencias salvo Google Fonts)

- [ ] **Step 1:** Esqueleto: `<!doctype html>` + Rubik + tokens del plan + layout de tarjeta blanca sobre `--bone`, barra de progreso de 3 segmentos con labels (Datos personales · Datos comerciales · Marcas) que se pintan de `--rojo` según paso activo.
- [ ] **Step 2:** Constantes de configuración al tope del `<script>`:

```javascript
const ENDPOINT = "PEGAR_URL_APPS_SCRIPT/exec"; // URL del Web App (Task 2)
const WHATSAPP = "549XXXXXXXXXX";              // número para el botón de contacto
```

- [ ] **Step 3:** Paso 1 completo: nombre*, apellido*, email* (type=email), teléfono* (type=tel), ciudad*, provincia* (select con las 24), preferencia de contacto* como pills radio (WhatsApp/Email/Llamada). Grid 2 columnas en desktop, 1 en mobile (`<560px`).
- [ ] **Step 4:** Motor del wizard y validación (patrón para los 3 pasos):

```javascript
const pasos = [...document.querySelectorAll(".paso")];
let actual = 0;
function mostrar(i){ pasos.forEach((p,j)=>p.hidden = j!==i); actual=i; pintarProgreso(i); window.scrollTo({top:0,behavior:"smooth"}); }
function validarPaso(i){
  let ok = true;
  pasos[i].querySelectorAll("[data-req]").forEach(el=>{
    if (el.offsetParent === null) return;            // campos ocultos por condicionales no validan
    const vacio = el.type==="radio" ? !pasos[i].querySelector(`[name=${el.name}]:checked`) : !el.value.trim();
    const invalido = vacio || (el.dataset.pattern && !new RegExp(el.dataset.pattern).test(el.value));
    el.closest(".campo").classList.toggle("error", invalido);
    if (invalido) ok = false;
  });
  return ok;
}
// CUIT: data-pattern="^\\d{2}-\\d{8}-\\d$" con auto-guiones en input
```

- [ ] **Step 5:** Verificar en navegador local (abrir el archivo): paso 1 se ve correcto, "Siguiente" bloquea con requeridos vacíos y marca el campo en rojo. Commit: `git add mayoristas/form.html && git commit -m "feat: form mayoristas paso 1 + wizard"`.

### Task 4: `mayoristas/form.html` — Paso 2 (datos comerciales, 4 sub-bloques)

**Files:**
- Modify: `mayoristas/form.html`

- [ ] **Step 1:** Sub-bloque **Local** (título con ícono SVG de línea): radio Sí/No*; contenedor `#si-local` (nombre fantasía*, dirección*, ciudad*, provincia*, Maps opcional, rubros como pills-checkbox*) y `#no-local` (pills-checkbox "¿Cómo comercializás?"), toggleados por el radio (`hidden`). Aviso destacado (borde izquierdo rojo, fondo bone): "Si contás con local físico abierto al público, se te dará **prioridad en la apertura de cuenta**."
- [ ] **Step 2:** Sub-bloque **Fiscal**: aviso "obligatorio estar inscripto fiscalmente…", razón social*, CUIT* (auto-formato XX-XXXXXXXX-X + `data-pattern`), DNI* (numérico 7-8 dígitos), condición IVA* pills radio.
- [ ] **Step 3:** Sub-bloque **Digital**: ecommerce Sí/No* (Sí → input URL), Mercado Libre Sí/No*, Instagram/Facebook/TikTok opcionales.
- [ ] **Step 4:** Sub-bloque **Experiencia**: ¿otras marcas? Sí/No (Sí → input "separadas por coma"), antigüedad* (select con las opciones del plan).
- [ ] **Step 5:** Verificar en navegador las 6 combinaciones condicionales (local Sí/No × ecommerce Sí/No, otras marcas Sí/No) y que la validación ignora campos ocultos. Commit.

### Task 5: `mayoristas/form.html` — Paso 3 (marcas) + envío + gracias

**Files:**
- Modify: `mayoristas/form.html`

- [ ] **Step 1:** Grid de 15 tarjetas-checkbox (logo desde `https://mariela-perona.github.io/naka-sale-dashboard/mayoristas/logos/<marca>.png` + nombre), borde rojo al seleccionar, y link "Me interesan todas" que togglea todo. Requerido: al menos 1.
- [ ] **Step 2:** Envío:

```javascript
async function enviar(){
  const btn = document.querySelector("#btn-enviar");
  btn.disabled = true; btn.textContent = "Enviando…";
  try {
    const r = await fetch(ENDPOINT, {method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body: JSON.stringify(recolectar())});
    const j = await r.json();
    if (!j.ok) throw new Error(j.error);
    document.querySelector("#form-wrap").hidden = true;
    document.querySelector("#gracias").hidden = false;
  } catch(e){
    document.querySelector("#error-envio").hidden = false; // mensaje + reintentar + botón WhatsApp
    btn.disabled = false; btn.textContent = "Enviar solicitud";
  }
}
```

`recolectar()` arma el objeto con las mismas claves que espera el `.gs` (Task 2). Los datos del formulario NUNCA se borran ante un error.

- [ ] **Step 3:** Pantalla de gracias inline: check en círculo rojo suave, "¡Gracias por tu solicitud!", "te respondemos dentro de los próximos **5 días hábiles**", botón WhatsApp (`https://wa.me/${WHATSAPP}?text=Hola!%20Acabo%20de%20enviar%20mi%20solicitud%20mayorista`).
- [ ] **Step 4:** Prueba end-to-end contra un Apps Script de prueba propio (crear Sheet + deploy con cuenta disponible): completar el wizard, verificar fila en la Sheet y email recibido. Commit.

### Task 6: `mayoristas/form.html` — responsive + pulido + publicar

**Files:**
- Modify: `mayoristas/form.html`

- [ ] **Step 1:** Pasada responsive: 375px (1 columna, pills envuelven, tap targets ≥44px), 768px, 1200px (tarjeta max-width ~720px centrada). El fondo de la página del form = `--bone` liso para que dentro del iframe se funda con la landing.
- [ ] **Step 2:** Estados de foco visibles (outline rojo suave), `aria-label` en la barra de progreso, `autocomplete` en los campos de contacto (name, email, tel, address-level1/2).
- [ ] **Step 3:** Push y verificación en producción: `git push` → abrir `https://mariela-perona.github.io/naka-sale-dashboard/mayoristas/form.html` y repetir el flujo completo.

### Task 7: Landing PEGAR — hero + franja de logos

**Files:**
- Create: `Landings/Mayoristas/mayoristas-naka-PEGAR.html`

- [ ] **Step 1:** Leer primero `Landings/MSR/msr-naka-PEGAR.html` completo como plantilla de patrones editor-safe. Todo namespaceado bajo `.myx`; sin `<script>`; imágenes como `<img>` real (nunca `background:url`); colores de headings/links/botones con `!important`.
- [ ] **Step 2:** Hero claro: kicker rojo "VENTA MAYORISTA", H1 "Sumá las marcas outdoor líderes del mundo a tu negocio", lead con los 3 datos duros (fabricantes y distribuidores oficiales · +150 marcas · 16 años), CTA rojo "Quiero ser mayorista" → ancla `#solicitud` (el iframe). Foto outdoor vía `<img>` + overlay claro sutil, o hero tipográfico puro sobre `--bone` si la foto no suma (decidir por peso).
- [ ] **Step 3:** Franja de logos: los 15 logos desde `mayoristas/logos/` con `?width=` chico si aplica, `filter:grayscale(1);opacity:.55` y color al `:hover`, en 2 filas con scroll horizontal nativo en mobile (patrón carrusel de la receta).
- [ ] **Step 4:** Medir: `wc -c Landings/Mayoristas/mayoristas-naka-PEGAR.html` — presupuesto parcial ≤20KB. Commit.

### Task 8: Landing PEGAR — beneficios + cómo funciona + cita + iframe + footer

**Files:**
- Modify: `Landings/Mayoristas/mayoristas-naka-PEGAR.html`

- [ ] **Step 1:** Sección `(01) Por qué Naka` — 4 tarjetas (grid 2×2 desktop, 1 col mobile) con ícono SVG de línea inline, título fuerte y línea de apoyo, con el copy exacto de la spec (marcas premium / fabricantes / probamos todo / hacé crecer tu negocio).
- [ ] **Step 2:** Sección `(02) Cómo funciona` — 3 pasos numerados estilo revista (01/02/03): Completá la solicitud → La evaluamos en 5 días hábiles → Activá tu cuenta mayorista.
- [ ] **Step 3:** Cita de identidad — franja `--ink` con texto claro (con `!important`): "Somos escaladores, hablamos tu mismo idioma." + 2 líneas B2B: 16 años probando en terreno el equipo que distribuimos; si un producto no nos convence, no lo vendemos.
- [ ] **Step 4:** Sección `(03) Solicitá tu cuenta` con ancla `id="solicitud"`, micro-copy de confianza y el iframe:

```html
<div class="myx-form" id="solicitud">
  <iframe src="https://mariela-perona.github.io/naka-sale-dashboard/mayoristas/form.html"
          style="width:100%;height:1450px;border:0" title="Solicitud de cuenta mayorista" loading="lazy"></iframe>
</div>
```

Altura fija generosa (sin JS no hay auto-resize): calibrar con el paso más alto del wizard (paso 2 con local=Sí) + margen; en mobile subir vía media query si hace falta.

- [ ] **Step 5:** Footer mínimo + botón "volver arriba" (patrón receta, siempre visible). Medir total: **≤60KB**; si se pasa, minificar (regex `>\s+<` → `><`, compactar CSS). Commit.

### Task 9: Versión preview `mayoristas-naka.html`

**Files:**
- Create: `Landings/Mayoristas/mayoristas-naka.html`

- [ ] **Step 1:** Copia legible (indentada, con comentarios de sección) de la landing PEGAR con el mismo iframe — es la fuente de verdad para futuras ediciones. Verificar en navegador que se ve idéntica.
- [ ] **Step 2:** Commit + push (para que Pages sirva también los logos ya usados).

### Task 10: Verificación final

- [ ] **Step 1:** `wc -c Landings/Mayoristas/mayoristas-naka-PEGAR.html` ≤ 65.000 bytes (objetivo ≤60KB).
- [ ] **Step 2:** Flujo completo en `form.html` publicado: 3 pasos, ambas ramas de cada condicional, validación de CUIT/email, envío real a la Sheet de prueba, email de notificación y de confirmación recibidos, pantalla de gracias, botón WhatsApp.
- [ ] **Step 3:** Responsive de la landing completa (375/768/1200px) con el iframe embebido.
- [ ] **Step 4:** Entregar a la usuaria: HTML PEGAR + instrucciones backend + recordar los 3 datos pendientes (email destino, WhatsApp, confirmar opciones de antigüedad) + pedir la prueba del iframe (Task 0) si aún no se hizo.
- [ ] **Step 5:** Commit final y actualizar memoria del proyecto.

# Landing Mayoristas Naka Outdoors — Especificación de diseño

**Fecha:** 2026-07-06
**Estado:** Aprobada por Marie (conversación 2026-07-06)

## Objetivo

Nueva sección corporativa B2B para captar leads mayoristas: comerciantes interesados
en comprar/distribuir los productos de Naka Outdoors. La landing debe impresionar,
ser clara de navegar, responsive y profesional, sin estética genérica de IA,
optimizada para conversión de leads.

## Contexto y restricciones

- **Plataforma:** panel de HTML de **Nubixstore** (no Tiendanube). El editor
  **elimina `<script>`/JS** y trunca en **~65KB** (restricciones probadas con las
  landings Therm-a-rest / MSR / EPIC — ver memoria `project_naka_landing_recipe`).
- **Arquitectura elegida (aprobada 2026-07-06):** la landing (hero, logos,
  beneficios, cómo funciona, cita) va pegada en Nubixstore como **CSS puro sin
  JS**; el **formulario wizard completo con JS vive en GitHub Pages**
  (`https://mariela-perona.github.io/naka-sale-dashboard/mayoristas/form.html`)
  y se embebe en la misma página con un `<iframe>`.
  **Riesgo a verificar primero:** que Nubixstore no elimine iframes — probar con
  snippet mínimo antes de construir todo; si lo elimina, fallback a formulario
  sin JS de una sola página con POST nativo a Apps Script.
- **Imágenes y logos:** servidos por URL externa (GitHub Pages), nunca base64.
- **El editor de Nubixstore puede filtrar/alterar código:** validar tras pegar.
- **Referencia funcional del formulario:** prototipo Lovable en
  https://cuentanaka.lovable.app/ — fuente de verdad para campos, opciones de
  selects (provincias, antigüedad), validaciones y textos. La estética del
  prototipo (dark + verde) NO se replica.

## Identidad visual

- Sistema editorial de las landings Therm-a-rest/MSR: fondo `#ffffff` / hueso
  `#f5f2ec`, tinta `#16140f`, gris `#635c4d`, líneas `#e7e1d5`.
- **Acento: rojo Naka** (tomar del logo; referencia MSR `#de0015` / TAR `#d81e2c`)
  en botones, barra de progreso, highlights. Único color de acento.
- Tipografía **Rubik** (regla fija de Naka).
- Íconos SVG de línea consistentes. Sin glassmorphism, sin gradientes decorativos,
  sin emojis en el copy final.

## Estructura de la landing (orden de scroll)

1. **Hero** — Imagen outdoor de calidad tratada con sutileza. Titular:
   *"Sumá las marcas outdoor líderes del mundo a tu negocio"*. Bajada:
   fabricantes y distribuidores oficiales · +150 marcas internacionales ·
   16 años de trayectoria. CTA rojo **"Quiero ser mayorista"** → scroll al formulario.
2. **Franja de logos** — Marcas top (La Sportiva, MSR, Thermarest, Edelrid, etc.)
   en gris, color al hover.
3. **4 beneficios B2B** (tarjetas limpias, frase fuerte + línea de apoyo):
   - **Marcas premium internacionales** — licencias oficiales y distribución exclusiva en Argentina
   - **Somos fabricantes** — acceso directo a fábrica, mejor margen para tu negocio
   - **Probamos todo lo que vendemos** — 16 años escalando y testeando en terreno
   - **Hacé crecer tu negocio** — llevá a tu ciudad el equipamiento que antes no se conseguía
4. **Cómo funciona** — 3 pasos: Completá la solicitud → Evaluación en 5 días
   hábiles → Activá tu cuenta mayorista.
5. **Cita de identidad** — sección editorial breve basada en
   *"somos escaladores, hablamos tu mismo idioma"* reescrita en clave B2B.
6. **Formulario** (ver abajo) con micro-copy de confianza.
7. **Pantalla de gracias** — mensaje "5 días hábiles" + botón de WhatsApp.

Copy: extraído/adaptado del texto institucional provisto (misión/visión/valores).
Solo datos reales confirmados: 16 años, fabricantes, +150 marcas, licencias
oficiales/distribución exclusiva.

## Formulario: 3 pasos (todos los campos del prototipo, pasos comprimidos)

Barra de progreso 33/66/100%. Validación en vivo por paso: no avanza con
requeridos vacíos y señala el campo exacto. Formato CUIT validado
(`XX-XXXXXXXX-X`).

### Paso 1 · Datos personales
Nombre*, Apellido*, Email*, Teléfono celular*, Ciudad*, Provincia* (select),
Preferencia de contacto* (WhatsApp / Email / Llamada).

### Paso 2 · Datos comerciales — 4 sub-bloques visuales con título e ícono
- **Local:** ¿Local físico abierto al público?* (Sí/No, condicional)
  - Sí → Nombre de fantasía*, Dirección*, Ciudad*, Provincia*, Link Google Maps
    (opcional), Rubros* (multiselección: Bicicleta, Camping, Escalada,
    Indumentaria deportiva, Montañismo, Náutica, Pesca, Running, Trekking, Otros)
  - No → ¿Cómo comercializás actualmente? (Ecommerce propio, Mercado Libre,
    Showroom, Redes sociales, Venta directa, Otro)
  - Aviso destacado: local físico = prioridad en apertura de cuenta.
- **Fiscal:** Razón social*, CUIT*, DNI del responsable*, Condición IVA*
  (Responsable Inscripto / Monotributo / IVA Exento Tierra del Fuego).
  Aviso: inscripción fiscal obligatoria.
- **Digital:** ¿Ecommerce propio?* (Sí → URL), ¿Vendés en Mercado Libre?*,
  Redes opcionales (Instagram, Facebook, TikTok).
- **Experiencia:** ¿Comercializás otras marcas? (Sí → listado separado por coma),
  Antigüedad en el rubro* (select, opciones del prototipo).

### Paso 3 · Marcas de interés
Grid de logos multiselección* + atajo "Me interesan todas". Marcas: Acepac,
Altus, Aonijie, Edelrid, Epic, Fixe, Flextail, Karun, La Sportiva, MSR,
Naturehike, Seal Line, Singing Rock, Thermarest, TSL.

## Backend: Google Apps Script + Google Sheets

- Script publicado como Web App desde **la cuenta de Google del área mayorista**;
  planilla de leads en el Drive de esa cuenta (una columna por campo + timestamp).
- El formulario hace POST al Web App. El script: (1) agrega fila a la Sheet,
  (2) envía email de notificación formateado con los datos del lead,
  (3) opcionalmente envía confirmación automática al solicitante.
- **Configuración como constantes al inicio del `.gs`:** casilla destino, nombre
  visible del remitente, flag `true/false` para el email de confirmación.
- Límite de envío (100/día Gmail, 1.500/día Workspace) sobra para este uso.

## Manejo de errores

- Si el POST falla: el formulario conserva los datos, muestra error claro y
  ofrece reintentar + botón de WhatsApp como canal alternativo.
- CORS: envío con `fetch` + `mode:'no-cors'` o `URLSearchParams` (patrón
  estándar Apps Script); confirmación optimista con manejo de timeout.

## Entregables

1. `Landings/Mayoristas/mayoristas-naka.html` — versión fuente legible (landing
   completa de preview, con el iframe apuntando al form).
2. `Landings/Mayoristas/mayoristas-naka-PEGAR.html` — landing minificada ≤65KB,
   CSS puro + `<iframe>`, para pegar en Nubixstore.
3. `mayoristas/form.html` — formulario wizard (HTML+CSS+JS autocontenido)
   servido por GitHub Pages desde este repo, + `mayoristas/logos/` con los
   logos de marcas.
4. `Landings/Mayoristas/mayoristas-leads.gs` — Apps Script con constantes
   configurables + instrucciones de publicación paso a paso (formato como las
   de la agenda).
5. Encabezados de la planilla documentados en las instrucciones.

## Verificación

- Peso del archivo PEGAR ≤65KB.
- Responsive: mobile (~375px), tablet, desktop.
- Flujo completo: los 3 pasos con ambas ramas condicionales (local Sí/No,
  ecommerce Sí/No, otras marcas Sí/No), validaciones, envío real a una Sheet
  de prueba y recepción del email.
- Opciones de selects idénticas al prototipo de Lovable (verificar visitándolo).

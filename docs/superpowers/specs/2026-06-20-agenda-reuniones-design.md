# Agenda de Reuniones — Diseño

**Fecha:** 2026-06-20
**Proyecto:** Sistema para armar la agenda de temas de las reuniones de Naka (4 personas)

## Objetivo

Que las 4 personas del equipo puedan ir juntando durante la semana los temas a tratar en la próxima reunión, y que en la reunión puedan marcar cada tema como tratado y anotar qué se decidió (mini-acta). Toda la información se sincroniza en la nube para que los 4 vean lo mismo en tiempo real.

## Decisiones tomadas (brainstorming)

- **Carga de temas:** durante la semana, cualquiera de los 4 agrega temas cuando se le ocurre (lista compartida en la nube).
- **Cómo se carga:** mediante un link rápido / acceso directo en el celular (no bot de WhatsApp por ahora).
- **En la reunión:** marcar temas como tratados, anotar la decisión de cada uno (mini-acta) y tener los temas priorizados.
- **Priorización:** etiqueta de nivel por tema — Alta / Media / Baja (no votación ni estrellas).
- **Acceso:** no público. PIN compartido al entrar (que nadie ajeno lo encuentre de casualidad). No requiere login por usuario.
- **Tipografía:** Rubik (identidad Naka).
- **Estilo visual:** "Glass gris" — fondo gris claro en degradé, tarjetas de vidrio esmerilado (semitransparentes blancas), encabezado grafito en degradé (#3f4651 → #717885), botones en gris (#4b5563). Prioridades con toque sutil de color: Alta rojo apagado (#e26d6d), Media mostaza (#cfa15a), Baja verde (#6fae84).
- **Fecha de reunión:** la "Próxima reunión" tiene una fecha programada editable por cualquiera, con cuenta regresiva ("faltan 3 días" / "es hoy" / "mañana"). Al cerrar, esa fecha es la que queda registrada en el Historial.

## Arquitectura

- **Un solo archivo HTML** autocontenido, mismo patrón que el POS de feria y la página de promociones.
- **Firebase + Firestore** para la sincronización en tiempo real entre los 4 dispositivos. Sin servidor propio, dentro de la capa gratuita.
- Hospedaje en Firebase Hosting o GitHub Pages, con URL no difundida.
- **PIN compartido**: al entrar por primera vez en un dispositivo se pide el PIN una vez y queda recordado (localStorage) en ese teléfono.
- El nombre del usuario (uno de los 4) también se recuerda por dispositivo, para no tener que elegirlo cada vez.

> Nota de alcance del PIN: es una barrera para que nadie ajeno entre de casualidad, no es seguridad de nivel servidor. Suficiente para temas internos de reuniones. Si en el futuro se cargan datos sensibles, se migra a login real con reglas de Firestore.

## Estructura de la pantalla

Pensada mobile-first (se ve bien también en escritorio). Encabezado "Agenda de reuniones · Naka" en Rubik.

Dos pestañas:

1. **Próxima reunión** — la lista de temas que se está juntando.
2. **Historial** — reuniones pasadas cerradas, en solo lectura.

## Pestaña "Próxima reunión"

### Agregar un tema
Arriba de todo, una barra **"📅 Reunión: [fecha]"**: selector de fecha que cualquiera de los 4 puede fijar, con cuenta regresiva al lado. Es la fecha que se registra al cerrar la reunión.

Debajo, bloque fijo de carga, siempre a mano:
- Campo de texto: "¿Qué tema querés tratar?"
- "+ detalle" plegable: campo opcional para ampliar con un par de líneas.
- Selector de prioridad: Alta / Media / Baja (por defecto **Media**).
- Selector de quién propone: los 4 nombres como botones; el propio queda recordado por dispositivo.
- Botón "Agregar": guarda en Firestore, limpia el campo, aparece al instante en la lista de todos.

### Lista de temas
Cada tema es una tarjeta con:
- **Título** (+ "ver más" si tiene detalle).
- **Etiqueta de prioridad de color**: 🔴 Alta · 🟡 Media · 🟢 Baja. Editable por cualquiera.
- **Quién lo propuso** (texto chico).
- Botón **borrar**.

Ordenamiento: **agrupado por prioridad** (Alta → Media → Baja) y, dentro de cada grupo, por orden de carga. Contador arriba: "7 temas para tratar".

## Modo reunión

Se trabaja sobre la misma lista de "Próxima reunión". Cada tarjeta suma:
- **Casilla "tratado" ✓** — al marcarla el tema se ve atenuado/tachado y baja al fondo de su grupo.
- **Campo "¿Qué se decidió?"** — una o dos líneas con la conclusión o lo que quedó pendiente. Es lo que forma el mini-acta.

Contador en vivo: "3 de 7 tratados".

Un tema no tratado no se toca: queda sin palomear y pasa solo a la próxima reunión al cerrar la actual.

## Seguimiento de temas (continuidad entre reuniones)

Para temas que no se cierran en una sola reunión:

- En un tema **ya tratado** aparece el botón **"↻ Hacer seguimiento →"**.
- Al tocarlo, el tema **pasa como copia a la próxima reunión**, marcado con el sello **📌 seguimiento**, y arrastra su **cadena de historial completa**: la lista de todas las reuniones donde se trató, con la decisión de cada una (ej: "20/06: se decidió pedir presupuestos · 27/06: se eligió proveedor X"). La cadena se ve plegada y se expande para consultar.
- El tema original queda marcado como ya derivado (no se puede duplicar dos veces) y se archiva normalmente al cerrar la reunión.

### Subtemas anidados
Cualquier tema (en especial los de seguimiento) puede tener **subtemas** hijos: una lista de puntos con checkbox para ir tildando lo que falta ("pedir presupuesto", "confirmar fecha"…). Se agregan con "+ subtema". Al hacer seguimiento, los subtemas **pendientes** se arrastran a la copia siguiente; los ya tildados quedan archivados con la reunión.

## Cerrar reunión → Historial

Botón "Cerrar reunión" con confirmación. Al cerrar:
- Los temas **tratados**, con sus notas, se archivan como una **reunión fechada** en Historial (ej: "Reunión 20/06/2026 — 5 temas"). Queda como acta permanente.
- Los temas **no tratados** se mantienen automáticamente en "Próxima reunión" para la siguiente, conservando su prioridad.

## Pestaña "Historial"

Lista de reuniones pasadas (más reciente arriba). Al tocar una, se ve la lista de temas con lo que se decidió en cada uno. Solo lectura.

## Modelo de datos (Firestore)

- Colección `temas` (próxima reunión): `{ titulo, detalle, prioridad, propuestoPor, tratado, decision, creadoEn, esSeguimiento, seguido, seguimiento:[{fecha,decision}], subtemas:[{id,titulo,hecho}] }`
- Colección `reuniones` (historial): `{ fecha, temas: [ ...snapshot de los tratados ] }`

## Fuera de alcance (por ahora)

- Bot de WhatsApp que cargue temas automáticamente (posible fase 2).
- Login por usuario / reglas de Firestore por identidad.
- Campo "responsable" por decisión (se puede agregar después si hace falta).
- Reordenar manualmente arrastrando (la prioridad ya ordena).

## Validación

Antes de conectar Firebase se entrega una **demo funcional** (mismo archivo, datos guardados en localStorage del dispositivo) para validar el flujo completo: agregar, priorizar, marcar tratado, anotar decisión, cerrar reunión y ver el historial. Una vez aprobado el flujo, se reemplaza la capa de datos por Firestore para la sincronización entre los 4.

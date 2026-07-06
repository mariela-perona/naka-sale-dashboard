/******** CONFIGURACIÓN — editar solo estas líneas ********/
var EMAIL_DESTINO = "COMPLETAR@nakaoutdoors.com.ar"; // casilla que recibe las solicitudes
var NOMBRE_REMITENTE = "Solicitudes Mayoristas · Naka Outdoors";
var ENVIAR_CONFIRMACION = true;   // true = email automático al solicitante / false = no enviar
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

// Ejecutar una vez desde el editor para probar sin el formulario (Ejecutar > testManual):
function testManual() {
  var fake = {postData:{contents:JSON.stringify({nombre:"Prueba",apellido:"Test",email:EMAIL_DESTINO,telefono:"111",ciudad:"CABA",provincia:"CABA",preferencia:"Email",localFisico:"No",comercializa:["Redes sociales"],razonSocial:"Test SA",cuit:"20-12345678-9",dni:"12345678",condicionIva:"Monotributo",ecommerce:"No",mercadolibre:"No",antiguedad:"1 a 3 años",marcasInteres:["MSR","Thermarest"]})}};
  Logger.log(doPost(fake).getContent());
}

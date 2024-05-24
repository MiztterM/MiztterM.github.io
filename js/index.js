$(document).ready(() => {
  console.log("JQuery Cargado");

  $(".cerrar").click(() => {
    cerrarPopup();
  });

  $("#formulario-principal").on("submit", (e) => {
    e.preventDefault(); 
    abrirFeedback();
    trasladarDatosDelFormCompletoAFeedback();
  });

});


function cerrarPopup() {
  $(".popup-contenedor.feedback").addClass("oculto");
}

function abrirFeedback() {
  $(".popup-contenedor.feedback").removeClass("oculto");
}

function trasladarDatosDelFormCompletoAFeedback() {
  const inputNombre = $("#nombre");
  const inputEmail = $("#email");
  const inputPais = $("#pais");

  let nombre = inputNombre.val().trim();
  const pais = inputPais.val();
  let email = inputEmail.val().trim();

  if (nombre.length > 12) {
    nombre = nombre.substring(0, 12);
  }

  if (email.length > 38) {
    email = email.substring(0, 38);
  }

  const spanNombre = $("#dato-nombre");
  const spanEmail = $("#dato-email");
  const spanPais = $("#dato-pais");

  spanNombre.html(nombre);
  spanEmail.html(email);
  spanPais.html(pais);
}

function trasladarMailDeMiniformAFormCompleto() {
  const inputEmail1 = $("#miniform-email-1");
  const inputEmail2 = $("#miniform-email-2");
  const inputEmail3 = $("#miniform-email-3");

  const email1 = inputEmail1.val();
  const email2 = inputEmail2.val();
  const email3 = inputEmail3.val();

  const inputEmailFormCompleto = $("#email");

  console.log(email1, email2, email3);
  if (email1 != "") {
    inputEmailFormCompleto.val(email1);
  } else if (email2 != "") {
    inputEmailFormCompleto.val(email2);
  } else if (email3 != "") {
    inputEmailFormCompleto.val(email3);
  }
}

function toggleMenuMobile() {
  const menuMobile = $("nav.mobile-only");
  if (menuMobile.hasClass("oculto")) {
    abrirMenuMobile();
  } else {
    cerrarMenuMobile();
  }
}

//Scroll hasta el botón del formulario

document.addEventListener("DOMContentLoaded", function () {
  // ¡ELIGE TU SELECCIÓN!"
  var eligeSeleccionBtn = document.querySelector('.cta');

  // Enviar
  var enviarBtn = document.getElementById('tpalforms');

  // Clic al botón "¡ELIGE TU SELECCIÓN!"
  eligeSeleccionBtn.addEventListener('click', function (event) {
    event.preventDefault();
    enviarBtn.scrollIntoView({ behavior: 'smooth' });
  });
});

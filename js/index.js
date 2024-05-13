// Esta linea garantiza que todo lo que se ejecute dentro de ready
// se ejecute solo cuando el html esté 100% cargado
$(document).ready(() => {
    console.log("JQuery Cargado");
  
    // Cuando hacemos click en la cruz de los popup, los cerramos
    $(".cerrar").click(() => {
      cerrarPopup();
    });
  
    // Cuando enviamos el formulario completo, mostramos el feedback
    $("#formulario-principal").on("submit", (e) => {
      e.preventDefault(); // Esta linea es importante para evitar que la página se recargue al enviar le formulario
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
    const email = inputEmail.val();

    if (nombre.length > 12) {
        nombre = nombre.substring(0, 12); // Recorta el nombre a los primeros 12 caracteres para que no pongan un nombre boludo
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
  
  function toggleMenuMobile(){
    const menuMobile = $("nav.mobile-only");
    if(menuMobile.hasClass("oculto")){
      abrirMenuMobile();
    } else {
      cerrarMenuMobile();
    }
  }

  //Scroll hasta el botón del formulario

  document.addEventListener("DOMContentLoaded", function() {
    // ¡ELIGE TU SELECCIÓN!"
    var eligeSeleccionBtn = document.querySelector('.cta');
  
    // Enviar
    var enviarBtn = document.getElementById('tpalforms');
  
    // Clic al botón "¡ELIGE TU SELECCIÓN!"
    eligeSeleccionBtn.addEventListener('click', function(event) {
      event.preventDefault();
      enviarBtn.scrollIntoView({ behavior: 'smooth' }); 
    });
  });
  
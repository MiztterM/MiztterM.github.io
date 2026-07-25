document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // 1. LÓGICA DEL FORMULARIO "SUMATE"
    // ==========================================

    const formVoluntario = document.getElementById("form-voluntario");
    const inputNombreVoluntario = document.getElementById("nombre");
    const errorNombreVoluntario = document.getElementById("error-nombre");
    const inputEdad = document.getElementById("edad");
    const errorEdad = document.getElementById("error-edad");
    const mensajeExitoVoluntario = document.getElementById("mensaje-exito");

    if (formVoluntario) {
        formVoluntario.addEventListener("submit", function (evento) {
            evento.preventDefault();
            let hayError = false;

            // Validar nombre (mínimo dos palabras)
            const palabrasNombre = inputNombreVoluntario.value.trim().split(/\s+/);
            if (palabrasNombre.length < 2) {
                errorNombreVoluntario.style.display = "block";
                inputNombreVoluntario.style.borderColor = "var(--color-primario)";
                hayError = true;
            }

            // Mínimo de edad
            if (inputEdad.value < 18) {
                errorEdad.style.display = "block";
                inputEdad.style.borderColor = "var(--color-primario)";
                hayError = true;
            }

            if (hayError) return;

            // Éxito
            formVoluntario.style.display = "none";
            mensajeExitoVoluntario.style.display = "block";
        });

        inputNombreVoluntario.addEventListener("input", function () {
            const palabrasNombre = this.value.trim().split(/\s+/);
            if (palabrasNombre.length >= 2) {
                errorNombreVoluntario.style.display = "none";
                this.style.borderColor = "var(--color-borde)";
            }
        });

        inputEdad.addEventListener("input", function () {
            if (this.value.length > 2) this.value = this.value.slice(0, 2);
            if (this.value >= 18) {
                errorEdad.style.display = "none";
                this.style.borderColor = "var(--color-borde)";
            }
        });
    }

    // ==========================================
    // 2. LÓGICA DE DONACIONES
    // ==========================================

    const botonesDonar = document.querySelectorAll(".donacion-botones a");
    const moduloPago = document.getElementById("modulo-pago");
    const spanMonto = document.getElementById("monto-elegido");

    if (botonesDonar.length > 0 && moduloPago) {
        botonesDonar.forEach(boton => {
            boton.addEventListener("click", function (evento) {
                evento.preventDefault();

                const tarjetaPadre = this.closest('.tarjeta-donacion');
                const precio = tarjetaPadre.querySelector('.donacion-precio').innerText;
                const tipoPago = this.innerText;

                const imagenQR = document.getElementById("imagen-qr-dinamico");

                // El usuario escaneará y tipeará 2000, 5000 o 10000 manualmente en su app.
                imagenQR.src = "img/qr-bomberos.webp";

                document.querySelectorAll('.tarjeta-donacion').forEach(t => t.classList.remove('seleccionada'));
                tarjetaPadre.classList.add('seleccionada'); spanMonto.innerText = precio + " (" + tipoPago + ")";

                const estabaOculto = moduloPago.classList.contains("oculto");

                tarjetaPadre.insertAdjacentElement('afterend', moduloPago);
                moduloPago.classList.remove("oculto");

                // Posicionar flechita
                const rectTarjeta = tarjetaPadre.getBoundingClientRect();
                const rectModulo = moduloPago.getBoundingClientRect();
                const centroX = (rectTarjeta.left + (rectTarjeta.width / 2)) - rectModulo.left;
                moduloPago.style.setProperty('--posicion-flecha', centroX + 'px');

                if (estabaOculto) {
                    setTimeout(() => window.scrollBy({ top: 250, left: 0, behavior: 'smooth' }), 150);
                }
            });
        });

        // Cambio de método de pago (Tarjeta vs Transferencia)
        const radiosMetodo = document.querySelectorAll('input[name="metodo_pago"]');
        const formTarjeta = document.getElementById("form-tarjeta");
        const formTransferencia = document.getElementById("form-transferencia");

        // Atrapamos la sección de datos personales que creamos en el HTML
        const seccionDatosPersonales = document.getElementById("seccion-datos-personales");

        radiosMetodo.forEach(radio => {
            radio.addEventListener("change", function () {
                if (this.value === "tarjeta") {
                    formTarjeta.classList.remove("oculto");
                    seccionDatosPersonales.classList.remove("oculto"); // Vuelven a aparecer los datos
                    formTransferencia.classList.add("oculto");

                    // Volver a hacer obligatorios los campos personales
                    seccionDatosPersonales.querySelectorAll("input, select").forEach(input => input.required = true);

                } else if (this.value === "transferencia") {
                    formTransferencia.classList.remove("oculto");
                    formTarjeta.classList.add("oculto");
                    seccionDatosPersonales.classList.add("oculto"); // ¡Se ocultan los datos!

                    // IMPORTANTE: Quitamos la obligación de llenar los campos personales 
                    seccionDatosPersonales.querySelectorAll("input, select").forEach(input => input.required = false);
                }
            });
        });

        // Validaciones en tiempo real para Donaciones
        const inputEmailPago = document.getElementById("email-pago");
        const errorEmailPago = document.getElementById("error-email-pago");

        inputEmailPago.addEventListener("blur", function () {
            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value !== "" && !regexEmail.test(this.value)) {
                errorEmailPago.style.display = "block";
                this.style.borderColor = "var(--color-primario)";
            } else {
                errorEmailPago.style.display = "none";
                this.style.borderColor = "var(--color-borde)";
            }
        });

        document.getElementById("telefono-pago").addEventListener("input", function () { this.value = this.value.replace(/\D/g, ""); });
        document.getElementById("documento-pago").addEventListener("input", function () { this.value = this.value.replace(/\D/g, ""); });
        document.getElementById("nombre-tarjeta").addEventListener("input", function () { this.value = this.value.replace(/[0-9]/g, ""); });
        document.getElementById("cvc-tarjeta").addEventListener("input", function () { this.value = this.value.replace(/\D/g, ""); });

        document.getElementById("fecha-expiracion").addEventListener("input", function () {
            let valor = this.value.replace(/\D/g, "");
            if (valor.length > 2) valor = valor.substring(0, 2) + "/" + valor.substring(2, 4);
            this.value = valor;
        });

        const inputTarjeta = document.getElementById("numero-tarjeta");
        const logoTarjeta = document.getElementById("logo-tarjeta");
        const svgMastercard = '<svg width="24" height="16" viewBox="0 0 24 16"><circle cx="8" cy="8" r="8" fill="#eb001b"/><circle cx="16" cy="8" r="8" fill="#f79e1b"/></svg>';
        const spanVisa = '<span class="logo-visa">VISA</span>';

        inputTarjeta.addEventListener("input", function () {
            let valor = this.value.replace(/\D/g, "");
            if (valor.startsWith("4")) logoTarjeta.innerHTML = spanVisa;
            else if (valor.startsWith("5")) logoTarjeta.innerHTML = svgMastercard;
            else logoTarjeta.innerHTML = "";

            let valorFormateado = "";
            for (let i = 0; i < valor.length; i++) {
                if (i > 0 && i % 4 === 0) valorFormateado += " ";
                valorFormateado += valor[i];
            }
            this.value = valorFormateado;
        });

        // Envío final de donación
        const formDonacion = document.getElementById("formulario-donacion");
        const msjExitoDonacion = document.getElementById("mensaje-exito-donacion");
        const btnVolverDonar = document.getElementById("btn-volver-donar");

        formDonacion.addEventListener("submit", function (evento) {
            evento.preventDefault();
            formDonacion.style.display = "none";
            msjExitoDonacion.style.display = "block";
        });

        btnVolverDonar.addEventListener("click", function () {
            msjExitoDonacion.style.display = "none";
            formDonacion.style.display = "block";
            formDonacion.reset();
            moduloPago.classList.add("oculto");
            document.querySelectorAll('.tarjeta-donacion').forEach(t => t.classList.remove('seleccionada'));
            document.querySelector('.seccion-donar').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
});
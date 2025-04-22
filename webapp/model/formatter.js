sap.ui.define([
    "sap/ui/core/library",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Element"
], function (coreLibrary, DateFormat, Element) {
    "use strict";

    return {
        formatEstados: function (value) {
            const valueState = coreLibrary.MessageType;
            let estado;
            switch (value) {
                case 1:
                    estado = valueState.Information;
                    break;
                case 2:
                    estado = valueState.Warning;
                    break;
                case 3:
                    estado = valueState.Success;
                    break;
                case 4:
                    estado = valueState.Success;
                    break;
                case 5:
                    estado = valueState.Success;
                    break;
                case 6:
                    estado = valueState.Error;
                    break;
                default:
                    estado = valueState.Error;
                    break;
            }
            return estado;
        },

        formatEstadosTexto: function (value) {

            let estado = "";

            switch (value) {
                case 1:
                    estado = "Pendiente";
                    break;
                case 2:
                    estado = "Enviado";
                    break;
                case 3:
                    estado = "Aprobación en curso";
                    break;
                case 4:
                    estado = "Aprobado";
                    break;
                case 5:
                    estado = "Rechazado";
                    break;
                case 6:
                    estado = "Contabilizado";
                    break;
                default:
                    estado = "Anulado";
                    break;
            }
            return estado;
        },
        capitalizarPrimeraLetra: function (texto) {
            if (!texto) return ''; // Verificar si el texto es vacío o nulo
            return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
        },
        normalizeToUTC: function (dateString) {
            const date = new Date(dateString);
            return new Date(date.getTime() + date.getTimezoneOffset() * 60000); // Ajusta a UTC
        },

        onGetLinkAprobacion: function (codProvision, codAprob) {

            const linkActual = window.location.href
            let linkReturn = ""

            if (linkActual.includes("provi-dev")) {
                linkReturn = `https://provi-dev-3b6txcdg.launchpad.cfapps.br10.hana.ondemand.com/site?siteId=8dae90fe-62ff-4c15-9f4a-8d0d00b08810#AprobacionProvisionesPP-Display?sap-ui-app-id-hint=saas_approuter_com.indra.bandejadeaprobaciones&/Provision?codProvision=${codProvision}&codAprob=${codAprob}`
            } else if (linkActual.includes("provi-qa")) {
                linkReturn = `https://provi-qas-dz3tlgkv.launchpad.cfapps.br10.hana.ondemand.com/site/Provisiones#AprobacionProvisionesPP-Display?sap-ui-app-id-hint=saas_approuter_com.indra.bandejadeaprobaciones&/Provision?codProvision=${codProvision}&codAprob=${codAprob}`
            } else {
                linkReturn = `https://af-prd-qs6cel8c.launchpad.cfapps.br10.hana.ondemand.com/site/financiero#AprobacionProvisionesPP-Display?sap-ui-app-id-hint=saas_approuter_com.indra.bandejadeaprobaciones&/Provision?codProvision=${codProvision}&codAprob=${codAprob}`
            }

            return linkReturn

        }

    };

});
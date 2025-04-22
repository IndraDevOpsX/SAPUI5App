sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
], function (
    Controller,
    UIComponent
) {
    "use strict";

    return Controller.extend("com.indra.gestionprovisiones.controller.BaseController", {

        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        getLanes: function (dataCab, aLogAprobaciones) {
            let aLanes = [];
            //dataCab.responsable
            //dataCab.responsableEgresos
            //dataCab.director

            aLanes = [
                {
                    "id": 0,
                    "icon": "sap-icon://company-view",
                    "label": "Responsable",
                    "position": 0,
                    "state": [
                        {
                            "state": "Neutral",
                            "value": 10
                        }
                    ],
                    'codigo': dataCab.responsable,
                    'estado': dataCab.vbDirecion ? 4 : 5
                },
                {
                    "id": 2,
                    "icon": "sap-icon://activity-assigned-to-goal",
                    "label": "Responsable Egresos",
                    "position": 2,
                    "state": [
                        {
                            "state": "Neutral",
                            "value": 10
                        }
                    ],
                    'codigo': dataCab.responsableEgresos,
                    'estado': 7
                }
            ];

            if (dataCab.vbDirecion) {
                aLanes.push({
                    "id": 1,
                    "icon": "sap-icon://address-book",
                    "label": "Director",
                    "position": 1,
                    "state": [
                        {
                            "state": "Neutral",
                            "value": 10
                        }
                    ],
                    'codigo': dataCab.director,
                    'estado': 5
                });
            }

            aLanes = aLanes.sort((a, b) => a.id - b.id);

            let idx = 0;
            let idxNode = 1;
            let aNodes = [];
            let that = this;
            aLanes.forEach(element => {
                element.id = '' + idx;
                element.position = idx;

                let oLog = aLogAprobaciones.find(d => d.estado_idEstadoProvision == element.estado);
                let oNode = {};
                oNode.id = idxNode;
                oNode.lane = idx;

                if (aLanes.length > idxNode) {
                    oNode.children = [idxNode + 1];
                }

                if (oLog) {
                    oNode.texts = [
                        that._formatDate(oLog.fechaAprobacion)
                    ]
                    oNode.state = "Positive";
                    oNode.stateText = oLog.estado.descripcion;
                } else {
                    oNode.state = "Neutral";
                    oNode.stateText = "";
                }
                aNodes.push(oNode);

                idx++;
                idxNode++;
            });


            return { aLanes: aLanes, aNodes: aNodes };
        },

        getConsideraciones: function () {
            let aConsideracion = [
                {
                    "ID": 1,
                    "Consideraciones para llenado de plantilla": "Cuando la provisión contiene OC/PA no se debe llenar las columnas desde C-F y la columna I, columna L"
                },
                {
                    "ID": 2,
                    "Consideraciones para llenado de plantilla": "Cuando la provisión contiene Solped no se debe llenar las columnas desde C-F(Se tiene que ingresar el código de proveedor en columna I)"
                },
                {
                    "ID": 3,
                    "Consideraciones para llenado de plantilla": "Cuando la provisión no contenga OC/PA/Solped no debe llenarse la columna A y B"
                },
                {
                    "ID": 4,
                    "Consideraciones para llenado de plantilla": "Debe existir el juego de datos de imputación, debido a que la aplicación consulta si se encuentran dentro del app mantenimiento de provisiones"
                }
            ];

            return aConsideracion;
        },

        /**
 * Convenience method for getting the view model by name.
 * @public
 * @param {string} [sName] the model name
 * @returns {sap.ui.model.Model} the model instance
 */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        readEntity: function (odataModel, path, parameters) {
            return new Promise((resolve, reject) => {
                odataModel.read(path, {
                    filters: parameters.filters,
                    urlParameters: parameters.urlParameters,
                    success: resolve,
                    error: reject
                });
            });
        },

        createEntity: function (odataModel, path, data) {
            return new Promise((resolve, reject) => {
                odataModel.create(path, data, {
                    success: resolve,
                    error: reject
                });
            });
        },

        updateEntity: function (odataModel, path, data) {
            return new Promise((resolve, reject) => {
                odataModel.update(path, data, {
                    success: resolve,
                    error: reject
                });
            });
        },
        deleteEntity: function (odataModel, path, data) {
            return new Promise((resolve, reject) => {
                odataModel.remove(path, {
                    success: resolve,
                    error: reject
                });
            });
        },
        callFunction: function (odataModel, path, parameters) {
            return new Promise((resolve, reject) => {
                odataModel.callFunction(path, {
                    urlParameters: parameters,
                    success: resolve,
                    error: reject
                });
            });
        },

        _formatDate: function (date) {
            if (date !== "" && date && date instanceof Date) return date.toISOString().split("T")[0]
            else return date
        },

        _formatDateCierre: function (date) {
            date.setDate(date.getDate() + 1);
            if (date !== "" && date && date instanceof Date) return date.toISOString().split("T")[0]
            else return date
        },

        _excelDateToJSDate: function (date) {

            return new Date(Date.UTC(0, 0, date - 1));

        },

        formatDataWithKey: function (sCadena) {

            if (sCadena.split("-").length === 3) {
                return {
                    key: sCadena.split("-")[0].trim(),
                    value: sCadena.split("-")[1].trim()
                }
            } else {
                return {
                    key: sCadena,
                    value: sCadena
                }
            }

        },

        _evaluarTipoDocumentoAprovisionamiento(sDocumento, sPosicion, bActionButton = false) {

            let bValidado = true,
                tipoDocumento = "",
                mensaje = ""

            sPosicion = sPosicion.toString()

            if ((sDocumento === "" || sPosicion === "") && !bActionButton){
                return {bValidado, tipoDocumento, mensaje}
            }

            if (sDocumento.length !== 10 ) {
                bValidado = false
                mensaje = "El campo OC/SOLPED/PA debe tener 10 caracteres."
                return { bValidado, tipoDocumento, mensaje }
            }

            if (sPosicion.length >  5) {
                bValidado = false
                mensaje = "El campo Posición no tiene la longitud permitida."
                return { bValidado, tipoDocumento, mensaje }
            }

            if (sDocumento.substring(0, 2) === "45") {
                tipoDocumento = "OC"
            } else if (sDocumento.substring(0, 2) === "46") {
                tipoDocumento = "PA"
            } else if (sDocumento.substring(0, 1) === "2") {
                tipoDocumento = "SP"
            } else {
                bValidado = false
                mensaje = "El documento ingresado no es válido."
            }

            return { bValidado, tipoDocumento, mensaje }

        }

    });
});
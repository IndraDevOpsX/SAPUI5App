sap.ui.define(['sap/ui/thirdparty/jquery', "sap/ui/export/Spreadsheet", "sap/ui/export/library"],
    function (jQuery, Spreadsheet, exportLibrary) {
        "use strict";
        var EdmType = exportLibrary.EdmType;
        var ExportService = {
            export: function (table, oBundle) {
                if (!table) {
                    return;
                }

                var aCols, oRowBinding, oSettings, oSheet;

                oRowBinding = table.getBinding("items");
                aCols = this.createColumnConfig(oBundle);

                oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: "Level"
                    },
                    dataSource: oRowBinding,
                    fileName: "Solicitudes de alta de contrata.xlsx",
                    worker: false
                };

                oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function () {
                    oSheet.destroy();
                });


            },

            createColumnConfig: function (oBundle) {
                var aCols = [];
                aCols.push({
                    label: oBundle.getText("codigoProvision"),
                    property: "idProvision",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("usuarioRegistro"),
                    property: "idProvision/usuarioRegistrador",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("periodoCierre"),
                    property: "periodoCierre",
                    type: EdmType.DateTime,
                    format: 'mm/yyyy'
                });
                aCols.push({
                    label: oBundle.getText("fechaEnvio"),
                    property: "fechaEnvio",
                    type: EdmType.DateTime,
                    format: 'dd/mm/yyyy'
                });
                aCols.push({
                    label: oBundle.getText("monto"),
                    property: "monto",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("moneda"),
                    property: "moneda",
                    type: EdmType.String
                });
                return aCols;
            },

            exportLogResultados: function (modelDetalleProv, oBundle, bSoloErrores) {

                var aCols, oSettings, oSheet, aData, aDataInicial

                aDataInicial = modelDetalleProv.getData()

                aCols = this.createColumnConfigDetalleProvision(oBundle)
                aData = jQuery.extend(true, [], aDataInicial)

                if (bSoloErrores) aData = aData.filter((oData) => oData.Estado === false)

                //Preparar Data
                for (let index = 0; index < aData.length; index++) {
                    const element = aData[index];

                    element.ctaContableCompleto = element.cuentaContable + " - " + (element.cuentaContableDesc ? element.cuentaContableDesc : "")
                    element.centroCostoCompleto = element.centroCosto + " - " + (element.centroCostoDesc ? element.centroCostoDesc : "")
                    element.centroGestorCompleto = element.centroGestor + " - " + (element.centroGestorDesc ? element.centroGestorDesc : "")
                    element.ordenInternaCompleto = element.ordenInterna + " - " + (element.ordenInternaDesc ? element.ordenInternaDesc : "")
                    element.proveedorCompleto = element.proveedor + " - " + element.proveedorNombre
                    element.idProvision = parseInt(element.posicionTabla || element.posicionTabla)

                    //fecha de periodo de gasto
                    let date = element.periodoGasto

                    if (date) {

                        if (date instanceof Date) {

                            // +2, porque la fecha
                            let month = date.getUTCMonth() + 1,
                                year = date.getUTCFullYear()

                            // Poner en el formato "MM/AAAA"
                            element.periodoGastoFormateado = `${month}/${year}`;

                        } else {

                            const partes = element.periodoGasto.split("-"); // ["2024", "10", "01"]         
                            if (date) {
                                let month = (partes[1]).toString().padStart(2, '0'),
                                    year = partes[0]
                                // Poner en el formato "MM/AAAA"
                                element.periodoGastoFormateado = `${month}/${year}`;
                            }
                        }
                    }

                    //Formatear Estado
                    element.Estado = (element.Estado) ? "Exitoso" : "Error"

                }

                //Ordeno los IDs
                aData.sort((a, b) => a.idProvision - b.idProvision)

                //Completo con 0's para que se puede identificar con la tabla mostrada
                aData.map(odato => {
                    odato.idProvision = odato.idProvision.toString().padStart(3, "0")
                })

                oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: "Level"
                    },
                    dataSource: aData,
                    fileName: "Log de Resultados.xlsx",
                    worker: false
                };

                oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function () {
                    oSheet.destroy();
                });

            },

            createColumnConfigDetalleProvision: function (oBundle) {
                var aCols = [];
                aCols.push({
                    label: oBundle.getText("dp_id"),
                    property: "idProvision",
                    type: EdmType.String,
                    width: 10
                });
                aCols.push({
                    label: oBundle.getText("dp_estado"),
                    property: "Estado",
                    type: EdmType.String,
                    width: 35
                });
                aCols.push({
                    label: oBundle.getText("dp_mensaje"),
                    property: "Mensaje",
                    type: EdmType.String,
                    width: 35
                });
                aCols.push({
                    label: oBundle.getText("dp_usuarioResponsable"),
                    property: "usuarioResponsable",
                    type: EdmType.String,
                    width: 35
                });
                aCols.push({
                    label: oBundle.getText("dp_cuentaContable"),
                    property: "ctaContableCompleto",
                    type: EdmType.String,
                    width: 40
                });
                aCols.push({
                    label: oBundle.getText("dp_ceco"),
                    property: "centroCostoCompleto",
                    type: EdmType.String,
                    width: 40
                });
                aCols.push({
                    label: oBundle.getText("dp_cege"),
                    property: "centroGestorCompleto",
                    type: EdmType.String,
                    width: 40
                });
                aCols.push({
                    label: oBundle.getText("dp_ordenInterna"),
                    property: "ordenInternaCompleto",
                    type: EdmType.String,
                    width: 40
                });
                aCols.push({
                    label: oBundle.getText("dp_rubro"),
                    property: "rubro",
                    type: EdmType.String,
                    width: 40
                });
                aCols.push({
                    label: oBundle.getText("dp_tipoPago"),
                    property: "idTipoPago_idTipoPago",
                    type: EdmType.String,
                    width: 40
                });
                aCols.push({
                    label: oBundle.getText("dp_ocsolpedpa"),
                    property: "sustento",
                    type: EdmType.String,
                    width: 40
                });
                aCols.push({
                    label: oBundle.getText("dp_posicion"),
                    property: "posicion",
                    type: EdmType.String,
                    width: 40
                });
                aCols.push({
                    label: oBundle.getText("dp_descServicio"),
                    property: "descripcionServicio",
                    type: EdmType.String,
                    width: 40
                });
                aCols.push({
                    label: oBundle.getText("dp_proveedor"),
                    property: "proveedorCompleto",
                    type: EdmType.String,
                    width: 40
                });
                aCols.push({
                    label: oBundle.getText("dp_periodoGasto"),
                    property: "periodoGastoFormateado",
                    type: EdmType.String,
                    width: 20
                });
                aCols.push({
                    label: oBundle.getText("dp_monto"),
                    property: "monto",
                    type: "number",
                    scale: 2
                });
                aCols.push({
                    label: oBundle.getText("dp_moneda"),
                    property: "moneda",
                    type: EdmType.String,
                    width: 40
                });
                return aCols;
            },


        };

        return ExportService;

    });

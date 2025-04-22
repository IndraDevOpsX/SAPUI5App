sap.ui.define([
    "./BaseController",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Button",
    "sap/m/Dialog",
    'sap/m/Bar',
    "sap/m/Text",
    'sap/m/MessageItem',
    'sap/m/MessageView',
    'sap/m/MessageToast',
    "com/indra/gestionprovisiones/controller/Exportation",
], function (
    BaseController,
    MessageBox,
    JSONModel,
    Filter,
    FilterOperator,
    Button,
    Dialog,
    Bar,
    Text,
    MessageItem,
    MessageView,
    MessageToast,
    Exportation
) {
    "use strict";
    let that
    let provisionModel, oModel, viewModel, empleadoModel, usuarioModel, provisionSAPModel, asignacionModel, aGlobalIndividual = [], bValidateCab = false
    let modeControlModel

    return BaseController.extend("com.indra.gestionprovisiones.controller.NuevaProvision", {
        onInit: function () {
            that = this;
            this.getRouter().getRoute("RouteNuevaProvision").attachPatternMatched(this._onObjectMatched, this)
        },

        _onObjectMatched: async function (oEvent) {
            bValidateCab = false
            provisionModel = this.getOwnerComponent().getModel("provisionModel")
            empleadoModel = this.getOwnerComponent().getModel("empleadoModel")
            usuarioModel = this.getOwnerComponent().getModel("usuarioModel")
            provisionSAPModel = this.getOwnerComponent().getModel("provisionSAPModel")
            asignacionModel = this.getOwnerComponent().getModel("asignacionModel")
            oModel = that.getOwnerComponent().getModel()

            that.setModel(new JSONModel({
                busy: false,
                cantidad: 0,
                bSave: false,
                bSustentoRetraso: false
            }), "worklistViewDetProvision")

            that.setModel(new JSONModel({
                comboBoxView: false,
                inputView: true
            }), "modeControl")

            that.setModel(new JSONModel({
                messageIndicaciones: `<strong>Indicaciones Generales para las provisiones de Costos y Gastos: </strong><br><br>
                <strong>1.</strong> Provisionar los servicios recibidos y validados cuya orden de compra no cuente con Entrada de Actividad (EA). <br>
                <strong>2.</strong> El antiguamiento de las provisiones no debe ser mayor al mes en curso y excepcionalmente de meses anteriores previa justificación. <br>                        
                `
            }), "pageModel")
            that.setModel(new JSONModel({
                messageMasivo: `<strong>Consideraciones para el Ingreso de Provisiones:</strong><br><br>
                <strong>1.</strong> Se deben llenar todos los campos existentes de la Plantilla de Provisión.<br>
                <strong>2.</strong> Asegurarse de colocar las imputaciones correctas según el tipo de servicio (Cuenta de gasto, Centro de costo, Centro gestor, orden interna). <br>
                `
            }), "pageModel2")
            viewModel = that.getModel("worklistViewDetProvision")
            modeControlModel = that.getModel("modeControl")

            that._getGerenciaJefaturaBBDD()
            that._getTiposPagoBBDD()
            that._getTiposGastoBBDD()
            that._getTiposServicioBBDD()
            that.setModelNew()
            that._getConfiguracionApertura()
            that._getConfiguracionMaximoFilas()

            that.getView().byId("frgDetalleProvision--tblViewProv").setVisible(false)
            that.getView().byId("frgDetalleProvision--tblNuevoProv").setVisible(true)
            await this.getDatosGlobal();
            this.onIniciarTabla();
        },

        setModelNew: function () {

            that.getView().setModel(new JSONModel({
                "idProvision": "",
                "usuarioRegistrador": this.getModel("userData").getData().userId,
                "fechaRegistro": new Date(),
                "fechaModificacion": null,
                "fechaEnvio": null,
                "direccion_ID": "",
                //"gerenciaJefaturaSolicitante_ID": "",
                //"gerenciaJefaturaSolicitante_Desc": "",
                "periodoCierre": "",
                "monto": 0.0,
                "moneda": "",
                "idEstadoProvision_idEstadoProvision": 2, // 2 = Registrado
                "motivoRechazo": "",
                "indicadorNoProvision": false,
                "montoTipoCambio": 0.0,
                "anulado": false,
                "area": "",
                "responsable": "",          //*************************** */
                "director": "",             //Se agregan los campos para guardar el codigo de aprobadores
                "responsableEgresos": "",   //****************************** */
                "vbDirecion": false,        //****************************** */
                "direccion": "",
                "direccionDesc": "",
                "areaDesc": "",
                "usuarioRegistradorDesc": this.getModel("userData").getData().givenName + " " + this.getModel("userData").getData().familyName,
                "responsableDesc": "",
                "directorDesc": "",
                "responsableEgresosDesc": "",
                "planificador": "",
                "planificadorDesc": "",
                "detallesProvision": []
            }
            ), "provisionCabModel")

            that.getView().setModel(new JSONModel({
                "idProvision_idProvision": "",
                "usuarioResponsable": "", // Responsable
                "cuentaContable": "",
                "cuentaContableDesc": "",
                "centroCosto": "",
                "centroCostoDesc": "",
                "ordenInterna": "",
                "ordenInternaDesc": "",
                "idTipoPago_idTipoPago": "",
                "idTipoGasto_idTipoGasto": "",
                "idTipoServicio_idTipoServicio": "",
                "sustento": "",
                "posicion": "",
                "centroGestor": "",
                "centroGestorDesc": "",
                "descripcionServicio": "",
                "periodoGasto": "",
                "proveedor": "",
                "proveedorNombre": "",
                "monto": "",
                "moneda": "",
                "rubro": "",
                "director": "",             //Se agregan los campos para guardar el codigo de aprobadores
                "responsableEgresos": "",   //****************************** */
                "vbDirecion": false,        //****************************** */
                "sustentoText": "",
                "usuarioResponsableNombres": ""
            }
            ), "provisionDetModel")

            that.getView().setModel(new JSONModel([]), "detalleProv")

        },

        onCleanForm: function () {

            that.getView().setModel(new JSONModel({
                "idProvision": "",
                "usuarioRegistrador": this.getModel("userData").getData().userId,
                "fechaRegistro": new Date(),
                "fechaModificacion": null,
                "fechaEnvio": null,
                "direccion_ID": "",
                //"gerenciaJefaturaSolicitante_ID": "",
                //"gerenciaJefaturaSolicitante_Desc": "",
                "periodoCierre": "",
                "monto": 0.0,
                "moneda": "",
                "idEstadoProvision_idEstadoProvision": 2, // 2 = Registrado
                "motivoRechazo": "",
                "indicadorNoProvision": false,
                "montoTipoCambio": 0.0,
                "anulado": false,
                "responsable": "",          //*************************** */
                "director": "",             //Se agregan los campos para guardar el codigo de aprobadores
                "responsableEgresos": "",   //****************************** */
                "vbDirecion": false,        //****************************** */
                "direccion": "",
                "direccionDesc": "",
                "area": "",
                "areaDesc": "",
                "usuarioRegistradorDesc": this.getModel("userData").getData().givenName + " " + this.getModel("userData").getData().familyName,
                "responsableDesc": "",
                "directorDesc": "",
                "responsableEgresosDesc": "",
                "planificador": "",
                "planificadorDesc": "",
                "detallesProvision": []
            }
            ), "provisionCabModel")

        },

        onGetModelProvCabService: function () {
            return {
                "idProvision": "",
                "usuarioRegistrador": this.getModel("userData").getData().userId,
                "fechaRegistro": "",
                "fechaModificacion": "",
                "fechaEnvio": "",
                "direccion_ID": "",
                //"gerenciaJefaturaSolicitante_ID": "",
                //"gerenciaJefaturaSolicitante_Desc": "",
                "periodoCierre": "",
                "monto": "",
                "moneda": "",
                "idEstadoProvision_idEstadoProvision": "",
                "motivoRechazo": "",
                "indicadorNoProvision": false,
                "montoTipoCambio": "",
                "anulado": "",
                "detallesProvision": []
            }
        },

        onGetModelProvDetService: function () {

            return {
                "idProvision_idProvision": "",
                "usuarioResponsable": "",
                "cuentaContable": "",
                "cuentaContableDesc": "",
                "centroCosto": "",
                "centroCostoDesc": "",
                "ordenInterna": "",
                "ordenInternaDesc": "",
                "idTipoPago_idTipoPago": "",
                "sustento": "",
                "posicion": "",
                "centroGestor": "",
                "centroGestorDesc": "",
                "descripcionServicio": "",
                "periodoGasto": "",
                "proveedor": "",
                "proveedorNombre": "",
                "monto": "",
                "moneda": "",
                "rubro": "",
                "sustentoText": "",
                "usuarioResponsableNombres": ""
            }

        },

        onCleanFormDetalle: function () {

            that.getView().setModel(new JSONModel({
                "idProvision_idProvision": "",
                "usuarioResponsable": "",
                "cuentaContable": "",
                "cuentaContableDesc": "",
                "centroCosto": "",
                "centroCostoDesc": "",
                "ordenInterna": "",
                "ordenInternaDesc": "",
                "idTipoPago_idTipoPago": "",
                "idTipoGasto_idTipoGasto": "",
                "idTipoServicio_idTipoServicio": "",
                "sustento": "",
                "posicion": "",
                "centroGestor": "",
                "centroGestorDesc": "",
                "descripcionServicio": "",
                "periodoGasto": "",
                "proveedor": "",
                "proveedorNombre": "",
                "monto": "",
                "moneda": "",
                "rubro": "",
                "director": "",             //Se agregan los campos para guardar el codigo de aprobadores
                "responsableEgresos": "",   //****************************** */
                "vbDirecion": false,        //****************************** */
                "sustentoText": "",
                "usuarioResponsableNombres": ""
            }
            ), "provisionDetModel")

            //"cbDireccion","cbAreas","idDpPeriodo",
            let aIds = ["cboProvisionConOc", "txtProvisionOC", "idInputCuentaContable", "idInputCentroCosto", "txtCentroGestor", "txtOrdenInterna", "cboTipoPago", "txtDescServicio", "idInputProveedor", "txtMonto", "cboMoneda"];
            for (let i = 0; i < aIds.length; i++) {
                this.byId(aIds[i]).setValueState(sap.ui.core.ValueState.None);
                this.byId(aIds[i]).setValueStateText("");
            }
            //that.getModel("provisionCabModel").setProperty("/direccion_ID", "");
            //that.getModel("provisionCabModel").setProperty("/area", "");
        },

        _getGerenciaJefaturaBBDD: async function () {

            try {

                const gerenciasJefaturas = await that.readEntity(empleadoModel, "/AreasSet", [new Filter("FlagJefe", "EQ", "X")]);

                oModel.setProperty("/GerenciasJefaturas", gerenciasJefaturas.results)

            } catch (error) {

                MessageBox.error(error)

            }

        },
        _getTiposPagoBBDD: async function () {

            try {

                const tiposPago = await that.readEntity(provisionModel, "/TipoPago", []);

                oModel.setProperty("/TiposPago", tiposPago.results)

            } catch (error) {

                MessageBox.error(error)

            }

        },
        _getTiposGastoBBDD: async function () {

            try {

                const tiposGasto = await that.readEntity(provisionModel, "/TipoGasto", []);

                oModel.setProperty("/TiposGasto", tiposGasto.results)

            } catch (error) {

                MessageBox.error(error)

            }

        },
        _getTiposServicioBBDD: async function () {

            try {

                const tiposServicio = await that.readEntity(provisionModel, "/TipoServicio", []);

                oModel.setProperty("/TiposServicio", tiposServicio.results)

            } catch (error) {

                MessageBox.error(error)

            }

        },

        onSuggestCentroCosto: function (event) {
            const value = event.getParameter("suggestValue"),
                input = event.getSource(),
                options = {
                    input,
                    field: "Kostl",
                    value: value,
                    entity: "CentroCostoSet",
                    property: "centrosCosto"
                };
            if (value) {
                this._getFiltrosService(options);
            }
        },
        onSuggestCentroGestor: function (event) {
            const value = event.getParameter("suggestValue"),
                input = event.getSource(),
                options = {
                    input,
                    field: "FICTR",
                    value: value,
                    entity: "CentroGestorSet",
                    property: "centroGestor"
                };
            if (value) {
                this._getFiltrosService(options);
            }
        },
        onSuggestOrdenInterna: function (event) {
            const value = event.getParameter("suggestValue"),
                input = event.getSource(),
                options = {
                    input,
                    field: "AUFNR",
                    value: value,
                    entity: "OrdenInternaSet",
                    property: "ordenInterna"
                };
            if (value) {
                this._getFiltrosService(options);
            }
        },
        onSuggestCuentaContable: function (event) {
            const value = event.getParameter("suggestValue"),
                input = event.getSource(),
                options = {
                    input,
                    field: "Saknr",
                    value: value,
                    entity: "CuentaContableSet",
                    property: "cuentasContable"
                };
            if (value) {
                this._getFiltrosService(options);
            }
        },
        onSuggestProveedor: function (event) {
            const value = event.getParameter("suggestValue"),
                input = event.getSource(),
                options = {
                    input,
                    field: "Lifnr",
                    value: value,
                    entity: "ProveedorSet",
                    property: "proveedores"
                };
            if (value) {
                this._getFiltrosService(options);
            }
        },
        _getFiltrosService: async function (options) {
            const filters = []
            if (options.field) {
                filters.push(new Filter(options.field, "EQ", `${options.value}`))
            }
            options.input.setBusy(true)
            const provisiones = await that.readEntity(provisionSAPModel, `/${options.entity}`, { filters })
            oModel.setProperty(`/${options.property}`, provisiones.results)
            options.input.setBusy(false);
        },

        _getRubro: async function () {

            const oInputs = that.getModel("provisionDetModel")

            let cuentaContable = separarCodigoYTexto(oInputs.getProperty("/cuentaContable")).codigo
            let centroCosto = separarCodigoYTexto(oInputs.getProperty("/centroCosto")).codigo
            let centroGestor = separarCodigoYTexto(oInputs.getProperty("/centroGestor")).codigo
            let ordenInterna = separarCodigoYTexto(oInputs.getProperty("/ordenInterna")).codigo

            if (centroGestor && cuentaContable && centroCosto || ordenInterna) {
                try {
                    let oReturn = await this.readEntity(provisionSAPModel, `/Get_RubroSet(CenGestor='${centroGestor}',CuentaContab='${cuentaContable}',CentCoste='${centroCosto}',OrdInterna='${ordenInterna}')`, {})
                    if (oReturn.Descripcion) {
                        oInputs.setProperty("/rubro", oReturn.Descripcion)
                    } else {
                        oInputs.setProperty("/rubro", "")
                    }

                    let aFilter = [];
                    aFilter.push(new Filter("cuentaContable", "EQ", cuentaContable))
                    aFilter.push(new Filter("centroCosto", "EQ", centroCosto))
                    aFilter.push(new Filter("centroGestor", "EQ", centroGestor))
                    aFilter.push(new Filter("ordenInterna", "EQ", ordenInterna))

                    let aAsignacion = await this._getAsignacionIndividualExcel(aFilter);
                    if (aAsignacion.results.length) {
                        //oInputs.setProperty("/rubro", aAsignacion.results[0].rubro)
                        //oInputs.setProperty("/usuarioResponsable", aAsignacion.results[0].responsable);
                        //that.getModel("provisionDetModel").setProperty("/usuarioResponsableNombres", aAsignacion.results[0].nomCompletoResponsable);
                    }
                } catch (error) {
                    oInputs.setProperty("/rubro", "")
                    //MessageBox.error(error)
                    return "Error"

                }
            }

            function separarCodigoYTexto(sText) {
                let partes = sText.split(" - ");
                let codigo = partes[0];
                let texto = "";
                $.each(partes, (key, value) => {
                    if (key > 1) {
                        texto = texto + " - " + value;
                    } else if (key == 1) {
                        texto = value
                    }
                })
                return {
                    codigo: codigo,
                    texto: texto
                };
            }

        },

        onAddDetalle: async function () {

            if (!that.byId("fDatosGeneralesProvision--cbResponsableCab").getSelectedItem()) {
                MessageBox.error("Por favor, seleccionar Dirección y Responsable.")
                sap.ui.core.BusyIndicator.hide()
                return
            }
            //se agrega el bloqueo del boton hasta que termine de validar
            that.byId("agreInd").setEnabled(false)
            //
            let oDetailProvision = that.getModel("provisionDetModel").getData()
            let oCabProvision = that.getModel("provisionCabModel").getData()
            let oValidate = this.fnValidarCampos(oDetailProvision)
            let oUserResponsable = that.byId("fDatosGeneralesProvision--cbResponsableCab").getSelectedItem()

            if (!oValidate.isdValid) {
                let arryListValueObli = oValidate.valueObli;
                let listmess = "<ul>";
                for (let i = 0; i < arryListValueObli.length; i++) {
                    listmess = listmess + "<li>" + arryListValueObli[i] + "</li>";
                }
                listmess = listmess + "</ul>"

                MessageBox.error("Por favor, completar los datos obligatorios", {
                    title: "Error",
                    id: "messageBoxValueObl",
                    details: listmess,
                    contentWidth: "100px",
                });
                that.byId("agreInd").setEnabled(true)
                //MessageBox.error(oValidate.message);
                return;
            }

            //TRAER DESCRIPCIONES DE IMPUTACIONES - NTT - MR

            oDetailProvision.cuentaContableDesc = await this.getTextForKey("Saknr", oDetailProvision.cuentaContable, "CuentaContableSet", "cuentasContable", "Saknr", "Txt50");
            oDetailProvision.centroCostoDesc = await this.getTextForKey("Kostl", oDetailProvision.centroCosto, "CentroCostoSet", "centrosCosto", "Kostl", "Ktext");
            oDetailProvision.centroGestorDesc = await this.getTextForKey("FICTR", oDetailProvision.centroGestor, "CentroGestorSet", "centroGestor", "BESCHR", "FICTR");
            oDetailProvision.ordenInternaDesc = await this.getTextForKey("AUFNR", oDetailProvision.ordenInterna, "OrdenInternaSet", "ordenInterna", "AUFNR", "KTEXT");
            oDetailProvision.proveedorNombre = await this.getTextForKey("Lifnr", oDetailProvision.proveedor, "ProveedorSet", "proveedores", "Lifnr", "Name1");

            //TRAER DESCRIPCIONES DE IMPUTACIONES - NTT - MR

            //TRAER Y VALIDAR MONEDA - NTT - MR

            if (oDetailProvision.provisionConOC === "1") {

                const { bValidado, tipoDocumento, mensaje } = that._evaluarTipoDocumentoAprovisionamiento(oDetailProvision.sustento, oDetailProvision.posicion, true)

                if (!bValidado) {
                    MessageBox.error(mensaje)
                    that.byId("agreInd").setEnabled(true)
                    return
                }

                const oOcs = await this.readEntity(provisionSAPModel,
                    `/DocumentoAprovisionamientoSet(Documento='${oDetailProvision.sustento}',Posicion='${oDetailProvision.posicion.toString()}',TipoDocumento='${tipoDocumento}')`, {})

                if (!oOcs.CuentaContab) {
                    MessageBox.error("No se encontró el documento ingresado")
                    that.byId("agreInd").setEnabled(true)
                    return
                }

                if (oOcs.Moneda !== oDetailProvision.moneda) {
                    MessageBox.error("La moneda ingresada es diferente a la moneda del documento ingresado.")
                    that.byId("agreInd").setEnabled(true)
                    return
                }

            }

            //TRAER Y VALIDAR MONEDA - NTT - MR

            oDetailProvision = that._getDataValueHelp(oDetailProvision)

            oDetailProvision.monto = parseFloat(oDetailProvision.monto)

            oDetailProvision = await that.onValidarDetalleIndividual(oDetailProvision, oCabProvision)

            if (oDetailProvision) {
                let dataDetail = that.getModel("detalleProv").getData()

                // if (dataDetail.length == 0) {
                //     let aFilter = [];
                //     aFilter.push(new Filter("cuentaContable", "EQ", oDetailProvision.cuentaContable))
                //     aFilter.push(new Filter("centroCosto", "EQ", oDetailProvision.centroCosto))
                //     aFilter.push(new Filter("centroGestor", "EQ", oDetailProvision.centroGestor))
                //     aFilter.push(new Filter("ordenInterna", "EQ", that.completarCerosIzquierda(oDetailProvision.ordenInterna, 12) ))
                //     let aAsignacion = await this._getAsignacionIndividual(aFilter);
                //     let findMantProv = aAsignacion.results.length > 0 ? aAsignacion.results[0] : false
                //     if (findMantProv) {
                //         that.setDatosCabDescription(findMantProv);
                //     } else {
                //         MessageBox.error("Los datos ingresados no existen en la tabla de Asignaciones.")
                //         return;
                //     }
                // }

                oDetailProvision.responsableEgresos = oCabProvision.responsableEgresos // validar con diferentes responsables
                oDetailProvision.usuarioResponsable = oUserResponsable.getKey() + " - " + oUserResponsable.getText();
                oDetailProvision.responsable = oUserResponsable.getKey();
                oDetailProvision.usuarioResponsableNombres = oUserResponsable.getText();
                dataDetail.push(oDetailProvision)

                let pos = 1;
                // Recorrer el array y asignar las nuevas posiciones
                for (let obj of dataDetail) {
                    // Generar la nueva posición con formato de 4 dígitos
                    obj.posicionTabla = pos.toString().padStart(4, '0');
                    // Incrementar la posición para el siguiente objeto
                    pos += 1;
                    if (obj.sustento == "") {
                        obj.posicion = "";
                    }

                }
                that.getModel("detalleProv").refresh()

                that.calcularMontos()
                that._validarDisponibilidadGuardado()
                that.onCleanFormDetalle()
                bValidateCab = true
            }
            // else {
            //     MessageBox.error("Ha ocurrido un error. Por favor, ingresar nuevamente los datos.")
            // }

            function obtenerUsuRegistra(cuentaContable, centroCosto, centroGestor, ordenInterna) {
                let aAreas = aGlobalIndividual.results.filter(oPos => oPos.centroCosto === centroCosto && oPos.centroGestor === centroGestor && oPos.cuentaContable === cuentaContable && oPos.ordenInterna === completarCerosIzquierda(ordenInterna, 12))
                if (aAreas.length > 0) {
                    return aAreas[0];
                } else {
                    return false;
                }
            }
            that.byId("agreInd").setEnabled(true)
        },

        _getDataValueHelp: function (oDetailProvision) {


            let bValidarCuenta = validarTexto(oDetailProvision.cuentaContable)

            if (bValidarCuenta) {
                oDetailProvision.cuentaContableDesc = separarCodigoYTexto(oDetailProvision.cuentaContable).texto
                oDetailProvision.cuentaContable = separarCodigoYTexto(oDetailProvision.cuentaContable).codigo
            }

            if (oDetailProvision.proveedorNombre && oDetailProvision.cuentaContableDesc &&
                oDetailProvision.centroCostoDesc && oDetailProvision.centroGestorDesc ||
                oDetailProvision.ordenInternaDesc
            ) {

                if (oDetailProvision.centroCosto.indexOf("-") > 0) {
                    oDetailProvision.centroCostoDesc = separarCodigoYTexto(oDetailProvision.centroCosto).texto
                    oDetailProvision.centroCosto = separarCodigoYTexto(oDetailProvision.centroCosto).codigo
                }

                if (oDetailProvision.proveedor.indexOf("-") > 0) {
                    oDetailProvision.proveedorNombre = separarCodigoYTexto(oDetailProvision.proveedor).texto
                    oDetailProvision.proveedor = separarCodigoYTexto(oDetailProvision.proveedor).codigo
                }

                if (oDetailProvision.centroGestor.indexOf("-") > 0) {
                    oDetailProvision.centroGestorDesc = separarCodigoYTexto(oDetailProvision.centroGestor).texto
                    oDetailProvision.centroGestor = separarCodigoYTexto(oDetailProvision.centroGestor).codigo
                }

                if (oDetailProvision.ordenInterna) {
                    if (oDetailProvision.ordenInterna.indexOf("-") > 0) {
                        oDetailProvision.ordenInternaDesc = separarCodigoYTexto(oDetailProvision.ordenInterna).texto
                        oDetailProvision.ordenInterna = separarCodigoYTexto(oDetailProvision.ordenInterna).codigo
                    }
                }

                if (oDetailProvision.cuentaContable.indexOf("-") > 0) {
                    oDetailProvision.cuentaContableDesc = separarCodigoYTexto(oDetailProvision.cuentaContable).texto
                    oDetailProvision.cuentaContable = separarCodigoYTexto(oDetailProvision.cuentaContable).codigo
                }

                return oDetailProvision;
            }

            let bFValidarCuenta = validarTexto(oDetailProvision.cuentaContable)

            if (bFValidarCuenta) {
                oDetailProvision.cuentaContableDesc = separarCodigoYTexto(oDetailProvision.cuentaContable).texto
                oDetailProvision.cuentaContable = separarCodigoYTexto(oDetailProvision.cuentaContable).codigo
            }

            oDetailProvision.proveedorNombre = separarCodigoYTexto(oDetailProvision.proveedor).texto
            oDetailProvision.proveedor = separarCodigoYTexto(oDetailProvision.proveedor).codigo

            oDetailProvision.centroCostoDesc = separarCodigoYTexto(oDetailProvision.centroCosto).texto
            oDetailProvision.centroCosto = separarCodigoYTexto(oDetailProvision.centroCosto).codigo

            oDetailProvision.centroGestorDesc = separarCodigoYTexto(oDetailProvision.centroGestor).texto
            oDetailProvision.centroGestor = separarCodigoYTexto(oDetailProvision.centroGestor).codigo

            if (oDetailProvision.ordenInterna) {
                oDetailProvision.ordenInternaDesc = separarCodigoYTexto(oDetailProvision.ordenInterna).texto
                oDetailProvision.ordenInterna = separarCodigoYTexto(oDetailProvision.ordenInterna).codigo
            }


            return oDetailProvision

            function separarCodigoYTexto(sText) {
                let partes = sText.split(" - ");
                let codigo = partes[0];
                //cambio porque pueden venir descripciones separadas por - en el texto
                let texto = "";
                $.each(partes, (key, value) => {
                    if (key > 1) {
                        texto = texto + " - " + value;
                    } else if (key == 1) {
                        texto = value
                    }
                })
                return {
                    codigo: codigo,
                    texto: texto
                };
            }

            function validarTexto(tex) {
                let soloNumeros = /^\d+$/;

                if (soloNumeros.test(tex)) {
                    return false;
                } else {
                    return true;
                }
            }

        },

        calcularMontos: function () {

            let dataDetail = that.getModel("detalleProv").getData()
            let totalMontoUSD = 0
            let totalMontoPEN = 0

            let aMonedaUSD = dataDetail.filter(oPos => oPos.moneda === "USD")
            $.each(aMonedaUSD, (key, value) => {
                totalMontoUSD += parseFloat(value.monto);
            })

            let aMonedaPEN = dataDetail.filter(oPos => oPos.moneda === "PEN")
            $.each(aMonedaPEN, (key, value) => {
                totalMontoPEN += parseFloat(value.monto);
            })

            //const sMoneda = dataDetail[0].moneda
            //viewModel.setProperty("/monedaProvision", sMoneda)
            viewModel.setProperty("/montoSoles", totalMontoPEN.toFixed(2))
            viewModel.setProperty("/montoDolares", totalMontoUSD.toFixed(2))

        },

        inputToInteger: function (oEvent) {
            var _oInput = oEvent.getSource();
            var regex = /^[0-9]+$/;
            var input = _oInput.getValue();
            if (!input.match(regex)) {
                _oInput.setValue("");
            }
        },

        onValidarDetalleIndividual: async function (oDetailProvision, oCabProvision) {

            const oDataValidacionFront = that.onValidarFilaIngresada(oDetailProvision)
            const oDetailOld = oDetailProvision;

            if (oDataValidacionFront.Estado) {
                const oDataSend = that.onPrepareDataToSAPValidation(oDetailProvision, oCabProvision)

                let aDataSAPValidated = await that._validarFilasSAP([oDataSend])

                if (aDataSAPValidated != "Error") {
                    if (aDataSAPValidated.UsuarioMensaje == null || aDataSAPValidated.UsuarioMensaje.results.length == 0) {
                        let aDataForTableResults = that._procesarDataValidadaSAP(aDataSAPValidated)
                        oDetailProvision = aDataForTableResults[0]
                        oDetailProvision.usuarioResponsable = oDetailOld.usuarioResponsable;
                        oDetailProvision.director = oDetailOld.director;
                        oDetailProvision.responsableEgresos = oDetailOld.responsableEgresos;
                        oDetailProvision.vbDirecion = oDetailOld.vbDirecion;
                        oDetailProvision.rubro = oDetailOld.rubro;
                        oDetailProvision.usuarioResponsable = oDetailOld.usuarioResponsable;
                        oDetailProvision.sustentoText = oDetailOld.sustentoText;
                        oDetailProvision.usuarioResponsableNombres = oDetailOld.usuarioResponsableNombres;
                        oDetailProvision.proveedorNombre = oDetailOld.proveedorNombre

                        oDetailProvision.centroCostoDesc = oDetailProvision.centroCostoDesc == "" ? oDetailOld.centroCostoDesc : oDetailProvision.centroCostoDesc
                        oDetailProvision.centroGestorDesc = oDetailProvision.centroGestorDesc == "" ? oDetailOld.centroGestorDesc : oDetailProvision.centroGestorDesc
                        oDetailProvision.cuentaContableDesc = oDetailProvision.cuentaContableDesc == "" ? oDetailOld.cuentaContableDesc : oDetailProvision.cuentaContableDesc
                        oDetailProvision.ordenInternaDesc = oDetailProvision.ordenInternaDesc == "" ? oDetailOld.ordenInternaDesc : oDetailProvision.ordenInternaDesc
                        oDetailProvision.cuentaContable = oDetailOld.cuentaContable
                        oDetailProvision.idTipoGasto_idTipoGasto = oDetailOld.idTipoGasto_idTipoGasto
                        oDetailProvision.idTipoServicio_idTipoServicio = oDetailOld.idTipoServicio_idTipoServicio


                        // oDetailProvision.Estado = false
                        return oDetailProvision
                    } else {
                        let oResult = await this.onMostrarMensajesIndividual(aDataSAPValidated.UsuarioMensaje.results);
                        return false;
                    }
                } else {
                    return false;
                }


            } else {
                return oDataValidacionFront
            }

        },

        onValidarDetalleForMasivo: function (oDetailProvision) {

            const oDataValidacionFront = that.onValidarFilaIngresada(oDetailProvision)

            return oDataValidacionFront

        },

        onValidarFilaIngresada: function (oDetailProvision) {

            let aDetalleProvisionCargado = that.getModel("detalleProv").getData()

            let dataTiposDePago = oModel.getProperty("/TiposPago"),
                dataTiposDeGasto = oModel.getProperty("/TiposGasto"),
                dataTiposDeServicio = oModel.getProperty("/TiposServicio")

            if (oDetailProvision.sustento !== "") {

                if (oDetailProvision.sustento.length > 10)
                    return { ...oDetailProvision, Estado: false, Mensaje: "Campo OC/SOLPED/PA - Límite de caracteres superado (10)" }

                if (oDetailProvision.posicion === "") {
                    return { ...oDetailProvision, Estado: false, Mensaje: "Campo Posición Incompleto" }
                } else {

                    if (oDetailProvision.posicion.length > 5)
                        return { ...oDetailProvision, Estado: false, Mensaje: "Campo Posición - Límite de caracteres superado (5)" }

                    if (aDetalleProvisionCargado.find(oPos =>
                        oPos.sustento == oDetailProvision.sustento &&
                        oPos.posicion == oDetailProvision.posicion &&
                        oPos.monto == oDetailProvision.monto)) {
                        return { ...oDetailProvision, Estado: false, Mensaje: "Registro duplicado" }
                    }
                }
            }

            if (oDetailProvision.cuentaContable === "")
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Cuenta Contable Incompleto" }
            else if (oDetailProvision.cuentaContable.length > 10)
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Cuenta Contable - Límite de caracteres superado (10)" }

            if (oDetailProvision.centroCosto === "")
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Centro de Costo Incompleto" }
            else if (oDetailProvision.centroCosto.length > 10)
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Centro de Costo - Límite de caracteres superado (10)" }

            if (oDetailProvision.centroGestor === "")
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Centro Gestor Incompleto" }
            else if (oDetailProvision.centroCosto.length > 16)
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Centro de Costo - Límite de caracteres superado (16)" }

            if (oDetailProvision.ordenInterna !== "" && oDetailProvision.ordenInterna.length > 12)
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Orden Interna - Límite de caracteres superado (12)" }

            if (oDetailProvision.proveedor !== "" && oDetailProvision.proveedor.length > 10)
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Proveedor - Límite de caracteres superado (19)" }

            if (oDetailProvision.idTipoPago_idTipoPago === "" ||
                oDetailProvision.idTipoPago_idTipoPago.length > 1 ||
                !dataTiposDePago.find((x) => x.idTipoPago === oDetailProvision.idTipoPago_idTipoPago))
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Tipo de Pago No Válido" }

            if (oDetailProvision.idTipoGasto_idTipoGasto === "" ||
                oDetailProvision.idTipoGasto_idTipoGasto.length > 1 ||
                !dataTiposDeGasto.find((x) => x.idTipoGasto === oDetailProvision.idTipoGasto_idTipoGasto))
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Tipo de Gasto No Válido" }

            if (oDetailProvision.idTipoServicio_idTipoServicio === "" ||
                oDetailProvision.idTipoServicio_idTipoServicio.length > 1 ||
                !dataTiposDeServicio.find((x) => x.idTipoServicio === oDetailProvision.idTipoServicio_idTipoServicio))
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Tipo de Servicio No Válido" }

            if (oDetailProvision.periodoGasto === "")
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Mes Servicio Incompleto" }

            const partes = oDetailProvision.periodoGasto.split("-"); // ["2024", "10", "01"]
            const dFechaPeriodo = new Date(partes[0], partes[1] - 1, partes[2]); // Restamos 1 al mes

            if (dFechaPeriodo.getMonth() > new Date().getMonth()
                && dFechaPeriodo.getFullYear() >= new Date().getFullYear()) {
                return { ...oDetailProvision, Estado: false, Mensaje: "No se permiten fechas posteriores a la actual" }
            }

            if (oDetailProvision.monto === "")
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Monto Incompleto" }
            else if (isNaN(Number(oDetailProvision.monto)))
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Monto - El dato ingresado no es un número" }

            if (oDetailProvision.moneda === "")
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Moneda Incompleto" }
            else if (oDetailProvision.moneda.length > 5)
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Moneda - Límite de caracteres superado (5)" }

            if (oDetailProvision.sustentoText !== "" && oDetailProvision.sustentoText.length > 16)
                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Sustento - Límite de caracteres superado (16)" }

            if (aDetalleProvisionCargado.find(oPos =>
                oPos.centroCosto == oDetailProvision.centroCosto &&
                oPos.centroGestor == oDetailProvision.centroGestor &&
                oPos.cuentaContable == oDetailProvision.cuentaContable &&
                oPos.proveedor == oDetailProvision.proveedor &&
                oPos.ordenInterna == oDetailProvision.ordenInterna &&
                oPos.monto == oDetailProvision.monto)
            ) {
                return { ...oDetailProvision, Estado: false, Mensaje: "Registro duplicado" }
            }

            return { ...oDetailProvision, Estado: true, Mensaje: "" }
        },

        //Procesar datos del modelo que van a ir SAP para su validación
        onPrepareDataToSAPValidation: function (oData, oCabProvision = {}) {
            // let sDireccion = oCabProvision ? oCabProvision.direccion_ID : oData.direccion_ID_direccion_ID,
            //     sArea = oCabProvision ? oCabProvision.area : oData.area_ID_area_ID;

            return {
                UsuRegistra: that.byId("fDatosGeneralesProvision--cbResponsableCab").getSelectedItem().getBindingContext("aResponsable").getObject().responsableEgresos,
                IdProvision: oData.IdProvision,
                NombUsuario: "",
                Responsable: oData.usuarioResponsable,
                Direccion: "",
                Area: "",
                ProvisionConOc: oData.provisionConOC,
                Descripcion: oData.rubro,
                CuentaContable: oData.cuentaContable,
                DescCuentaContab: "",
                Monto: oData.monto.toFixed ? oData.monto.toFixed(2) : oData.monto,
                TipoMoneda: oData.moneda,
                CentroCosto: oData.centroCosto,
                DescCentroCosto: "",
                CentroGestor: oData.centroGestor,
                DescCentroGestor: "",
                OrdenInterna: oData.ordenInterna,
                DescOrdenInterna: "",
                TipoPago: oData.idTipoPago_idTipoPago.toString(),
                DocCompra: oData.sustento,
                Posicion: oData.posicion,
                MesProvisionar: that._formatDate(oData.periodoGasto).substring(0, 7).replace("-", ""),
                DescrServicio: oData.descripcionServicio,
                CodigoProveedor: oData.proveedor,
                NombreProveedor: "",
                Sustento: oData.sustentoText ? oData.sustentoText : "",
                Validado: false,
                Motivo: "",
                Rubro: "",
                Nivel: "",
                DescRubro: "",
            }

        },

        //Procesar datos de resultados que vienen de SAP
        onPrepareDataToTableResult: function (oData) {

            return {
                idProvision: oData.IdProvision,
                usuarioResponsable: oData.UsuRegistra,
                usuarioResponsable: oData.NombUsuario,
                cuentaContable: oData.CuentaContable,
                cuentaContableDesc: oData.DescCuentaContab,
                monto: oData.Monto,
                moneda: oData.TipoMoneda,
                centroCosto: oData.CentroCosto,
                centroCostoDesc: oData.DescCentroCosto,
                centroGestor: oData.CentroGestor,
                centroGestorDesc: oData.DescCentroGestor,
                ordenInterna: oData.OrdenInterna,
                ordenInternaDesc: oData.DescOrdenInterna,
                idTipoPago_idTipoPago: oData.TipoPago,
                sustento: oData.DocCompra,
                posicion: oData.Posicion,
                periodoGasto: oData.MesProvisionar,
                descripcionServicio: oData.DescrServicio,
                proveedor: oData.CodigoProveedor,
                proveedorNombre: oData.NombreProveedor,
                rubro: oData.Rubro,
                sustentoText: oData.Sustento,
                Estado: oData.Validado,
                Mensaje: oData.Motivo,
            }

        },

        onVerMotivo: function (oEvent) {

            let oDetProvision = oEvent.getSource().getBindingContext("detalleProv").getObject()

            MessageBox.error(oDetProvision.Mensaje)
        },

        descargarLogResultados: function () {

            const modelDetalleProvision = that.getModel("detalleProv")
            let bSoloErrores = false

            if (!modelDetalleProvision || modelDetalleProvision.getData().length === 0) {
                sap.m.MessageBox.warning("No existen datos para exportar.")
                return
            }

            MessageBox.confirm("¿Desea descargar todos los resultados o sólo los errores?", {
                title: "Elija una opción",
                actions: ["Solo Errores", "Todos los Resultados"],
                emphasizedAction: "Solo Errores",
                onClose: (sAction) => {
                    if (sAction === "Solo Errores") bSoloErrores = true
                    Exportation.exportLogResultados(modelDetalleProvision, that.getView().getModel("i18n").getResourceBundle(), bSoloErrores)
                    MessageToast.show("Descargando log de resultados ...")
                }
            })

        },

        _validarDisponibilidadGuardado: function () {

            const detalleProvision = that.getModel("detalleProv").getData()
            const bValidado = detalleProvision.findIndex(x => x.Estado === false)

            viewModel.setProperty("/bSave", (bValidado < 0))

        },

        onNavBack: function () {
            this.getRouter().navTo("RouteHome");
        },

        onAddMontos: function () {

            const sProveedor = that.getView().byId("frgMasivoProvision--idInputProveedor").getValue();
            const dFechaPeriodo = that.getView().byId("frgMontoProvision--idDpPeriodo").getDateValue();
            const nMonto = that.getView().byId("frgMontoProvision--idInputMontoProvision").getValue();

            let oModelTable = that.getView().getModel();

            let oDataTable = oModelTable.getData();

            oDataTable.montos.push({
                monto: nMonto, proveedor: sProveedor, periodoProv: dFechaPeriodo,
                // fechaIng: UI5Date.getInstance()
            })

            oModelTable.refresh();

            that.getView().byId("frgMontoProvision--idInputProveedor").setValue("")
            that.getView().byId("frgMontoProvision--idDpPeriodo").setValue("")
            that.getView().byId("frgMontoProvision--idInputMontoProvision").setValue("")


        },

        onChangeNoProvision: function () {
            let dataCab = that.getModel("provisionCabModel").getData();
            let oApertura = oModel.getProperty("/AperturasConfiguradas");

            if (!oApertura[0]) {
                MessageBox.error("Por favor, configurar una nueva apertura de asignación.");
                return;
            }

            oApertura = oApertura[0];

            // Obtener mes y año de dataCab.periodoCierre
            let mesCierre = dataCab.periodoCierre ? dataCab.periodoCierre.getMonth() : null;
            let añoCierre = dataCab.periodoCierre ? dataCab.periodoCierre.getFullYear() : null;

            // Obtener mes y año de oApertura.valor1 y oApertura.valor2
            let mesInicio = oApertura.valor1.getMonth();
            let añoInicio = oApertura.valor1.getFullYear();
            let mesFin = oApertura.valor2.getMonth();
            let añoFin = oApertura.valor2.getFullYear();

            // Validar que dataCab.periodoCierre esté dentro del rango de oApertura.valor1 y oApertura.valor2
            if (dataCab.periodoCierre) {
                if (
                    (añoCierre > añoInicio || (añoCierre === añoInicio && mesCierre >= mesInicio)) &&
                    (añoCierre < añoFin || (añoCierre === añoFin && mesCierre <= mesFin))
                ) {
                    // En rango
                    viewModel.setProperty("/bSave", true);
                } else {
                    // Fuera de rango
                    dataCab.periodoCierre = null;
                    that.getView().setModel(new JSONModel(dataCab), "provisionCabModel");
                    MessageBox.error("La fecha seleccionada no está dentro del rango permitido.");
                    viewModel.setProperty("/bSave", false);
                }
            } else {
                viewModel.setProperty("/bSave", false);
            }
        },

        onGuardarProvision: async function () {
            sap.ui.core.BusyIndicator.show(0)
            let dataCab = that.getModel("provisionCabModel").getData()
            let dataDetail = that.getModel("detalleProv").getData()

            if (!dataCab.direccion_ID || that.byId("fDatosGeneralesProvision--cbDireccionCab").getSelectedKey() == "") {
                MessageBox.error("Por favor, seleccionar una dirección")
                sap.ui.core.BusyIndicator.hide()
                return;
            }

            if (!dataCab.responsable || that.byId("fDatosGeneralesProvision--cbResponsableCab").getSelectedKey() == "") {
                MessageBox.error("Por favor, seleccionar usuario responsable")
                sap.ui.core.BusyIndicator.hide()
                return;
            }

            if (this.byId("cbRubro").getSelectedKey() == "NUEVO RUBRO" && this.byId("cbRubro").getItems().length > 1) {
                MessageBox.error("Por favor, seleccionar el rubro correctamente.")
                sap.ui.core.BusyIndicator.hide()
                return;
            }

            if (dataDetail.length === 0) {
                MessageBox.error("Debe haber al menos 1 posición.")
                sap.ui.core.BusyIndicator.hide()
                return;
            }

            let bAsignarAprob = await this._getAprobadores(dataCab.direccion_ID, dataCab.responsable)
            if (!bAsignarAprob) {
                MessageBox.error("No existe aprobadores para la dirección y responsable seleccionado.")
                sap.ui.core.BusyIndicator.hide()
                return;
            }

            let oValidate = this.fnValidarCabecera(dataCab)
            if (!oValidate.isdValid) {
                MessageBox.error("Por favor, completar el campo Periódo de Gasto.")
                sap.ui.core.BusyIndicator.hide()
                return
            }

            const oDataSend = that.getDataToSend(),
                maxFilas = oModel.getProperty("/MaximoFilas")

            if (oDataSend.detallesProvision.length > maxFilas) {
                MessageBox.error(`La cantidad de filas cargadas supera el límite configurado en el sistema (${maxFilas}).`)
                sap.ui.core.BusyIndicator.hide()
                return
            }

            if (dataCab.indicadorNoProvision) {
                delete oDataSend.direccion_ID
            }

            try {

                const provisionCreated = await that.createEntity(provisionModel, "/Provision", oDataSend)              
                //Se agrega la logica para guardar los documentos en el DMS luego de que ya se creo la provisión
                const oModel = this.getView().getModel("archivos");               
                const archivos = oModel.getProperty("/items");
                if (!archivos || archivos.length === 0) {
                    MessageBox.success(`Provisión ${provisionCreated.idProvision} guardada con éxito.`, {
                        onClose: function (sAction) {
                            sap.ui.core.BusyIndicator.hide()
                            that.onNavBack()
                        }
                    });
                    return;
                }else{
                    //Se llama la funcion para crear el folder en el DMS basado en el numero de solicitud
                    await this.getFolder(provisionCreated.idProvision);
                    await this.onSubirDocumentosDMS(provisionCreated.idProvision);
                    //se llama la función para subir los documentos luego que se creo el folder del DMS
                    MessageBox.success(`Provisión ${provisionCreated.idProvision} guardada con éxito.`, {
                        onClose: function (sAction) {
                            sap.ui.core.BusyIndicator.hide()
                            that.onNavBack()
                        }
                    });
                }
                

            } catch (error) {

                let mensajeError = {}

                mensajeError.entidad = "Provision"
                mensajeError.error = error.innererror.errordetails

                MessageBox.error('Por favor, haga click y envíe el detalle al equipo de TI.', {
                    title: "Ha ocurrido un error en HANA",
                    contentWidth: "40rem",
                    details: mensajeError
                })

                sap.ui.core.BusyIndicator.hide()
                MessageBox.error(error)
            }

        },

        getDataToSend: function () {

            let oData = {}
            let dataCab = that.getModel("provisionCabModel").getData()
            const bNoProvision = dataCab.indicadorNoProvision
            let dataDetail = that.getModel("detalleProv").getData()

            oData = Object.assign(that.onGetModelProvCabService(), dataCab)

            oData.fechaRegistro = that._formatDate(oData.fechaRegistro)
            oData.fechaModificacion = that._formatDate(oData.fechaModificacion)
            oData.fechaEnvio = that._formatDate(oData.fechaEnvio)
            oData.periodoCierre = oData.periodoCierre == "" ? null : that._formatDateCierre(oData.periodoCierre)
            oData.detallesProvision = []

            oData.responsableEgresos = dataCab.responsableEgresos;
            oData.director = dataCab.director;
            oData.vbDirecion = dataCab.vbDirecion
            oData.responsable = dataCab.responsable;
            oData.direccionDesc = dataCab.direccionDesc;
            oData.areaDesc = dataCab.areaDesc;
            oData.responsableDesc = dataCab.responsableDesc;
            oData.directorDesc = dataCab.directorDesc;
            oData.responsableEgresosDesc = dataCab.responsableEgresosDesc;
            oData.planificadorDesc = dataCab.planificadorDesc;
            oData.planificador = dataCab.planificador;
            oData.direccion = dataCab.direccion_ID

            //Guardar monto en moneda provisionada
            const monedaProvision = viewModel.getProperty("/monedaProvision")

            if (monedaProvision === "PEN") oData.monto = viewModel.getProperty("/montoSoles")
            if (monedaProvision === "USD") oData.monto = viewModel.getProperty("/montoDolares")
            oData.moneda = monedaProvision

            if (!bNoProvision) {

                for (let index = 0; index < dataDetail.length; index++) {

                    const oDetailProvision = that.onGetModelProvDetService()
                    const element = dataDetail[index];

                    // if (element.periodoGasto.length === 2 || element.periodoGasto.length === 1) {
                    //     element.periodoGasto = new Date(`${new Date().getFullYear()}-${element.periodoGasto}-01`)
                    // }

                    element.periodoGasto = that._formatDate(element.periodoGasto)
                    //element.periodoGasto = oData.periodoCierre

                    //Formatear montos
                    element.monto = parseFloat(element.monto.toFixed(2))

                    const elementDetail = Object.assign(oDetailProvision, element)

                    delete elementDetail.Estado
                    delete elementDetail.Mensaje
                    delete elementDetail.idProvision
                    delete elementDetail.IdProvision
                    delete elementDetail.rubro_ID
                    delete oData.direccion_ID
                    delete elementDetail.responsable
                    //añade por id
                    delete elementDetail.posicionTabla

                    oData.detallesProvision.push(elementDetail)

                }

            }

            delete oData.gerenciaJefaturaSolicitante_Desc
            delete oData.gerenciaJefaturaSolicitante_ID
            return oData
        },

        _validarFilasSAP: async function (aData) {

            const oDataSend = that.getFormatForServiceSAP(aData)

            try {
                provisionSAPModel.setUseBatch(false)
                const provisionValidated = await that.createEntity(provisionSAPModel, "/UsuarioSet", oDataSend)

                const provisionTemp = that._validTemporalMensaje11(provisionValidated)

                return provisionTemp

            } catch (error) {

                this.byId("idNuevaSolicitudPage").setBusy(false);

                let mensajeError = {}

                if (error.responseText === "") {
                    mensajeError.message = error.message + " " + error.responseText
                } else {
                    mensajeError = JSON.parse(error.responseText).error.message
                }

                mensajeError.entidad = "UsuarioSet"

                MessageBox.error('Por favor, haga click y envíe el detalle al equipo de TI.', {
                    title: "Ha ocurrido un error en SAP",
                    contentWidth: "40rem",
                    details: mensajeError
                })

                sap.ui.core.BusyIndicator.hide()
                return "Error"

            }


        },

        _validTemporalMensaje11: function (oData) {

            if (!oData.UsuarioMensaje) return oData

            const usuarioMensajeSin11 = oData.UsuarioMensaje.results.filter((x) => x.CodigoMensaje !== "011")

            if (usuarioMensajeSin11.length > 0) {
                oData.UsuarioMensaje.results = usuarioMensajeSin11
            }

            for (let index = 0; index < oData.UsuarioSolicitud.results.length; index++) {
                const element = oData.UsuarioSolicitud.results[index]

                if (usuarioMensajeSin11.findIndex((x) => x.IdProvision === element.IdProvision) < 0) {
                    element.Validado = true
                    element.Motivo = ""
                }
            }

            if (usuarioMensajeSin11.length === 0) {
                oData.UsuarioMensaje = null
            }

            return oData

        },

        getFormatForServiceSAP: function (aData) {

            for (let index = 0; index < aData.length; index++) {
                const element = aData[index]
            }

            return {
                "UsuRegistra": that.byId("fDatosGeneralesProvision--cbResponsableCab").getSelectedItem().getBindingContext("aResponsable").getObject().responsableEgresos,
                "UsuarioSolicitud": aData,
                "UsuarioMensaje": [
                    {
                        "UsuRegistra": "",
                        "IdProvision": "",
                        "CodigoMensaje": "",
                        "DescMensaje": "",
                    }
                ]
            }

        },

        onChangePeriodoGasto: function (event) {

            const periodoGastoIn = that.getModel("provisionDetModel").getProperty("/periodoGasto")

            if (periodoGastoIn) {

                const mesActual = new Date().getMonth() + 1

                const mesPeriodoGasto = periodoGastoIn.getMonth() + 1

                if (mesActual - mesPeriodoGasto >= 3) {
                    viewModel.setProperty("/bSustentoRetraso", true)
                } else {
                    viewModel.setProperty("/bSustentoRetraso", false)
                }
            } else {
                viewModel.setProperty("/bSustentoRetraso", false)
            }


        },

        onBorrarResults: function (oEvent) {
            let idxDetProvision = oEvent.getSource().getBindingContext("detalleProv").getPath()
            //let idxDetProvision = oEvent.getSource().getBindingContext("detalleProv").sPath.split("/")[2]
            let aResults = that.getModel("detalleProv").getData()
            aResults.splice(parseInt(idxDetProvision.split("/").pop()), 1)

            that.calcularMontos()
            that._validarDisponibilidadGuardado()
            that.getModel("detalleProv").refresh()

        },

        //Funcion para limpiar toda la grilla de Detalle Provisión
        onBorrarGrillDetallProvision: function () {
            let aResults = that.getModel("detalleProv").getData()
            aResults.splice(0, aResults.length);
            that.calcularMontos()
            that._validarDisponibilidadGuardado()
            that.getModel("detalleProv").refresh()
        },
        //Funcion para limpiar solo los erroneos en la tabla
        onBorrarErroneosDetallProvision: function () {
            let aResults = that.getModel("detalleProv").getData()
            let indicesDelete = []
            for (let index = 0; index < aResults.length; index++) {
                const element = aResults[index];
                if (!element.Estado) {
                    indicesDelete.push(index);
                }
            }
            // Ordena los índices de mayor a menor
            indicesDelete.sort((a, b) => b - a);

            indicesDelete.forEach(index => {
                aResults.splice(index, 1);
            });
            let pos = 1;
            // Recorrer el array y asignar las nuevas posiciones
            for (let obj of aResults) {
                // Generar la nueva posición con formato de 4 dígitos
                obj.posicionTabla = pos.toString().padStart(4, '0');
                // Incrementar la posición para el siguiente objeto
                pos += 1;
            }
            that.calcularMontos()
            that._validarDisponibilidadGuardado()
            that.getModel("detalleProv").refresh()
        },

        /* Carga Masiva de Provisiones */
        onCargarArchivo: async function (event) {
            const file = event.getParameter("files") && event.getParameter("files")[0];
            const fileUploader = event.getSource();
            sap.ui.core.BusyIndicator.show(0);

            //Valido si se asignó dirección y responsable
            //Descomentar
            if (!that.byId("fDatosGeneralesProvision--cbResponsableCab").getSelectedItem()) {
                MessageBox.error("Por favor, seleccionar Dirección y Responsable.")
                sap.ui.core.BusyIndicator.hide()
                return
            }

            MessageToast.show("Validando datos. Espere por favor...", {
                my: "CenterCenter",
                at: "CenterCenter"
            });

            const data = await this._import(file);

            let moneda = "", mvali = false

            data.forEach(element => {
                if (moneda == "") {
                    moneda = element.MONEDA
                }
                if (moneda != element.MONEDA) {
                    mvali = true
                }
            });
            if (mvali) {
                MessageBox.information("El archivo adjunto contiene mas de una moneda, NO se realizará la carga.")
                sap.ui.core.BusyIndicator.hide();
                fileUploader.clear();
                return false;
            }

            if (data && data.length > 0) {
                //se valida el envio maximo de 1000 caracteres antes de realizar todo la logica
                data.forEach(element => {
                    if (element.SUSTENTO !== undefined && element.SUSTENTO !== null) {
                        element.SUSTENTO = element.SUSTENTO.substring(0, 999);
                    }
                });

                const maxFilas = oModel.getProperty("/MaximoFilas")

                if (data.length > maxFilas) {
                    MessageBox.error(`La cantidad de filas cargadas supera el límite configurado en el sistema (${maxFilas}).`)
                    sap.ui.core.BusyIndicator.hide();
                    fileUploader.clear();
                    return false;
                }

                // this.setDataToTableProv(data)
                this.setDataToTableProvV2(data)
            } else {
                MessageBox.information("El archivo no contiene información")
                sap.ui.core.BusyIndicator.hide();
            }
            fileUploader.clear();
        },
        _import: async function (file) {
            var excelData = {};
            const resolveImport = (e) => {
                var data = e.target.result;
                var workbook = XLSX.read(data, {
                    type: 'binary'
                });
                workbook.SheetNames.forEach(function (sheetName) {
                    // Here is your object for every sheet in workbook
                    if (sheetName === "PROVISIONES") {
                        excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                    }
                });
                if (excelData.length > 0) {
                    return excelData
                }
            };
            const rejectImport = (error) => {
                console.log(error);
            }
            const readerImport = new Promise((resolve, reject) => {
                if (file && window.FileReader) {
                    var reader = new FileReader();
                    reader.onload = resolve;
                    reader.onerror = reject;
                    reader.readAsBinaryString(file);
                }

            });

            return await readerImport.then(resolveImport, rejectImport);

        },
        setDataToTableProv: async function (data) {

            if (!that.byId("fDatosGeneralesProvision--cbResponsableCab").getSelectedItem()) {
                MessageBox.error("Por favor, seleccionar Dirección y Responsable.")
                sap.ui.core.BusyIndicator.hide()
                return
            }

            if (data.length > 0) {
                let aDetailProvision = that.getFormatForProcess(data)
                let aDataValidatedFront = that.getModel("detalleProv").getData()
                let oUserResponsable = that.byId("fDatosGeneralesProvision--cbResponsableCab").getSelectedItem()
                const aDataValidatedExcel = []
                let bValidarMantProv = true
                let aMensajesNoSAPProv = []
                let aProvCabNoSAP = []
                let aItemProvisionFalso = []

                let iPos = 1;
                for (let index = 0; index < aDetailProvision.length; index++) {

                    let element = aDetailProvision[index];
                    let findMantProv;
                    let monedaCoincide = true;

                    //Validar periodo de gasto
                    const partes = element.periodoGasto.split("-"); // ["2024", "10", "01"]
                    const dFechaPeriodo = new Date(partes[0], partes[1] - 1, partes[2]); // Restamos 1 al mes

                    const { bValidado, tipoDocumento, mensaje } =
                        that._evaluarTipoDocumentoAprovisionamiento(element.sustento, element.posicion)

                    // if ((element.sustento && element.posicion) && (element.centroCosto || element.centroGestor || element.cuentaContable || element.ordenInterna)) {
                    //     aMensajesNoSAPProv.push({
                    //         CodigoMensaje: "010",
                    //         DescMensaje: "Error en llenado de registro. No se permite ingresar OC, posición y objetos de imputación. Revisar pestaña Consideraciones en plantilla de ingreso masivo de provisiones.",
                    //         IdProvision: formatoNumerico(iPos),
                    //         UsuRegistra: ""
                    //     })
                    //     aProvCabNoSAP.push({
                    //         IdProvision: formatoNumerico(iPos),
                    //         Direccion: element.direccion_ID_direccion_ID,
                    //         Area: element.area_ID_area_ID,
                    //         DocCompra: element.sustento,
                    //         CuentaContable: element.cuentaContable,
                    //         CentroCosto: element.centroCosto,
                    //         CentroGestor: element.centroGestor,
                    //         OrdenInterna: element.ordenInterna
                    //     })
                    //     bValidarMantProv = false
                    //     iPos++
                    //     element.Mensaje = "Error en llenado de registro. No se permite ingresar OC, posición y objetos de imputación. Revisar pestaña Consideraciones en plantilla de ingreso masivo de provisiones."
                    //     element.Estado = false
                    //     aItemProvisionFalso.push(element)
                    // } else 
                    if (aDataValidatedFront.find(oPos =>
                        oPos.centroCosto == element.centroCosto &&
                        oPos.centroGestor == element.centroGestor &&
                        oPos.cuentaContable == element.cuentaContable &&
                        oPos.proveedor == element.proveedor &&
                        oPos.ordenInterna == element.ordenInterna)
                    ) {
                        aMensajesNoSAPProv.push({
                            CodigoMensaje: "010",
                            DescMensaje: "Imputación incorrecta o no definida, valide con su contacto de finanzas la imputación correcta para proceder con el registro de esta posición.",
                            IdProvision: formatoNumerico(iPos),
                            UsuRegistra: ""
                        })
                        aProvCabNoSAP.push({
                            IdProvision: formatoNumerico(iPos),
                            Direccion: element.direccion_ID_direccion_ID,
                            Area: element.area_ID_area_ID,
                            DocCompra: element.sustento,
                            CuentaContable: element.cuentaContable,
                            CentroCosto: element.centroCosto,
                            CentroGestor: element.centroGestor,
                            OrdenInterna: element.ordenInterna
                        })
                        bValidarMantProv = false
                        iPos++
                        element.Mensaje = "Registro duplicado"
                        element.Estado = false
                        aItemProvisionFalso.push(element)
                    } else if (dFechaPeriodo.getMonth() > new Date().getMonth()
                        && dFechaPeriodo.getFullYear() >= new Date().getFullYear()) {
                        bValidarMantProv = false
                        iPos++
                        element.Mensaje = "No se permiten fechas posteriores a la actual"
                        element.Estado = false
                        aItemProvisionFalso.push(element)
                    } else if (!element.idTipoGasto_idTipoGasto) {
                        bValidarMantProv = false
                        iPos++
                        element.Mensaje = "No ha ingresado un tipo de gasto"
                        element.Estado = false
                        aItemProvisionFalso.push(element)
                    } else if (!element.idTipoServicio_idTipoServicio) {
                        bValidarMantProv = false
                        iPos++
                        element.Mensaje = "No ha ingresado un tipo de servicio"
                        element.Estado = false
                        aItemProvisionFalso.push(element)
                    } else if ((element.sustento && element.posicion) && !bValidado) { //Validar tipo de documento
                        bValidarMantProv = false
                        iPos++
                        element.Mensaje = mensaje
                        element.Estado = false
                        aItemProvisionFalso.push(element)
                    } else {
                        let oOcs;
                        if (element.sustento && element.posicion) {

                            oOcs = await this.readEntity(provisionSAPModel,
                                `/DocumentoAprovisionamientoSet(Documento='${element.sustento}',Posicion='${element.posicion.toString()}',TipoDocumento='${tipoDocumento}')`, {})

                            let aFilter = [];
                            aFilter.push(new Filter("cuentaContable", "EQ", element.cuentaContable))
                            aFilter.push(new Filter("centroCosto", "EQ", element.centroCosto))
                            aFilter.push(new Filter("centroGestor", "EQ", element.centroGestor))
                            // if (element.ordenInterna) {
                            //     aFilter.push(new Filter("ordenInterna", "Contains", element.ordenInterna )) //that.completarCerosIzquierda(element.ordenInterna, 12) ))
                            // }
                            if (element.ordenInterna !== undefined) {
                                if (element.ordenInterna.toString().trim().length > 0) {
                                    aFilter.push(new Filter("ordenInterna", "Contains", element.ordenInterna)) //that.completarCerosIzquierda(element.ordenInterna, 12) ))
                                } else {
                                    aFilter.push(new Filter("ordenInterna", "EQ", element.ordenInterna)) //that.completarCerosIzquierda(element.ordenInterna, 12) ))
                                }
                            }

                            let aAsignacion = await that._getAsignacionIndividualExcel(aFilter);

                            if (aAsignacion.results.length == 1) {
                                findMantProv = aAsignacion.results[0]
                            } else {
                                findMantProv = oOcs ? oOcs : false
                            }

                            if (oOcs.moneda && oOcs.Moneda !== element.moneda) {
                                monedaCoincide = false
                            }

                        } else {
                            let aFilter = [];
                            aFilter.push(new Filter("cuentaContable", "EQ", element.cuentaContable))
                            aFilter.push(new Filter("centroCosto", "EQ", element.centroCosto))
                            aFilter.push(new Filter("centroGestor", "EQ", element.centroGestor))
                            // if (element.ordenInterna) {
                            //     aFilter.push(new Filter("ordenInterna", "Contains", element.ordenInterna )) //that.completarCerosIzquierda(element.ordenInterna, 12) ))
                            // }
                            if (element.ordenInterna !== undefined) {
                                if (element.ordenInterna.toString().trim().length > 0) {
                                    aFilter.push(new Filter("ordenInterna", "Contains", element.ordenInterna)) //that.completarCerosIzquierda(element.ordenInterna, 12) ))
                                } else {
                                    aFilter.push(new Filter("ordenInterna", "EQ", element.ordenInterna)) //that.completarCerosIzquierda(element.ordenInterna, 12) ))
                                }
                            }

                            let aAsignacion = await that._getAsignacionIndividualExcel(aFilter);
                            //findMantProv = aAsignacion.results.length > 0 ? aAsignacion.results[0] : false

                            if (aAsignacion.results.length == 1) {
                                findMantProv = aAsignacion.results[0]
                            } else if (aAsignacion.results.length > 1) {
                                findMantProv = false
                            } else {
                                findMantProv = oOcs ? oOcs : false
                            }
                        }

                        if (!findMantProv) {
                            aMensajesNoSAPProv.push({
                                CodigoMensaje: "010",
                                DescMensaje: "Imputación incorrecta o no definida, valide con su contacto de finanzas la imputación correcta para proceder con el registro de esta posición.",
                                IdProvision: formatoNumerico(iPos),
                                UsuRegistra: ""
                            })
                            aProvCabNoSAP.push({
                                IdProvision: formatoNumerico(iPos),
                                Direccion: element.direccion_ID_direccion_ID,
                                Area: element.area_ID_area_ID,
                                DocCompra: element.sustento,
                                CuentaContable: element.cuentaContable,
                                CentroCosto: element.centroCosto,
                                CentroGestor: element.centroGestor,
                                OrdenInterna: element.ordenInterna
                            })
                            bValidarMantProv = false
                            iPos++
                            element.Mensaje = "Imputación incorrecta o no definida, valide con su contacto de finanzas la imputación correcta para proceder con el registro de esta posición."
                            element.Estado = false
                            aItemProvisionFalso.push(element)
                        } else if (!monedaCoincide) {
                            aMensajesNoSAPProv.push({
                                CodigoMensaje: "020",
                                DescMensaje: "La moneda del documento no coincide con la moneda ingresada.",
                                IdProvision: formatoNumerico(iPos),
                                UsuRegistra: ""
                            })
                            aProvCabNoSAP.push({
                                IdProvision: formatoNumerico(iPos),
                                Direccion: element.direccion_ID_direccion_ID,
                                Area: element.area_ID_area_ID,
                                DocCompra: element.sustento,
                                CuentaContable: element.cuentaContable,
                                CentroCosto: element.centroCosto,
                                CentroGestor: element.centroGestor,
                                OrdenInterna: element.ordenInterna
                            })
                            bValidarMantProv = false
                            iPos++
                            element.Mensaje = "La moneda del documento no coincide con la moneda ingresada."
                            element.Estado = false
                            aItemProvisionFalso.push(element)
                        } else {
                            element.monto = parseFloat(element.monto)
                            element = await that.onValidarDetalleForMasivo(element)
                            element.IdProvision = formatoNumerico(iPos)
                            element.usuarioResponsable = findMantProv ? findMantProv.responsable : "";
                            element.director = findMantProv ? findMantProv.director : "";
                            element.responsableEgresos = findMantProv ? findMantProv.responsableEgresos : "";
                            element.vbDirecion = findMantProv ? findMantProv.vbDirecion : false;
                            element.rubro = findMantProv ? findMantProv.rubro : "";
                            element.responsable = findMantProv ? findMantProv.responsable : "";
                            element.usuarioResponsableNombres = findMantProv ? findMantProv.nomCompletoResponsable : "";
                            element.moneda = !findMantProv.Moneda ? element.moneda : findMantProv.Moneda
                            //element.posicion = !findMantProv.Posicion ? generarCorrelativo(iPos) : findMantProv.Posicion
                            iPos++
                            aDataValidatedExcel.push(element)
                        }
                    }


                }

                let aDataForTableResults = aDataValidatedExcel
                    .filter(x => !x.Estado)

                let aDataForSAPValidation = aDataValidatedExcel
                    .filter(x => x.Estado)
                    .map((detProv) => {
                        return that.onPrepareDataToSAPValidation(detProv)
                    })

                // if (bValidarMantProv) {
                if (aDataForSAPValidation.length > 0) {
                    this.byId("idNuevaSolicitudPage").setBusy(true);
                    // MessageToast.show("Validando datos. Espere por favor...",{
                    //     my: "CenterCenter",
                    //     at: "CenterCenter"
                    // });
                    let aDataSAPValidated = await that._validarFilasSAP(aDataForSAPValidation)
                    let aProvisionesCorrectas;

                    if (aDataSAPValidated.UsuarioMensaje) {
                        aProvisionesCorrectas = aDataSAPValidated.UsuarioSolicitud.results.filter(provision => {
                            return !aDataSAPValidated.UsuarioMensaje.results.some(mensaje => mensaje.IdProvision === provision.IdProvision);
                        });
                    } else {
                        aProvisionesCorrectas = aDataSAPValidated.UsuarioSolicitud.results;
                    }

                    if (aDataSAPValidated.UsuarioMensaje !== null) {
                        let aMensajes,
                            aProvision;
                        if (aMensajesNoSAPProv) {
                            aMensajes = aDataSAPValidated.UsuarioMensaje.results.concat(aMensajesNoSAPProv);
                        } else {
                            aMensajes = aDataSAPValidated.UsuarioMensaje.results
                        }
                        if (aProvCabNoSAP) {
                            aProvision = aDataSAPValidated.UsuarioSolicitud.results.concat(aProvCabNoSAP);
                        } else {
                            aProvision = aDataSAPValidated.UsuarioSolicitud.result
                        }

                        //Se guarda las provisiones con errores de SAP
                        // Función para agrupar los mensajes por IdProvision y devolver un array de objetos
                        function agruparPorIdProvision(mensajes) {
                            var agrupados = mensajes.reduce((acc, mensaje) => {
                                if (!acc[mensaje.IdProvision]) {
                                    acc[mensaje.IdProvision] = {
                                        IdProvision: mensaje.IdProvision,
                                        mensajes: []
                                    };
                                }
                                acc[mensaje.IdProvision].mensajes.push(mensaje);
                                return acc;
                            }, {});

                            // Convertir el objeto agrupado en un array de objetos
                            return Object.values(agrupados);
                        }

                        // Agrupar los mensajes
                        var mensajesAgrupados = agruparPorIdProvision(aDataSAPValidated.UsuarioMensaje.results);

                        for (let i = 0; i < mensajesAgrupados.length; i++) {
                            let oProvisionSAP = mensajesAgrupados[i]
                            let element = aDetailProvision.find(oPos => oPos.IdProvision == oProvisionSAP.IdProvision)
                            let elementValidated = aDataSAPValidated.UsuarioSolicitud.results.find(oPos => oPos.IdProvision == oProvisionSAP.IdProvision)

                            if (element) {
                                let sMensaje = ""

                                for (let x = 0; x < oProvisionSAP.mensajes.length; x++) {
                                    sMensaje += oProvisionSAP.mensajes[x].DescMensaje + "\n"
                                }

                                element.cuentaContable = elementValidated.CuentaContable
                                element.cuentaContableDesc = elementValidated.DescCuentaContab
                                element.centroCosto = elementValidated.CentroCosto
                                element.centroCostoDesc = elementValidated.DescCentroCosto
                                element.centroGestor = elementValidated.CentroGestor
                                element.centroGestorDesc = elementValidated.DescCentroGestor
                                element.ordenInterna = elementValidated.OrdenInterna
                                element.ordenInternaDesc = elementValidated.DescOrdenInterna
                                element.proveedor = elementValidated.CodigoProveedor
                                element.proveedorNombre = elementValidated.NombreProveedor
                                element.Mensaje = sMensaje
                                element.Estado = false
                                aItemProvisionFalso.push(element)
                            }

                        }

                        //********************************************************** */


                        let oResult = await that.onMostrarMensajesMultiples(aMensajes, aProvision);
                        this.byId("idNuevaSolicitudPage").setBusy(false);
                    }

                    if (aProvisionesCorrectas && aProvisionesCorrectas.length > 0) {
                        const aDataValidatedSAP = that._procesarDataValidadaSAP2(aProvisionesCorrectas)
                        ///
                        //bucle para validar monedas de lo que ya esta subido
                        if (aDataValidatedFront !== undefined) {
                            if (aDataValidatedFront.length > 0) {
                                let validMoneda = true
                                let monedaActual = aDataValidatedFront[0].moneda;
                                for (let index = 0; index < aDataValidatedSAP.length; index++) {
                                    if (monedaActual != aDataValidatedSAP[index].moneda) {
                                        validMoneda = false
                                    }
                                }
                                if (!validMoneda) {
                                    MessageBox.information("La moneda del archivo adjunto no corresponde a la solicitud, No se realizará la carga.")
                                    this.byId("idNuevaSolicitudPage").setBusy(false);
                                    sap.ui.core.BusyIndicator.hide()
                                    that.calcularMontos()
                                    that._validarDisponibilidadGuardado()
                                    return false;
                                }
                            }
                        }

                        ///
                        let iPosx = 1;
                        for (let index = 0; index < aDataValidatedSAP.length; index++) {
                            const element = aDataValidatedSAP[index];

                            if (aDataValidatedExcel.length) {
                                element.usuarioResponsable = oUserResponsable.getKey() + " - " + oUserResponsable.getText();//aDataValidatedExcel[0].usuarioResponsable;
                                element.responsable = oUserResponsable.getKey(); //aDataValidatedExcel[0].responsable;
                                element.director = aDataValidatedExcel[0].director;
                                element.responsableEgresos = aDataValidatedExcel[0].responsableEgresos;
                                element.vbDirecion = aDataValidatedExcel[0].vbDirecion;
                                element.rubro = aDataValidatedExcel[index].rubro;
                                element.sustentoText = element.sustentoText;
                                element.usuarioResponsableNombres = oUserResponsable.getText();//aDataValidatedExcel[0].usuarioResponsableNombres;
                                element.posicionTabla = generarCorrelativo(iPosx);
                                element.posicion = aDataValidatedSAP[index].posicion;
                            }
                            aDataValidatedFront.push(element)
                            iPosx++
                        }
                        this.byId("idNuevaSolicitudPage").setBusy(false);
                    }
                }

                let newArray;
                if (aItemProvisionFalso.length !== 0) {
                    newArray = aDataValidatedFront.concat(aItemProvisionFalso);
                } else {
                    newArray = aDataValidatedFront
                }

                let pos = 1;
                // Recorrer el array y asignar las nuevas posiciones
                for (let obj of newArray) {
                    // Generar la nueva posición con formato de 4 dígitos
                    obj.posicionTabla = pos.toString().padStart(4, '0');
                    // Incrementar la posición para el siguiente objeto
                    pos += 1;
                    if (obj.sustento == "") {
                        obj.posicion = "";
                    }
                }

                //Asignar el tipo de gasto y servicio
                let resultadoFinal = that.agregarTiposFaltantes(newArray, aDataValidatedExcel)

                that.getView().setModel(new JSONModel(resultadoFinal), "detalleProv")
                sap.ui.core.BusyIndicator.hide()
                // } else {
                //     MessageBox.error("Por favor, validar las direcciones y areas del excel.")
                //     sap.ui.core.BusyIndicator.hide()
                // }

            } else {
                MessageBox.error("No existe datos en la plantilla.")
                sap.ui.core.BusyIndicator.hide()
            }

            that.calcularMontos()
            that._validarDisponibilidadGuardado()

            function formatoNumerico(numero) {
                return String(numero).padStart(3, '0');
            }

            function generarCorrelativo(numero) {
                let correlativo = numero * 10;

                let correlativoStr = correlativo.toString().padStart(5, '0');

                return correlativoStr;
            }

        },

        setDataToTableProvV2: async function (data) {

            try {

                if (data.length > 0) {
                    let aDetalleProvisionParaValidar = that.getFormatForProcess(data),
                        oUserResponsable = that.byId("fDatosGeneralesProvision--cbResponsableCab").getSelectedItem(),
                        aDataToSetTable = [], //Array para setear en la tabla
                        aDataExito = [], //Array con lineas de éxito
                        aDataError = [] //Array con lineas de error

                    //Valido los datos a nivel local

                    const aDataValidadaLocal = aDetalleProvisionParaValidar.reduce((acc, fila) => {
                        const filaValidada = that.onValidarFilaIngresada(fila);

                        if (filaValidada.periodoGasto) {
                            filaValidada.periodoGasto = new Date(filaValidada.periodoGasto);
                        }

                        filaValidada.posicionTabla = filaValidada.IdProvision;
                        acc.push(filaValidada);

                        return acc;
                    }, []);

                    //Separo los datos de exito y error
                    aDataExito = aDataValidadaLocal.filter((data) => data.Estado)
                    aDataError = aDataValidadaLocal.filter((data) => !data.Estado)

                    //Valido si hay lineas exitosas producto de la validación local
                    if (aDataExito.length > 0) {
                        //Valido los datos a nivel BD HANA
                        const aDataValidadaHANA = await that._validarDatosHANA(aDataExito)

                        //Separo los datos de exito y error
                        aDataExito = aDataValidadaHANA.filter((data) => data.Estado)
                        aDataError = aDataError.concat(aDataValidadaHANA.filter((data) => !data.Estado))

                        //Valido si hay lineas exitosas producto de la validación con HANA
                        if (aDataExito.length > 0) {
                            //Valido los datos a nivel SAP
                            const aDataValidadaSAP = await that._validarDatosSAP(aDataExito)


                            //Separo los datos de exito y error
                            aDataExito = aDataValidadaSAP.filter((data) => data.Estado)
                            aDataError = aDataError.concat(aDataValidadaSAP.filter((data) => !data.Estado))
                        }
                    }

                    //Agrego todo
                    aDataToSetTable = aDataExito.concat(aDataError)

                    //Agrego campos adicionales
                    aDataToSetTable = aDataToSetTable.map(item => {
                        return {
                            ...item,
                            usuarioResponsable: oUserResponsable.getKey() + " - " + oUserResponsable.getText(),
                            responsable: oUserResponsable.getKey(),
                            usuarioResponsableNombres: oUserResponsable.getText()
                        };
                    });

                    //Verifico si tiene alguna linea de error
                    if (aDataToSetTable.find((x) => !x.Estado))
                        MessageBox.error("Una o más filas han tenido errores de validación. Descargar el log de errores para su  verificación y resolución.")

                    //Seteo los datos en la tabla de provisiones
                    that.getView().setModel(new JSONModel(aDataToSetTable), "detalleProv")

                    sap.ui.core.BusyIndicator.hide()

                } else {
                    MessageBox.error("No existe datos en la plantilla.")
                    sap.ui.core.BusyIndicator.hide()
                }

                that.calcularMontos()
                that._validarDisponibilidadGuardado()
            } catch (error) {

                sap.ui.core.BusyIndicator.hide()

                MessageBox.error("Por favor, envíe el detalle al equipo de TI.", {
                    title: "Ocurrió un error en la validación masiva.",
                    details: `<strong>${error.stack}</strong>`,
                    contentWidth: "40rem"
                })

            }
        },

        _validarDatosHANA: async function (aDetalleProvisionParaValidar) {

            const aDataRequest =
                aDetalleProvisionParaValidar
                    .map(({ centroCosto, centroGestor, cuentaContable, ordenInterna }) =>
                        ({ centroCosto, centroGestor, cuentaContable, ordenInterna }))

            const aDataResponseHANA = await that.onValidarDataHANAMasivo(aDataRequest)

            const aDataValidadaHANA = that._procesarResultadosSistema("HANA", aDetalleProvisionParaValidar, aDataResponseHANA.results)

            return aDataValidadaHANA

        },

        onValidarDataHANAMasivo: async function (aDataRequest) {

            return new Promise(async (resolve, reject) => {
                try {
                    let aReturn = await this.createEntity(asignacionModel, '/ValidarImputaciones', { data: aDataRequest })
                    resolve(aReturn)
                } catch (error) {
                    resolve(false)
                    MessageBox.error(error);
                }
            });

        },

        _validarDatosSAP: async function (aDetalleProvisionParaValidar) {

            const aDataRequest = aDetalleProvisionParaValidar
                .map((detProv) => {
                    return that.onPrepareDataToSAPValidation(detProv)
                })

            const aDataResponseSAP = await that._validarFilasSAP(aDataRequest)

            if (aDataResponseSAP === "Error") return []

            const aDataValidadaSAP = that._procesarResultadosSistema("SAP", aDetalleProvisionParaValidar, aDataResponseSAP)

            return aDataValidadaSAP

        },

        _procesarResultadosSistema: function (sistema, aDataBase, resultadosValidacion) {

            if (sistema === "HANA") {

                // Crear un mapa de los resultados de validación para búsqueda rápida
                const validacionMap = new Map(
                    resultadosValidacion.map(item => [
                        `${item.cuentaContable}_${item.centroCosto}_${item.centroGestor}_${item.ordenInterna}`,
                        item
                    ])
                );

                // Combinar los resultados con el array base
                return aDataBase.map(baseItem => {
                    const key = `${baseItem.cuentaContable}_${baseItem.centroCosto}_${baseItem.centroGestor}_${baseItem.ordenInterna}`;
                    const validacionItem = validacionMap.get(key);

                    // Si hay datos de validación, combinar sobrescribiendo Estado y Mensaje
                    if (validacionItem) {
                        return {
                            ...baseItem,
                            rubro_ID: validacionItem.rubro_ID || baseItem.rubro_ID,
                            rubro: validacionItem.rubro || baseItem.rubro,
                            Estado: validacionItem.Estado, // Sobrescribe con el Estado del resultado
                            Mensaje: validacionItem.Mensaje // Sobrescribe con el Mensaje del resultado
                        };
                    }

                    // Si no hay validación, mantener los valores originales
                    return baseItem;
                });

            } else if (sistema === "SAP") {

                // Extraer resultados de UsuarioSolicitud y UsuarioMensaje
                const solicitudes = resultadosValidacion.UsuarioSolicitud?.results || [];
                const mensajes = resultadosValidacion.UsuarioMensaje?.results || []; // Validar si UsuarioMensaje es null

                // Crear un mapa para solicitudes (clave: combinación única)
                const solicitudMap = new Map(
                    solicitudes.map(item => [
                        `${item.IdProvision}`,
                        item
                    ])
                );

                // Crear un mapa agrupando los mensajes por clave
                const mensajeMap = new Map();
                mensajes.forEach(item => {
                    const key = `${item.IdProvision}`;
                    if (!mensajeMap.has(key)) {
                        mensajeMap.set(key, []);
                    }
                    mensajeMap.get(key).push(item.DescMensaje);
                });

                // Combinar los resultados con el array base
                return aDataBase.map(baseItem => {
                    const solicitudKey = `${baseItem.IdProvision}`;
                    const mensajeKey = `${baseItem.IdProvision}`;

                    const solicitud = solicitudMap.get(solicitudKey);
                    const mensajesConcatenados = mensajeMap.has(mensajeKey)
                        ? mensajeMap.get(mensajeKey).join("\n") // Concatenar con salto de línea
                        : ""; // Si no hay mensajes, queda vacío

                    // Combinar datos si se encuentra la solicitud
                    if (solicitud) {
                        return {
                            ...baseItem,
                            descripcionServicio: solicitud.DescrServicio,
                            cuentaContableDesc: solicitud.DescCuentaContab,
                            centroCostoDesc: solicitud.DescCentroCosto,
                            centroGestorDesc: solicitud.DescCentroGestor,
                            ordenInternaDesc: solicitud.DescOrdenInterna,
                            proveedorNombre: solicitud.NombreProveedor,
                            Estado: solicitud.Validado, // Sobrescribir Estado con el valor de Validado
                            Mensaje: mensajesConcatenados // Concatenar mensajes con salto de línea
                        };
                    }

                    // Si no hay solicitud, mantener los valores originales
                    return {
                        ...baseItem,
                        Mensaje: mensajesConcatenados // Concatenar mensajes con salto de línea
                    };
                });

            }

        },

        formatoNumerico: function (numero) {
            return String(numero).padStart(4, '0');
        },

        generarCorrelativo: function (numero) {
            let correlativo = numero * 10;

            let correlativoStr = correlativo.toString().padStart(5, '0');

            return correlativoStr;
        },


        agregarTiposFaltantes: function (array1, aDataValidatedExcel) {

            let resultadoFinal = []

            resultadoFinal = array1.map(item2 => {
                // Buscar el objeto en array1 con el mismo IdProvision
                let item1 = aDataValidatedExcel.find(item => item.IdProvision === item2.idProvision);

                // Si lo encuentra, pasar las propiedades
                if (item1) {
                    item2.idTipoGasto_idTipoGasto = item1.idTipoGasto_idTipoGasto;
                    item2.idTipoServicio_idTipoServicio = item1.idTipoServicio_idTipoServicio;
                }

                return item2; // Retornar el objeto con las propiedades actualizadas
            });


            return resultadoFinal

        },

        getFormatForProcess: function (data) {

            let aDataFormatted = []
            let iPos = 1
            for (let index = 0; index < data.length; index++) {
                const value = data[index];
                const elementDetail =
                {
                    "idProvision_idProvision": "",
                    "direccion_ID_direccion_ID": (value.DIRECCION) ? value.DIRECCION + "" : "",
                    "provisionConOC": (value.OC_SOLPED_PA !== "" && value.POSICION !== "") ? "1" : "0",
                    "cuentaContable": (value.CUENTA_CONTABLE) ? value.CUENTA_CONTABLE + "" : "",
                    "cuentaContableDesc": "",
                    "centroCosto": (value.CENTRO_COSTO) ? value.CENTRO_COSTO + "" : "",
                    "centroCostoDesc": "",
                    "centroGestor": (value.CENTRO_GESTOR) ? value.CENTRO_GESTOR + "" : "",
                    "centroGestorDesc": "",
                    "ordenInterna": (value.ORDEN_INTERNA) ? value.ORDEN_INTERNA + "" : "",
                    "ordenInternaDesc": "",
                    "idTipoPago_idTipoPago": (value.TIPO_PAGO) ? value.TIPO_PAGO : "",
                    "idTipoGasto_idTipoGasto": (value.TIPO_GASTO) ? value.TIPO_GASTO : "",
                    "idTipoServicio_idTipoServicio": (value.TIPO_SERVICIO) ? value.TIPO_SERVICIO : "",
                    "sustento": (value.OC_SOLPED_PA) ? value.OC_SOLPED_PA + "" : "",
                    "posicion": (value.POSICION) ? value.POSICION + "" : "",
                    "descripcionServicio": (value.GLOSA) ? value.GLOSA : "",
                    "proveedor": (value.PROVEEDOR) ? value.PROVEEDOR + "" : "",
                    "proveedorNombre": "",
                    "periodoGasto": (value.MES_SERVICIO) ? that._formatDate(that._excelDateToJSDate(value.MES_SERVICIO)) : "",
                    "monto": (value.MONTO) ? parseFloat(value.MONTO) : "0",
                    "moneda": (value.MONEDA) ? value.MONEDA : "",
                    "rubro": "",
                    "sustentoText": (value.SUSTENTO) ? value.SUSTENTO : "",
                    "IdProvision": that.formatoNumerico(iPos)
                }

                elementDetail.usuarioResponsable = that.onObtenerResponsable(elementDetail)

                aDataFormatted.push(elementDetail)
                iPos++
            }

            return aDataFormatted
        },

        onObtenerResponsable: function (elementDetail) {

            return this.getModel("userData").getData().userId;

        },

        _procesarDataValidadaSAP: function (aDataSAPValidada) {

            let aDataForTableResult = []
            const aDataEnviada = aDataSAPValidada.UsuarioSolicitud.results
            const aDataMensajes = aDataSAPValidada.UsuarioMensaje

            for (let index = 0; index < aDataEnviada.length; index++) {
                const element = aDataEnviada[index];
                const data = that.onPrepareDataToTableResult(element)

                if (data.periodoGasto.length === 6 || data.periodoGasto.length === 5) {
                    const year = data.periodoGasto.slice(0, 4); // Obtiene los primeros 4 caracteres como año
                    const month = data.periodoGasto.slice(4, 6); // Obtiene los últimos 2 caracteres como mes
                    data.periodoGasto = new Date(`${year}-${month}-01`); // Construye la fecha con el primer día del mes
                }

                if (aDataMensajes) {
                    data.Mensaje = (aDataMensajes.results.filter(x => x.IdProvision === data.idProvision))
                        ? aDataMensajes.filter(x => x.IdProvision === data.idProvision)[0].DescMensaje
                        : ""
                }
                aDataForTableResult.push(data)


            }

            return aDataForTableResult

        },
        _procesarDataValidadaSAP2: function (aDataSAPValidada) {
            let aDataForTableResult = []
            const aDataEnviada = aDataSAPValidada

            for (let index = 0; index < aDataEnviada.length; index++) {
                const element = aDataEnviada[index];
                const data = that.onPrepareDataToTableResult(element)

                if (data.periodoGasto.length === 7 || data.periodoGasto.length === 6) {
                    const year = data.periodoGasto.slice(0, 4); // Obtiene los primeros 4 caracteres como año
                    const month = data.periodoGasto.slice(4, 6); // Obtiene los últimos 2 caracteres como mes
                    data.periodoGasto = new Date(`${year}-${month}-01`); // Construye la fecha con el primer día del mes
                }

                aDataForTableResult.push(data)
            }

            return aDataForTableResult
        },
        onDescargarPlantilla: function () {
            let dataPlantilla = [
                {
                    "OC_SOLPED_PA": "", "POSICION": "",
                    "CUENTA_CONTABLE": "", "CENTRO_COSTO": "", "CENTRO_GESTOR": "", "ORDEN_INTERNA": "", "TIPO_PAGO": "",
                    "GLOSA": "", "PROVEEDOR": "", "MES_SERVICIO": "", "MONTO": "", "MONEDA": "", "SUSTENTO": "",
                    "TIPO_GASTO": "", "TIPO_SERVICIO": ""
                }
            ];

            let wsPlantilla = XLSX.utils.json_to_sheet(dataPlantilla);
            var wbPlantilla = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wbPlantilla, wsPlantilla, "PROVISIONES");

            // let dataGerenciasJefatura = oModel.getProperty("/GerenciasJefaturas")
            // let wsGerenciasJefatura = XLSX.utils.json_to_sheet(dataGerenciasJefatura.map((element) => { return { ID: element.UnidadOrg, Descripcion: element.DescUnidadOrg } }))
            // XLSX.utils.book_append_sheet(wbPlantilla, wsGerenciasJefatura, "Gerencias_Jefaturas");

            //Ayuda Excel para los tipos de pago
            let dataTiposDePago = oModel.getProperty("/TiposPago")
            let wsTiposPago = XLSX.utils.json_to_sheet(dataTiposDePago.map((element) => { return { ID: element.idTipoPago, Descripcion: element.descripcion } }))
            XLSX.utils.book_append_sheet(wbPlantilla, wsTiposPago, "Tipos_Pago");

            //Ayuda Excel para los tipos de gasto
            let dataTiposDeGasto = oModel.getProperty("/TiposGasto")
            let wsTiposGasto = XLSX.utils.json_to_sheet(dataTiposDeGasto.map((element) => { return { ID: element.idTipoGasto, Descripcion: element.descripcion } }))
            XLSX.utils.book_append_sheet(wbPlantilla, wsTiposGasto, "Tipos_Gasto");

            //Ayuda Excel para los tipos de servicio
            let dataTiposDeServicio = oModel.getProperty("/TiposServicio")
            let wsTiposServicio = XLSX.utils.json_to_sheet(dataTiposDeServicio.map((element) => { return { ID: element.idTipoServicio, Descripcion: element.descripcion } }))
            XLSX.utils.book_append_sheet(wbPlantilla, wsTiposServicio, "Tipos_Servicio");

            // let wsConsideraciones = XLSX.utils.json_to_sheet(that.getConsideraciones());
            // XLSX.utils.book_append_sheet(wbPlantilla, wsConsideraciones, "Consideraciones");

            XLSX.writeFile(wbPlantilla, "Plantilla Provisiones.xlsx");
        },

        onSearchOC: async function () {
            try {
                const oInputs = that.getModel("provisionDetModel")
                const sSustento = oInputs.getProperty("/sustento");
                const sPosicion = parseInt(oInputs.getProperty("/posicion"));

                oInputs.setProperty("/rubro", "")
                if (sSustento === "" || !sSustento) {
                    MessageBox.error("Por favor, completar el campo OC/SOLPED/PA.");
                    return;
                }

                if (sPosicion === "" || !sPosicion) {
                    MessageBox.error("Por favor, completar el campo Posición.");
                    return;
                }

                const { bValidado, tipoDocumento, mensaje } = that._evaluarTipoDocumentoAprovisionamiento(sSustento, sPosicion, true)

                if (!bValidado) {
                    MessageBox.error(mensaje)
                    return
                }

                this.byId("idNuevaSolicitudPage").setBusy(true);
                // const oOcs = await that.readEntity(provisionSAPModel, `/OrdenCompraSet(OrdCompra='${sSustento}',Posicion='${sPosicion.toString()}')`, {})

                const oOcs = await this.readEntity(provisionSAPModel,
                    `/DocumentoAprovisionamientoSet(Documento='${sSustento}',Posicion='${sPosicion.toString()}',TipoDocumento='${tipoDocumento}')`, {})

                if (!oOcs.CuentaContab) {
                    MessageBox.error("No se encontró el documento ingresado")
                    this.byId("idNuevaSolicitudPage").setBusy(false);
                    oInputs.setProperty("/cuentaContable", "")
                    oInputs.setProperty("/centroCosto", "")
                    oInputs.setProperty("/centroGestor", "")
                    oInputs.setProperty("/ordenInterna", "")
                    oInputs.setProperty("/proveedor", "")
                    return
                }

                // if (oOcs.OrdInterna) {
                //Sugerencia NTT DATA: Se debería traer los textos en el request anterior, no hacer búsquedas por cada uno, degrada el perfomance del app
                let sCuentaContable = await this.getTextForKey("Saknr", oOcs.CuentaContab, "CuentaContableSet", "cuentasContable", "Saknr", "Txt50");
                oInputs.setProperty("/cuentaContable", sCuentaContable.trim());

                let aFindCuenta = await this.readEntity(provisionSAPModel, `/CuentaAdelantoSet`, {})
                console.log(aFindCuenta);

                if (aFindCuenta.results.length !== 0) {
                    let oFindCuenta = aFindCuenta.results.find(oPos => oPos.Denom == oOcs.CuentaContab)
                    if (oFindCuenta) {
                        this.byId("idInputCuentaContable").setEnabled(true);
                    } else {
                        this.byId("idInputCuentaContable").setEnabled(false);
                    }
                }

                if (oOcs.CentCoste) {
                    let sCentCoste = await this.getTextForKey("Kostl", oOcs.CentCoste, "CentroCostoSet", "centrosCosto", "Kostl", "Ktext");
                    oInputs.setProperty("/centroCosto", sCentCoste.trim());
                } else {
                    oInputs.setProperty("/centroCosto", "")
                }

                if (oOcs.CenGestor) {
                    let sCentGestor = await this.getTextForKey("FICTR", oOcs.CenGestor, "CentroGestorSet", "centroGestor", "BESCHR", "FICTR");
                    oInputs.setProperty("/centroGestor", sCentGestor.trim());
                } else {
                    oInputs.setProperty("/centroGestor", "")
                }

                if (oOcs.OrdInterna) {
                    let sOrdenInterna = await this.getTextForKey("AUFNR", oOcs.OrdInterna, "OrdenInternaSet", "ordenInterna", "AUFNR", "KTEXT");
                    oInputs.setProperty("/ordenInterna", sOrdenInterna.trim());
                } else {
                    oInputs.setProperty("/ordenInterna", "");
                }

                if (oOcs.CodProveedor) {
                    let sCodProveedor = await this.getTextForKey("Lifnr", oOcs.CodProveedor, "ProveedorSet", "proveedores", "Lifnr", "Name1");
                    oInputs.setProperty("/proveedor", sCodProveedor.trim());
                } else {
                    oInputs.setProperty("/proveedor", "")
                }

                oInputs.setProperty("/moneda", oOcs.Moneda);
                //oInputs.setProperty("/proveedor", oOcs.CodProveedor);

                this.byId("txtSustento").setValueState(sap.ui.core.ValueState.None);
                this.byId("txtSustento").setValueStateText("");
                this.byId("txtProvisionOC").setValueState(sap.ui.core.ValueState.None);
                this.byId("txtProvisionOC").setValueStateText("");
                this._getRubro();
                // } else {
                //     MessageBox.error("No se encontaron registros.");
                //     oInputs.setProperty("/cuentaContable", "");
                //     oInputs.setProperty("/centroCosto", "");
                //     oInputs.setProperty("/centroGestor", "");
                //     oInputs.setProperty("/ordenInterna", "");
                //     oInputs.setProperty("/moneda", "");

                //     this.byId("txtSustento").setValueState(sap.ui.core.ValueState.Error);
                //     this.byId("txtSustento").setValueStateText("No existen datos");
                //     this.byId("txtProvisionOC").setValueState(sap.ui.core.ValueState.Error);
                //     this.byId("txtProvisionOC").setValueStateText("No existen datos");
                // }
                this.byId("idNuevaSolicitudPage").setBusy(false);
            } catch (error) {
                MessageBox.error(error);
            }
        },

        getDatosGlobal: async function () {
            return new Promise(async (resolve, reject) => {
                const parameters = this.sendfiltrosVacios()
                try {
                    let asignacionModel = this.getOwnerComponent().getModel("asignacionModel")
                    let aDireccion = await this.readEntity(asignacionModel, '/GetListaDirecciones', parameters)
                    this.getOwnerComponent().setModel(new JSONModel(aDireccion.results), "aDireccion");
                    resolve(true);
                } catch (error) {
                    MessageBox.error(error);
                }
            });
        },

        // getDatosGlobal: async function () {
        //     return new Promise(async (resolve,reject) => {
        //         const parameters = {
        //             filters: [],
        //             urlParameters: {
        //                 "$expand": "direccion_ID"
        //             }
        //         };
        //         try {
        //             aGlobalIndividual = await this.readEntity(asignacionModel, '/AsignacionesProvision', parameters)
        //             const aDireccion = this.getOnlyKey(aGlobalIndividual.results, "direccion_ID_direccion_ID");
        //             this.getView().setModel(new JSONModel(aDireccion), "oDireccion");
        //             resolve(true);
        //         } catch (error) {
        //             MessageBox.error(error);
        //         }
        //     });
        // },

        getAreas: function (oEvent) {
            let sKey = oEvent.getSource().getSelectedKey();
            if (sKey !== "") {
                let aAreas = aGlobalIndividual.results.filter(oPos => oPos.direccion_ID_direccion_ID === sKey)
                if (aAreas.length !== 0) {
                    const aNewAreas = this.getOnlyKey(aAreas, "area_ID_area_ID");
                    this.getView().setModel(new JSONModel(aNewAreas), "oAreas");
                } else {
                    this.getView().setModel(new JSONModel([]), "oAreas");
                }
                this.byId("cbAreas").setSelectedKey();
            }
        },

        getRubro: function (oEvent) {
            let sKey = oEvent.getSource().getSelectedKey();
            if (sKey !== "") {
                const oInputs = that.getModel("provisionDetModel")
                const oData = oEvent.getSource().getSelectedItem().getBindingContext("oAreas").getObject();
                //oInputs.setProperty("/rubro", oData.rubro);
                //oInputs.setProperty("/usuarioResponsable", oData.responsable);
                //that.getModel("provisionDetModel").setProperty("/usuarioResponsableNombres", oData.nomCompletoResponsable);

                //Cuando se seleccione 
                // if (bValidateCab) {
                //     that.setDatosCabDescription(oData);
                // }
            }
        },

        getOnlyKey: function (array, keyData) {
            const uniqueKeys = new Set();
            return array.filter(obj => {
                const key = obj[keyData];
                if (!uniqueKeys.has(key)) {
                    uniqueKeys.add(key);
                    return true;
                }
                return false;
            });
        },

        getTextForKey: async function (sField, sValue, sEntity, sProperty, sKey, sText) {
            return new Promise(async (resolve, reject) => {
                let options = {
                    field: sField,
                    value: sValue,
                    entity: sEntity,
                    property: sProperty,
                };

                const filters = [];
                if (options.field) {
                    filters.push(new Filter(options.field, "EQ", `${options.value}`))
                }

                try {
                    const provisiones = await that.readEntity(provisionSAPModel, `/${options.entity}`, { filters });
                    let sReturn = "";
                    if (provisiones.results.length && provisiones.results.length > 0) {
                        sReturn = provisiones.results[0][sKey] + " - " + provisiones.results[0][sText];
                        if (sProperty == "proveedores") {
                            oModel.setProperty(`/${sProperty}`, provisiones.results)
                        }
                    }
                    resolve(sReturn);
                } catch (error) {
                    reject(error);
                }
            });
        },

        onChangeProvisionConOc: async function (oEvent) {
            const oInputs = that.getModel("provisionDetModel")
            oInputs.setProperty("/sustento", "");
            oInputs.setProperty("/posicion", "");
            oInputs.setProperty("/cuentaContable", "");
            oInputs.setProperty("/centroCosto", "");
            oInputs.setProperty("/centroGestor", "");
            oInputs.setProperty("/ordenInterna", "");
            oInputs.setProperty("/moneda", "");
            this.byId("txtSustento").setValueState(sap.ui.core.ValueState.None);
            this.byId("txtSustento").setValueStateText("");
            this.byId("txtProvisionOC").setValueState(sap.ui.core.ValueState.None);
            this.byId("txtProvisionOC").setValueStateText("");
            this.byId("idInputCuentaContable").setValueState(sap.ui.core.ValueState.None);
            this.byId("idInputCuentaContable").setValueStateText("");
            this.byId("idInputCentroCosto").setValueState(sap.ui.core.ValueState.None);
            this.byId("idInputCentroCosto").setValueStateText("");
            this.byId("txtCentroGestor").setValueState(sap.ui.core.ValueState.None);
            this.byId("txtCentroGestor").setValueStateText("");
            this.byId("txtOrdenInterna").setValueState(sap.ui.core.ValueState.None);
            this.byId("txtOrdenInterna").setValueStateText("");

            oInputs.setProperty("/rubro", "")
            oInputs.setProperty("/usuarioResponsable", "");
            that.getModel("provisionDetModel").setProperty("/usuarioResponsableNombres", "");

            this._validarControlesModo()
        },

        fnValidarCampos: function (oData) {

            let valueObligatoriosImpl = [],
                oReturn = {
                    isdValid: true,
                    message: "Completar los datos obligatorios:",
                    valueObli: valueObligatoriosImpl
                }

            if (!oData.provisionConOC || oData.provisionConOC.length <= 0) {
                this.byId("cboProvisionConOc").setValueState(sap.ui.core.ValueState.Error);
                this.byId("cboProvisionConOc").setValueStateText("Completar este campo");
                valueObligatoriosImpl.push("Tipo Doc. Compras");
                oReturn.isdValid = false;
            } else {
                this.byId("cboProvisionConOc").setValueState(sap.ui.core.ValueState.None);
                this.byId("cboProvisionConOc").setValueStateText("");

                if (oData.provisionConOC == "1") {
                    // if (oData.ordenInterna.length <= 0) {
                    //     oReturn.isdValid = false;
                    //     oReturn.message = "No se encontraron registros con la OC/SOLPED/PA y la posición.";
                    //     this.byId("txtSustento").setValueState(sap.ui.core.ValueState.Error);
                    //     this.byId("txtSustento").setValueStateText("No existen datos");
                    //     this.byId("txtProvisionOC").setValueState(sap.ui.core.ValueState.Error);
                    //     this.byId("txtProvisionOC").setValueStateText("No existen datos");
                    // } else {
                    //     this.byId("txtSustento").setValueState(sap.ui.core.ValueState.None);
                    //     this.byId("txtSustento").setValueStateText("");
                    //     this.byId("txtProvisionOC").setValueState(sap.ui.core.ValueState.None);
                    //     this.byId("txtProvisionOC").setValueStateText("");
                    // }
                } else {
                    let cboRubro = this.byId("cbRubro").getSelectedKey(),
                        sIdCuentaContable = "idInputCuentaContable",
                        sIdCentroCosto = "idInputCentroCosto",
                        sIdCentroGestor = "txtCentroGestor",
                        sIdOrdenInterna = "txtOrdenInterna"

                    if (cboRubro !== "NUEVO RUBRO") {
                        sIdCuentaContable = "idCboCuentaContable"
                        sIdCentroCosto = "idCboCentroCosto"
                        sIdCentroGestor = "idCboCentroGestor"
                        sIdOrdenInterna = "idCboOrdenInterna"
                    }

                    if (oData.cuentaContable.length <= 0) {
                        this.byId(sIdCuentaContable).setValueState(sap.ui.core.ValueState.Error);
                        this.byId(sIdCuentaContable).setValueStateText("Completar este campo");
                        oReturn.isdValid = false;
                    } else {
                        if (this.byId(sIdCuentaContable).getSelectedKey() == "") {
                            this.byId(sIdCuentaContable).setValueState(sap.ui.core.ValueState.Error);
                            this.byId(sIdCuentaContable).setValueStateText("Dato ingresado no válido");
                            oReturn.isdValid = false;
                        } else {
                            this.byId(sIdCuentaContable).setValueState(sap.ui.core.ValueState.None);
                            this.byId(sIdCuentaContable).setValueStateText("");
                        }
                    }

                    if (oData.centroCosto.length <= 0) {
                        this.byId(sIdCentroCosto).setValueState(sap.ui.core.ValueState.Error);
                        this.byId(sIdCentroCosto).setValueStateText("Completar este campo");
                        oReturn.isdValid = false;
                    } else {
                        if (this.byId(sIdCentroCosto).getSelectedKey() == "") {
                            this.byId(sIdCentroCosto).setValueState(sap.ui.core.ValueState.Error);
                            this.byId(sIdCentroCosto).setValueStateText("Dato ingresado no válido");
                            oReturn.isdValid = false;
                        } else {
                            this.byId(sIdCentroCosto).setValueState(sap.ui.core.ValueState.None);
                            this.byId(sIdCentroCosto).setValueStateText("");
                        }
                    }

                    if (oData.centroGestor.length <= 0) {
                        this.byId(sIdCentroGestor).setValueState(sap.ui.core.ValueState.Error);
                        this.byId(sIdCentroGestor).setValueStateText("Completar este campo");
                        oReturn.isdValid = false;
                    } else {
                        if (this.byId(sIdCentroGestor).getSelectedKey() == "") {
                            this.byId(sIdCentroGestor).setValueState(sap.ui.core.ValueState.Error);
                            this.byId(sIdCentroGestor).setValueStateText("Dato ingresado no válido");
                            oReturn.isdValid = false;
                        } else {
                            this.byId(sIdCentroGestor).setValueState(sap.ui.core.ValueState.None);
                            this.byId(sIdCentroGestor).setValueStateText("");
                        }
                    }

                    // if (oData.provisionConOC == "0")  {
                    //     if (oData.ordenInterna.length <= 0) {
                    //         this.byId(sIdOrdenInterna).setValueState(sap.ui.core.ValueState.Error);
                    //         this.byId(sIdOrdenInterna).setValueStateText("Completar este campo");
                    //         oReturn.isdValid = false;
                    //     } else {
                    //         if (this.byId(sIdOrdenInterna).getSelectedKey() == "") {
                    //             this.byId(sIdOrdenInterna).setValueState(sap.ui.core.ValueState.Error);
                    //             this.byId(sIdOrdenInterna).setValueStateText("Dato ingresado no válido");
                    //             oReturn.isdValid = false;
                    //         } else {
                    //             this.byId(sIdOrdenInterna).setValueState(sap.ui.core.ValueState.None);
                    //             this.byId(sIdOrdenInterna).setValueStateText("");
                    //         }
                    //     }
                    // }

                }
            }


            if (oData.idTipoPago_idTipoPago.length <= 0) {
                this.byId("cboTipoPago").setValueState(sap.ui.core.ValueState.Error);
                this.byId("cboTipoPago").setValueStateText("Dato ingresado no válido");
                valueObligatoriosImpl.push("Tipo de Pago");
                oReturn.isdValid = false;
            } else {
                if (this.byId("cboTipoPago").getSelectedKey() == "") {
                    this.byId("cboTipoPago").setValueState(sap.ui.core.ValueState.Error);
                    this.byId("cboTipoPago").setValueStateText("Dato ingresado no válido");
                    oReturn.isdValid = false;
                } else {
                    this.byId("cboTipoPago").setValueState(sap.ui.core.ValueState.None);
                    this.byId("cboTipoPago").setValueStateText("");
                }
            }

            if (oData.idTipoGasto_idTipoGasto.length <= 0) {
                this.byId("cboTipoGasto").setValueState(sap.ui.core.ValueState.Error);
                this.byId("cboTipoGasto").setValueStateText("Dato ingresado no válido");
                valueObligatoriosImpl.push("Tipo de Gasto");
                oReturn.isdValid = false;
            } else {
                if (this.byId("cboTipoGasto").getSelectedKey() == "") {
                    this.byId("cboTipoGasto").setValueState(sap.ui.core.ValueState.Error);
                    this.byId("cboTipoGasto").setValueStateText("Dato ingresado no válido");
                    oReturn.isdValid = false;
                } else {
                    this.byId("cboTipoGasto").setValueState(sap.ui.core.ValueState.None);
                    this.byId("cboTipoGasto").setValueStateText("");
                }
            }

            if (oData.idTipoServicio_idTipoServicio.length <= 0) {
                this.byId("cboTipoServicio").setValueState(sap.ui.core.ValueState.Error);
                this.byId("cboTipoServicio").setValueStateText("Dato ingresado no válido");
                valueObligatoriosImpl.push("Tipo de Servicio");
                oReturn.isdValid = false;
            } else {
                if (this.byId("cboTipoServicio").getSelectedKey() == "") {
                    this.byId("cboTipoServicio").setValueState(sap.ui.core.ValueState.Error);
                    this.byId("cboTipoServicio").setValueStateText("Dato ingresado no válido");
                    oReturn.isdValid = false;
                } else {
                    this.byId("cboTipoServicio").setValueState(sap.ui.core.ValueState.None);
                    this.byId("cboTipoServicio").setValueStateText("");
                }
            }

            if (oData.descripcionServicio.length <= 0) {
                this.byId("txtDescServicio").setValueState(sap.ui.core.ValueState.Error);
                this.byId("txtDescServicio").setValueStateText("Completar este campo");
                valueObligatoriosImpl.push("Desc. de Servicio");
                oReturn.isdValid = false;
            } else {
                this.byId("txtDescServicio").setValueState(sap.ui.core.ValueState.None);
                this.byId("txtDescServicio").setValueStateText("");
            }

            if (oData.periodoGasto.length <= 0) {
                this.byId("idDpPeriodo").setValueState(sap.ui.core.ValueState.Error);
                this.byId("idDpPeriodo").setValueStateText("Completar este campo");
                valueObligatoriosImpl.push("Mes de Servicio");
                oReturn.isdValid = false;
            } else {
                this.byId("idDpPeriodo").setValueState(sap.ui.core.ValueState.None);
                this.byId("idDpPeriodo").setValueStateText("");
            }

            if (oData.proveedor.length <= 0) {
                this.byId("idInputProveedor").setValueState(sap.ui.core.ValueState.Error);
                this.byId("idInputProveedor").setValueStateText("Completar este campo");
                valueObligatoriosImpl.push("Cod. Proveedor");
                oReturn.isdValid = false;
            } else {
                if (this.byId("idInputProveedor").getSuggestionItems().length === 0) {
                    this.byId("idInputProveedor").setValueState(sap.ui.core.ValueState.Error);
                    this.byId("idInputProveedor").setValueStateText("Dato ingresado no válido");
                    oReturn.isdValid = false;
                } else {
                    this.byId("idInputProveedor").setValueState(sap.ui.core.ValueState.None);
                    this.byId("idInputProveedor").setValueStateText("");
                }
            }

            if (oData.monto.length <= 0) {
                this.byId("txtMonto").setValueState(sap.ui.core.ValueState.Error);
                this.byId("txtMonto").setValueStateText("Completar este campo");
                valueObligatoriosImpl.push("Monto");
                oReturn.isdValid = false;
            } else {
                this.byId("txtMonto").setValueState(sap.ui.core.ValueState.None);
                this.byId("txtMonto").setValueStateText("");
            }

            if (oData.moneda.length <= 0) {
                this.byId("cboMoneda").setValueState(sap.ui.core.ValueState.Error);
                this.byId("cboMoneda").setValueStateText("Dato ingresado no válido");
                valueObligatoriosImpl.push("Moneda");
                oReturn.isdValid = false;
            } else {
                this.byId("cboMoneda").setValueState(sap.ui.core.ValueState.None);
                this.byId("cboMoneda").setValueStateText("");
            }

            if (oData.rubro.length <= 0) {
                oReturn.isdValid = false;
                oReturn.message = "Por favor, completar los datos obligatorios:" + valueObligatoriosImpl;
                this.byId("cbRubro").setValueState(sap.ui.core.ValueState.Error);
                this.byId("cbRubro").setValueStateText("Dato ingresado no válido");
                valueObligatoriosImpl.push("Rubro");
                //this.byId("cbDireccion").setValueState(sap.ui.core.ValueState.Error);
                //this.byId("cbDireccion").setValueStateText("Dato ingresado no válido");
                //this.byId("cbAreas").setValueState(sap.ui.core.ValueState.Error);
                //this.byId("cbAreas").setValueStateText("Dato ingresado no válido");
            } else {
                this.byId("cbRubro").setValueState(sap.ui.core.ValueState.None);
                this.byId("cbRubro").setValueStateText("");
                //this.byId("cbDireccion").setValueState(sap.ui.core.ValueState.None);
                //this.byId("cbDireccion").setValueStateText("");
                //this.byId("cbAreas").setValueState(sap.ui.core.ValueState.None);
                //this.byId("cbAreas").setValueStateText("");
            }

            return oReturn;
        },

        fnValidarCabecera: function (oData) {
            let oReturn = {
                isdValid: true,
                message: "Completar los datos obligatorios."
            }

            if (oData.periodoCierre === null || oData.periodoCierre.length <= 0) {
                this.byId("fDatosGeneralesProvision--idDpPeriodo").setValueState(sap.ui.core.ValueState.Error);
                this.byId("fDatosGeneralesProvision--idDpPeriodo").setValueStateText("Completar este campo");
                oReturn.isdValid = false;
            } else {
                this.byId("fDatosGeneralesProvision--idDpPeriodo").setValueState(sap.ui.core.ValueState.None);
                this.byId("fDatosGeneralesProvision--idDpPeriodo").setValueStateText("");
            }

            return oReturn;
        },

        onMostrarMensajesIndividual: function (aMensajes) {
            var oModel = new sap.ui.model.json.JSONModel({
                provision: aMensajes
            });
            sap.ui.getCore().setModel(oModel, "mensajes");
            var oDialog = new sap.m.Dialog({
                title: 'Mensajes',
                resizable: false,
                state: "Information",
                content: [
                    new sap.m.List({
                        visible: true,
                        items: {
                            path: "mensajes>/provision",
                            template: new sap.m.StandardListItem({
                                title: "{mensajes>CodigoMensaje}",
                                description: "{mensajes>DescMensaje}",
                                wrapping: true // Esto habilitará el wrapping del texto dentro del elemento

                            })
                        }
                    })
                ],
                beginButton: new Button({
                    icon: "sap-icon://decline",
                    type: "Reject",
                    press: function () {
                        this.getParent().close();
                    },
                    text: "Cerrar"
                }),
                contentHeight: "300px",
                contentWidth: "500px",
                verticalScrolling: true
            });

            oDialog.open();
        },

        onMostrarMensajesMultiples: function (aMensajes, aProvision) {
            let aReturnProvision = formatArray(aMensajes, aProvision);
            var oModel = new sap.ui.model.json.JSONModel({
                provision: aReturnProvision
            });
            sap.ui.getCore().setModel(oModel, "test");
            let oBackButton = new Button({
                icon: sap.ui.core.IconPool.getIconURI("nav-back"),
                visible: false,
                press: function () {
                    sap.ui.getCore().byId("errorList").setVisible(false);
                    sap.ui.getCore().byId("listProv").setVisible(true);
                    this.setVisible(false);
                }
            });
            var oDialog = new sap.m.Dialog({
                title: 'Mensajes',
                resizable: false,
                state: "Information",
                content: [
                    new sap.m.List({
                        id: "listProv",
                        items: {
                            path: "test>/provision",
                            template: new sap.m.StandardListItem({
                                title: "Error en la fila {test>IdProvision}: {test>Direccion} - {test>Area}",
                                description: "{test>DocCompra} - {test>CuentaContable} - {test>CentroCosto} - {test>CentroGestor} - {test>OrdenInterna}",
                                type: "Active",
                                highlight: "Information",
                                press: this.onMostrarMensajesDeError.bind(this, oBackButton)
                            })
                        }
                    }),
                    new sap.m.List({
                        id: "errorList",
                        visible: false,
                        items: {
                            path: "test>errores",
                            template: new sap.m.StandardListItem({
                                title: "{test>CodigoMensaje}",
                                description: "{test>DescMensaje}",
                                highlight: "Error"
                            })
                        }
                    })
                ],
                beginButton: new Button({
                    icon: "sap-icon://decline",
                    type: "Reject",
                    press: function () {
                        this.getParent().destroy();
                    },
                    text: "Cerrar"
                }),
                customHeader: new Bar({
                    contentMiddle: [
                        new Text({
                            text: "Mensajes"
                        })
                    ],
                    contentLeft: [oBackButton]
                }),
                contentHeight: "300px",
                contentWidth: "500px",
                verticalScrolling: true
            });

            // Abre el diálogo
            oDialog.open();

            function formatArray(aMensajes, aProvision) {
                let aReturn = [];

                for (let i = 0; i < aProvision.length; i++) {
                    let aMensajesR = aMensajes.filter(oPos => oPos.IdProvision === aProvision[i].IdProvision);
                    if (aMensajesR.length > 0) {
                        let iPosicion = i + 1;
                        let oProvision = {
                            posicion: iPosicion,
                            descrServicio: aProvision[i].DescrServicio,
                            usuarioResponsable: aProvision[i].UsuRegistra,
                            IdProvision: aProvision[i].IdProvision,
                            Direccion: aProvision[i].Direccion,
                            Area: aProvision[i].Area,
                            DocCompra: aProvision[i].DocCompra,
                            Posicion: aProvision[i].Posicion,
                            CuentaContable: aProvision[i].CuentaContable,
                            CentroCosto: aProvision[i].CentroCosto,
                            CentroGestor: aProvision[i].CentroGestor,
                            OrdenInterna: aProvision[i].OrdenInterna,
                            errores: aMensajesR
                        };
                        aReturn.push(oProvision);
                    }

                }

                return aReturn;
            }
        },

        onMostrarMensajesDeError: function (oBackButton, oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext("test")

            var aErrores = oBindingContext.getProperty("errores");

            var oErrorList = sap.ui.getCore().byId("errorList");
            oErrorList.bindItems({
                path: "test>/errores",
                template: new sap.m.StandardListItem({
                    title: "{test>CodigoMensaje}",
                    description: "{test>DescMensaje}",
                    wrapping: true,
                    highlight: "Error"
                })
            });
            oErrorList.getModel("test").setProperty("/errores", aErrores);
            oErrorList.setVisible(true);
            oBackButton.setVisible(true);
            oEvent.getSource().getParent().setVisible(false);
        },

        setDatosCabDescription: function (oData) {
            if (that.getModel("detalleProv").getData().length == 0) {
                that.getModel("provisionCabModel").setProperty("/vbDirecion", oData.vbDirecion);
                that.getModel("provisionCabModel").setProperty("/responsable", oData.responsable);
                that.getModel("provisionCabModel").setProperty("/responsableEgresos", oData.responsableEgresos);
                that.getModel("provisionCabModel").setProperty("/director", oData.director);

                that.getModel("provisionCabModel").setProperty("/direccion", oData.direccion_ID_direccion_ID);
                that.getModel("provisionCabModel").setProperty("/direccionDesc", oData.direccion_ID.nombreDireccion);
                that.getModel("provisionCabModel").setProperty("/area", oData.area_ID_area_ID);
                that.getModel("provisionCabModel").setProperty("/areaDesc", oData.area_ID.nombreArea);
                that.getModel("provisionCabModel").setProperty("/responsableDesc", oData.nomCompletoResponsable);
                that.getModel("provisionCabModel").setProperty("/directorDesc", oData.nomCompletoDirector);
                that.getModel("provisionCabModel").setProperty("/responsableEgresosDesc", oData.nomCompletoResponsableEgresos);
                that.getModel("provisionCabModel").setProperty("/planificadorDesc", oData.nomCompletoPlanificador);
                that.getModel("provisionCabModel").setProperty("/planificador", oData.planificador);
            }
        },

        onGetRubroSinOc: async function (oEvent) {
            let sKey = this.byId("cboProvisionConOc").getSelectedKey();
            let oInputs = that.getModel("provisionDetModel")

            //if (sKey == "0") {
            let sCuenta = separarCodigoYTexto(oInputs.getProperty("/cuentaContable")).codigo
            let sCosto = separarCodigoYTexto(oInputs.getProperty("/centroCosto")).codigo
            let sGestor = separarCodigoYTexto(oInputs.getProperty("/centroGestor")).codigo
            let sOrden = separarCodigoYTexto(oInputs.getProperty("/ordenInterna")).codigo

            let aFilter = [];

            if (sCuenta != "" && sCosto != "" && sGestor != "" && sOrden != "") {
                aFilter.push(new Filter("cuentaContable", "EQ", sCuenta))
                aFilter.push(new Filter("centroCosto", "EQ", sCosto))
                aFilter.push(new Filter("centroGestor", "EQ", sGestor))
                aFilter.push(new Filter("ordenInterna", "EQ", sOrden.replace(/^0+/, '')))
                let aAsignacion = await this._getAsignacionIndividualExcel(aFilter);
                const oInputs = that.getModel("provisionDetModel")

                if (aAsignacion) {
                    if (aAsignacion.results.length) {
                        this.byId("cbRubro").setValue("")
                        this.byId("cbRubro").setSelectedKey("")
                        aAsignacion.results.push({ rubro: "NUEVO RUBRO" })
                        this.getView().setModel(new JSONModel(aAsignacion.results), "aRubro")
                        MessageBox.error("Ya exite un rubro para los datos ingresados. Por favor, seleccionar el rubro correcto.")
                        //oInputs.setProperty("/rubro", aAsignacion.results[0].rubro)
                        //oInputs.setProperty("/usuarioResponsable", aAsignacion.results[0].responsable);
                        //that.getModel("provisionDetModel").setProperty("/usuarioResponsableNombres", aAsignacion.results[0].nomCompletoResponsable);
                    } else {
                        oInputs.setProperty("/rubro", "")
                        oInputs.setProperty("/usuarioResponsable", "");
                        that.getModel("provisionDetModel").setProperty("/usuarioResponsableNombres", "");
                    }
                } else {
                    oInputs.setProperty("/rubro", sRubro)
                }
            }

            //}

            function separarCodigoYTexto(sText) {
                let partes = sText.split(" - ");
                let codigo = partes[0];
                let texto = "";
                $.each(partes, (key, value) => {
                    if (key > 1) {
                        texto = texto + " - " + value;
                    } else if (key == 1) {
                        texto = value
                    }
                })
                return {
                    codigo: codigo,
                    texto: texto
                };
            }
        },

        _getAsignacionIndividualExcel: async function (aFilter) {
            return new Promise(async (resolve, reject) => {
                const parameters = {
                    filters: aFilter,
                    urlParameters: {}
                };
                try {
                    let aReturn = await this.readEntity(provisionModel, '/AsignacionesDetalle', parameters)
                    resolve(aReturn)
                } catch (error) {
                    resolve(false)
                    MessageBox.error(error);
                }
            });
        },

        _getAsignacionIndividual: async function (aFilter) {
            return new Promise(async (resolve, reject) => {
                try {
                    const parameters = {
                        filters: aFilter,
                        urlParameters: {
                            "$expand": "direccion_ID,detalle"
                        }
                    };

                    const asignacionCurrent = await that.readEntity(asignacionModel, `/AsignacionesProvision`, parameters);

                    resolve(asignacionCurrent.results[0].detalle)
                } catch (error) {
                    sap.ui.core.BusyIndicator.hide(0)
                    resolve(false)
                }
            });
        },

        getDescTipoPago: function (sValue) {
            if (!sValue) {
                return "";
            }

            let oTipo = oModel.getProperty("/TiposPago").find(oPos => oPos.idTipoPago == sValue)

            if (oTipo) {
                return oTipo.descripcion
            } else {
                return ""
            }
        },

        getDescTipoGasto: function (sValue) {
            if (!sValue) {
                return "";
            }

            let oTipo = oModel.getProperty("/TiposGasto").find(oPos => oPos.idTipoGasto == sValue)

            if (oTipo) {
                return oTipo.descripcion
            } else {
                return ""
            }
        },

        getDescTipoServicio: function (sValue) {
            if (!sValue) {
                return "";
            }

            let oTipo = oModel.getProperty("/TiposServicio").find(oPos => oPos.idTipoServicio == sValue)

            if (oTipo) {
                return oTipo.descripcion
            } else {
                return ""
            }
        },

        sendfiltrosVacios: function () {
            let urlParameters = {};
            urlParameters['direccion_ID_direccion_ID'] = null;
            urlParameters['area_ID_area_ID'] = null;
            urlParameters.responsable = null;
            urlParameters.responsableEgresos = null;
            urlParameters.planificador = null;
            var parameters = {};
            parameters.urlParameters = urlParameters
            return parameters;
        },

        completarCerosIzquierda: function (sValue, longitud) {
            let resultado = sValue.toString();
            while (resultado.length < longitud) {
                resultado = '0' + resultado;
            }
            return resultado;
        },

        getResponsable: async function (oEvent) {
            let sKey = oEvent.getSource().getSelectedKey()

            if (sKey) {
                let urlParameters = {};
                urlParameters['direccion_ID_direccion_ID'] = sKey;
                let parameters = {};
                parameters.urlParameters = urlParameters
                try {
                    let asignacionModel = this.getOwnerComponent().getModel("asignacionModel")
                    let aResponsable = await this.readEntity(asignacionModel, '/GetListaResponsables', parameters)
                    this.byId("fDatosGeneralesProvision--cbResponsableCab").setValue()
                    this.getView().setModel(new JSONModel(aResponsable.results), "aResponsable")
                } catch (error) {
                    MessageBox.error(error);
                }
            }
        },
        _getAprobadores: async function (sDireccion, sResponsable) {
            return new Promise(async (resolve, reject) => {
                try {
                    let urlParameters = {};
                    urlParameters['rubro_ID'] = null;
                    urlParameters['direccion_ID_direccion_ID'] = sDireccion;
                    urlParameters['nombreArea_nombreArea'] = null;
                    urlParameters.responsable = sResponsable;
                    urlParameters.responsableEgresos = null;
                    let parameters = {};
                    parameters.urlParameters = urlParameters
                    const asignaciones = await that.readEntity(asignacionModel, '/GetListadoAsignaciones', parameters)
                    if (asignaciones.results.length === 0) {
                        resolve(false)
                    } else {
                        let oData = asignaciones.results[0]
                        that.getModel("provisionCabModel").setProperty("/vbDirecion", oData.vbDirecion);
                        that.getModel("provisionCabModel").setProperty("/responsable", oData.responsable);
                        that.getModel("provisionCabModel").setProperty("/responsableEgresos", oData.responsableEgresos);
                        that.getModel("provisionCabModel").setProperty("/director", oData.director);

                        that.getModel("provisionCabModel").setProperty("/direccion", oData.direccion_ID);
                        that.getModel("provisionCabModel").setProperty("/direccionDesc", oData.nombreDireccion);
                        that.getModel("provisionCabModel").setProperty("/area", oData.area_ID);
                        that.getModel("provisionCabModel").setProperty("/areaDesc", oData.nombreArea);
                        that.getModel("provisionCabModel").setProperty("/responsableDesc", oData.nomCompletoResponsable);
                        that.getModel("provisionCabModel").setProperty("/directorDesc", oData.nomCompletoDirector);
                        that.getModel("provisionCabModel").setProperty("/responsableEgresosDesc", oData.nomCompletoResponsableEgresos);
                        that.getModel("provisionCabModel").setProperty("/planificadorDesc", oData.nomCompletoPlanificador);
                        that.getModel("provisionCabModel").setProperty("/planificador", oData.planificador);
                        resolve(true)
                    }
                } catch (error) {
                    MessageBox.error(error);
                    resolve(false)
                }
            });
        },
        getRubros: async function (oEvent) {
            try {
                sap.ui.core.BusyIndicator.show(0)
                let urlParameters = {};
                urlParameters['rubro_ID'] = null;
                urlParameters['direccion_ID_direccion_ID'] = that.byId("fDatosGeneralesProvision--cbDireccionCab").getSelectedKey();
                urlParameters['nombreArea_nombreArea'] = null;
                urlParameters.responsable = oEvent.getSource().getSelectedKey();
                urlParameters.responsableEgresos = null;
                let parameters = {};
                parameters.urlParameters = urlParameters

                const asignaciones = await that.readEntity(asignacionModel, '/GetListadoAsignaciones', parameters)
                let oData = asignaciones.results
                if (asignaciones.results.length === 0) {
                    oData = [{ rubro: "NUEVO RUBRO" }]
                } else {
                    oData.push({ rubro: "NUEVO RUBRO" })
                }
                this.getView().setModel(new JSONModel(oData), "aRubro")
                sap.ui.core.BusyIndicator.hide(0)
            } catch (error) {
                MessageBox.error(error);
                sap.ui.core.BusyIndicator.hide(0)
            }
        },
        changeRubro: function (oEvent) {
            let sKey = oEvent.getSource().getSelectedKey(),
                sKeyTipoDoc = this.byId("cboProvisionConOc").getSelectedKey()

            this._validarControlesModo()
            if (sKey == "NUEVO RUBRO") {
                this.byId("idInputCuentaContable").setEnabled(true)
                this.byId("idInputCentroCosto").setEnabled(true)
                this.byId("txtCentroGestor").setEnabled(true)
                this.byId("txtOrdenInterna").setEnabled(true)
            } else {
                if (sKeyTipoDoc == 0) {
                    return
                }
                this.byId("idInputCuentaContable").setEnabled(false)
                this.byId("idInputCentroCosto").setEnabled(false)
                this.byId("txtCentroGestor").setEnabled(false)
                this.byId("txtOrdenInterna").setEnabled(false)
            }
        },
        onChangeMesServicio: function () {
            let dataDet = that.getModel("provisionDetModel").getData()

            if (dataDet.periodoGasto) {
                if (dataDet.periodoGasto.getMonth() > new Date().getMonth()
                    && dataDet.periodoGasto.getFullYear() >= new Date().getFullYear()) {
                    dataDet.periodoGasto = null;
                    MessageBox.error('No se permiten fechas posteriores a la actual')
                    return;
                }
                viewModel.setProperty("/bSave", true)
            } else {
                viewModel.setProperty("/bSave", false)
            }

        },

        _validarControlesModo: async function () {
            let cboTipoCompra = this.byId("cboProvisionConOc").getSelectedKey(),
                cboRubro = this.byId("cbRubro").getSelectedKey()

            //NTT DATA - COMENTADO A PETICION DEL CLIENTE - MR
            // if (cboTipoCompra == 0 && cboRubro !== "NUEVO RUBRO") {
            //NTT DATA - COMENTADO A PETICION DEL CLIENTE - MR

            if (cboRubro !== "NUEVO RUBRO") {

                modeControlModel.setProperty("/comboBoxView", true)
                modeControlModel.setProperty("/inputView", false)

                //Se buscan los 4 campos del mantenimiento de asignación
                let sRubro = that.byId("cbRubro").getSelectedKey(),
                    sDireccion = that.byId("fDatosGeneralesProvision--cbDireccionCab").getSelectedKey()

                if (sRubro !== "" && sDireccion !== "") {
                    sap.ui.core.BusyIndicator.show(0)

                    sRubro = that.byId("cbRubro").getSelectedItem().getBindingContext("aRubro").getObject().rubro_ID
                    let aFilter = [];
                    aFilter.push(new Filter("rubro_ID", "EQ", sRubro))
                    aFilter.push(new Filter("direccion_ID_direccion_ID", "EQ", sDireccion))
                    let aAsignacion = await that._getAsignacionIndividual(aFilter);

                    let objetoFiltrado = aAsignacion.results.reduce((obj, item) => {
                        if (!obj.cuentaContable[item.cuentaContable]) {
                            obj.cuentaContable[item.cuentaContable] = true;
                            obj.cuentaContableArray.push({ key: item.cuentaContable, descripcion: item.cuentaContable });
                        }

                        if (!obj.centroCosto[item.centroCosto]) {
                            obj.centroCosto[item.centroCosto] = true;
                            obj.centroCostoArray.push({ key: item.centroCosto, descripcion: item.centroCosto });
                        }

                        if (!obj.centroGestor[item.centroGestor]) {
                            obj.centroGestor[item.centroGestor] = true;
                            obj.centroGestorArray.push({ key: item.centroGestor, descripcion: item.centroGestor });
                        }

                        if (!obj.ordenInterna[item.ordenInterna]) {
                            obj.ordenInterna[item.ordenInterna] = true;
                            obj.ordenInternaArray.push({ key: item.ordenInterna, descripcion: item.ordenInterna });
                        }

                        return obj;
                    }, {
                        cuentaContable: {},
                        centroCosto: {},
                        centroGestor: {},
                        ordenInterna: {},
                        cuentaContableArray: [],
                        centroCostoArray: [],
                        centroGestorArray: [],
                        ordenInternaArray: []
                    });

                    oModel.setProperty(`/cuentasContable`, objetoFiltrado.cuentaContableArray)
                    oModel.setProperty(`/centrosCosto`, objetoFiltrado.centroCostoArray)
                    oModel.setProperty(`/centroGestor`, objetoFiltrado.centroGestorArray)
                    oModel.setProperty(`/ordenInterna`, objetoFiltrado.ordenInternaArray)

                    that.byId("idCboCuentaContable").setSelectedKey("")
                    that.byId("idCboCentroCosto").setSelectedKey("")
                    that.byId("idCboCentroGestor").setSelectedKey("")
                    that.byId("idCboOrdenInterna").setSelectedKey("")
                    console.log(objetoFiltrado);
                    sap.ui.core.BusyIndicator.hide()
                }

            } else {
                modeControlModel.setProperty("/comboBoxView", false)
                modeControlModel.setProperty("/inputView", true)
            }

        },

        _getConfiguracionApertura: async function () {

            viewModel.setProperty("/busy", true)

            const filterList = [],
                filters = []

            filterList.push(new Filter("identificador", "EQ", "CARGA_RUBRO"))
            filterList.push(new Filter("fechaCreacion", "NE", null))
            filterList.push(new Filter("estado", "EQ", true))

            filters.push(new Filter({
                filters: filterList,
                and: true
            }))

            const parameters = {
                filters: filters,
                urlParameters: {
                }
            };
            try {

                const configuracionAperturas = await that.readEntity(asignacionModel, '/Configuracion', parameters)

                for (let index = 0; index < configuracionAperturas.results.length; index++) {
                    const element = configuracionAperturas.results[index]
                    element.valor1 = new Date(element.valor1)
                    element.valor2 = new Date(element.valor2)
                }

                oModel.setProperty("/AperturasConfiguradas", configuracionAperturas.results)

                viewModel.setProperty("/busy", false)
            } catch (error) {

                MessageBox.error(error);

                viewModel.setProperty("/busy", false)
            }

        },

        //VALIDACION DE MAX FILAS
        _getConfiguracionMaximoFilas: async function () {

            viewModel.setProperty("/busy", true)

            const filterList = [],
                filters = []

            filterList.push(new Filter("identificador", "EQ", "MAX_FILAS"))
            filterList.push(new Filter("estado", "EQ", true))

            filters.push(new Filter({
                filters: filterList,
                and: true
            }))

            const parameters = {
                filters: filters,
                urlParameters: {
                }
            };

            try {
                const configuracionMaximoFilas = await that.readEntity(asignacionModel, '/Configuracion', parameters)
                let maxFilas = 0

                if (configuracionMaximoFilas.results.length > 0)
                    maxFilas = configuracionMaximoFilas.results[0].valor1

                oModel.setProperty("/MaximoFilas", parseFloat(maxFilas))

                viewModel.setProperty("/busy", false)
            } catch (error) {

                MessageBox.error(error);

                viewModel.setProperty("/busy", false)
            }

        },

        formatoImporte: function (numero) {
            if (!numero) {
                return "0.00"
            }
            let formateado = numero.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return formateado
        },
        /*Función para iniciar tabla
        *Crear el modelo de la tabla
        Agregar el fragmento a la vista*/
        onIniciarTabla: function () {
            const oModel = new sap.ui.model.json.JSONModel({
                items: [] 
            });
            this.getView().setModel(oModel, "archivos");

            // if (!this._oFragment) {
            //     Fragment.load({
            //         id: this.getView().getId(),
            //         name: "com.indra.gestionprovisiones.view.provision.AdjuntoArchivo",
            //         controller: this
            //     }).then((oFragment) => {
            //         this._oFragment = oFragment;

            //         this.getView().addDependent(this._oFragment);

            //         this.getView().byId("contentContainer").addItem(this._oFragment);
            //         this.getView().byId("contentContainerVisualice").addItem(this._oFragment);
            //     });
            // }
        },
            /*Función para obtener la tabla del fragmento
            *Para habilitar los botones según la selección
            Deshabilitar botones de descarga o eliminar*/
        onSelectionChange: function (oEvent) {
            
            const oTable = sap.ui.core.Fragment.byId(this.getView().getId(), "tablaArchivo");
            const aSelectedItems = oTable.getSelectedItems();

            const bHasSelection = aSelectedItems.length > 0; // Si hay al menos un archivo seleccionado
            const oDescargarArchivo = sap.ui.core.Fragment.byId(this.getView().getId(), "descargarArchivo");
            const oEliminarArchivo = sap.ui.core.Fragment.byId(this.getView().getId(), "eliminarArchivo");

            oDescargarArchivo.setEnabled(bHasSelection);

            oEliminarArchivo.setEnabled(aSelectedItems.length === 1);
        },
            /*Función para cargar archivo a la tabla
            *Validar el tamaño del archivo
            Validar el tipo de archivo*/

        onCargarArchivoDMS: function (oEvent) {
            const oFileInput = document.createElement("input");
            oFileInput.type = "file";
            oFileInput.accept = ".eml,.bmp,.gif,.jpeg,.png,.xls,.xlsx,.ppt,.pptx,.txt,.doc,.docx,.zip,.rar";
            oFileInput.multiple = false;

            oFileInput.addEventListener("change", (oEvent) => {
                const oFile = oEvent.target.files[0];

                if (!oFile) {
                    sap.m.MessageToast.show("No se seleccionó ningún archivo.");
                    return;
                }
                if (oFile.size > 20 * 1024 * 1024) {
                    sap.m.MessageToast.show("El archivo excede el tamaño máximo de 20 MB.");
                    return;
                }
                const aAllowedTypes = [
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
                    "application/msword", // .doc
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
                    "application/vnd.ms-powerpoint", // .ppt
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
                    "application/vnd.ms-excel", // .xls
                    "text/plain", // .txt
                    "image/jpeg", // .jpeg, .jpg
                    "image/png", // .png
                    "image/bmp", // .bmp
                    "image/gif", // .gif
                    "message/rfc822", // .eml
                    "application/x-zip-compressed", // .zip
                    "application/x-rar-compressed", // .rar
                ];

                if (!aAllowedTypes.includes(oFile.type)) {
                    sap.m.MessageToast.show("Formato de archivo no permitido.");
                    return;
                }

                // Determinar el ícono representativo según el tipo de archivo
                const oFileIconMap = {
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "sap-icon://excel-attachment",
                    "application/msword": "sap-icon://doc-attachment",
                    "image/jpeg": URL.createObjectURL(oFile),
                    "image/png": URL.createObjectURL(oFile)
                };

                const sUrl = oFileIconMap[oFile.type] || "sap-icon://attachment";

                const oModel = this.getView().getModel("archivos");
                const aItems = oModel.getProperty("/items");

                aItems.push({
                    nombreArchivo: oFile.name,
                    formatoArchivo: oFile.type,
                    tamanioArchivo: (oFile.size / 1024 / 1024).toFixed(2) + " MB",
                    url: sUrl, // URL temporal o ícono según el tipo
                    file: oFile
                });

                oModel.setProperty("/items", aItems);

                sap.m.MessageToast.show("Archivo cargado exitosamente.");
            });

            oFileInput.click();
        },
            //Función para descargar archivos de la tabla
        onDescargarArchivo: function (oEvent) {
            const oTable = sap.ui.core.Fragment.byId(this.getView().getId(), "tablaArchivo");
            const aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                sap.m.MessageToast.show("Por favor, seleccione un archivo para descargar.");
                return;
            }

            aSelectedItems.forEach((oItem) => {
                const oContext = oItem.getBindingContext("archivos");
                const oData = oContext.getObject();

                if (oData.url) {
                    // Crear un enlace de descarga
                    const link = document.createElement("a");
                    link.href = oData.url;
                    link.download = oData.nombreArchivo || "archivo"; // Nombre por defecto si no existe
                    link.click();
                } else {
                    sap.m.MessageToast.show("El archivo no tiene una URL válida para descargar.");
                }
            });

            sap.m.MessageToast.show("Descarga completada.");
        },

            //Función para eliminar achivos de la tabla
        onEliminarArchivo: function (oEvent) {
            const oTable = sap.ui.core.Fragment.byId(this.getView().getId(), "tablaArchivo");
            const aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                sap.m.MessageToast.show("Por favor, seleccione un archivo para eliminar.");
                return;
            }

            const oModel = this.getView().getModel("archivos");
            const aItems = oModel.getProperty("/items");

            // Eliminar elementos seleccionados del modelo
            aSelectedItems.forEach((oItem) => {
                const oContext = oItem.getBindingContext("archivos");
                const oData = oContext.getObject();
                const iIndex = aItems.indexOf(oData);
                if (iIndex !== -1) {
                    aItems.splice(iIndex, 1); // Eliminar del array
                }
            });

            oModel.setProperty("/items", aItems);

            // Deshabilitar los botones después de eliminar
            const oDescargarArchivo = sap.ui.core.Fragment.byId(this.getView().getId(), "descargarArchivo");
            const oEliminarArchivo = sap.ui.core.Fragment.byId(this.getView().getId(), "eliminarArchivo");
            oDescargarArchivo.setEnabled(false);
            oEliminarArchivo.setEnabled(false);

            sap.m.MessageToast.show("Archivo(s) eliminado(s) exitosamente.");
        },
        
        //Función para ver los archivos seleccionado en la tabla
        onVerArchivo: function (oEvent) {
            const oModel = this.getView().getModel("archivos");
            const aItems = oModel.getProperty("/items");
            const aImageItems = aItems.filter(item => item.formatoArchivo.includes("image"));

            if (aImageItems.length === 0) {
                sap.m.MessageToast.show("No hay imágenes para mostrar.");
                return;
            }

            // Crear elementos del carrusel
            const aCarouselPages = aImageItems.map(item => new sap.m.Image({
                src: item.url,
                width: "80%",
                height: "80%"
            }));

            // Crear el diálogo para el carrusel
            if (!this._oCarouselDialog) {
                this._oCarouselDialog = new sap.m.Dialog({
                    title: "Vista Previa de Imágenes",
                    contentWidth: "70%",
                    contentHeight: "70%",
                    resizable: true,
                    draggable: true,
                    content: new sap.m.Carousel({
                        pages: aCarouselPages
                    }),
                    beginButton: new sap.m.Button({
                        text: "Cerrar",
                        press: () => this._oCarouselDialog.close()
                    }),

                    endButton: new sap.m.Button({
                        text: "Descargar",
                        press: () => {
                            // Crear enlace para descargar
                            const oCarousel = sap.ui.getCore().byId(this.getView().getId() + "--carousel");
                            const iActiveIndex = oCarousel.indexOfPage(oCarousel.getActivePage());

                            // Obtener el elemento activo del carrusel
                            const oCurrentItem = aImageItems[iActiveIndex];

                            if (oCurrentItem.url) {
                                // Crear un enlace para descargar la imagen
                                const link = document.createElement("a");
                                link.href = oCurrentItem.url;
                                link.download = oCurrentItem.nombreArchivo || "imagen";
                                link.click();
                                sap.m.MessageToast.show("Descarga completada.");
                            } else {
                                sap.m.MessageToast.show("No se puede descargar esta imagen.");
                            }
                        }
                    }),

                });

                this.getView().addDependent(this._oCarouselDialog);
            } else {
                this._oCarouselDialog.removeAllContent();
                this._oCarouselDialog.addContent(new sap.m.Carousel({
                    pages: aCarouselPages
                }));
            }

            this._oCarouselDialog.open();
        },
        //Función para crear carpeta en el DMS
        getFolder: async function (nuevaProvision) {
            sap.ui.core.BusyIndicator.show(0)
            if (await this._noExisteFolder(nuevaProvision)) {
                const formData = new FormData();
                formData.append("cmisaction", "createFolder");
                formData.append("propertyId[0]", "cmis:name");
                formData.append("propertyValue[0]", nuevaProvision);
                formData.append("propertyId[1]", "cmis:objectTypeId");
                formData.append("propertyValue[1]", "cmis:folder");
                formData.append("succinct", true);
                try {
                    const folder = await fetch(`${this._pathRest()}`, {
                        method: "POST",
                        body: formData,
                        success: (data) => data,
                        error: (error) => error
                    })
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    sap.ui.core.BusyIndicator.hide()
                    MessageBox.error("No se pudo crear el repositorio")
                }
            }
        },
        //Función para verificar si existe la carpeta en el DMS
        _noExisteFolder: async function (nuevaProvision) {
            const url = `${(this._pathRest())}/Solicitud_${nuevaProvision}`
            const folder = await fetch(url)
            if (folder.ok) {
                const contenido = await folder.json();
                
                const model = this.getView().getModel("VIEW_DETALLE_MODEL");
                if (model) {
                    model.setProperty("/folder", contenido);
                } else {
                    console.error("VIEW_DETALLE_MODEL no está definido");
                }
                
                return false;
            }

            return true;
        },
        //Función para conectarse al DMS
        _pathRest: function () {
            const idAplicacion = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            const appPath = idAplicacion.replaceAll(".", "/");
            const appModulePath = $.sap.getModulePath(appPath);
            const url = appModulePath + "/browser/9dbc57fa-16d2-4dea-a799-9ba20f2c18f5/root";
            return url;
        },

        //Función para subir archivos al DMS
        onSubirDocumentosDMS: async function(numeroSol){
            sap.ui.core.BusyIndicator.show(0)
            const oModel = this.getView().getModel("archivos");
            const archivos = oModel.getProperty("/items");            
            try {
                const responses = await Promise.all(
                    archivos.map(async (item) => {
                        const extension = item.file.name.split(".")[1];                   
                        
                        const formData = new FormData();
                        formData.append("cmisaction", "createDocument");
                        formData.append("filename", `${item.nombreArchivo}`);
                        formData.append("_charset", "UTF-8");
                        formData.append("propertyId[0]", "cmis:name");
                        formData.append("propertyValue[0]", `${item.nombreArchivo}.${extension}`);
                        formData.append("propertyId[1]", "cmis:objectTypeId");
                        formData.append("propertyValue[1]", "cmis:document");
                        formData.append("media", item.file);

                        const url = `${this._pathRest()}/${numeroSol}`;
                        return await fetch(url, { method: "POST", body: formData });
                    })
                );

                const resultados = [];
                responses.forEach((response, index) => {
                    if (response.ok) {
                        resultados.push({
                            title: archivos[index].nombreArchivo,
                            info: archivos[index].file.name,
                            infoState: "Success"
                        });
                    } else {
                        resultados.push({
                            title: archivos[index].nombreArchivo,
                            info: archivos[index].file.name,
                            infoState: "Error"
                        });
                    }
                });

                oModel.setProperty("/contenidoDialogoInfoAdjunto", resultados);

                const errores = resultados.filter((res) => res.infoState === "Error");
                if (errores.length > 0) {
                    MessageBox.warning("Algunos archivos no se pudieron cargar.");
                }
                // else {
                //     MessageBox.success("Todos los archivos se cargaron con éxito.");
                // }
                sap.ui.core.BusyIndicator.hide()
            } catch (error) {
                sap.ui.core.BusyIndicator.hide()
                console.error("Error al cargar los archivos:", error);
                MessageBox.error("Ocurrió un error al cargar los archivos.");
            } finally {
                sap.ui.core.BusyIndicator.hide()
            }
        },
        
    });
});

sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, JSONModel, formatter, MessageBox,
        Filter,
        FilterOperator) {
        "use strict";
        //prueba CI/CD
        let that
        let provisionModel, oModel, viewModel, empleadoModel, provisionSAPModel, asignacionModel

        return BaseController.extend("com.indra.gestionprovisiones.controller.Home", {

            formatter: formatter,
            onInit: function () {
                that = this

                let oRouter = that.getOwnerComponent().getRouter()

                oRouter.getRoute("RouteHome").attachMatched((this._onRouteMatched), this)
            },


            _onRouteMatched: function (oEvent) {

                provisionModel = this.getOwnerComponent().getModel("provisionModel")
                empleadoModel = this.getOwnerComponent().getModel("empleadoModel")
                provisionSAPModel = this.getOwnerComponent().getModel("provisionSAPModel")
                asignacionModel = this.getOwnerComponent().getModel("asignacionModel")
                oModel = that.getOwnerComponent().getModel()
                oModel.setProperty("/Busqueda", { periodoCierre: new Date() })

                that.setModel(new JSONModel({
                    busy: false,
                    cantidad: 0
                }), "worklistView")

                viewModel = that.getModel("worklistView")

                that._getSolicitudesProvisionBBDD([])
                that._getGerenciaJefaturaBBDD()
                that._getEstadosBBDD()
                that._getConfiguracionApertura()

            },

            _getGerenciaJefaturaBBDD: async function () {

                try {

                    const gerenciasJefaturas = await that.readEntity(empleadoModel, "/AreasSet", [new Filter("FlagJefe", "EQ", "X")]);

                    oModel.setProperty("/GerenciasJefaturas", gerenciasJefaturas.results)

                } catch (error) {

                    MessageBox.error(error)

                }

            },

            _getEstadosBBDD: async function () {

                try {

                    const estadosSolicitudes = await that.readEntity(provisionModel, "/EstadosProvision", []);

                    oModel.setProperty("/EstadosProvision", estadosSolicitudes.results)

                } catch (error) {

                    MessageBox.error(error)

                }

            },
            _getSolicitudesProvisionBBDD: async function (filters) {
                //Se agrega filtro de usuario al iniciar proceso
                sap.ui.core.BusyIndicator.show(0)
                let oModelUser = that.getView().getModel("userData");
                let sUser = "";
                if (oModelUser) {
                    sUser = oModelUser.getData().userId;
                }
                viewModel.setProperty("/busy", true)
                filters.push(new Filter("usuarioRegistrador", "EQ", sUser))
                //Se agrega filtro de usuario al iniciar proceso
                const parameters = {
                    filters: filters,
                    urlParameters: {
                        "$expand": "idEstadoProvision,detallesProvision"
                    }
                };
                try {

                    const solicitudes = await that.readEntity(provisionModel, '/Provision', parameters)

                    $.each(solicitudes.results, (key, value) => {
                        let totalMontoUSD = 0
                        let totalMontoPEN = 0

                        let aMonedaUSD = value.detallesProvision.results.filter(oPos => oPos.moneda === "USD")
                        $.each(aMonedaUSD, (key, value) => {
                            totalMontoUSD += parseFloat(value.monto);
                        })

                        let aMonedaPEN = value.detallesProvision.results.filter(oPos => oPos.moneda === "PEN")
                        $.each(aMonedaPEN, (key, value) => {
                            totalMontoPEN += parseFloat(value.monto);
                        })

                        value.montoSoles = totalMontoPEN.toFixed(2)
                        value.monedaSoles = "PEN"
                        value.montoDolares = totalMontoUSD.toFixed(2)
                        value.monedaDolares = "USD"
                    })

                    oModel.setProperty("/Solicitudes", solicitudes.results)

                    viewModel.setProperty("/busy", false)
                    viewModel.setProperty("/cantidad", solicitudes.results.length)
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    sap.ui.core.BusyIndicator.hide()
                    MessageBox.error(error);

                    viewModel.setProperty("/busy", false)
                }

            },
            onSuggestIdProvision: function (event) {
                const value = event.getParameter("suggestValue"),
                    input = event.getSource(),
                    options = {
                        input,
                        field: "idProvision",
                        value: value,
                        entity: "FiltroProvision",
                        property: "provisiones"
                    };
                if (value) {
                    this._getFiltrosService(options);
                }
            },
            _getFiltrosService: async function (options) {
                const filters = []
                if (options.field) {
                    filters.push(new Filter(options.field, "Contains", options.value))
                }
                options.input.setBusy(true)
                const provisiones = await that.readEntity(provisionModel, `/${options.entity}`, { filters })
                oModel.setProperty(`/${options.property}`, provisiones.results)
                options.input.setBusy(false);
            },

            onIrNuevaProvision: function () {
                //Validacion de fuera fecha de provision
                let oApertura = oModel.getProperty("/AperturasConfiguradas");
                if (!oApertura[0]) {
                    MessageBox.error("Por favor, configurar una nueva apertura de asignación.");
                    return;
                }
                oApertura = oApertura[0];
                let fechaInicio = new Date(oApertura.valor1);
                fechaInicio.setDate(fechaInicio.getDate() + 1);
                let fechaFin = new Date(oApertura.valor2);
                fechaFin.setDate(fechaFin.getDate() + 1);
                //Se compara con la fecha actual
                let fechaActual = new Date();  // Fecha actual
                if (fechaActual >= fechaInicio && fechaActual <= fechaFin) {
                    this.getRouter().navTo("RouteNuevaProvision");
                } else {

                    let dia = ("0" + fechaInicio.getDate()).slice(-2);       // Obtiene el día y agrega un 0 si es necesario
                    let mes = ("0" + (fechaInicio.getMonth() + 1)).slice(-2);  // Obtiene el mes (getMonth() devuelve un valor entre 0 y 11)
                    let anio = fechaInicio.getFullYear();                     // Obtiene el año

                    let fechaFormateadaInicial = `${dia}.${mes}.${anio}`;

                    let diaF = ("0" + fechaFin.getDate()).slice(-2);       // Obtiene el día y agrega un 0 si es necesario
                    let mesF = ("0" + (fechaFin.getMonth() + 1)).slice(-2);  // Obtiene el mes (getMonth() devuelve un valor entre 0 y 11)
                    let anioF = fechaFin.getFullYear();                     // Obtiene el año

                    let fechaFormateadaFinal = `${diaF}.${mesF}.${anioF}`;
                    MessageBox.error("La fecha actual se encuentra fuera del rango permitido de ingreso de solicitudes. Validar con el usuario de contabilidad. El último periodo configurado fue del (" + fechaFormateadaInicial + ") al (" + fechaFormateadaFinal + ")");
                }
                //

            },

            onPressProvision: function (oEvent) {

                let oProvision = oEvent.getSource().getBindingContext().getObject()

                that.getRouter().navTo("Provision", {
                    "?query": { codProvision: `${oProvision.idProvision}` }
                })

            },
            onVerMotivo: function (oEvent) {

                let oProvision = oEvent.getSource().getBindingContext().getObject()

                MessageBox.information(oProvision.motivoRechazo)
            },
            onGetSolicitudesFiltradas: function () {

                let busqueda = oModel.getProperty("/Busqueda"),
                    filterList = [],
                    filters = []
                //Se agrega filtro de usuario al iniciar proceso
                let oModelUser = that.getView().getModel("userData");
                let sUser = "";
                if (oModelUser) {
                    sUser = oModelUser.getData().userId;
                }
                filterList.push(new Filter("usuarioRegistrador", "EQ", sUser))
                //Se agrega filtro de usuario al iniciar proceso
                if (busqueda.codigoSolicitud) filterList.push(new Filter("idProvision", "EQ", busqueda.codigoSolicitud))
                if (busqueda.periodoCierre) {
                    let periodoCierreBusqueda = busqueda.periodoCierre
                    // Se setea al dia 2 porque a nivel de BBDD se está guardando el periodo de cierre de esta forma "XXXX-XX-02"
                    periodoCierreBusqueda.setDate(2);

                    filterList.push(new Filter("periodoCierre",
                        "EQ",
                        that._formatDate(periodoCierreBusqueda)))
                }

                if (busqueda.gerenciaJefaturaSolicitante_ID) filterList.push(new Filter("gerenciaJefaturaSolicitante_ID", "EQ", busqueda.gerenciaJefaturaSolicitante_ID))

                if (busqueda.idEstadoProvision_idEstadoProvision) {
                    if (busqueda.idEstadoProvision_idEstadoProvision.length !== 0) {
                        let filterEstados = []
                        filterEstados = filterEstados.concat(busqueda.idEstadoProvision_idEstadoProvision.map(estado => {
                            return new Filter("idEstadoProvision_idEstadoProvision", "EQ", estado)
                        }))

                        filterList.push(new Filter({
                            filters: filterEstados,
                            and: false
                        }))
                    }
                }
                if (busqueda.fechaEnvioS && busqueda.fechaEnvioE) filterList.push(new Filter("fechaEnvio", "BT", busqueda.fechaEnvioS, busqueda.fechaEnvioE))

                // si la lista de filtros tiene algun elemento se pasa parametros al servicio            
                if (filterList.length > 0) {
                    filters.push(new Filter({
                        filters: filterList,
                        and: true
                    }))
                }

                that._getSolicitudesProvisionBBDD(filters)

            },

            _applySearch: function (aTableSearchState) {
                var oTable = this.byId("idProvisiones");
                oTable.getBinding("items").filter(aTableSearchState);
            },

            onEnviarSolicitud: async function () {

                const contextSelected = that.getView().byId("idProvisiones").getSelectedContexts()
                const provisionesNoRegistradas = contextSelected.filter(x => x.getObject().idEstadoProvision_idEstadoProvision !== 2)
                const provisionesParaEnviar = contextSelected.map((context) => { return context.getObject() })
                var isValidDa = false;
                $.each(contextSelected, (key, value) => {
                    var fechCorregida = new Date(value.getObject().periodoCierre.getTime() + (value.getObject().periodoCierre.getTimezoneOffset() * 60000));
                    if (fechCorregida.getMonth() != new Date().getMonth()) {
                        isValidDa = true;
                    }
                })
                if (provisionesNoRegistradas.length > 0) {
                    MessageBox.error('Seleccione solo las provisiones con estado "Registrado"')
                    return
                }
                if (isValidDa) {
                    MessageBox.error('Seleccione solo las provisiones que esten dentro del mes')
                    return
                }
                MessageBox.confirm("¿Está seguro que desea enviar las provisiones a aprobar?", {
                    onClose: async function (bOption) {
                        if (bOption !== "OK") return

                        for (let index = 0; index < provisionesParaEnviar.length; index++) {
                            const element = provisionesParaEnviar[index].idProvision
                            const oProvision = {
                                idEstadoProvision_idEstadoProvision: 3,
                                fechaEnvio: new Date(),
                                fechaModificacion: new Date()
                            }
                            const oAprobadorProvision = {
                                "idProvision_idProvision": element,
                                "usuarioAprobador": provisionesParaEnviar[index].responsable,
                                "nivel": 1,
                                "estado_idEstadoProvision": 3
                            }

                            const { aprobadorCreate, provisionUpdated } = await that.onUpdateProvisionBBDD(element, oProvision, 1, oAprobadorProvision)
                            const oReturnEnviarCorreo = await that.onEnviarCorreo(provisionesParaEnviar[index], aprobadorCreate);
                        }

                    }
                })

            },

            onUpdateProvisionBBDD: async function (idProvision, oProvision, tipoUpdate, oAprobadorProvision) {

                try {
                    const aprobadorCreate =
                        await that.createEntity(provisionModel, "/AprobadoresProvision", oAprobadorProvision)

                    const provisionUpdated =
                        await that.updateEntity(provisionModel, `/Provision('${idProvision}')`, oProvision)

                    MessageBox.success(`La provisión ha sido ${(tipoUpdate === 1) ? 'enviado' : 'anulado'}.`, {
                        onClose: function () {
                            that.onGetSolicitudesFiltradas()
                        }.bind(this)
                    })

                    return { aprobadorCreate, provisionUpdated }

                } catch (error) {

                }

            },

            onBorrarSolicitud: function (oEvent) {

                let oProvisionSelected = oEvent.getSource().getBindingContext().getObject()

                MessageBox.confirm("¿Está seguro que desea anular la solicitud de provisión?", {
                    onClose: function (bOption) {
                        if (bOption !== "OK") return

                        const oProvision = {
                            idEstadoProvision_idEstadoProvision: 0,
                            fechaModificacion: new Date()
                        }
                        that.onUpdateProvisionBBDD(oProvisionSelected.idProvision, oProvision, 2)

                    }
                })

            },

            onLimpiarBusqueda: function () {
                this.byId("idInputSolicitud").setValue();
                this.byId("DRS2").setValue();
                this.byId("idDpPeriodo").setValue();
                this.byId("mcbEstados").setSelectedItems([]);
                that._getSolicitudesProvisionBBDD([]);
            },

            onEnviarCorreo: function (oSolicitud, aprobadorCreate) {
                return new Promise(async (resolve, reject) => {

                    const correoHTML = that.generarCorreoHTML(oSolicitud, oSolicitud.detallesProvision.results, aprobadorCreate)

                    const oDataSend = {
                        "Usuarios": oSolicitud.responsable,
                        "UsuariosCopia": oSolicitud.responsableEgresos,
                        "Asunto": "Sol. Provisión Pendiente de Aprobación " + oSolicitud.idProvision,
                        "Mensaje": correoHTML,
                        "Resultado": "",
                    };

                    try {
                        provisionSAPModel.setUseBatch(false)
                        const oEnviarCorreo = await that.createEntity(provisionSAPModel, "/CorreoSet", oDataSend)
                        resolve(true);
                    } catch (error) {
                        MessageBox.error(error);
                        reject(false);
                    }
                });
            },

            generarCorreoHTML: function (oSolicitud, data, aprobadorCreate) {

                const linkPortal = formatter.onGetLinkAprobacion(oSolicitud.idProvision, aprobadorCreate.ID)
                let moneda = ""

                let totalMesesAnteriores = 0;
                let totalUltimoMes = 0;
                let totalGeneral = 0;
                let tablaProveedores = '';

                // Obtener la fecha más reciente en los datos
                let fechas = data.map(item => formatter.normalizeToUTC(item.periodoGasto));
                let ultimaFecha = oSolicitud.periodoCierre; // Fecha más reciente
                let ultimoMesNombre = formatter.capitalizarPrimeraLetra(ultimaFecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' })); // Ejemplo: "Agosto 2024"

                // Agrupar datos por proveedor
                let proveedoresMap = new Map();

                data.forEach(item => {
                    let proveedor = item.proveedorNombre;
                    let fecha = formatter.normalizeToUTC(item.periodoGasto);
                    let monto = parseFloat(item.monto);
                    moneda = item.moneda

                    // Inicializar si no existe el proveedor en el mapa
                    if (!proveedoresMap.has(proveedor)) {
                        proveedoresMap.set(proveedor, { mesesAnteriores: 0, ultimoMes: 0, total: 0 });
                    }

                    let proveedorData = proveedoresMap.get(proveedor);

                    // Sumar al último mes o a los meses anteriores
                    if (fecha.getMonth() === ultimaFecha.getMonth() && fecha.getFullYear() === ultimaFecha.getFullYear()) {
                        proveedorData.ultimoMes += monto;
                    } else {
                        proveedorData.mesesAnteriores += monto;
                    }

                    proveedorData.total += monto; // Sumar al total general del proveedor
                });

                // Construir las filas de la tabla y calcular los totales por columna
                proveedoresMap.forEach((totales, proveedor) => {
                    tablaProveedores += `
                        <tr>
                            <td>${proveedor}</td>
                            <td style="text-align: right; background-color: red; color: white;">${totales.mesesAnteriores.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style="text-align: right;">${totales.ultimoMes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style="text-align: right;">${totales.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                    `;

                    // Acumular los totales por columna
                    totalMesesAnteriores += totales.mesesAnteriores;
                    totalUltimoMes += totales.ultimoMes;
                    totalGeneral += totales.total;
                });

                // Formatear los totales
                let totalMesesAnterioresFormatted = totalMesesAnteriores.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                let totalUltimoMesFormatted = totalUltimoMes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                let totalGeneralFormatted = totalGeneral.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                // Contenido del correo
                let correoHTML = `
                <p>Estimado aprobador,</p>
                <p>Se ha generado la solicitud con código: "${oSolicitud.idProvision}". Por favor, realizar el análisis correspondiente para aprobar o rechazar la solicitud.</p>
                <p><strong>Moneda: </strong>${moneda}</p>
            
                 <!-- Tabla de proveedores -->
                    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr>
                                <th style="width: 300px">Proveedor</th>
                                <th style="background-color: red; color: white; width: 150px">Serv. Recibidos en Meses Anteriores</th>
                                <th style="width: 150px">Serv. Recibido en ${ultimoMesNombre}</th>
                                <th style="width: 150px">Total General</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tablaProveedores}
                            <tr>
                                <td><strong>Total</strong></td>
                                <td style="text-align: right; background-color: red; color: white;"><strong>${totalMesesAnterioresFormatted}</strong></td>
                                <td style="text-align: right;"><strong>${totalUltimoMesFormatted}</strong></td>
                                <td style="text-align: right;"><strong>${totalGeneralFormatted}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                
                <p>A continuación, se envía el link directo a la solicitud para que pueda revisar el detalle. Recuerde que debe contar con sus credenciales de acceso al Portal de Provisiones para poder ingresar.</p>
                <p><a href="${linkPortal}">Haga click para ir al Portal</a></p>
                <p>Saludos.</p>

                `;

                return correoHTML;
            },

            //VALIDACION DE FECHA
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

            }

        });
    });

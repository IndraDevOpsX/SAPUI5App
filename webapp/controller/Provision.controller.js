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
], function(
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
        MessageToast
) {
	"use strict";

	let that;
	let provisionModel, oModel, usuarioModel, empleadoModel, viewModel, provisionSAPModel, asignacionModel, aGlobalIndividual = []
	let modeControlModel

	return BaseController.extend("com.indra.gestionprovisiones.controller.Provision", {

		/**
		 * @override
		 */
		onInit: function() {

			this.getRouter().getRoute("Provision").attachPatternMatched(this._onObjectMatched, this);
			that = this;

		},

		_onObjectMatched: async function(oEvent) {
			that.getView().byId("frgDetalleProvision--tblViewProv").setVisible(true);
			that.getView().byId("frgDetalleProvision--tblNuevoProv").setVisible(false);
			// const sIdxProvision = oEvent.getParameter("arguments").codProvision;
			// setTimeout(() => {
			//         // that._bindView("/Solicitudes" + sCodProvision);
			//         that._bindView(sIdxProvision);
			// }, 500)

			provisionModel = this.getOwnerComponent().getModel("provisionModel")
			usuarioModel = this.getOwnerComponent().getModel("usuarioModel")
			oModel = that.getOwnerComponent().getModel()
			empleadoModel = this.getOwnerComponent().getModel("empleadoModel")
                        asignacionModel = this.getOwnerComponent().getModel("asignacionModel")
                        provisionSAPModel = this.getOwnerComponent().getModel("provisionSAPModel")

			//that.setModel(new JSONModel({}), "worklistViewDetProvision")
                        that.setModel(new JSONModel({
                                busy: false,
                                cantidad: 0,
                                bSave: false,
                                bSustentoRetraso: false
                            }), "worklistViewDetProvision")
			viewModel = that.getModel("worklistViewDetProvision")

			that.setModel(new JSONModel({
                comboBoxView: false,
                inputView: true
            }), "modeControl")
            modeControlModel = that.getModel("modeControl")

			let argsRoute = oEvent.getParameter("arguments")["?query"];
			that._getGerenciaJefaturaBBDD();
                        that._getTiposPagoBBDD()
						that._getTiposGastoBBDD()
						that._getTiposServicioBBDD()
			that._getSolicitudProvisionService(argsRoute.codProvision);
			that._getObjectIdByCodigoSolicitud(argsRoute.codProvision);
                        that.setModelNew()
			await this.getDatosGlobal();
		},


		_getSolicitudProvisionService: async function(codProvision) {
			sap.ui.core.BusyIndicator.show(0)
			const parameters = {
				urlParameters: {
					"$expand": "detallesProvision($expand=idTipoPago,idTipoGasto,idTipoServicio)"
				}
			};

			try {
				const provisionCurrent = await that.readEntity(provisionModel, `/Provision('${codProvision}')`, parameters);
				provisionCurrent.direccion_ID = provisionCurrent.direccion
				that.getView().setModel(new JSONModel(provisionCurrent), "provisionCabModel")
				that.getView().setModel(new JSONModel(provisionCurrent.detallesProvision.results), "detalleProv")

				if (!provisionCurrent.indicadorNoProvision) {
					that.calcularMontos()
					that.setFlujoAprobacion(provisionCurrent)
				}
				sap.ui.core.BusyIndicator.hide()
				that.byId("fDatosGeneralesProvision--cbDireccionCab").fireChange()
			} catch (error) {
				sap.ui.core.BusyIndicator.hide()
				MessageBox.error(error);
			}
		},

		setFlujoAprobacion: async function() {
			const oCabModel = that.getModel("provisionCabModel").getData()
			let aFilters = [];
            aFilters.push(new Filter("idProvision_idProvision","EQ", oCabModel.idProvision))

			const parameters = {
				filters: aFilters,
				urlParameters: {
					"$expand":"estado"
				}
			};

			let provisionModel = that.getOwnerComponent().getModel("provisionModel")
            const logAprobaciones = await that.readEntity(provisionModel, '/LogAprobacion', parameters)
            let aLogAprobaciones = logAprobaciones.results;
			
			let oLaneNodes = that.getLanes(oCabModel, aLogAprobaciones)

			oModel.setProperty("/nodes", oLaneNodes.aNodes);
			oModel.setProperty("/lanes", oLaneNodes.aLanes);
			
			//oModel.attachRequestCompleted(this.byId("processflow1").updateModel.bind(this.byId("processflow1")));
			that.byId("processflow1").updateModel();
		},

		onGetModelProvCabService: function() {
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

		onGetModelProvDetService: function() {

			return {
				"idProvision_idProvision": "",
				"usuarioResponsable": "",
				"cuentaContable": "",
				"centroCosto": "",
				"ordenInterna": "",
				"idTipoPago_idTipoPago": "",
				"sustento": "",
				"posicion": "",
				"centroGestor": "",
				"descripcionServicio": "",
				"periodoGasto": "",
				"proveedor": "",
				"proveedorNombre": "",
				"monto": "",
				"moneda": "",
				"rubro": ""
			}

		},

		_getGerenciaJefaturaBBDD: async function() {

			try {

				const gerenciasJefaturas = await that.readEntity(empleadoModel, "/AreasSet", [new Filter("FlagJefe", "EQ", "X")]);

				oModel.setProperty("/GerenciasJefaturas", gerenciasJefaturas.results)

			} catch (error) {

				MessageBox.error(error)

			}

		},

		calcularMontos: function() {

			let dataDetail = that.getModel("detalleProv").getData()
			let totalMontoUSD = 0
			let totalMontoPEN = 0

			let aMonedaUSD = dataDetail.filter( oPos => oPos.moneda === "USD" )
			$.each(aMonedaUSD, (key, value) => {
				totalMontoUSD += parseFloat(value.monto);
			})

			let aMonedaPEN = dataDetail.filter( oPos => oPos.moneda === "PEN" )
			$.each(aMonedaPEN, (key, value) => {
				totalMontoPEN += parseFloat(value.monto);
			})
			
			const sMoneda = dataDetail[0].moneda
			viewModel.setProperty("/monedaProvision", sMoneda)
			viewModel.setProperty("/montoSoles", totalMontoPEN.toFixed(2))
			viewModel.setProperty("/montoDolares", totalMontoUSD.toFixed(2))
			
		},

		onNavBack: function() {
			this.getRouter().navTo("RouteHome");
		},

		onActualizarProvision: async function() {

			const oDataSend = that.getDataToSend();
			let dataCab = that.getModel("provisionCabModel").getData()
			let oValidate = this.fnValidarCabecera(dataCab)

			if (!oValidate.isdValid) {
					return;
			}

			try {

				const provisionCreated =
				await that.updateEntity(provisionModel, `/Provision('${oDataSend.idProvision}')`, oDataSend)
				if(viewModel.getProperty("/bDMS")){
					this.onUpdateDMS();
				}
				MessageBox.success(`Provisión ${provisionCreated.idProvision} actualizada con éxito.`, {
					onClose: function(sAction) {
						that.onNavBack()
					}
				});

			} catch (error) {

				MessageBox.error(error)

			}


		},
		getDataToSend: function() {

			let oData = {}
			let dataCab = that.getModel("provisionCabModel").getData()
			const bNoProvision = dataCab.indicadorNoProvision
			let dataDetail = that.getModel("detalleProv").getData()
			let dataGerenciasJefatura = oModel.getProperty("/GerenciasJefaturas")

			oData = Object.assign(that.onGetModelProvCabService(), dataCab)

			oData.fechaRegistro = that._formatDate(oData.fechaRegistro)
			oData.fechaModificacion = that._formatDate(oData.fechaModificacion)
			oData.fechaEnvio = that._formatDate(oData.fechaEnvio)
			oData.periodoCierre = that._formatDate(oData.periodoCierre)
				// oData.gerenciaJefaturaSolicitante_Desc =
				//         dataGerenciasJefatura.filter(x => x.UnidadOrg === oData.gerenciaJefaturaSolicitante_ID)[0].DescUnidadOrg
			oData.detallesProvision = []

			//Guardar monto en moneda provisionada
			const monedaProvision = viewModel.getProperty("/monedaProvision")

			if (monedaProvision === "PEN") oData.monto = viewModel.getProperty("/montoSoles")
			if (monedaProvision === "USD") oData.monto = viewModel.getProperty("/montoDolares")
			oData.moneda = monedaProvision

			if (!bNoProvision) {

				for (let index = 0; index < dataDetail.length; index++) {

					const oDetailProvision = that.onGetModelProvDetService()
					const element = dataDetail[index];

					element.periodoGasto = that._formatDate(element.periodoGasto)

					const elementDetail = Object.assign(oDetailProvision, element)

					delete elementDetail.Estado
					delete elementDetail.Mensaje

					oData.detallesProvision.push(elementDetail)

				}

			}

			delete oData.gerenciaJefaturaSolicitante_Desc
			delete oData.gerenciaJefaturaSolicitante_ID
			delete oData.area
			delete oData.direccion_ID
			return oData
		},

		/**
                **Funcion para agregar provisiones individual
                */
                onAddDetalle: async function () {

						if (!that.byId("fDatosGeneralesProvision--cbResponsableCab").getSelectedItem()) {
							MessageBox.error("Por favor, seleccionar Dirección y Responsable.")
							sap.ui.core.BusyIndicator.hide()
							return
						}

                        let oDetailProvision = that.getModel("provisionDetModel").getData()
                        let oCabProvision = that.getModel("provisionCabModel").getData()
                        let oValidate = this.fnValidarCampos(oDetailProvision)
            
                        if (!oValidate.isdValid) {
                            MessageBox.error(oValidate.message);
                            return;
                        }
            
                        oDetailProvision = that._getDataValueHelp(oDetailProvision)
            
                        oDetailProvision.monto = parseFloat(oDetailProvision.monto)
            
                        oDetailProvision = await that.onValidarDetalleIndividual(oDetailProvision, oCabProvision)
            
                        if (oDetailProvision) {
                            let dataDetail = that.getModel("detalleProv").getData()
            
                            dataDetail.push(oDetailProvision)
            
                            that.getModel("detalleProv").refresh()
            
                            that.calcularMontos()
                            that._validarDisponibilidadGuardado()
                            that.onCleanFormDetalle()
                        }
                },
            
                _getDataValueHelp: function (oDetailProvision) {
            
                        oDetailProvision.proveedorNombre = (oDetailProvision.proveedor.split("-")[1]) ? oDetailProvision.proveedor.split("-")[1].trim() : ""
                        oDetailProvision.proveedor = (oDetailProvision.proveedor) ? oDetailProvision.proveedor.split("-")[0].trim() : ""
            
                        oDetailProvision.cuentaContableDesc = (oDetailProvision.cuentaContable.split("-")[1]) ? oDetailProvision.cuentaContable.split("-")[1].trim() : ""
                        oDetailProvision.cuentaContable = (oDetailProvision.cuentaContable) ? oDetailProvision.cuentaContable.split("-")[0].trim() : ""
            
                        oDetailProvision.centroCostoDesc = (oDetailProvision.centroCosto.split("-")[1]) ? oDetailProvision.centroCosto.split("-")[1].trim() : ""
                        oDetailProvision.centroCosto = (oDetailProvision.centroCosto) ? oDetailProvision.centroCosto.split("-")[0].trim() : ""
            
                        return oDetailProvision
            
                },
                onValidarDetalleIndividual: async function (oDetailProvision, oCabProvision) {

                        const oDataValidacionFront = that.onValidarFilaIngresada(oDetailProvision)
            
                        if (oDataValidacionFront.Estado) {
                            const oDataSend = that.onPrepareDataToSAPValidation(oDetailProvision, oCabProvision)
                            
                            let aDataSAPValidated = await that._validarFilasSAP([oDataSend])
            
                            if (aDataSAPValidated.UsuarioMensaje == null || aDataSAPValidated.UsuarioMensaje.results.length == 0) {
                                let aDataForTableResults = that._procesarDataValidadaSAP(aDataSAPValidated)
                                oDetailProvision = aDataForTableResults[0]
                                // oDetailProvision.Estado = false
                                return oDetailProvision
                            } else {
                                let oResult = await this.onMostrarMensajesIndividual(aDataSAPValidated.UsuarioMensaje.results);
                                return false;
                            }
                            
                        } else {
                            return oDataValidacionFront
                        }
            
                },
                onValidarFilaIngresada: function (oDetailProvision) {
            
                        if (oDetailProvision.sustento !== "") {
            
                            if (oDetailProvision.posicion === "")
                                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Posición Incompleto" }
            
            
                        } else {
            
                            if (oDetailProvision.cuentaContable === "")
                                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Cuenta Contable Incompleto" }
            
                            if (oDetailProvision.centroCosto === "")
                                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Centro de Costo Incompleto" }
            
                            if (oDetailProvision.centroGestor === "")
                                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Centro Gestor Incompleto" }
            
                            // if(oDetailProvision.ordenInterna === "") 
                            // return {...oDetailProvision, Estado: false, Mensaje: "Campo Usuario Responsable Incompleto"}
            
                            // if(oDetailProvision.rubro === "") 
                            // return {...oDetailProvision, Estado: false, Mensaje: "Rubro No Encontrado"}
            
                            if (oDetailProvision.idTipoPago_idTipoPago === "")
                                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Tipo de Pago Incompleto" }
            
                            if (oDetailProvision.descripcionServicio === "")
                                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Desc. Servicio Incompleto" }
            
                            if (oDetailProvision.periodoGasto === "")
                                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Periodo de Gasto Incompleto" }
            
                            // if(oDetailProvision.sustentoRetraso === "") 
                            // return {...oDetailProvision, Estado: false, Mensaje: "Campo Sustento Retraso Incompleto"}
            
                            // if(oDetailProvision.proveedor === "") 
                            // return {...oDetailProvision, Estado: false, Mensaje: "Campo Proveedor Incompleto"}
            
                            if (oDetailProvision.monto === "")
                                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Monto Incompleto" }
            
                            if (oDetailProvision.moneda === "")
                                return { ...oDetailProvision, Estado: false, Mensaje: "Campo Moneda Incompleto" }
            
                        }
            
                        return { ...oDetailProvision, Estado: true, Mensaje: "" }
                },
                _validarFilasSAP: async function (aData) {
                        const oDataSend = that.getFormatForServiceSAP(aData)
            
                        try {
                            provisionSAPModel.setUseBatch(false)
                            const provisionValidated = await that.createEntity(provisionSAPModel, "/UsuarioSet", oDataSend)
            
                            return provisionValidated
            
                        } catch (error) {
            
                            MessageBox.error(error)
                            return "Error"
            
                        }
            
            
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
							"responsable": "",          //*************************** */
							"director": "",             //Se agregan los campos para guardar el codigo de aprobadores
							"responsableEgresos": "",   //****************************** */
							"vbDirecion": false,
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
							"vbDirecion": false,         //****************************** */
							"sustentoText": ""
                        }
                        ), "provisionDetModel")
            
                        that.getView().setModel(new JSONModel([]), "detalleProv")
            
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
                            "rubro": ""
                        }
                        ), "provisionDetModel")
                        
                        let aIds = ["cbDireccion","cbAreas","cboProvisionConOc","txtProvisionOC","idInputCuentaContable","idInputCentroCosto","txtCentroGestor","txtOrdenInterna","cboTipoPago","txtDescServicio","idDpPeriodo","idInputProveedor","txtMonto","cboMoneda"];
                        for (let i = 0; i < aIds.length; i++) {
                            this.byId(aIds[i]).setValueState(sap.ui.core.ValueState.None);
                            this.byId(aIds[i]).setValueStateText("");
                        }
                        that.getModel("provisionCabModel").setProperty("/direccion_ID", "");
                        that.getModel("provisionCabModel").setProperty("/area", "");
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
							"direccion": "",
							"direccionDesc": "",
							"area": "",
							"areaDesc": "",
							"usuarioRegistradorDesc": this.getModel("userData").getData().givenName + " " + this.getModel("userData").getData().familyName,
							"responsable": "",
							"responsableDesc": "",
							"director": "",
							"directorDesc": "",
							"responsableEgresos": "",
							"responsableEgresosDesc": "",
							"planificador": "",
							"planificadorDesc": "",
                            "detallesProvision": []
                        }
                        ), "provisionCabModel")
            
                },
		getDatosGlobal: async function() {
			return new Promise(async(resolve, reject) => {
				const parameters = {
					filters: [],
					urlParameters: {
						"$expand": "direccion_ID"
					}
				};
				try {
					aGlobalIndividual = await this.readEntity(asignacionModel, '/AsignacionesProvision', parameters)
					const aDireccion = this.getOnlyKey(aGlobalIndividual.results, "direccion_ID_direccion_ID");
					this.getView().setModel(new JSONModel(aDireccion), "oDireccion");
					resolve(true);
				} catch (error) {
					MessageBox.error(error);
				}
			});
		},
                //Procesar datos del modelo que van a ir SAP para su validación
                onPrepareDataToSAPValidation: function (oData, oCabProvision) {

                        return {
                        UsuRegistra: that.byId("fDatosGeneralesProvision--cbResponsableCab").getSelectedItem().getBindingContext("aResponsable").getObject().responsableEgresos, //Debe jalar del ias
                        IdProvision: "", //oData.IdProvision,
                        NombUsuario: "",
                        Responsable: oData.usuarioResponsable,
                        Direccion: oCabProvision ? oCabProvision.direccion_ID : oData.direccion_ID_direccion_ID,
                        Area: oCabProvision ? oCabProvision.area : oData.area_ID_area_ID,
                        ProvisionConOc: oData.provisionConOC,
                        Descripcion: oData.rubro,
                        CuentaContable: oData.cuentaContable,
                        DescCuentaContab: "",
                        Monto: oData.monto.toFixed(2),
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
                        MesProvisionar: that._formatDate(oData.periodoGasto).substring(5, 7),
                        DescrServicio: oData.descripcionServicio,
                        CodigoProveedor: oData.proveedor,
                        NombreProveedor: "",
                        Sustento: "Susteno",
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
                        centroGestorDesc: oData.centroGestorDesc,
                        ordenInterna: oData.OrdenInterna,
                        ordenInternaDesc: oData.ordenInternaDesc,
                        idTipoPago_idTipoPago: oData.TipoPago,
                        sustento: oData.DocCompra,
                        posicion: oData.Posicion,
                        periodoGasto: oData.MesProvisionar,
                        descripcionServicio: oData.DescrServicio,
                        proveedor: oData.CodigoProveedor,
                        proveedorNombre: oData.NombreProveedor,
                        rubro: oData.Rubro,
                        // Sustento: "",
                        Estado: oData.Validado,
                        Mensaje: oData.Motivo,
                        }
        
                },
                onVerMotivo: function (oEvent) {
        
                        let oDetProvision = oEvent.getSource().getBindingContext("detalleProv").getObject()
        
                        MessageBox.error(oDetProvision.Mensaje)
                },
    
                _validarDisponibilidadGuardado: function () {
        
                        const detalleProvision = that.getModel("detalleProv").getData()
                        const bValidado = detalleProvision.findIndex(x => x.Estado === false)
        
                        viewModel.setProperty("/bSave", (bValidado < 0))
        
                },

		onSearchOC: async function() {
			try {
				const oInputs = that.getModel("provisionDetModel")
				const sSustento = oInputs.getProperty("/sustento");
				const sPosicion = parseInt(oInputs.getProperty("/posicion"));

				if (sSustento === "" || !sSustento) {
					MessageBox.error("Por favor, completar el campo OC/SOLPED/PA.");
					return;
				}

				if (sPosicion === "" || !sPosicion) {
					MessageBox.error("Por favor, completar el campo Posición.");
					return;
				}

				this.byId("idNuevaSolicitudPage").setBusy(true);
				const oOcs = await this.readEntity(provisionSAPModel, `/OrdenCompraSet(OrdCompra='${sSustento}',Posicion='${sPosicion.toString()}')`, {})

				if (oOcs.OrdInterna) {
					let sCuentaContable = await this.getTextForKey("Saknr", oOcs.CuentaContab, "CuentaContableSet", "cuentasContable", "Saknr", "Txt50");
					oInputs.setProperty("/cuentaContable", sCuentaContable);

					let sCentCoste = await this.getTextForKey("Kostl", oOcs.CentCoste, "CentroCostoSet", "centrosCosto", "Kostl", "Ktext");
					oInputs.setProperty("/centroCosto", sCentCoste);

					oInputs.setProperty("/centroGestor", oOcs.CenGestor);
					oInputs.setProperty("/ordenInterna", oOcs.OrdInterna);

					this.byId("txtSustento").setValueState(sap.ui.core.ValueState.None);
					this.byId("txtSustento").setValueStateText("");
					this.byId("txtProvisionOC").setValueState(sap.ui.core.ValueState.None);
					this.byId("txtProvisionOC").setValueStateText("");
				} else {
					MessageBox.error("No se encontaron registros.");
					oInputs.setProperty("/cuentaContable", "");
					oInputs.setProperty("/centroCosto", "");
					oInputs.setProperty("/centroGestor", "");
					oInputs.setProperty("/ordenInterna", "");

					this.byId("txtSustento").setValueState(sap.ui.core.ValueState.Error);
					this.byId("txtSustento").setValueStateText("No existen datos");
					this.byId("txtProvisionOC").setValueState(sap.ui.core.ValueState.Error);
					this.byId("txtProvisionOC").setValueStateText("No existen datos");
				}
				this.byId("idNuevaSolicitudPage").setBusy(false);
			} catch (error) {
				MessageBox.error(error);
			}
		},

		getDatosGlobal: async function() {
			return new Promise(async(resolve, reject) => {
				const parameters = {
					filters: [],
					urlParameters: {
						"$expand": "direccion_ID"
					}
				};
				try {
					aGlobalIndividual = await this.readEntity(asignacionModel, '/AsignacionesProvision', parameters)
					const aDireccion = this.getOnlyKey(aGlobalIndividual.results, "direccion_ID_direccion_ID");
					this.getView().setModel(new JSONModel(aDireccion), "oDireccion");
					resolve(true);
				} catch (error) {
					MessageBox.error(error);
				}
			});
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

		getAreas: function(oEvent) {
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

		getRubro: function(oEvent) {
			const oInputs = that.getModel("provisionDetModel")
			const oData = oEvent.getSource().getSelectedItem().getBindingContext("oAreas").getObject();
			oInputs.setProperty("/rubro", oData.rubro);
			oInputs.setProperty("/usuarioResponsable", oData.responsable);
		},

		getOnlyKey: function(array, keyData) {
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

		getTextForKey: async function(sField, sValue, sEntity, sProperty, sKey, sText) {
			return new Promise(async(resolve, reject) => {
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
					const provisiones = await that.readEntity(provisionSAPModel, `/${options.entity}`, {
						filters
					});
					let sReturn = "";
					if (provisiones.results.length && provisiones.results.length > 0) {
						sReturn = provisiones.results[0][sKey] + " - " + provisiones.results[0][sText];
					}
					console.log(provisiones.results);
					resolve(sReturn);
				} catch (error) {
					reject(error);
				}
			});
		},

		onChangeProvisionConOc: function(oEvent) {
			const oInputs = that.getModel("provisionDetModel")
			oInputs.setProperty("/sustento", "");
			oInputs.setProperty("/posicion", "");
			oInputs.setProperty("/cuentaContable", "");
			oInputs.setProperty("/centroCosto", "");
			oInputs.setProperty("/centroGestor", "");
			oInputs.setProperty("/ordenInterna", "");
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
		},

		fnValidarCampos: function(oData) {
			let oReturn = {
				isdValid: true,
				message: "Completar los datos obligatorios."
			}

			if (!oData.provisionConOC || oData.provisionConOC.length <= 0) {
				this.byId("cboProvisionConOc").setValueState(sap.ui.core.ValueState.Error);
				this.byId("cboProvisionConOc").setValueStateText("Completar este campo");
				oReturn.isdValid = false;
			} else {
				this.byId("cboProvisionConOc").setValueState(sap.ui.core.ValueState.None);
				this.byId("cboProvisionConOc").setValueStateText("");

				if (oData.provisionConOC == "1") {
					if (oData.ordenInterna.length <= 0) {
						oReturn.isdValid = false;
						oReturn.message = "No se encontraron registros con la OC/SOLPED/PA y la posición.";
						this.byId("txtSustento").setValueState(sap.ui.core.ValueState.Error);
						this.byId("txtSustento").setValueStateText("No existen datos");
						this.byId("txtProvisionOC").setValueState(sap.ui.core.ValueState.Error);
						this.byId("txtProvisionOC").setValueStateText("No existen datos");
					} else {
						this.byId("txtSustento").setValueState(sap.ui.core.ValueState.None);
						this.byId("txtSustento").setValueStateText("");
						this.byId("txtProvisionOC").setValueState(sap.ui.core.ValueState.None);
						this.byId("txtProvisionOC").setValueStateText("");
					}
				} else {
					if (oData.cuentaContable.length <= 0) {
						this.byId("idInputCuentaContable").setValueState(sap.ui.core.ValueState.Error);
						this.byId("idInputCuentaContable").setValueStateText("Completar este campo");
						oReturn.isdValid = false;
					} else {
						if (this.byId("idInputCuentaContable").getSelectedKey() == "") {
							this.byId("idInputCuentaContable").setValueState(sap.ui.core.ValueState.Error);
							this.byId("idInputCuentaContable").setValueStateText("Dato ingresado no válido");
							oReturn.isdValid = false;
						} else {
							this.byId("idInputCuentaContable").setValueState(sap.ui.core.ValueState.None);
							this.byId("idInputCuentaContable").setValueStateText("");
						}
					}

					if (oData.centroCosto.length <= 0) {
						this.byId("idInputCentroCosto").setValueState(sap.ui.core.ValueState.Error);
						this.byId("idInputCentroCosto").setValueStateText("Completar este campo");
						oReturn.isdValid = false;
					} else {
						if (this.byId("idInputCentroCosto").getSelectedKey() == "") {
							this.byId("idInputCentroCosto").setValueState(sap.ui.core.ValueState.Error);
							this.byId("idInputCentroCosto").setValueStateText("Dato ingresado no válido");
							oReturn.isdValid = false;
						} else {
							this.byId("idInputCentroCosto").setValueState(sap.ui.core.ValueState.None);
							this.byId("idInputCentroCosto").setValueStateText("");
						}
					}

					if (oData.centroGestor.length <= 0) {
						this.byId("txtCentroGestor").setValueState(sap.ui.core.ValueState.Error);
						this.byId("txtCentroGestor").setValueStateText("Completar este campo");
						oReturn.isdValid = false;
					} else {
						this.byId("txtCentroGestor").setValueState(sap.ui.core.ValueState.None);
						this.byId("txtCentroGestor").setValueStateText("");
					}

					if (oData.ordenInterna.length <= 0) {
						this.byId("txtOrdenInterna").setValueState(sap.ui.core.ValueState.Error);
						this.byId("txtOrdenInterna").setValueStateText("Completar este campo");
						oReturn.isdValid = false;
					} else {
						this.byId("txtOrdenInterna").setValueState(sap.ui.core.ValueState.None);
						this.byId("txtOrdenInterna").setValueStateText("");
					}
				}
			}


			if (oData.idTipoPago_idTipoPago.length <= 0) {
				this.byId("cboTipoPago").setValueState(sap.ui.core.ValueState.Error);
				this.byId("cboTipoPago").setValueStateText("Dato ingresado no válido");
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

			if (oData.descripcionServicio.length <= 0) {
				this.byId("txtDescServicio").setValueState(sap.ui.core.ValueState.Error);
				this.byId("txtDescServicio").setValueStateText("Completar este campo");
				oReturn.isdValid = false;
			} else {
				this.byId("txtDescServicio").setValueState(sap.ui.core.ValueState.None);
				this.byId("txtDescServicio").setValueStateText("");
			}

			if (oData.periodoGasto.length <= 0) {
				this.byId("idDpPeriodo").setValueState(sap.ui.core.ValueState.Error);
				this.byId("idDpPeriodo").setValueStateText("Completar este campo");
				oReturn.isdValid = false;
			} else {
				this.byId("idDpPeriodo").setValueState(sap.ui.core.ValueState.None);
				this.byId("idDpPeriodo").setValueStateText("");
			}

			if (oData.proveedor.length <= 0) {
				this.byId("idInputProveedor").setValueState(sap.ui.core.ValueState.Error);
				this.byId("idInputProveedor").setValueStateText("Completar este campo");
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
				oReturn.isdValid = false;
			} else {
				this.byId("txtMonto").setValueState(sap.ui.core.ValueState.None);
				this.byId("txtMonto").setValueStateText("");
			}

			if (oData.moneda.length <= 0) {
				this.byId("cboMoneda").setValueState(sap.ui.core.ValueState.Error);
				this.byId("cboMoneda").setValueStateText("Dato ingresado no válido");
				oReturn.isdValid = false;
			} else {
				this.byId("cboMoneda").setValueState(sap.ui.core.ValueState.None);
				this.byId("cboMoneda").setValueStateText("");
			}

			if (oData.rubro.length <= 0) {
				oReturn.isdValid = false;
				oReturn.message = "Por favor, seleccionar Dirección y Área";
				this.byId("cbDireccion").setValueState(sap.ui.core.ValueState.Error);
				this.byId("cbDireccion").setValueStateText("Dato ingresado no válido");
				this.byId("cbAreas").setValueState(sap.ui.core.ValueState.Error);
				this.byId("cbAreas").setValueStateText("Dato ingresado no válido");
			} else {
				this.byId("cbDireccion").setValueState(sap.ui.core.ValueState.None);
				this.byId("cbDireccion").setValueStateText("");
				this.byId("cbAreas").setValueState(sap.ui.core.ValueState.None);
				this.byId("cbAreas").setValueStateText("");
			}

			return oReturn;
		},

		fnValidarCabecera: function(oData) {
			let oReturn = {
				isdValid: true,
				message: "Completar los datos obligatorios."
			}

			if (oData.periodoCierre.length <= 0 || this.byId("fDatosGeneralesProvision--idDpPeriodo").getValue() == "") {
				this.byId("fDatosGeneralesProvision--idDpPeriodo").setValueState(sap.ui.core.ValueState.Error);
				this.byId("fDatosGeneralesProvision--idDpPeriodo").setValueStateText("Completar este campo");
				oReturn.isdValid = false;
			} else {
				this.byId("fDatosGeneralesProvision--idDpPeriodo").setValueState(sap.ui.core.ValueState.None);
				this.byId("fDatosGeneralesProvision--idDpPeriodo").setValueStateText("");
			}

			return oReturn;
		},

		onMostrarMensajesIndividual: function(aMensajes) {
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
								description: "{mensajes>DescMensaje}"
							})
						}
					})
				],
				beginButton: new Button({
					icon: "sap-icon://decline",
					type: "Reject",
					press: function() {
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

		onObtenerResponsable: function(elementDetail){
				return this.getModel("userData").getData().userId;
		},
	
		_procesarDataValidadaSAP: function (aDataSAPValidada) {
	
				let aDataForTableResult = []
				const aDataEnviada = aDataSAPValidada.UsuarioSolicitud.results
				const aDataMensajes = aDataSAPValidada.UsuarioMensaje
	
				for (let index = 0; index < aDataEnviada.length; index++) {
					const element = aDataEnviada[index];
					const data = that.onPrepareDataToTableResult(element)
	
					if (data.periodoGasto.length === 2 || data.periodoGasto.length === 1) {
						data.periodoGasto = new Date(`${new Date().getFullYear()}-${data.periodoGasto}-01`)
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
		getResponsable: async function (oEvent) {
			let sKey = that.byId("fDatosGeneralesProvision--cbDireccionCab").getSelectedKey()

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
		//Función para conectarse al DMS
        _pathRest: function () {
            const idAplicacion = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            const appPath = idAplicacion.replaceAll(".", "/");
            const appModulePath = $.sap.getModulePath(appPath);
            const url = appModulePath + "/browser/9dbc57fa-16d2-4dea-a799-9ba20f2c18f5/root";
            return url;
        },
		// Función para obtener el objectId de la carpeta usando CODIGOSOLICITUD
		_getObjectIdByCodigoSolicitud: function (sCodigoSolicitud) {
			const oModelInicial = new sap.ui.model.json.JSONModel({
                items: [] 
            });
            this.getView().setModel(oModelInicial, "archivos");
			var sUrl = "/browser/9dbc57fa-16d2-4dea-a799-9ba20f2c18f5/root/" + sCodigoSolicitud;
			fetch(sUrl)
				.then(response => response.json())
				.then(data => {
					if (data && data.objects && data.objects.length > 0) {
						var parentId = data.objects[0].object.properties["sap:parentIds"].value[0];
						// Ahora que tenemos el sap:parentIds, podemos llamar para obtener los archivos
						this._loadFilesFromDMS(parentId);
					}
				})
				.catch(error => {
					console.error('Error fetching sap:parentIds:', error);
					MessageBox.error("Error al obtener el sap:parentIds.");
				});
		},

        // Función para cargar los archivos desde el DMS
		_loadFilesFromDMS: function (sObjectId) {
			
			var oModel = this.getView().getModel("archivos");
			var oData = [];
			let pathInitial ="/browser/9dbc57fa-16d2-4dea-a799-9ba20f2c18f5/root?objectId="
			var sUrl = pathInitial + sObjectId + "&cmisSelector=children";
		
			fetch(sUrl)
				.then(response => response.json())
				.then(data => {
					// Verificar si hay archivos en la respuesta
					if (data.objects && data.objects.length > 0) {
						data.objects.forEach(function (file) {
							var documentData = file.object.properties;
							
							// Obtener el nombre del archivo
							var fileName = documentData["cmis:contentStreamFileName"].value;
							// Obtener el tamaño del archivo
							var fileSize = documentData["cmis:contentStreamLength"].value;
							// Obtener el tipo MIME del archivo
							var mimeType = documentData["cmis:contentStreamMimeType"].value;
							let sArchivoObjecId = documentData["cmis:objectId"].value
							// Generar la URL del archivo (puedes ajustarlo según tu servidor DMS)
							var fileUrl = pathInitial + sArchivoObjecId + "&cmisSelector=content&filename=" + fileName; 
		
							// Crear un objeto con la información del archivo
							oData.push({
								nombreArchivo: fileName,
								tamanioArchivo: this._formatFileSize(fileSize),
								formatoArchivo: mimeType,
								url: fileUrl,
								objectId:sArchivoObjecId
							});
						}, this);
		
						// Actualizar el modelo de la vista con los archivos obtenidos
						oModel.setProperty("/items", oData);
						const odataCopia = [...oData];
						oModel.setProperty("/documentosSubidos", odataCopia);
					} else {
						MessageBox.error("No se encontraron archivos.");
					}
				})
				.catch(error => {
					console.error('Error fetching document details:', error);
					MessageBox.error("No se pudieron cargar los archivos.");
				});
		},
		_formatFileSize: function (size) {
			if (size < 1024) {
				return size + " B";
			} else if (size < 1024 * 1024) {
				return (size / 1024).toFixed(2) + " KB";
			} else if (size < 1024 * 1024 * 1024) {
				return (size / (1024 * 1024)).toFixed(2) + " MB";
			} else {
				return (size / (1024 * 1024 * 1024)).toFixed(2) + " GB";
			}
		},
		// Función para ver los archivos seleccionados en la tabla desde el DMS
		onVerArchivo: function (oEvent) {
			const oModel = this.getView().getModel("archivos");
			const aItems = oModel.getProperty("/items");
			
			// Filtrar los archivos con formato de imagen
			const aImageItems = aItems.filter(item => item.formatoArchivo.includes("image"));

			if (aImageItems.length === 0) {
				sap.m.MessageToast.show("No hay imágenes para mostrar.");
				return;
			}

			// Crear elementos del carrusel
			const aCarouselPages = aImageItems.map(item => new sap.m.Image({
				src: item.url, // Asumiendo que 'url' contiene la URL de la imagen
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
		onSelectionChange: function (oEvent) {
		
			const oTable = sap.ui.core.Fragment.byId(this.getView().getId(), "tablaArchivo");
			const aSelectedItems = oTable.getSelectedItems();

			const bHasSelection = aSelectedItems.length > 0; // Si hay al menos un archivo seleccionado
			const oDescargarArchivo = sap.ui.core.Fragment.byId(this.getView().getId(), "descargarArchivo");
			const oEliminarArchivo = sap.ui.core.Fragment.byId(this.getView().getId(), "eliminarArchivo");

			oDescargarArchivo.setEnabled(bHasSelection);

			oEliminarArchivo.setEnabled(bHasSelection);
		},
		//Función para eliminar achivos de la tabla
		onEliminarArchivo: function (oEvent) {
			// const oTable = sap.ui.core.Fragment.byId(this.getView().getId(), "tablaArchivo");
			// const aSelectedItems = oTable.getSelectedItems();

			// if (aSelectedItems.length === 0) {
			// 	sap.m.MessageToast.show("Por favor, seleccione un archivo para eliminar.");
			// 	return;
			// }

			// const oModel = this.getView().getModel("archivos");
			// const aItems = oModel.getProperty("/items");

			// // Eliminar elementos seleccionados del modelo
			// aSelectedItems.forEach((oItem) => {
			// 	const oContext = oItem.getBindingContext("archivos");
			// 	const oData = oContext.getObject();
			// 	const iIndex = aItems.indexOf(oData);
			// 	if (iIndex !== -1) {
			// 		aItems.splice(iIndex, 1); // Eliminar del array
			// 	}
			// });

			// oModel.setProperty("/items", aItems);
			const oTable = sap.ui.core.Fragment.byId(this.getView().getId(), "tablaArchivo");
			const aSelectedItems = oTable.getSelectedItems();
			
			if (aSelectedItems.length === 0) {
				sap.m.MessageToast.show("Por favor, seleccione un archivo para eliminar.");
				return;
			}
			
			// Obtener el modelo y los datos
			const oModel = this.getView().getModel("archivos");
			const aItems = oModel.getProperty("/items");
			
			// Crear un nuevo array excluyendo los elementos seleccionados
			const aUpdatedItems = aItems.filter((oItem) => {
				// Comprobar si este elemento no está seleccionado
				return !aSelectedItems.some((oSelectedItem) => {
					const oContext = oSelectedItem.getBindingContext("archivos");
					return oContext && oContext.getObject() === oItem;
				});
			});
			
			// Actualizar el modelo con los elementos restantes
			oModel.setProperty("/items", aUpdatedItems);
			
			// Limpiar la selección de la tabla
			oTable.removeSelections();
			// Deshabilitar los botones después de eliminar
			const oDescargarArchivo = sap.ui.core.Fragment.byId(this.getView().getId(), "descargarArchivo");
			const oEliminarArchivo = sap.ui.core.Fragment.byId(this.getView().getId(), "eliminarArchivo");
			oDescargarArchivo.setEnabled(false);
			oEliminarArchivo.setEnabled(false);
			viewModel.setProperty("/bSave", true)
			viewModel.setProperty("/bDMS", true)
			sap.m.MessageToast.show("Archivo(s) eliminado(s) exitosamente.");
		},
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
                    "application/octet-stream" // Fallback para archivos desconocidos
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
				viewModel.setProperty("/bSave", true)
				viewModel.setProperty("/bDMS", true)
				const oTable = sap.ui.core.Fragment.byId(this.getView().getId(), "tablaArchivo");
				oTable.removeSelections();
                sap.m.MessageToast.show("Archivo cargado exitosamente.");
            });

            oFileInput.click();
			
			
        },
		onUpdateDMS:async function(){
			//eliminar archivos para subirlos nuevamente luego
			sap.ui.core.BusyIndicator.show(0)
			const oModel = this.getView().getModel("archivos");
            const items = oModel.getProperty("/items");
			const documentosSubidos = oModel.getProperty("/documentosSubidos");
			const documentosEliminadas = documentosSubidos.filter(itemInicial => 
				!items.some(itemModificado => itemInicial.objectId === itemModificado.objectId)
			);
			let idProvision = that.getView().getModel("provisionCabModel").getData().idProvision
			if(documentosEliminadas.length>0){				
				// Eliminar elementos seleccionados del modelo
				for (let index = 0; index < documentosEliminadas.length; index++) {
					const oData = documentosEliminadas[index];					
					//elimina los archivos del dms
					if(oData.objectId !== undefined || oData.objectId !== null){
						const formData = new FormData();
						formData.append("cmisaction", "delete");
						formData.append("objectId",oData.objectId);				
						const url =this._pathRest();
						await fetch(url, { method: "POST", body: formData });	
					}
				}
				
				this.onSubirDocumentosDMS(idProvision);
			}else{
				this.onSubirDocumentosDMS(idProvision);
			}
			
		},
		 //Función para subir archivos al DMS
		 onSubirDocumentosDMS: async function(numeroSol){
            sap.ui.core.BusyIndicator.show(0)
            const oModel = this.getView().getModel("archivos");
            const archivos = oModel.getProperty("/items");
			const archivosCopia = [];
			for (let index = 0; index < archivos.length; index++) {
				const element = archivos[index];
				if(element.objectId == undefined || element.objectId == null){
					archivosCopia.push(element);
				}
			}
            try {
                const responses = await Promise.all(
                    archivosCopia.map(async (item) => {
						if(item.objectId == undefined || item.objectId == null){
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
						}                        
                    })
                );

                const resultados = [];
                responses.forEach((response, index) => {
                    if (response.ok) {
                        resultados.push({
                            title: archivosCopia[index].nombreArchivo,
                            info: archivosCopia[index].file.name,
                            infoState: "Success"
                        });
                    } else {
                        resultados.push({
                            title: archivosCopia[index].nombreArchivo,
                            info: archivosCopia[index].file.name,
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
		//Función para opciones de la tabla según el estado seleccionado

	});
});
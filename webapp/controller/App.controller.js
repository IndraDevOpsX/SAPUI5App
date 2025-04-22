sap.ui.define(
    [
      "./BaseController",
      "sap/m/MessageBox",
      "sap/ui/model/json/JSONModel",
    ],
    function(BaseController, MessageBox, JSONModel) {
      "use strict";
  
      return BaseController.extend("com.indra.gestionprovisiones.controller.App", {
        onInit: async function () {
          await this.getInfoUser();
          await this.getDatosGlobal();
        },

        getInfoUser: function(){
            return new Promise((resolve,reject) => {
              var that = this;
              var userDataModel = new sap.ui.model.json.JSONModel();
              userDataModel.setData({
                  "givenName": "",
                  "familyName": "",
                  "userId": "",
                  "userAndName": ""
              });
              this.getView().setModel(userDataModel, "userData");
              if (sap.ushell.Container) {
                sap.ushell.Container.getServiceAsync("UserInfo").then(function (UserInfo) {
                    if (UserInfo.getEmail()) {
                      that.getCurrentUserData(UserInfo.getEmail());
                      resolve(true);
                    } else {
                      that.getCurrentUserData("aeyzaguirre0394@gmail.com");
                      resolve(true);
                    }
                });
              } else {
                that.getCurrentUserData("aeyzaguirre0394@gmail.com");
                resolve(true);
              }
          });
        },

        getCurrentUserData: function (email) {
          var that = this;
          var xhr = new XMLHttpRequest();
          xhr.withCredentials = true;
          xhr.addEventListener("readystatechange", function () {
              if (this.readyState === 4) {
                  var userData = JSON.parse(this.responseText);
                  var oModel = that.getView().getModel("userData");
                  if (oModel) {
                      oModel.setProperty("/givenName", userData.Resources[0].name.givenName);
                      oModel.setProperty("/familyName", userData.Resources[0].name.familyName);
                      oModel.setProperty("/userId", userData.Resources[0].userName);
                      oModel.setProperty("/userAndName", userData.Resources[0].userName + "-" + userData.Resources[0].name.givenName + " " + userData.Resources[0].name.familyName);
                  }
              }
          });
          var url = "";
          url = this.getBaseURL() + "/scim/Users?filter=emails.value eq \"" + email + "\"";
  
          xhr.open("GET", url, false);
          xhr.send();
        },
        
        getBaseURL: function () {
          var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
          var appPath = appId.replaceAll(".", "/");
          var appModulePath = jQuery.sap.getModulePath(appPath);
          return appModulePath;
        },

        getDatosGlobal: async function () {
            return new Promise(async (resolve,reject) => {
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
        
      });
    }
  );
  
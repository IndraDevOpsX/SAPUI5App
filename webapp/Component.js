/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "com/indra/gestionprovisiones/model/models"
    ],
    function (UIComponent, Device, models) {
        "use strict";

        jQuery.sap.includeScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.5/jszip.js");
        jQuery.sap.includeScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");

        return UIComponent.extend("com.indra.gestionprovisiones.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                var userDataModel = new sap.ui.model.json.JSONModel();
                    userDataModel.setData({
                        "givenName": "",
                        "familyName": "",
                        "userId": "",
                        "userAndName": ""
                    });
                this.setModel(userDataModel, "userData");

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            }
        });
    }
);
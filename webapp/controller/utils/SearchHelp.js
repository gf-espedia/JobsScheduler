sap.ui.define([], function() {
	"use strict";

	return {
		handleDamageF4: function(oEvent) {
			sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("Help_1"));
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();
			this.catalogSearchHelp(sInputValue, "Damage");
			this._catalog = "Damage";
		},

		handleCauseF4: function(oEvent) {
			sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("Help_2"));
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();
			this.catalogSearchHelp(sInputValue, "Cause");
			this._catalog = "Cause";
		},

		catalogSearchHelp: function(input, catalog) {
			// create value help dialog
			if (!this._catalogHelpDialog) {
				this._catalogHelpDialog = sap.ui.xmlfragment(
					"com.espedia.demo.JobsScheduler.view.fragments.CatalogDialog",
					this
				);
				this.getView().addDependent(this._catalogHelpDialog);
			}

			if (catalog === "Damage") {

				this._aFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter(
							"Catalogtype",
							sap.ui.model.FilterOperator.EQ, "C"
						),
						new sap.ui.model.Filter(
							"Catalogid",
							sap.ui.model.FilterOperator.EQ, "ZPM1"
						)
					],
					and: true
				});

			} else if (catalog === "Cause") {
				this._aFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter(
							"Catalogtype",
							sap.ui.model.FilterOperator.EQ, "5"
						),
						new sap.ui.model.Filter(
							"Catalogid",
							sap.ui.model.FilterOperator.EQ, "ZPM1"
						)
					],
					and: true
				});
			}
			this._catalogHelpDialog.getBinding("items").filter(this._aFilter);
			// create a filter for the binding
			/*this._catalogHelpDialog.getBinding("items").filter([new sap.ui.model.Filter(
				"Equnr",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);*/
			// open value help dialog filtered by the input value
			this._catalogHelpDialog.open();
		},

		_handleCatalogHelpSearch: function(evt) {

			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"CodeDescr",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			if (sValue === "") {
				evt.getSource().getBinding("items").filter([]);
				evt.getSource().getBinding("items").filter(this._aFilter);
			} else {
				evt.getSource().getBinding("items").filter([oFilter, this._aFilter]);
			}

		},

		_handleCatalogHelpClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var catalogInput = sap.ui.getCore().byId(this.inputId);
				catalogInput.setValue("(" + oSelectedItem.getTitle() + ") " + oSelectedItem.getDescription());
			}
			//evt.getSource().getBinding("items").filter([]);
			this._catalogHelpDialog.getBinding("items").filter([]);
		},

		equiDialogSearch: function() {
			var equnr = sap.ui.getCore().byId("eqSearchNum").getValue();
			var descr = sap.ui.getCore().byId("eqSearchDescr").getValue();
			var plant = sap.ui.getCore().byId("eqSearchPlant").getValue();
			var funcloc = sap.ui.getCore().byId("eqSearchFuncloc").getValue();
			//var langu = sap.ui.getCore().byId("eqSearchLangu").getValue();
			var aFilters = [
				new sap.ui.model.Filter("Equnr", sap.ui.model.FilterOperator.Contains, equnr),
				new sap.ui.model.Filter("Eqktx", sap.ui.model.FilterOperator.Contains, descr),
				new sap.ui.model.Filter("Swerk", sap.ui.model.FilterOperator.Contains, plant),
				new sap.ui.model.Filter("Tplnr", sap.ui.model.FilterOperator.Contains, funcloc)
			];
			sap.ui.getCore().byId("equiDialogList").getBinding("items").filter(aFilters);
		},

		equiDialogSelect: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext().getPath();
			var rowData = this.getView().getModel().getProperty(sPath);
			this._orderModel.setProperty("/Order/Equipment", rowData.Equipment);
			this.eqSearchDialogClose();
		},

		equiClearForm: function() {
			sap.ui.getCore().byId("eqSearchNum").setValue("");
			sap.ui.getCore().byId("eqSearchDescr").setValue("");
			sap.ui.getCore().byId("eqSearchPlant").setValue("");
			sap.ui.getCore().byId("eqSearchFuncloc").setValue("");
		},

		eqSearchDialogClose: function() {
			this._equiSearchDialog.close();
			this.equiClearForm();
		},

		handleEquipmentF4: function(oEvent) {
			debugger;
			//	var sInputValue = oEvent.getSource().getValue();
			if (!this._equiSearchDialog) {
				this._equiSearchDialog = sap.ui.xmlfragment(
					"com.espedia.demo.JobsScheduler.view.fragments.EquipmentSearchDialog",
					this
				);
				this.getView().addDependent(this._equiSearchDialog);
			}
			this.equiClearForm();
			this.equiDialogSearch();
			this._equiSearchDialog.open();
		},
		////////////////////////////// MATERIAL
		matnrDialogSearch: function() {
			var matnr = sap.ui.getCore().byId("matnrSearchNum").getValue();
			var descr = sap.ui.getCore().byId("matnrSearchDescr").getValue();
			var plant = sap.ui.getCore().byId("matnrSearchPlant").getValue();
			//var langu = sap.ui.getCore().byId("eqSearchLangu").getValue();
			var aFilters = [
				new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, matnr),
				new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, descr),
				new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.Contains, plant)
			];
			sap.ui.getCore().byId("matnrDialogList").getBinding("items").filter(aFilters);
		},

		matnrDialogSelect: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext().getPath();
			var rowData = this.getView().getModel().getProperty(sPath);
			if (rowData) {
				this.selModel.setProperty(this.selRow + "/Material", rowData.Matnr);
				this.selModel.setProperty(this.selRow + "/MatlDesc", rowData.Maktx);
				this.selModel.setProperty(this.selRow + "/RequirementQuantityUnit", "PC");
				this.selModel.refresh();
			}
			//this._orderModel.setProperty("/Order/Equipment", equi);
			this.matnrSearchDialogClose();
		},

		matnrClearForm: function() {
			sap.ui.getCore().byId("matnrSearchNum").setValue("");
			sap.ui.getCore().byId("matnrSearchDescr").setValue("");
			sap.ui.getCore().byId("matnrSearchPlant").setValue("");
		},

		matnrSearchDialogClose: function() {
			this._matnrSearchDialog.close();
			this.matnrClearForm();
		},

		handleMaterialF4: function(oEvent) {
			this.selRow = oEvent.getSource().getBindingContext().getPath();
			this.selModel = oEvent.getSource().getModel();
			//	var sInputValue = oEvent.getSource().getValue();
			if (!this._matnrSearchDialog) {
				this._matnrSearchDialog = sap.ui.xmlfragment(
					"com.espedia.demo.JobsScheduler.view.fragments.MaterialSearchDialog",
					this
				);
				this.getView().addDependent(this._matnrSearchDialog);
			}
			this.matnrClearForm();
			this.matnrDialogSearch();
			this._matnrSearchDialog.open();
		},

		//

		wcDialogSearch: function() {
			var wc = sap.ui.getCore().byId("wcSearchWorkCenter").getValue();
			var descr = sap.ui.getCore().byId("wcSearchDesciption").getValue();
			var plant = sap.ui.getCore().byId("wcSearchPlant").getValue();
			//var langu = sap.ui.getCore().byId("eqSearchLangu").getValue();
			var aFilters = [
				new sap.ui.model.Filter("Arbpl", sap.ui.model.FilterOperator.Contains, wc),
				new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, descr),
				new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.Contains, plant)
				//	new sap.ui.model.Filter("Spras", sap.ui.model.FilterOperator.Contains, "")
			];
			sap.ui.getCore().byId("wcDialogList").getBinding("items").filter(aFilters);
		},

		wcDialogSelect: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext().getPath();
			var rowData = this.getView().getModel().getProperty(sPath);
			this._orderModel.setProperty("/Order/WorkCenter", rowData.Arbpl);
			this._orderModel.setProperty("/Order/WorkCenterDescr", rowData.Ktext);
			this.wcSearchDialogClose();
		},

		wcClearForm: function() {
			sap.ui.getCore().byId("wcSearchWorkCenter").setValue("");
			sap.ui.getCore().byId("wcSearchDesciption").setValue("");
			sap.ui.getCore().byId("wcSearchPlant").setValue("");
		},

		wcSearchDialogClose: function() {
			this._wcSearchDialog.close();
			this.wcClearForm();
		},

		handleWcF4: function(oEvent) {
			//	var sInputValue = oEvent.getSource().getValue();
			if (!this._wcSearchDialog) {
				this._wcSearchDialog = sap.ui.xmlfragment(
					"com.espedia.demo.JobsScheduler.view.fragments.WorkCenterSearchDialog",
					this
				);
				this.getView().addDependent(this._wcSearchDialog);
			}
			this.wcClearForm();
			this.wcDialogSearch();
			this._wcSearchDialog.open();
		}
	};
});
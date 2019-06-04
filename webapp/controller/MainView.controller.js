sap.ui.define([
	"com/espedia/demo/JobsScheduler/controller/BaseController",
	//"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	//"com/espedia/demo/JobsScheduler/controller/utils/SearchHelp",
	"jquery.sap.global",
	"sap/m/UploadCollectionParameter",
	"sap/m/MessageToast",
	"sap/m/library",
	"sap/ui/core/format/FileSizeFormat",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
		"sap/ui/model/json/JSONModel"
], function (BaseController, MessageBox, jQuery, UploadCollectionParameter, MessageToast, MobileLibrary, FileSizeFormat, Filter,
	FilterOperator, JSONModel) {
	"use strict";

	return BaseController.extend("com.espedia.demo.JobsScheduler.controller.MainView", {
		uploadJSON: {},
		PhotoNumberAttach: 0,
		onInit: function () {
			this.mutableJSONOrdCreate = JSON.parse(JSON.stringify(this.orderCreationModel));
			this._orderModel = new sap.ui.model.json.JSONModel(this.mutableJSONOrdCreate);
			this.getView().byId("componentsTableEdit").setModel(this._orderModel);
			this.getView().byId("componentsTable").setModel(this._orderModel);
			this.getView().byId("operationsTableEdit").setModel(this._orderModel);
			this.getView().byId("operationsTable").setModel(this._orderModel);
			this.getView().byId("attachments").setModel(this._orderModel);
			this.getView().byId("cameraPage").setModel(new sap.ui.model.json.JSONModel({ //modello di default gestito da controller (alias empty model)
				photos: []
			})); //fotocamera
			//GF 16.10.2018: modello per l'editabilità
			this.getView().byId("orderEditPage").setModel(new sap.ui.model.json.JSONModel({
				"Order": {
					"ObjVisib": true,
					"ObjEdit": true
				}
			}), "settingsModel");

			this.getView().byId("attachments").setModel(new sap.ui.model.json.JSONModel({
				"maximumFilenameLength": 80,
				"maximumFileSize": 10,
				"mode": MobileLibrary.ListMode.SingleSelectMaster,
				"uploadEnabled": true,
				"uploadButtonVisible": true,
				"enableEdit": true,
				"enableDelete": true,
				"visibleEdit": true,
				"visibleDelete": true,
				"listSeparatorItems": [
					MobileLibrary.ListSeparators.All,
					MobileLibrary.ListSeparators.None
				],
				"showSeparators": MobileLibrary.ListSeparators.All,
				"listModeItems": [{
					"key": MobileLibrary.ListMode.SingleSelectMaster,
					"text": "Single"
				}, {
					"key": MobileLibrary.ListMode.MultiSelect,
					"text": "Multi"
				}]
			}), "attachSettings");

			this.getView().byId("attachments").setModel(new sap.ui.model.json.JSONModel({
				"items": ["jpg", "txt", "ppt", "pptx", "doc", "docx", "xls", "xlsx", "pdf", "png"],
				"selected": ["jpg", "txt", "ppt", "pptx", "doc", "docx", "xls", "xlsx", "pdf", "png"]
			}), "fileTypes");

			// Aggiornamento conteggi tab
			this.getView().byId("notifTable").attachUpdateFinished(null, function (oEvent) {
				this.getView().byId("mainNotifTabFilter").setCount(oEvent.getParameter("total"));
			}, this);

			this.getView().byId("openOrderTable").attachUpdateFinished(null, function (oEvent) {
				this.getView().byId("mainOpenOrdersTabFilter").setCount(oEvent.getParameter("total"));
			}, this);

			this.getView().byId("releasedOrderTable").attachUpdateFinished(null, function (oEvent) {
				this.getView().byId("mainRelOrdersTabFilter").setCount(oEvent.getParameter("total"));
			}, this);

			//setto il numero di allegati nella tab relattiva
			this.byId("attachments").addEventDelegate({
				onBeforeRendering: function () {
					this.byId("attachmentTitle").setText(this.getAttachmentTitleText());
				}.bind(this)
			});
		},

		///////////////////////////////
		// GESTIONE NAVIGAZIONE

		// Ritorno alla pagina principale
		onBackToMain: function () {
			var app = this.getView().byId("idAppControl");
			var page = this.getView().byId("mainPage");
			app.to(page, "show");
			this.getView().byId("notifTable").removeSelections(true);
			this.getView().byId("openOrderTable").removeSelections(true);
			this.getView().byId("releasedOrderTable").removeSelections(true);
		},

		navToNotif: function () {
			this.onBackToMain();
			this.byId("idIconTabBar").setSelectedKey("notif");
			this.byId("idIconTabBar").setExpanded(true);
		},

		// Pagina principale e tab ordini aperti
		navToOpenOrders: function () {
			this.onBackToMain();
			this.byId("idIconTabBar").setSelectedKey("oorders");
			this.byId("idIconTabBar").setExpanded(true);
		},

		// Pagina principale e tab ordini schedulati
		navToScheduledOrders: function () {
			this.onBackToMain();
			this.byId("idIconTabBar").setSelectedKey("sorders");
			this.byId("idIconTabBar").setExpanded(true);
			this._releasedOrder = false; //inizializzo
		},

		onConfirmBackToMain: function () {
			MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("createBackConfirm"), {
				title: this.getView().getModel("i18n").getResourceBundle().getText("ConfirmDeletion"), // default
				onClose: function (key) {
					if (key === "OK") {
						(this.onBackToMain.bind(this))();
					}
				}.bind(this)
			});

		},

		// Click su notifica
		notifSelect: function (oEvent) {
			this._selectedNotif = oEvent.getParameter("listItem").getBindingContext().getPath();
			var app = this.byId("idAppControl");
			var page = this.byId("notifDetailPage");
			//this.getView().byId("notifFormOrd").bindElement(this._selectedNotif);
			page.bindElement(this._selectedNotif);
			app.to(page, "show");
			// se
			var bd = this.getView().byId("idNotBreack").getState();
			this.getView().byId("formNotMalfStart").setVisible(bd);
			this.getView().byId("formNotMalfEnd").setVisible(bd);
		},

		// Creazione ordine
		onCreateOrder: function () {
			var app = this.byId("idAppControl");
			var page = this.byId("orderCreatePage");
			app.to(page, "show");
			this.getView().byId("iconTabBar").setSelectedKey("info");
			this.byId("iconTabBar").setExpanded(true);

			this.getView().setBusyIndicatorDelay(0);
			this.getView().setBusy(true);

			// Creo un clone del json modello, così quest'ultimo rimane inalterato e posso riutilizzarlo nei cicli successivi
			this.mutableJSONOrdCreate = JSON.parse(JSON.stringify(this.orderCreationModel));
			this._orderModel = new sap.ui.model.json.JSONModel(this.mutableJSONOrdCreate);
			this.moveNotifDataToOrder();
			var bd = this._orderModel.getProperty("/Order/Breakdown");
			this.getView().byId("formMalfStart").setVisible(bd);
			this.getView().byId("formMalfEnd").setVisible(bd);
			this.getView().byId("formEditMalfStart").setVisible(bd);
			this.getView().byId("formEditMalfEnd").setVisible(bd);

			this.getView().byId("operationsTable").setModel(this._orderModel);
			this.getView().byId("componentsTable").setModel(this._orderModel);
			this.getView().byId("infoFormBox").setModel(this._orderModel);
			this.getView().byId("planningFormOrd").setModel(this._orderModel);
		},
		
		onAfterRendering: function () {
			var oModel = this.getView().getModel(); //dichiarazione del modello oModel, come modello di default
			var sPath = "/NotifTypeCustSet()";

			oModel.read(sPath, {
				"success": function (oData) {
					//per il collegamento alla select tramite modello
					var problTypeModel = new JSONModel(oData);
					this.getView().setModel(problTypeModel, "problType");

				}.bind(this),
				"error": function (err) {
					sap.m.MessageBox.error(err.message);
				}
			});
			//fine chiamata al servizio
		},

		moveNotifDataToOrder: function () {
			this.getView().getModel().read(this._selectedNotif, {
				"success": function (oData) {
					this.getView().setBusy(false);
					this._orderModel.setProperty("/Order/Equipment", oData.Equipment);
					this._orderModel.setProperty("/Order/Funcloc", oData.Funcloc);
					this._orderModel.setProperty("/Order/Description", oData.Descript);
					this._orderModel.setProperty("/Order/Notificat", oData.Notificat);
					this._orderModel.setProperty("/Order/NotifDescription", oData.Descript);
					this._orderModel.setProperty("/Order/NotifLongText", oData.NotifLongText);
					this._orderModel.setProperty("/Order/Erdat", oData.Erdat);
					this._orderModel.setProperty("/Order/Ernam", oData.Ernam);
					this._orderModel.setProperty("/Order/Damage", "(" + oData.DamageCodegrp + " - " + oData.DamageCode + ") " + oData.DamageCodeDescr);
					this._orderModel.setProperty("/Order/DamageText", oData.DamageText);
					this._orderModel.setProperty("/Order/Cause", "(" + oData.CauseCodegrp + " - " + oData.CauseCode + ") " + oData.CauseCodeDescr);
					this._orderModel.setProperty("/Order/CauseText", oData.CauseText);
					this._orderModel.setProperty("/Order/Breakdown", oData.Breakdown);
					this._orderModel.setProperty("/Order/MalfunctionStart", oData.MalfunctionStart);
					this._orderModel.setProperty("/Order/MalfunctionEnd", oData.MalfunctionEnd);
					if (oData.MnWrkPlnt.length > 0) {
						this._orderModel.setProperty("/Order/Werks", oData.MnWrkPlnt);
					} else {
						this._orderModel.setProperty("/Order/Werks", oData.Planplant);
					}
					this._orderModel.setProperty("/Order/WorkCenter", oData.MnWrkCntr);
				}.bind(this),
				"error": function (err) {
					this.getView().setBusy(false);
				}
			});
			var date = new Date();
			//this._orderModel.setProperty("/Order/PlannedDate", date.getFullYear() + "-" + date.getMonth() + "-" + (date.getDate() + 1));
			this._orderModel.setProperty("/Order/PlannedDate", date);
		},

		orderSelect: function () {
			//this._selectedOrder = oEvent.getParameter("listItem").getBindingContext().getPath();
			var app = this.byId("idAppControl");
			var page = this.byId("orderEditPage");

			this.getView().setBusyIndicatorDelay(0);
			this.getView().setBusy(true);

			// Creo un clone del json modello, così quest'ultimo rimane inalterato e posso riutilizzarlo nei cicli successivi
			this.mutableJSONOrd = JSON.parse(JSON.stringify(this.orderCreationModel));
			this._orderModel = new sap.ui.model.json.JSONModel(this.mutableJSONOrd);
			//this._orderModel.attachRequestCompleted(this.readOrderData, this);
			this.readOrderData();

			this.getView().byId("iconTabBarEdit").setSelectedKey("info");
			this.byId("iconTabBarEdit").setExpanded(true);

			var bd = this._orderModel.getProperty("/Order/Breakdown");
			this.getView().byId("formMalfStart").setVisible(bd);
			this.getView().byId("formMalfEnd").setVisible(bd);
			this.getView().byId("formEditMalfStart").setVisible(bd);
			this.getView().byId("formEditMalfEnd").setVisible(bd);

			this.getView().byId("editPageHeader").setModel(this._orderModel);
			this.getView().byId("infoFormBoxEdit").setModel(this._orderModel);
			this.getView().byId("operationsTableEdit").setModel(this._orderModel);
			this.getView().byId("componentsTableEdit").setModel(this._orderModel);
			this.getView().byId("planningFormOrdEdit").setModel(this._orderModel);

			app.to(page, "show");
		},

		// Edit ordine
		openOrderSelect: function (oEvent) {
			this._selectedOrder = oEvent.getParameter("listItem").getBindingContext().getPath();
			this.getView().byId("orderReleaseButton").setVisible(true);
			this.getView().byId("orderEditPage").setTitle(this.getView().getModel("i18n").getResourceBundle().getText("editReleaseTitle"));
			this.orderSelect();
			this.orderReadComponents();
			this.orderReadOperations();
			this.byId("editPageHeader").addStyleClass('openOrderPageHeader');
			this.byId("editPageHeader").removeStyleClass('scheduledOrderPageHeader');
		},

		readOrderData: function () {
			this.getView().getModel().read(this._selectedOrder, {
				"success": function (oData) {
					this.getView().setBusy(false);
					this._orderModel.setProperty("/Order/Orderid", oData.Orderid);
					this._orderModel.setProperty("/Order/CreatedBy", oData.EnteredBy);
					this._orderModel.setProperty("/Order/CreatedOn", oData.EnterDate);
					this._orderModel.setProperty("/Order/Equipment", oData.Equipment);
					this._orderModel.setProperty("/Order/Funcloc", oData.Funcloc);
					this._orderModel.setProperty("/Order/Description", oData.ShortText);
					this._orderModel.setProperty("/Order/LongText", oData.LongText);
					this._orderModel.setProperty("/Order/NotifLongText", oData.NotifLongText);
					this._orderModel.setProperty("/Order/Damage", "(" + oData.DamageCodegrp + " - " + oData.DamageCode + ") " + oData.DamageCodeDescr);
					this._orderModel.setProperty("/Order/DamageText", oData.DamageText);
					this._orderModel.setProperty("/Order/Cause", "(" + oData.CauseCodegrp + " - " + oData.CauseCode + ") " + oData.CauseCodeDescr);
					this._orderModel.setProperty("/Order/CauseText", oData.CauseText);
					this._orderModel.setProperty("/Order/Breakdown", oData.Breakdown);
					this._orderModel.setProperty("/Order/MalfunctionStart", oData.MalfunctionStart);
					this._orderModel.setProperty("/Order/MalfunctionEnd", oData.MalfunctionEnd);
					this._orderModel.setProperty("/Order/Notificat", oData.NotifNo);
					this._orderModel.setProperty("/Order/WorkCenter", oData.MnWkCtr);
					this._orderModel.setProperty("/Order/WorkCenterDescr", oData.MainWorkcenterDescr);
					this._orderModel.setProperty("/Order/Werks", oData.MnWkPlant);
					this._orderModel.setProperty("/Order/Priority", oData.Priority);
					this._orderModel.setProperty("/Order/PriorityDescription", oData.PrioDesc);
					//this._orderModel.setProperty("/Order/PlannedDate", oData.StartDate.getFullYear() + "-" + oData.StartDate.getMonth() +
					//	"-" + (oData.StartDate.getDate() + 1));
					this._orderModel.setProperty("/Order/PlannedDate", oData.StartDate);
					// Manage icon color
					/*debugger;
					if (this._selectedStatus === "open") {
						$('.orderEditHeader').addClass('openOrderPageHeader').removeClass('scheduledOrderPageHeader');
					} else if (this._selectedStatus === "released") {
						$('.orderEditHeader').addClass('scheduledOrderPageHeader').removeClass('openOrderPageHeader');
					}
					this._selectedStatus = null;*/

					if (oData.UStatus === "ILAV") {
						this._setOrderEditability(false);
					} else {
						this._setOrderEditability(true);
					}

					this.getView().getModel().read("/NotifSet('" + oData.NotifNo + "')", {
						"success": function (nData) {
							this._orderModel.setProperty("/Order/NotifDescript", nData.Descript);
							this._orderModel.setProperty("/Order/Erdat", nData.Erdat);
							this._orderModel.setProperty("/Order/Ernam", nData.Ernam);
						}.bind(this),
						"error": function (err) {
							MessageBox.error(err.message);
						}
					});

				}.bind(this),
				"error": function (err) {
					MessageBox.error(err.message);
					this.getView().setBusy(false);
				}.bind(this)
			});
		},

		releasedOrderSelect: function (oEvent) {
			this._selectedOrder = oEvent.getParameter("listItem").getBindingContext().getPath();
			this._releasedOrder = true; //per gestione corretta uscita 
			this.getView().byId("orderReleaseButton").setVisible(false);
			this.getView().byId("orderEditPage").setTitle(this.getView().getModel("i18n").getResourceBundle().getText("editTitle"));
			this.orderSelect();
			this.orderReadComponents();
			this.orderReadOperations();
			this.byId("editPageHeader").addStyleClass('scheduledOrderPageHeader');
			this.byId("editPageHeader").removeStyleClass('openOrderPageHeader');
		},

		orderReadComponents: function () {
			this.getView().getModel().read(this._selectedOrder + "/GetComponents", {
				"success": function (oData) {
					var entity;
					for (var i in oData.results) {
						entity = {};
						entity.ItemNumber = oData.results[i].ItemNumber;
						entity.Material = oData.results[i].Material;
						entity.MatlDesc = oData.results[i].MatlDesc;
						entity.RequirementQuantity = oData.results[i].RequirementQuantity;
						entity.RequirementQuantityUnit = oData.results[i].RequirementQuantityUnit;
						entity.Activity = oData.results[i].Activity;
						this._orderModel.setProperty("/Components", this._orderModel.getProperty("/Components").concat([entity]));
					}
				}.bind(this),
				"error": function (err) {
					MessageBox.error(err.message);
				}
			});
		},

		orderReadOperations: function () {
			this.getView().getModel().read(this._selectedOrder + "/GetOperations", {
				"success": function (oData) {
					var entity;
					for (var i in oData.results) {
						entity = {};
						entity.Activity = oData.results[i].Activity;
						entity.Description = oData.results[i].Description;
						entity.DurationNormal = oData.results[i].DurationNormal;
						entity.Acttype = oData.results[i].Acttype;
						this._orderModel.setProperty("/Operations", this._orderModel.getProperty("/Operations").concat([entity]));
					}
					//this._orderModel.refresh
				}.bind(this),
				"error": function (err) {
					MessageBox.error(err.message);
				}
			});
		},

		_setOrderEditability: function (boole) {
			var settingModel = this.getView().byId("orderEditPage").getModel("settingsModel");
			settingModel.setProperty("/Order/ObjVisib", boole);
			settingModel.setProperty("/Order/ObjEdit", boole);
		},

		// Nuova tab con calendario
		openCalendar: function () {
			window.open("https://workcentercalendar-m9a44f3468.dispatcher.hana.ondemand.com", "_blank");
		},

		// END GESTIONE NAVIGAZIONE
		///////////////////////////////

		///////////////////////////////
		// GESTIONE REFRESH DATI
		refreshNotif: function () {
			var table = this.getView().byId("notifTable");
			table.getModel().refresh(true);
		},

		refreshOpenOrder: function () {
			var table = this.getView().byId("openOrderTable");
			table.getModel().refresh(true);
		},

		refreshReleasedOrder: function () {
			var table = this.getView().byId("releasedOrderTable");
			table.getModel().refresh(true);
		},
		// FINE GESTIONE REFRESH DATI
		///////////////////////////////

		showDamageText: function (oEvent) {
			if (!this._dmgPopover) {
				this._dmgPopover = sap.ui.xmlfragment("com.espedia.demo.JobsScheduler.view.fragments.DamagePopover", this);
				this.getView().addDependent(this._dmgPopover);
				this._dmgPopover.attachAfterOpen(function () {
					this.disablePointerEvents();
				}, this);
				this._dmgPopover.attachAfterClose(function () {
					this.enablePointerEvents();
				}, this);
			}

			var oCtx = oEvent.getSource().getBindingContext();
			this._dmgPopover.bindElement(oCtx.getPath());

			// delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.
			var oControl = oEvent.getSource();
			this._dmgPopover.openBy(oControl);
		},

		showCauseText: function (oEvent) {
			if (!this._causePopover) {
				this._causePopover = sap.ui.xmlfragment("com.espedia.demo.JobsScheduler.view.fragments.CausePopover", this);
				this.getView().addDependent(this._causePopover);
				this._causePopover.attachAfterOpen(function () {
					this.disablePointerEvents();
				}, this);
				this._causePopover.attachAfterClose(function () {
					this.enablePointerEvents();
				}, this);
			}

			var oCtx = oEvent.getSource().getBindingContext();
			this._causePopover.bindElement(oCtx.getPath());

			// delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.
			var oControl = oEvent.getSource();
			this._causePopover.openBy(oControl);
		},

		showNotifLongText: function (oEvent) {
			if (!this._nltPopover) {
				this._nltPopover = sap.ui.xmlfragment("com.espedia.demo.JobsScheduler.view.fragments.NotifLTPopover", this);
				this.getView().addDependent(this._nltPopover);
				this._nltPopover.attachAfterOpen(function () {
					this.disablePointerEvents();
				}, this);
				this._nltPopover.attachAfterClose(function () {
					this.enablePointerEvents();
				}, this);
			}

			var oCtx = oEvent.getSource().getBindingContext();
			this._nltPopover.bindElement(oCtx.getPath());

			// delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.
			var oControl = oEvent.getSource();
			this._nltPopover.openBy(oControl);
		},

		/////////////////////////////
		// OPERAZIONI NOTIFICHE

		onDeleteNotif: function () {
			var notifDelete = function (key) {
				if (key !== "OK") {
					return;
				}
				this.onBackToMain();
				this.getView().getModel().remove(this._selectedNotif, {
					"success": function () {
						sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("NotificationDeleted"));
					}.bind(this),
					"error": function (err) {
						sap.m.MessageBox.error(err.message);
					}.bind(this)

				});
			};

			MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("DeleteNotification"), {
				title: this.getView().getModel("i18n").getResourceBundle().getText("ConfirmDeletion"), // default
				onClose: notifDelete.bind(this)
			});

		},
		// END OPERAZIONI NOTIFICHE

		/////////////////////////////
		// OPERAZIONI ORDINE

		// Wrapper per le chiamate odata singole
		orderCreationSave: function (boolRelease) {
			this.getView().setBusyIndicatorDelay(0);
			this.getView().setBusy(true);

			var oModel = this.getView().getModel();
			oModel.setUseBatch(true);
			var changeSetId = "abc";
			oModel.setDeferredGroups([changeSetId]);
			var mParameters = {
				"groupId": changeSetId,
				"changeSetId": changeSetId
			};

			var batchSuccess = function (oData) {
				this.getView().setBusy(false);
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("OrderCreated"));
				this.refreshNotif();
				if (boolRelease) {
					this.navToScheduledOrders();
					this.refreshReleasedOrder();
				} else {
					this.navToOpenOrders();
					this.refreshOpenOrder();
				}
			}.bind(this);

			var batchError = function (err) {
				this.getView().setBusy(false);
				MessageBox.error(err.message);
			}.bind(this);

			this.odataOrderCreate(mParameters, boolRelease);
			this.odataOrderOperationCreate(mParameters);
			this.odataOrderComponentCreate(mParameters);
			this.getView().getModel().submitChanges({
				"groupId": changeSetId,
				//"changeSetId": changeSetId,
				"success": batchSuccess,
				"error": batchError
			});
		},

		odataOrderCreate: function (param, boolRelease) {
			var oModel = this.getView().getModel();
			var entity = {};
			entity["Equipment"] = this._orderModel.getProperty("/Order/Equipment");
			entity["OrderType"] = this.getView().byId("orderTypeSelect").getSelectedKey();
			entity["NotifNo"] = this._orderModel.getProperty("/Order/Notificat");
			entity["MnWkCtr"] = this._orderModel.getProperty("/Order/WorkCenter");
			entity["MnWkPlant"] = this._orderModel.getProperty("/Order/Werks");
			entity["Planplant"] = this._orderModel.getProperty("/Order/Werks"); //this._orderModel.getProperty("/Order/WorkCenter");

			var startDate = this._orderModel.getProperty("/Order/PlannedDate");
			// mod GF 08.10.2018: non più necessario 
			//var regExp = /(.+)-(.+)-(.+)/gi;
			//var dateMatch = regExp.exec(String(startDate));
			//entity["StartDate"] = new Date(dateMatch[1], dateMatch[2], dateMatch[3]);
			entity["StartDate"] = startDate;
			entity["ShortText"] = this._orderModel.getProperty("/Order/Description");
			entity["Priority"] = this.getView().byId("prioritySelectEdit").getSelectedKey();
			if (boolRelease) {
				entity["StatusToSet"] = "RELEASE";
			}
			// DESCRIPTION
			// LONG TEXT
			entity["LongText"] = this._orderModel.getProperty("/Order/LongText");
			/*this.getView().getModel().create("/OrderSet", entity, {
				"success": successF.bind(this),
				"error": errorF.bind(this)
			});*/
			oModel.create("/OrderSet", entity, param);
		},

		odataOrderOperationCreate: function (param) {
			var oModel = this.getView().getModel();
			var oper = this._orderModel.getProperty("/Operations");
			if (!(oper && oper.length > 0)) {
				return;
			}

			for (var i in oper) {
				oModel.create("/OperationSet", oper[i], param);
			}
		},

		odataOrderComponentCreate: function (param) {
			var comp = this._orderModel.getProperty("/Components");
			if (!(comp && comp.length > 0)) {
				return;
			}
			var oModel = this.getView().getModel();
			var plant = this._orderModel.getProperty("/Order/Werks");
			for (var i in comp) {
				comp[i].Plant = plant;
				oModel.create("/ComponentSet", comp[i], param);
			}
		},

		onOrderCreationSave: function () {
			if (this._orderModel.getProperty("/Order/WorkCenter").length < 1) {
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("InsertValidWorkCenter"));
				return;
			}
			MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("CreateOrder"), {
				title: "Save", // default
				onClose: function (key) {
					if (key === "OK") {
						this.orderCreationSave(false);
					}
				}.bind(this)
			});
		},

		onOrderCreationRelease: function () {
			if (this._orderModel.getProperty("/Order/WorkCenter").length < 1) {
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("InsertValidWorkCenter"));
				return;
			}
			MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("CreateRelease"), {
				title: this.getView().getModel("i18n").getResourceBundle().getText("SaveRelease"), // default
				onClose: function (key) {
					if (key === "OK") {
						this.orderCreationSave(true);
					}
				}.bind(this)
			});
		},

		onOrderCreationCancel: function () {
			//sap.m.MessageToast.show("Operation cancelled.");
			this._orderModel = null;
			this.navToNotif();
		},

		//////

		orderEditSave: function (boolRelease) {
			this.getView().setBusyIndicatorDelay(0);
			this.getView().setBusy(true);

			var requestCompleted = function (oEvent) {
				try {
					var responseModel = JSON.parse(oEvent.getParameter("response").responseText);
				} catch (err) {}

				this.getView().setBusy(false);

				if (responseModel === undefined) {
					sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("OrderSaved"));
					if (this._releasedOrder) {
						boolRelease = this._releasedOrder;
					}
					if (boolRelease) {
						this.navToScheduledOrders();
						this.refreshReleasedOrder();
					} else {
						this.navToOpenOrders();
					}
				} else {
					var errMessage = responseModel.error.message.value;
					sap.m.MessageBox.error(errMessage);
				}
				this.getView().getModel().detachRequestCompleted(requestCompleted);
			}.bind(this);

			this.getView().getModel().attachRequestCompleted(requestCompleted);

			var oModel = this.getView().getModel();
			oModel.setUseBatch(true);
			var changeSetId = "bcd";
			oModel.setDeferredGroups([changeSetId]);
			var mParameters = {
				"groupId": changeSetId,
				"changeSetId": changeSetId
			};

			var batchSuccess = function (oData, res) {
				/*	this.getView().setBusy(false);
					sap.m.MessageToast.show("Order saved");
					if (this._releasedOrder) {
						boolRelease = this._releasedOrder;
					}
					if (boolRelease) {
						this.navToScheduledOrders();
					} else {
						this.navToOpenOrders();
					}*/
			}.bind(this);

			var batchError = function (err) {
				this.getView().setBusy(false);
				MessageBox.error(err.message);
			}.bind(this);

			this.odataOrderEdit(mParameters, boolRelease);
			this.odataOrderOperationEdit(mParameters);
			this.odataOrderComponentEdit(mParameters);
			this.getView().getModel().submitChanges({
				"groupId": changeSetId,
				//"changeSetId": changeSetId,
				"success": batchSuccess,
				"error": batchError
			});
			/*	setTimeout(function() {
					this.getView().setBusy(false);
					if (boolRelease) {
						this.navToScheduledOrders();
					} else {
						this.navToOpenOrders();
					}
				}.bind(this), 1000);*/

		},

		odataOrderEdit: function (param, boolRelease) {
			var entity = {};
			entity["Orderid"] = this._orderModel.getProperty("/Order/Orderid");
			entity["Equipment"] = this._orderModel.getProperty("/Order/Equipment");
			entity["OrderType"] = this.getView().byId("orderTypeSelect").getSelectedKey();
			entity["NotifNo"] = this._orderModel.getProperty("/Order/Notificat");
			entity["MnWkCtr"] = this._orderModel.getProperty("/Order/WorkCenter");
			entity["MnWkPlant"] = this._orderModel.getProperty("/Order/Werks"); //this._orderModel.getProperty("/Order/WorkCenter");
			entity["Planplant"] = this._orderModel.getProperty("/Order/Werks");
			entity["ShortText"] = this._orderModel.getProperty("/Order/Description");
			entity["Priority"] = this.getView().byId("prioritySelectEdit").getSelectedKey();
			//var startDate = this._orderModel.getProperty("/Order/PlannedDate");
			//entity["StartDate"] = new Date(startDate.slice(0, 4), startDate.slice(5, 7), startDate.slice(8, 10));

			var startDate = this._orderModel.getProperty("/Order/PlannedDate");
			// mod GF 08.10.2018: non più necessario per gestione dataPick a layout
			//var regExp = /(.+)-(.+)-(.+)/gi;
			//var dateMatch = regExp.exec(String(startDate));
			//entity["StartDate"] = new Date(dateMatch[1], dateMatch[2], dateMatch[3]);
			entity["StartDate"] = startDate;
			entity["ShortText"] = this._orderModel.getProperty("/Order/Description");
			if (boolRelease) {
				entity["StatusToSet"] = "RELEASE";
			}
			// DESCRIPTION
			// LONG TEXT
			entity["LongText"] = this._orderModel.getProperty("/Order/LongText");
			/*this.getView().getModel().create("/OrderSet", entity, {
				"success": successF.bind(this),
				"error": errorF.bind(this)
			});*/
			this.getView().getModel().update("/OrderSet('" + entity["Orderid"] + "')", entity, param);
		},

		odataOrderOperationEdit: function (param) {
			var oModel = this.getView().getModel();
			var oper = this._orderModel.getProperty("/Operations");
			var orderid = this._orderModel.getProperty("/Order/Orderid");
			if (!(oper && oper.length > 0)) {
				return;
			}
			for (var i in oper) {
				oModel.update("/OperationSet(Aufnr='" + orderid + "',Activity='" + oper[i].Activity + "')", oper[i], param);
			}
		},

		odataOrderComponentEdit: function (param) {
			var comp = this._orderModel.getProperty("/Components");
			var orderid = this._orderModel.getProperty("/Order/Orderid");
			if (!(comp && comp.length > 0)) {
				return;
			}
			var oModel = this.getView().getModel();
			for (var i in comp) {
				oModel.update("/ComponentSet(Aufnr='" + orderid + "',Material='" + comp[i].Material + "')", comp[i], param);
			}
		},

		onOrderEditSave: function () {
			if (this._orderModel.getProperty("/Order/WorkCenter").length < 1) {
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("InsertValidWorkCenter"));
				return;
			}
			MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("UpdateOrder"), {
				title: this.getView().getModel("i18n").getResourceBundle().getText("Save"), // default
				onClose: function (key) {
					if (key === "OK") {
						this.orderEditSave(false);
					}
				}.bind(this)
			});
		},

		onOrderEditRelease: function () {
			if (this._orderModel.getProperty("/Order/WorkCenter").length < 1) {
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("InsertValidWorkCenter"));
				return;
			}
			MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("SaveRel"), {
				title: this.getView().getModel("i18n").getResourceBundle().getText("SaveRelease"), // default
				onClose: function (key) {
					if (key === "OK") {
						this.orderEditSave(true);
					}
				}.bind(this)
			});
		},

		onOrderEditCancel: function () {
			//sap.m.MessageToast.show("Operation cancelled");
			this._orderModel = null;
			this.onBackToMain();
		},

		// END OPERAZIONI ORDINE
		////////////////////////////////

		////////////////////////////////
		// AGGIUNTA COMPONENTS ORDINE
		onComponentAdd: function () {
			if (this._orderModel.getProperty("/Operations").length < 1) {
				MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("noOperationsFoundText"), {
					"title": this.getView().getModel("i18n").getResourceBundle().getText("noOperationsFoundTitle")
				});
				return;
			}

			var lastCompIndex = this._orderModel.getProperty("/Components").length - 1;
			var newComp;
			if (lastCompIndex >= 0) {
				var lastComp = this._orderModel.getProperty("/Components/" + lastCompIndex + "/ItemNumber");
				newComp = String(parseInt(lastComp, 10) + 10).padStart(4, "0");
			} else {
				newComp = "0010";
			}

			if (!this._newComponentDialog) {
				this._newComponentDialog = sap.ui.xmlfragment("com.espedia.demo.JobsScheduler.view.fragments.NewComponentDialog", this);
			}
			// Creo un clone del json modello, così quest'ultimo rimane inalterato e posso riutilizzarlo nei cicli successivi
			this.mutableJSONComp = JSON.parse(JSON.stringify(this.addComponentModel));
			this._newCompModel = new sap.ui.model.json.JSONModel(this.mutableJSONComp);
			this._newCompModel.setProperty("/NewComponents/0/ItemNumber", newComp);
			this.getView().addDependent(this._newComponentDialog);
			this._newComponentDialog.open();
			sap.ui.getCore().byId("newComponentsTable").setModel(this._newCompModel);

		},

		onNewComponentCancelPress: function () {
			this._newCompModel = null;
			this._newComponentDialog.close();
			this._newComponentDialog.destroy();
			this._newComponentDialog = undefined;
		},

		onNewComponentConfirmPress: function () {
			
			var checkComponentWellValorized = true;
			for (var i = 0; i < this._newCompModel.oData.NewComponents.length - 1; i++) {
				if (this._newCompModel.oData.NewComponents[i].Material == "" || this._newCompModel.oData.NewComponents[i].Activity == "" || this._newCompModel
					.oData.NewComponents[i].RequirementQuantity == "" || this._newCompModel.oData.NewComponents[i].RequirementQuantityUnit == "") {
					checkComponentWellValorized = false;
				}
			}

			if (!(this._newCompModel.oData.NewComponents[this._newCompModel.oData.NewComponents.length - 1].Material == "" && this._newCompModel
					.oData.NewComponents[this._newCompModel.oData.NewComponents.length - 1].Activity == "" && this._newCompModel.oData.NewComponents[
						this._newCompModel.oData.NewComponents.length - 1].RequirementQuantity == "" && this._newCompModel.oData.NewComponents[this._newCompModel
						.oData.NewComponents.length - 1].RequirementQuantityUnit == "")) {
				checkComponentWellValorized = false;
			}
			if (!checkComponentWellValorized) {
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("ComponentWarning"));
			} else {
			
			
			var lastIndex = this._newCompModel.getProperty("/NewComponents").length - 1;
			var lastRow = "/NewComponents/" + lastIndex + "/";
			if (
				this._newCompModel.getProperty(lastRow + "Material").length === 0 &&
				this._newCompModel.getProperty(lastRow + "RequirementQuantity").length === 0 &&
				this._newCompModel.getProperty(lastRow + "RequirementQuantityUnit").length === 0 &&
				this._newCompModel.getProperty(lastRow + "Activity").length === 0
			) {
				this._newCompModel.getProperty("/NewComponents").pop();
			}

			this._orderModel.setProperty("/Components", this._orderModel.getProperty("/Components").concat(this._newCompModel.getProperty(
				"/NewComponents")));
			this._newCompModel = null;
			this._newComponentDialog.close();
			this._newComponentDialog.destroy();
			this._newComponentDialog = undefined;
		}
		},

		newCompLiveChange: function (oEvent) {
			//  this._newOpModel
			var lastIndex = this._newCompModel.getProperty("/NewComponents").length - 1;
			var lastRow = "/NewComponents/" + lastIndex + "/";
			if (
				this._newCompModel.getProperty(lastRow + "Material").length > 0 &&
				this._newCompModel.getProperty(lastRow + "RequirementQuantity").length > 0 &&
				this._newCompModel.getProperty(lastRow + "RequirementQuantityUnit").length > 0 &&
				this._newCompModel.getProperty(lastRow + "Activity").length > 0
			) {
				var newEmptyComp = {
					"ItemNumber": String(parseInt(this._newCompModel.getProperty(lastRow + "ItemNumber"), 10) + 10).padStart(4, "0"),
					"Material": "",
					"RequirementQuantity": "",
					"RequirementQuantityUnit": "",
					"Activity": ""
				};
				this._newCompModel.getProperty("/NewComponents").push(newEmptyComp);
				this._newCompModel.refresh();
			}
		},

		removeComponentFromTable: function (oEvent) {
			var selectedRow = oEvent.getSource().getBindingContext().getPath();
			var oIndex = parseInt(selectedRow.substring(selectedRow.lastIndexOf('/') + 1), 10);
			var data = this._orderModel.getProperty("/Components");
			data.splice(oIndex, 1);
			this._orderModel.setProperty("/Components", data);
			this._orderModel.refresh();
		},
		// END AGGIUNTA COMPONENTS ORDINE
		////////////////////////////////

		////////////////////////////////
		// AGGIUNTA OPERATIONS ORDINE
		onOperationAdd: function () {
			var lastOpIndex = this._orderModel.getProperty("/Operations").length - 1;
			var newActivity;
			if (lastOpIndex >= 0) {
				var lastActivity = this._orderModel.getProperty("/Operations/" + lastOpIndex + "/Activity");
				newActivity = String(parseInt(lastActivity, 10) + 10).padStart(4, "0");
			} else {
				newActivity = "0010";
			}
			if (!this._newOperationDialog) {
				this._newOperationDialog = sap.ui.xmlfragment("com.espedia.demo.JobsScheduler.view.fragments.NewOperationDialog", this);
			}
			// Creo un clone del json modello, così quest'ultimo rimane inalterato e posso riutilizzarlo nei cicli successivi
			this.mutableJSONOper = JSON.parse(JSON.stringify(this.addOperationModel));
			this._newOpModel = new sap.ui.model.json.JSONModel(this.mutableJSONOper);
			this._newOpModel.setProperty("/NewOperations/0/Activity", newActivity);
			this.getView().addDependent(this._newOperationDialog);
			this._newOperationDialog.open();
			sap.ui.getCore().byId("newOperationsTable").setModel(this._newOpModel);
		},

		onNewOperationCancelPress: function () {
			this._newOpModel = null;
			this._newOperationDialog.close();
			this._newOperationDialog.destroy();
			this._newOperationDialog = undefined;
		},

		onNewOperationConfirmPress: function () {
			var checkOperationWellValorized = true;
			for (var i = 0; i < this._newOpModel.oData.NewOperations.length - 1; i++) {
				if (this._newOpModel.oData.NewOperations[i].Description == "" || this._newOpModel.oData.NewOperations[i].DurationNormal == "") {
					checkOperationWellValorized = false;
				}
			}

			if (!(this._newOpModel.oData.NewOperations[this._newOpModel.oData.NewOperations.length - 1].Description == "" && this._newOpModel.oData
					.NewOperations[this._newOpModel.oData.NewOperations.length - 1].DurationNormal == "")) {
				checkOperationWellValorized = false;
			}
			if (!checkOperationWellValorized) {
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("OperationOrAHMissing"));
			} else {
				var lastIndex = this._newOpModel.getProperty("/NewOperations").length - 1;
				var lastRow = "/NewOperations/" + lastIndex + "/";
				if (
					this._newOpModel.getProperty(lastRow + "Description").length === 0 &&
					this._newOpModel.getProperty(lastRow + "Acttype").length === 0 &&
					this._newOpModel.getProperty(lastRow + "DurationNormal").length === 0
				) {
					this._newOpModel.getProperty("/NewOperations").pop();
				}

				this._orderModel.setProperty("/Operations", this._orderModel.getProperty("/Operations").concat(this._newOpModel.getProperty(
					"/NewOperations")));
				this._newOpModel = null;
				this._newOperationDialog.close();
				this._newOperationDialog.destroy();
				this._newOperationDialog = undefined;
			}
		},

		newOpLiveChange: function (oEvent) {
			var lastIndex = this._newOpModel.getProperty("/NewOperations").length - 1;
			var lastRow = "/NewOperations/" + lastIndex + "/";
			if (
				this._newOpModel.getProperty(lastRow + "Description").length > 0 &&
				this._newOpModel.getProperty(lastRow + "DurationNormal").length > 0
			) {
				var newEmptyOp = {
					"Activity": String(parseInt(this._newOpModel.getProperty(lastRow + "Activity"), 10) + 10).padStart(4, "0"),
					"Description": "",
					"DurationNormal": "",
					"Acttype": ""
				};
				this._newOpModel.getProperty("/NewOperations").push(newEmptyOp);
				this._newOpModel.refresh();
			}
		},

		removeOperationFromTable: function (oEvent) {
			var selectedRow = oEvent.getSource().getBindingContext().getPath();
			var oIndex = parseInt(selectedRow.substring(selectedRow.lastIndexOf('/') + 1), 10);
			var data = this._orderModel.getProperty("/Operations");
			data.splice(oIndex, 1);
			this._orderModel.setProperty("/Operations", data);
			this._orderModel.refresh();
		},
		// END AGGIUNTA OPERATIONS ORDINE
		////////////////////////////////             
		// START FILE UPLOADER   
		formatAttribute: function (sValue) {
			if (jQuery.isNumeric(sValue)) {
				return FileSizeFormat.getInstance({
					binaryFilesize: false,
					maxFractionDigits: 1,
					maxIntegerDigits: 3
				}).format(sValue);
			} else {
				return sValue;
			}
		},

		arrayJSONStringify: function (array) {
			for (var i = 0; i < array.length; i++) {
				if (typeof array[i] !== "string") {
					array[i] = JSON.stringify(array[i]);
				}
			}
			return array;
		},

		arrayJSONParse: function (array) {
			for (var i = 0; i < array.length; i++) {
				array[i] = JSON.parse(array[i]);
			}
			return array;
		},

		onChange: function (oEvent) {
			var that = this;
			var oUploadCollection = oEvent.getSource();
			// Header Token
			var oCustomerHeaderToken = new UploadCollectionParameter({
				name: "x-csrf-token",
				value: "securityTokenFromModel"
			});
			oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

			var reader = new FileReader();
			var file = oEvent.getParameter("files")[0];
			that.uploadJSON = {};
			that.uploadJSON.fileId = jQuery.now().toString();
			that.uploadJSON.fileName = file.name;
			that.uploadJSON.fileMimeType = file.type;
			that.uploadJSON.fileDimension = (file.size / 1000).toFixed(2) + " kB";
			that.uploadJSON.fileExtension = file.name.split(".")[1];
			that.uploadJSON.fileUploadDate = new Date(jQuery.now()).toLocaleDateString();
			reader.onload = function (e) {
				that.uploadJSON.fileContent = e.target.result.substring(5 + that.uploadJSON.fileMimeType.length + 8);
			};

			reader.onerror = function (e) {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("errUpl"));
			};

			reader.readAsDataURL(file);

		},

		base64toBlob: function (base64Data, contentType) {
			contentType = contentType || '';
			var sliceSize = 1024;
			var byteCharacters = atob(base64Data);
			var bytesLength = byteCharacters.length;
			var slicesCount = Math.ceil(bytesLength / sliceSize);
			var byteArrays = new Array(slicesCount);

			for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
				var begin = sliceIndex * sliceSize;
				var end = Math.min(begin + sliceSize, bytesLength);
				var bytes = new Array(end - begin);

				for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
					bytes[i] = byteCharacters[offset].charCodeAt(0);
				}

				byteArrays[sliceIndex] = new Uint8Array(bytes);
			}

			return new Blob(byteArrays, {
				type: contentType
			});
		},

		onFileDeleted: function (oEvent) {
			this.deleteItemById(oEvent.getParameter("documentId"));
		},

		deleteItemById: function (sItemToDeleteId) {
			var oData = this.byId("attachments").getModel().getData();
			var aItems = jQuery.extend(true, {}, oData)["Attachments"];
			jQuery.each(aItems, function (index) {
				if (aItems[index] && aItems[index].fileId === sItemToDeleteId) {
					aItems.splice(index, 1);
				}
			});
			this.byId("attachments").getModel().getData()["Attachments"] = aItems;
			this.byId("attachments").getModel().refresh();

			this.byId("attachmentTitle").setText(this.getAttachmentTitleText());
		},

		onFilenameLengthExceed: function () {
			MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("fileLenghtExc"));
		},

		onFileRenamed: function (oEvent) {
			var oData = this.byId("attachments").getModel().getData();
			var aItems = jQuery.extend(true, {}, oData)["Attachments"];
			var sDocumentId = oEvent.getParameter("documentId");
			jQuery.each(aItems, function (index) {
				if (aItems[index] && aItems[index].fileId === sDocumentId) {
					aItems[index].fileName = oEvent.getParameter("item").getFileName();
				}
			});
			this.byId("attachments").getModel().getData()["Attachments"] = aItems;
			this.byId("attachments").getModel().refresh();
		},

		onFileSizeExceed: function () {
			MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("fileSizeExc"));
		},

		onTypeMissmatch: function () {
			MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("typeMiss"));
		},

		onUploadComplete: function () {
			var that = this;
			var oData = this.byId("attachments").getModel().getData();

			var blobForURL = this.base64toBlob(that.uploadJSON.fileContent, that.uploadJSON.fileMimeType);
			var fileURL = URL.createObjectURL(blobForURL);
			oData["Attachments"].unshift({
				"fileId": that.uploadJSON.fileId,
				"fileName": that.uploadJSON.fileName,
				"fileMimeType": that.uploadJSON.fileMimeType,
				"fileDimension": that.uploadJSON.fileDimension,
				"fileExtension": that.uploadJSON.fileExtension,
				"fileUploadDate": that.uploadJSON.fileUploadDate,
				"fileContent": that.uploadJSON.fileContent,
				"fileThumbnailUrl": "",
				"fileURL": fileURL,
				"attributes": [{
					"title": "Data di caricamento",
					"text": that.uploadJSON.fileUploadDate,
					"active": false
				}, {
					"title": "Dimensione",
					"text": that.uploadJSON.fileDimension,
					"active": false
				}],
				"selected": false
			});
			this.byId("attachments").getModel().refresh();
			that.uploadJSON = {};

			// Sets the text to the label
			this.byId("attachmentTitle").setText(this.getAttachmentTitleText());
		},

		onBeforeUploadStarts: function (oEvent) {
			// Header Slug
			var oCustomerHeaderSlug = new UploadCollectionParameter({
				name: "slug",
				value: oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
		},

		onSelectAllPress: function (oEvent) {
			var oUploadCollection = this.byId("attachments");
			if (!oEvent.getSource().getPressed()) {
				this.deselectAllItems(oUploadCollection);
				oEvent.getSource().setPressed(false);
				oEvent.getSource().setText("Select all");
			} else {
				this.deselectAllItems(oUploadCollection);
				oUploadCollection.selectAll();
				oEvent.getSource().setPressed(true);
				oEvent.getSource().setText("Deselect all");
			}
			this.onSelectionChange(oEvent);
		},

		deselectAllItems: function (oUploadCollection) {
			var aItems = oUploadCollection.getItems();
			for (var i = 0; i < aItems.length; i++) {
				oUploadCollection.setSelectedItem(aItems[i], false);
			}
		},

		getAttachmentTitleText: function () {
			var aItems = this.byId("attachments").getItems();
			var nAllegati = this.getView().getModel("i18n").getResourceBundle().getText("Nallegati"); //i18n gestito con variabile dinamica
			nAllegati = nAllegati.replace("%var%", aItems.length);

			return nAllegati;
		},

		onModeChange: function (oEvent) {
			var oSettingsModel = this.getView().getModel("settings");
			if (oEvent.getParameters().selectedItem.getProperty("key") === MobileLibrary.ListMode.MultiSelect) {
				oSettingsModel.setProperty("/visibleEdit", false);
				oSettingsModel.setProperty("/visibleDelete", false);
				this.enableToolbarItems(true);
			} else {
				oSettingsModel.setProperty("/visibleEdit", true);
				oSettingsModel.setProperty("/visibleDelete", true);
				this.enableToolbarItems(false);
			}
		},

		onSelectionChange: function () {
			var oData = this.byId("attachments").getModel().getData();
			var aSelectedItems = this.byId("attachments").getSelectedItems();
			if (aSelectedItems.length !== 0) {
				var selectedItemId = aSelectedItems[0].getDocumentId();
				var attach = oData["Attachments"];
				for (var k in attach) {
					if (attach[k].selected === true && attach[k].fileId !== selectedItemId) {
						attach[k].selected = false;
					}
				}
			}
		},

		onDownloadSelectedItems: function () {
			var oData = this.byId("attachments").getModel().getData();
			var aItems = jQuery.extend(true, {}, oData)["Attachments"];
			var aSelectedItems = this.byId("attachments").getSelectedItems();
			if (aSelectedItems.length !== 0) {
				var downloadableContent;
				jQuery.each(aItems, function (index) {
					if (aItems[index] && aItems[index].fileId === aSelectedItems[0].getDocumentId()) {
						downloadableContent = aItems[index];
					}
				});
				var blob = this.base64toBlob(downloadableContent.fileContent, downloadableContent.fileMimeType);
				var objectURL = URL.createObjectURL(blob);

				var link = document.createElement('a');
				link.style.display = 'none';
				document.body.appendChild(link);

				link.href = objectURL;
				link.href = URL.createObjectURL(blob);
				link.download = downloadableContent.fileName;
				link.click();
			}
		},
		// END FILE UPLOADER 

		onCameraOpen: function () { //controllare l'ordine degli id
			var app = this.byId("idAppControl");
			var page = this.byId("cameraPage");
			app.to(page, "show");
			var oCamera = this.getView().byId("idCamera");
			if (!firstOpenCamera) oCamera.rerender(); // apre la webcam se è spenta
			firstOpenCamera = false;
		},
		
		
		onSelectedPhotos: function (oEvent) {

			var oModel = this.getView().byId("cameraPage").getModel();
			var aPhotos = oModel.getProperty("/photos");

			var index = aPhotos.length - 1;
			var PhotosSelected = aPhotos[index]; //prende la foto selezionata
			//in memoria ha solo l'url

			//var oTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance();
			var time = new Date(jQuery.now()).toLocaleDateString();
			var content = PhotosSelected.src.split(',')[1];

			var blobForURL = this.base64toBlob(content, "image/png");
			var fileURL = URL.createObjectURL(blobForURL);

			this.PhotoNumberAttach++;
			//attributi per l'immagine 
			this.byId("attachments").getModel().getData()["Attachments"].unshift({		//l'id è della pagina in cui sono gli allegati, controllare
				"fileId": jQuery.now().toString(),
				"fileName": this.getView().getModel("i18n").getResourceBundle().getText("photo") + this.PhotoNumberAttach + ".png",
				"fileMimeType": "image/png",
				"fileDimension": "",
				"fileExtension": "png",
				"fileUploadDate": time,
				"fileContent": content,
				"fileThumbnailUrl": "",
				"fileURL": fileURL,
				"attributes": [{
					"title": this.getView().getModel("i18n").getResourceBundle().getText("uploadDate"),
					"text": time,
					"active": false
				}],
				"selected": false
			})
			
			var app = this.byId("idAppControl");
			var page = this.byId("orderCreatePage");
			var oCamera = this.getView().byId("idCamera");
			oCamera.stopCamera();
			app.to(page, "show");

			//this.byId("attachments").getModel().getData().Attachments.push(PhotoObj);
			this.byId("attachments").getModel().refresh();
			//var selectedPhotos = oEvent.getSource().getBindingContext().getObject();
		},
			onBackToApp: function () {
			var app = this.getView().byId("idAppControl");
			var page = this.getView().byId("orderCreatePage");
			var oCamera = this.getView().byId("idCamera");
			oCamera.stopCamera();
			app.to(page, "show");

		},

	});
});
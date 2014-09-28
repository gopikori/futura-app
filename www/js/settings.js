Application.addRoute("/settings", {
   id: "settingsView",
   factory: function(app, viewUi) {
      var buildings = ["T", "U", "V", "W", "X"],
            
            flats = ["001", "002", "003", "004",
                     "101", "102", "103", "104",
                     "201", "202", "203", "204",
                     "301", "302", "303", "304",
                     "401", "402", "403", "404",
                     "501", "502", "503", "504",
                     "601", "602", "603", "604"
            ],
            formBinder;
    
      return {
         actions: [
            {
               type: "action",
               alignment: "left",
               icon: "fa-left-big",
               handler: function() {
                  app.popView();
               }
            }
         ],
         
         initialize: function() {
            // data binder for this form
            formBinder = viewUi.binder();
            
            var buildingExpandable = $("#building").expandable();
            // list of lats
            var buildingList = $("#buildingList").datalist({
               itemClass: "activable",
               data: buildings
            });
            buildingList.on(Events.tap, function(e, uiItem, item) {
               formBinder.update("building", item);
               buildingExpandable.expand(false);
            }); 
            
            // expanding panel
            var flatExpandable = $("#flat").expandable();
            
            // list of flats
            var flatList = $("#flatList").datalist({
               itemClass: "activable",
               data: flats
            });
            flatList.on(Events.tap, function(e, uiItem, item) {
               formBinder.update("flat", item);
               flatExpandable.expand(false);
            });
            
            // name
            var updateName = function() {
               formBinder.update("displayName", this.value);
            };
            $("#displayName").on("input", updateName)
                    .on("change", updateName);
            
            // save button
            $("#btnSave").on(Events.tap, function() {
                //alert(JSON.stringify(formBinder.getModel(), null, " "));
                var bldg = formBinder.getModel().building;
                var flat = formBinder.getModel().flat;
                var name = formBinder.getModel().displayName;

                if (!bldg) {
                    Notification.error("Please select your building");
                    return;
                }
                if (!flat) {
                    Notification.error("Please select your flat");
                    return;
                }
                if (!name || ($.trim(name) === "")) {
                    Notification.error("Please enter your name");
                    return;
                }

                //save to android db 
                var db = window.openDatabase("FuturaAppDB", "0.0.1", "Futura App DB", 1000000);

                db.transaction(updateUserSettings, errorCB, successCB);
               
                function updateUserSettings(tx) {
                    console.log("Updating user settings to:" + bldg+flat+name);
                    var updateSql = 'insert or replace into FUTURAUSER(id, bldg, flat, name) values ((select id from FUTURAUSER where id= 1), ?, ?, ?)'
                    tx.executeSql(updateSql, [bldg, flat, name], updateSuccess, errorCB);
                };

                function updateSuccess(tx, results) {
                    Notification.success("Settings Saved!");
                    app.showView("/");
                };
                
                function errorCB(err) {
                    Notification.error("Error saving settings[1]");
                    console.log("##########Error processing SQL: " + err.code + " " + err.message);
                };

                function successCB() {
                    console.log("Success getting user from db.");
                };       
            });
         },

         activate: function(routeParams, data) {
            // data binder for this form
            formBinder = viewUi.binder();

            initForm();
            function initForm() {
                var db = window.openDatabase("FuturaAppDB", "0.0.1", "Futura App DB", 1000000);
                db.transaction(getUserDetailsFromDB, errorCB, successCB);
                
                function getUserDetailsFromDB(tx) {
                    console.log("Retrieving user settings from db");
                    tx.executeSql('SELECT * FROM FUTURAUSER', [], querySuccess, errorCB);
                };

                function querySuccess(tx, results) {
                    console.log("Returned rows = " + results.rows.length);
                    if (results.rows.length > 0) {
                        console.log("RES=\nbldg=" +results.rows.item(0).bldg + "\nflat=" + results.rows.item(0).flat + "\nname= " + results.rows.item(0).name);
                        formBinder.update("building", results.rows.item(0).bldg);
                        formBinder.update("flat", results.rows.item(0).flat);
                        formBinder.update("displayName", results.rows.item(0).name);
                    }
                };

                function errorCB(err) {
                    console.log("Failed loading user settings");
                    Notification.error("Failed fetching settings[2]");
                };

                function successCB() {
                    console.log("Success loading user settings");
                };
             }
             
         },
         
         deactivate: function() {},
         
         destroy: function() {}
      };
   }
});
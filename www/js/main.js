Application.addRoute("/", {
   id: "mainView",
   factory: function(app, viewUi) {
      
        var types = ["info", "warn", "success", "error"];
      
        var firebaseRef = new Firebase("https://your-firebase-app-name-here.firebaseio.com/");
      
        function fetchDataAndPopulatePage() {
            var rowTemplate = $.template(
                              '<tr data-building="{bldg}">' 
                            + '    <td class="pad-h selected">'
                            + '        <h2 class="no-margin">{bldg}</h2>'
                            + '    </td>'
                            + '    <td id="updateWaterStatus{bldg}" class="{cellColor} pad">'
                            + '        <label class="text-left" data-bind="status-{bldg}">{waterStatus}</label>'
                            + '        <div class="text-left text-xxx-small">Last updated at {timestamp} by {username}</div>'
                            + '    </td>'
                            + '</tr>');
                    
            //Add all the firebase model listeners
            firebaseRef.child("wonderfutura/buildings").on("value", function(snapshot) {
                console.log("Data fetched successfully");
                var rowContainer = $("#bldg-water-status");
                $("tr", rowContainer).remove();
                $.forEach(snapshot.val(), function(val, key) {
                    addRow(rowContainer, key, val);
                });
                //Notification.success("Water status refreshed");
            }, function(error){
                Notification.error("Error. Check your internet connection");
            });

            firebaseRef.child("wonderfutura/global/waterStatus/pmcWaterStatus").on("value", function(snapshot) {
                $("#pmcWaterStatus").removeClass("hidden");
                if(snapshot.val().isAvailable) {
                    $("#pmcWaterStatus").removeClass("water-not-available");
                    $("#pmcWaterStatus").addClass("water-available");
                } else {
                    $("#pmcWaterStatus").addClass("water-not-available");
                    $("#pmcWaterStatus").removeClass("water-available");
                }
                var timestamp = new Date(snapshot.val().lastUpdatedAt).format("h:MM TT dd mmm");
                var username = snapshot.val().lastUpdatedBy;
                $("#pmcWaterStatusTimestamp").html("Last updated at " + timestamp + " by " + username);

                console.log("PMC water status fetched successfully");
            }, function(error){
                Notification.error("Error. Check your internet connection");
            });

            firebaseRef.child("wonderfutura/global/waterStatus/tankerWaterStatus").on("value", function(snapshot) {
                $("#tankerWaterStatus").removeClass("hidden");
                if(snapshot.val().isAvailable) {
                    $("#tankerWaterStatus").removeClass("water-not-available");
                    $("#tankerWaterStatus").addClass("water-available");
                } else {
                    $("#tankerWaterStatus").addClass("water-not-available");
                    $("#tankerWaterStatus").removeClass("water-available");
                }
                var timestamp = new Date(snapshot.val().lastUpdatedAt).format("h:MM TT dd mmm");
                var username = snapshot.val().lastUpdatedBy;
                $("#tankerWaterStatusTimestamp").html("Last updated at " + timestamp + " by " + username);

                console.log("Tanker water status fetched successfully");
            }, function(error){
                Notification.error("Error. Check your internet connection");
            });

            function addRow(rowContainer, key, data) {

                var rowData = {
                    "bldg" : key,
                    "waterStatus" : data.waterStatus.isAvailable? 'Available' :'Not Available',
                    "timestamp" : new Date(data.waterStatus.lastUpdatedAt).format("h:MM TT dd mmm"),
                    "username" : data.waterStatus.lastUpdatedBy,
                    "cellColor" : data.waterStatus.isAvailable? 'water-available' : 'water-not-available'
                }
                rowContainer.append(rowTemplate.process(rowData));
           };

        };

      return {
         actions: [
            {
               type: "title",
               title: "Wonder Futura"
            },
            {
               type: "action",
               alignment: "right",
               icon: "fa-info",
               handler: function() {
                  app.showView("/about");
               }
            },
            {
               type: "action",
               alignment: "right",
               icon: "fa-wrench",
               handler: function() {
                  app.showView("/settings");
               }
            }
         ],
         
         initialize: function() {
            
            initDB();
                        
            fetchDataAndPopulatePage();
            
            $('#bldg-water-status').on(Events.tap, function(event) {
                var t = event.target;
                while (t!=this && !t.hasAttribute('data-building')) {
                    t = t.parentNode;
                }
                var bldg = t.getAttribute('data-building');
                if (bldg) {
                    toggleWaterStatusOfBuilding(bldg);
                } else {
                    Notification.error('Error: Impossible tap!');
                }
            });
            
            $('#pmcWaterStatus').on(Events.tap, function(event) {
                togglePmcWaterStatus();
            });
            
            $('#tankerWaterStatus').on(Events.tap, function(event) {
                toggleTankerWaterStatus();
            });
            
            function toggleWaterStatusOfBuilding(targetBldg) {
                
                //Allow the user to update only if all user details are provided
                
                var db = window.openDatabase("FuturaAppDB", "0.0.1", "Futura App DB", 1000000);
                db.transaction(getUserDetailsFromDB, errorCB, successCB);
                
                function getUserDetailsFromDB(tx) {
                    console.log("Retrieving user settings from db");
                    tx.executeSql('SELECT * FROM FUTURAUSER', [], querySuccess, errorCB);
                };

                function querySuccess(tx, results) {
                    console.log("Returned rows = " + results.rows.length);
                    if (results.rows.length > 0 && results.rows.item(0).bldg && results.rows.item(0).flat && results.rows.item(0).name) {
                        //Update to backend
                        console.log("User settings correct. Updating water status.");
                        updateWaterStatus(targetBldg, results.rows.item(0).bldg, results.rows.item(0).flat, results.rows.item(0).name);
                    } else {
                        alert("Please provide your flat and name to be able to update water status.");
                        app.showView("/settings");
                    }
                };
                
                function errorCB(err) {
                    console.log("Failed loading user settings");
                    Notification.error("Error updating water status[3]");
                };

                function successCB() {
                    console.log("Successfully retrieved user details before toggling water status");
                };
                
                function updateWaterStatus(bldg, ownerBldg, flat, name){
                    var bldgWaterStatusRef = firebaseRef.child("wonderfutura/buildings/" + bldg + "/waterStatus/");
                    var isWaterAvailable = $("#updateWaterStatus" + bldg).hasClass('water-available');
                    var goAhead = confirm("Sure you want to update '" + bldg
                            + "' water status to " + (isWaterAvailable ? "'Not Available'?" : "'Available'?"));
                    if (!goAhead) {
                        return;
                    }
                    var newValues = {
                        "isAvailable": !isWaterAvailable,
                        "lastUpdatedBy": name + " (" + ownerBldg + "-" + flat +")",
                        "lastUpdatedAt": Firebase.ServerValue.TIMESTAMP
                    }
                    bldgWaterStatusRef.update(newValues, function(error) {
                        if (error) {
                            Notification.error("Failed updating water status[4]");
                        } else {
                            console.log("Water status updated to backend");
                            Notification.success("Updated successfully");
                        }
                    });
                };        
            };

            function togglePmcWaterStatus() {
                
                //Allow the user to update only if all user details are provided
                
                var db = window.openDatabase("FuturaAppDB", "0.0.1", "Futura App DB", 1000000);
                db.transaction(getUserDetailsFromDB, errorCB, successCB);
                
                function getUserDetailsFromDB(tx) {
                    console.log("Retrieving user settings from db");
                    tx.executeSql('SELECT * FROM FUTURAUSER', [], querySuccess, errorCB);
                };

                function querySuccess(tx, results) {
                    console.log("Returned rows = " + results.rows.length);
                    if (results.rows.length > 0 && results.rows.item(0).bldg && results.rows.item(0).flat && results.rows.item(0).name) {
                        //Update to backend
                        console.log("User settings correct. Updating pmc water status.");
                        updatePmcWaterStatus(results.rows.item(0).bldg, results.rows.item(0).flat, results.rows.item(0).name);
                    } else {
                        alert("Please provide your flat and name to be able to update water status.");
                        app.showView("/settings");
                    }
                };
                
                function errorCB(err) {
                    console.log("Failed loading user settings");
                    Notification.error("Error updating water status[5]");
                };

                function successCB() {
                    console.log("Successfully retrieved user details before toggling water status");
                };
                
                function updatePmcWaterStatus(ownerBldg, flat, name){
                    var pmcWaterStatusRef = firebaseRef.child("wonderfutura/global/waterStatus/pmcWaterStatus");
                    var isWaterAvailable = $("#pmcWaterStatus").hasClass('water-available');
                    var goAhead = confirm("Sure you want to update PMC "
                            + " water status to " + (isWaterAvailable ? "'Not Available'?" : "'Available'?"));
                    if (!goAhead) {
                        return;
                    }
                    var newValues = {
                        "isAvailable": !isWaterAvailable,
                        "lastUpdatedBy": name + " (" + ownerBldg + "-" + flat +")",
                        "lastUpdatedAt": Firebase.ServerValue.TIMESTAMP
                    }
                    pmcWaterStatusRef.update(newValues, function(error) {
                        if (error) {
                            Notification.error("Failed updating water status[6]");
                        } else {
                            console.log("Water status updated to backend");
                            Notification.success("Updated successfully");
                        }
                    });
                };        
            };

            function toggleTankerWaterStatus() {
                
                //Allow the user to update only if all user details are provided
                
                var db = window.openDatabase("FuturaAppDB", "0.0.1", "Futura App DB", 1000000);
                db.transaction(getUserDetailsFromDB, errorCB, successCB);
                
                function getUserDetailsFromDB(tx) {
                    console.log("Retrieving user settings from db");
                    tx.executeSql('SELECT * FROM FUTURAUSER', [], querySuccess, errorCB);
                };

                function querySuccess(tx, results) {
                    console.log("Returned rows = " + results.rows.length);
                    if (results.rows.length > 0 && results.rows.item(0).bldg && results.rows.item(0).flat && results.rows.item(0).name) {
                        //Update to backend
                        console.log("User settings correct. Updating tanker water status.");
                        updateTankerWaterStatus(results.rows.item(0).bldg, results.rows.item(0).flat, results.rows.item(0).name);
                    } else {
                        alert("Please provide your flat and name to be able to update water status.");
                        app.showView("/settings");
                    }
                };
                
                function errorCB(err) {
                    console.log("Failed loading user settings");
                    Notification.error("Error updating water status[5]");
                };

                function successCB() {
                    console.log("Successfully retrieved user details before toggling water status");
                };
                
                function updateTankerWaterStatus(ownerBldg, flat, name){
                    var tankerWaterStatusRef = firebaseRef.child("wonderfutura/global/waterStatus/tankerWaterStatus");
                    var isWaterAvailable = $("#tankerWaterStatus").hasClass('water-available');
                    var goAhead = confirm("Sure you want to update Tanker "
                            + " water status to " + (isWaterAvailable ? "'Not Available'?" : "'Available'?"));
                    if (!goAhead) {
                        return;
                    }
                    var newValues = {
                        "isAvailable": !isWaterAvailable,
                        "lastUpdatedBy": name + " (" + ownerBldg + "-" + flat +")",
                        "lastUpdatedAt": Firebase.ServerValue.TIMESTAMP
                    }
                    tankerWaterStatusRef.update(newValues, function(error) {
                        if (error) {
                            Notification.error("Failed updating water status[6]");
                        } else {
                            console.log("Water status updated to backend");
                            Notification.success("Updated successfully");
                        }
                    });
                };        
            };             
             
            function initDB() {

                var db = window.openDatabase("FuturaAppDB", "0.0.1", "Futura App DB", 1000000);
                db.transaction(populateDB, errorCB, successCB);
            
                function populateDB(tx) {
                    console.log("Creating db..");
                    tx.executeSql('CREATE TABLE IF NOT EXISTS FUTURAUSER (id unique, bldg, flat, name)', [], dbCreateSuccess, errorCB);
                    tx.executeSql('SELECT * FROM FUTURAUSER', [], querySuccess, errorCB);
                };
                
                function dbCreateSuccess(tx, results) {
                    console.log('Database created/updated successfully');
                };

                function querySuccess(tx, results) {
                    console.log("Returned rows = " + results.rows.length);
                    if (results.rows.length < 1) {
                        tx.executeSql('insert into FUTURAUSER(id, bldg, flat, name) values (1, null, null, null)');
                        //There are no user settings present. Force the user to do settings first
                        app.showView("/settings");
                    }
                };

                function errorCB(err) {
                    console.log("##########Error processing SQL: " + err.code + " " + err.message);
                };

                function successCB() {
                    console.log("Success!");
                };
            };
            $("#btnRefreshWaterStatus").on(Events.tap, function() {
                // Remove all value callbacks
                firebaseRef.off('value');
                fetchDataAndPopulatePage(); //This will re add the callback
                Notification.success("Water status refreshed");
            });
         },
         
         activate: function(routeParams, data) {},
         
         deactivate: function() {},
         
         destroy: function() {}
      };
   }
});
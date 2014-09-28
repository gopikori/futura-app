Application.addRoute("/about", {
   id: "aboutView",
   factory: function(app, viewUi) {

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
         },

         activate: function(routeParams, data) {
         },
         
         deactivate: function() {},
         
         destroy: function() {}
      };
   }
});
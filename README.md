This cross-platform mobile app was developed during draughtlike conditions in Pune that 
triggered water crisis. This app is targetted to help our building admins to view water 
availability status of various buildings and also communicate the same to all residents 
effectively.

The data structure stored on firebase is very simple and constant. Refer the file
server-data-model.txt for exact structure. If you want to modify this app for your 
society, you have to follow this structure

For quick view, refer the screenshots in screenshots folder.


### To run the app in simulator
cordova run android


### Configuration
Make sure to provide the correct url of your firebase app in www/js/main.js in below line

var firebaseRef = new Firebase("https://your-firebase-app-name-here.firebaseio.com/");

### ** Credits **
Thanks to my friend Aniket for his excellent library https://github.com/naikus/mojo that
helped me to build this cross-platform app just in a couple of days

# Angular not working checklist

1. Angular.js (or angular.min.js) downloaded, placed in scripts folder and accessible.
2. Angular-route.js (or angular-route.min.js) downloaded, placed in scripts folder and accessible.

You can test accessibility by opening a browser and loading the file in the URL directly, for example http://localhost:8080/scripts/angular.js

3. Both scripts are listed at the bottom of the HTML page, before the closing `<body>` tag. Angular should be before the routing.
```html
    <script src="/scripts/angular.min.js"></script>
    <script src="/scripts/angular-route.min.js"></script>
    <!-- Other scripts may be here -->
</body>
```

4. Make sure your `body` tag has the `ng-app` attribute and it is set to YOUR apps name. For example if your app is store then it should be `ng-app="store"`
5. Make sure you have a `div` tag in the HTML which has the `ng-view` attribute in it. For example `<div ng-view=""></div>`
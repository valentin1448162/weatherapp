'use strict';


/**
 * Declaration of WeatherApp
 */
var WeatherApp = angular.module('WeatherApp', [
    //Module dependencies
    'ngRoute','ui.bootstrap','ngCookies','cgBusy','pascalprecht.translate',
 ]);


/**
 * Main controller of the app
 */
WeatherApp.controller('MainCtrl', ['$scope','$http' , '$cookieStore', '$translate',
	function ($scope,$http,$cookieStore,$translate) {

	/**
	 * Var initialization
	 */
	$scope.showError 		= false;
	var isShow 				= false;

	var date 				= new Date(); 
	$scope.date 			= date.toLocaleDateString();

	$scope.unityTemp 		= 'C°'; //here to compare if radioModel change 
	$scope.radioModel 		= 'C°'; //C° by default
	
	/**
	 * fonction used to change the language (work with the config below)
	 */
	$scope.changeLanguage = function (key) {
    	$translate.use(key);
    	$cookieStore.put('preferredLanguage',key);
  	};

	/**
	 * Checks if the fields City and Country are filled
	 */
	$scope.searchCity = function(){
		//$scope.showResult(false);
		$scope.showError 	= false;
		if($scope.citySearch && $scope.countrySearch){
			$scope.search = this.citySearch + ',' + this.countrySearch;
			return true;
		}
		return false;

	};

	/**
	 * Checks if the fields Latitude and Longitude are filled
	 */
	$scope.searchCoord = function(){
		$scope.showError 	= false;
		if($scope.latSearch && $scope.lonSearch){
			$scope.search = 'lat=' + this.latSearch + '&lon=' + this.lonSearch;
			return true;
		}
		return false;

	};

	/**
	 * Do the conversion when we click on one of the buttons on the right-top of the page (C or F)
	 */
	$scope.conversion = function(temp){
		if ($scope.unityTemp === temp){
			return;
		}
		if (temp === 'F°'){
			$scope.temp = $scope.temp *1.8 + 32;
			$scope.unityTemp = 'F°';
		}
		else {
			$scope.temp = ($scope.temp - 32)/1.8;
			$scope.unityTemp = 'C°';
		}
		$scope.temp = $scope.temp.toPrecision(3);
	};

	/**
 	* Show the result of the search
 	* If city and country are set in the cookies, call searchJSON
 	* Using 'ngCookies'
 	*/
	$scope.showResult = function(){
		if(isShow){
			return true;
		}
		else if ($cookieStore.get('hasCookies')){
			$scope.citySearch = $cookieStore.get('city');
			$scope.countrySearch = $cookieStore.get('country');
			$scope.searchJSON('city');
			return false;
		}
		else return false;
	};

	/**
 	* Finds the datas on the API according to the city/country or coordonates given
 	*/
	$scope.searchJSON = function(location){
		if($scope.searchCity() && location === 'city'){
			delete $http.defaults.headers.common['X-Requested-With'];
			$scope.httpPromise = $http.get('http://api.openweathermap.org/data/2.5/weather?q=' + this.search)
				.success(function(data, status, headers, config){
					$scope.json = data;

					if($scope.json.cod !=='404'){
						
						$scope.showError = false;
						$scope.parseJson();

						
						$scope.citySearch 		= '';
						$scope.countrySearch 	= '';
					}
					else {
						$scope.showError = true;
					}
			});
		}
		
		if($scope.searchCoord() && location === 'coord'){
			delete $http.defaults.headers.common['X-Requested-With'];
			$http.get('http://api.openweathermap.org/data/2.5/weather?' + this.search)
				.success(function(data, status, headers, config){
					$scope.json = data;
					if($scope.json.cod !=='404'){
						
						$scope.showError = false;
						$scope.parseJson();
						$scope.latSearch = '';
						$scope.lonSearch = '';
					}
					else {
						$scope.showError = true;
					}
			});

		}
	};

	/**
 	* Parse the JSON file found by the method search JSON
 	*/
	$scope.parseJson = function(){

		//Do the conversion between Kelvin and the given temperature unit (Celcius or Farenheit)
		$scope.temp  	= $scope.json.main.temp;

		if(this.unityTemp === 'C°'){
			$scope.temp -= 273,15;
		}
		else if(this.unityTemp === 'F°'){
			$scope.temp = ($scope.temp - 273.15)*1.8 + 32
		}

		$scope.temp = $scope.temp.toPrecision(3);

		//Ajust the datas to the datas found by the API
		$scope.city 	= $scope.json.name;
		$scope.country 	= $scope.json.sys.country;
		$scope.weather  = $scope.json.weather[0].main;		
		$scope.pressure = $scope.json.main.pressure;
		$scope.humidity = $scope.json.main.humidity;
		$scope.img 		= 'style/img/' + $scope.json.weather[0].icon + '.png'; 

		

		isShow = true;
		$scope.showResult();

		$cookieStore.put('city',$scope.city);
		$cookieStore.put('country',$scope.country);

		$cookieStore.put('hasCookies',true)
	};

}]);

/**
 * Config used to manage the routes
 * Using 'ngRoute'
 */
WeatherApp.config(['$routeProvider',
    function($routeProvider) { 
        
        $routeProvider
        .when('/home', {
            templateUrl: 'partials/home.html',
            controller: 'MainCtrl'
        })
        .when('/contact', {
            templateUrl: 'partials/contact.html',
            controller: 'MainCtrl'
        })
        .when('/about', {
            templateUrl: 'partials/about.html',
            controller: 'MainCtrl'
        })
        .otherwise({
            redirectTo: '/home'
        });
    }
]); 


/**
 * Directive used to filter invalid chars
 * Code adapted from http://stackoverflow.com/questions/28879865/javascript-regular-expresion	
 */

WeatherApp.directive('restrict', function($parse) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, iElement, iAttrs, controller) {
            scope.$watch(iAttrs.ngModel, function(value) {
                if (!value) {
                    return;
                }
                $parse(iAttrs.ngModel).assign(scope, value.replace(new RegExp(iAttrs.restrict, 'g'), '').replace(/\s+/g, '-'));
            });
        }
    }
});


/**
 * Config used to change the app language
 * Using 'pascalprecht.translate'
 */

WeatherApp.config(function ($translateProvider) {
  $translateProvider.translations('en', {
  	TITLE 			: 'Weather Forecast',
  	NAV_HOME		: 'Home',
  	NAV_CONTACT		: 'Contact',
  	NAV_ABOUT		: 'About',
  	NAV_LANGUAGE    : 'English',
    SUBTITLE_CITY	: 'Weather by City Name:',
    CITY_SEARCH		: 'City : ',
    COUNTRY_SEARCH	: 'Country (or state) : ',
    SUBTITLE_COORD	: 'Weather by Coordonates:',
    LON 			: 'Longitude : ',
    LAT 			: 'Latitude : ',  
    ERROR_TITLE		: 'CITY NOT FOUND',
    ERROR_MSG		: 'The city you ask can\'t be found.',
    TAB_WEATHER		: 'Weather',
    TAB_PRESSURE	: 'Pressure',
    TAB_TEMP		: 'Temperature',
    TAB_HUMIDITY	: 'Humidity',

    ABOUT_TITLE		:'About',
    ABOUT_TEXT_1	:'This website was made by Valentin DARRICAU, an engineer student in computer science at <a href="http://www.enseirb-matmeca.fr/en">ENSEIRB-MATMECA</a> , Talence, France.',
    ABOUT_TEXT_2	:'It uses <a href="www.angularjs.org">AngularJS</a>, <a href="http://getbootstrap.com">Twitter Bootsrap</a> and the API given by <a href="http://openweathermap.org/API">openweathermap.org</a>.',

	CONTACT_TEXT	: 'If you have any questions or suggestions, please contact me by <a href="mailto:valentin.darricau@laposte.net">e-mail</a>.',
    
    BUTTON_LANG_EN	: 'English',
    BUTTON_LANG_FR	: 'French'
  });
  $translateProvider.translations('fr', {
  	TITLE 			: 'Application Météo',
  	NAV_HOME		: 'Accueil',
  	NAV_CONTACT		: 'Contact',
  	NAV_ABOUT		: 'A propos',
  	NAV_LANGUAGE    : 'Français',
    SUBTITLE_CITY	: 'Météo par nom de ville:',
    CITY_SEARCH		: 'Ville : ',
    COUNTRY_SEARCH	: 'Pays (ou Etat): ',
    SUBTITLE_COORD	: 'Météo par coordonéees : ',
    LON 			: 'Longitude : ',
    LAT 			: 'Latitude : ',  
    ERROR_TITLE		: 'VILLE NON TROUVEE',
    ERROR_MSG		: 'La ville que vous demandez n\'a pas été trouvée',
    TAB_WEATHER		: 'Temps',
    TAB_PRESSURE	: 'Pression',
    TAB_TEMP		: 'Température',
    TAB_HUMIDITY	: 'Humidité',

    ABOUT_TITLE		:'A propos',
    ABOUT_TEXT_1	:'Ce site internet a été fait par Valentin DARRICAU, étudiant-ingénieur en informatique à <a href="http://www.enseirb-matmeca.fr/en">ENSEIRB-MATMECA</a> , Talence, France.',
    ABOUT_TEXT_2	:'Il utilise <a href="www.angularjs.org">AngularJS</a>, <a href="http://getbootstrap.com">Twitter Bootsrap</a> et l\'API donnée par <a href="http://openweathermap.org/API">openweathermap.org</a>.',

    CONTACT_TEXT	: 'Si vous avez une question ou une suggestion, je vous pris de me contacter par <a href="mailto:valentin.darricau@laposte.net">e-mail</a>.',
    BUTTON_LANG_EN	: 'Anglais',
    BUTTON_LANG_FR	: 'Français'
  });

	$translateProvider.preferredLanguage('en');
	
	//Store the last language you choose. Use 'angular-translate-storage-cookie.min.js'
	$translateProvider.useCookieStorage();
});



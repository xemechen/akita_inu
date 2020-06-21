'use strict'
console.log("In the page of index");
var connectionDomain = window.location.host;

var app = angular.module("workingApp", []); 
app.controller("indexCtrl", function($scope) {

	$scope.year = 2018;
	$scope.month = 7;
	$scope.day = 31;
	$scope.budget = 1500;
	$scope.calBtn = false;

	var task = ["做NN", "做ML", "複習PR", "複習NN", "複習ML"]; //做NN 做ML 复习PR 复习NN 复习ML

	$scope.task = "";
	$scope.getJob = function() {
		var a = Math.random();
		var unit = 1/task.length;
		var idx = Math.floor(a/unit);
		$scope.task = task[idx];
	};

	$scope.calculateBudget = function(){
		$scope.calBtn = true;
		var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds

		var nowDate = new Date();
		var nowY = nowDate.getFullYear();
		var nowM = nowDate.getMonth();
		var nowD = nowDate.getDate();
		var y = $scope.year;
		var m = $scope.month - 1;
		var dayLimit = new Date(y, m + 1, 0).getDate();
		if(typeof $scope.day == 'undefined' || !$scope.day || $scope.day < 0 || $scope.day > dayLimit){
			$scope.day = dayLimit;
		}
		var d = $scope.day;

		var b = $scope.budget;
		
		var firstDate = new Date(nowY,nowM,nowD);
		var secondDate = new Date(y, m, d);

		if(secondDate.getTime() <= firstDate.getTime()){
			$scope.dailyBudget = "NA";
		}else{
			var diffDays = Math.ceil(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
			$scope.dailyBudget = Math.floor(b/diffDays);
		}		
	}
});
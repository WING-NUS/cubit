	
//
//Draw Distribution of array
//Bar Chart
//
function draw(container,array){
	
//	google.setOnLoadCallback(
//	function drawChart(event){
		var data = new google.visualization.DataTable();
		data.addColumn('string','Year');
		data.addColumn('number','citation');
		for(var i in array){ //prepare data
			data.addRows([
				[array[i][0]+"",array[i][1]]
			]);
		}
		var showEvery = Math.ceil(array.length/8);

		var options = {   //set options
			title: 'Citation Distribution by year',
			hAxis: {title: 'Year', titleTextStyle: {color: 'red'}},
			bar: {groupWidth: "20%"},
			hAxis: {showTextEvery:showEvery},			
			legend: {position: 'bottom', textStyle: {color: 'black', fontSize: 12}}
		};

		var chart = new google.visualization.ColumnChart(document.getElementById(container));
		chart.draw(data, options);
	
//	}
	//);
}

//
//Draw comparation between array1 and array2
//Line Chart
//
 function drawTrend(container, cit_year, author_cit_trend){
	var data = new google.visualization.DataTable();
	data.addColumn('string','n-st Year');
	data.addColumn('number','Current article');
	data.addColumn('number','Author');
	var k;
	for(var i = 0 ; i < cit_year.length; i++){
		k = i+1;
		data.addRows([
			[k+"",cit_year[i],author_cit_trend[i]]		
		]);
	}
	while(i < author_cit_trend.length){
		k = i+1;
		data.addRows([
			[k+"",null,author_cit_trend[i]]		
		]);
		i++;
	}

	var showEvery = Math.ceil(author_cit_trend.length/15);

	var options = {   //set options
		title: 'Citation Life Circle',
		hAxis: {title: 'n-st Year', titleTextStyle: {color: 'red'}},
		hAxis: {showTextEvery:showEvery},			
		legend: {position: 'bottom', textStyle: {color: 'black', fontSize: 12}}
	};

	var chart = new google.visualization.LineChart(document.getElementById(container));
    chart.draw(data, options);
 }
     
	
//Draw comparation between array1 and array2
//Line Chart
//
 function drawAuthorTrend(container, author_cit_trend, group_cit_trend){
	var data = new google.visualization.DataTable();
	data.addColumn('string','n-st Year');
	data.addColumn('number','Current Author');
	data.addColumn('number','Group');
	var k;
	for(var i = 0 ; i < author_cit_trend.length; i++){
		k = i+1;
		data.addRows([
			[k+"",author_cit_trend[i],group_cit_trend[i]]		
		]);
	}
	while(i < group_cit_trend.length){
		k = i+1;
		data.addRows([
			[k+"",null,group_cit_trend[i]]		
		]);
		i++;
	}

	var showEvery = Math.ceil(group_cit_trend.length/10);

	var options = {   //set options
		title: 'Citation Life Circle',
		hAxis: {title: 'n-st Year', titleTextStyle: {color: 'red'}},
		hAxis: {showTextEvery:showEvery},			
		legend: {position: 'bottom', textStyle: {color: 'black', fontSize: 12}}
	};

	var chart = new google.visualization.LineChart(document.getElementById(container));
    chart.draw(data, options);
 }

   
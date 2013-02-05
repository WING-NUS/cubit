	
//
//Draw Chart
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
		var showEvery = Math.ceil(array.length/10);

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

	 
     
	
   
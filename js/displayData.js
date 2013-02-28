var TOPCITATOR = 5;
google.load("visualization", "1", {packages:["corechart"]}); 


$(document).ready(function(){
	var main_id = getMainID();
	var main_item = getMetaConfig(main_id)

//	var main_item = getMetaConfig(main_id);
	$("#header").html("<h1>" + main_item.name +"</h1>");
//	setTimeout(getParentItem(main_item, main_item),0);
	displayOutline(main_id,main_item.type,"#root_list",0,false,main_item,main_item);

});


function displayOutline(id, type, container, index, needVerify, main_item, parent_item)
{
	var item;
	
	//Generate:
	//		Item
	//		Citation_container
	//		List_container
	var citation_container, list_container, label;
	citation_container = "<div id=citationDiv_"+index+"></div>";
	
	if(type == "group"){
		list_container = "<table id=listTbl_"+index+" class='table'></table>";
		label = "<br/><p class=lead><b>Member List:</b></p>";
		item = getMetaConfig(id);   //Get group_item (without cit_people, cit_trend, cit_year, etc.)
		
	}else if(type == "person"){
		list_container = "<ol id=listTbl_"+index+"></ol>";
		label = "<br/><p class=lead><b>Publication List:</b></p>";		
		item = getPersonItem(id, main_item, needVerify); //Generate person_item
		
	}else{ //Warning info
		document.write("Config_" + id + ": type not correct, should be group or person");
	}
	
	$(citation_container).appendTo($(container));
	$(label).appendTo($(container));
	$(list_container).appendTo($(container));
		
	
	//Generate:
	//	citation-detail button
	var button = "<button id=citationBtn_"+index 
					+" class='btn btn-primary btn-small'"
					+" display=false drawopt=false>"
					+"<i class=icon-chevron-down></i>"
					+" citation-detail</button>";
	$(button).appendTo($("#citationDiv_"+index));
	var citToggleDiv = "<div id=citToggleDiv_"+index+" class=detail-div></div>";
	$(citToggleDiv).appendTo($("#citationDiv_"+index));
	$("#citToggleDiv_"+index).hide();
	
	//Generate:
	//	citationDiv
//	$("#citationBtn_"+index).mousedown(function(){	
//		displayLoadingGif("#citToggleDiv_"+index, index);
//		setInterval(displayLoadingGif("#citToggleDiv_"+index, index),30);
//	});
	
	$("#citationBtn_"+index).click(function(){
	
		displayLoadingGif("#citToggleDiv_"+index, index);
		
		setTimeout(function(){
			parent_item = getParentItem(parent_item, main_item); //Generate parent_item.cit_trend, .cit_year, .cit_people, .totalCit, etc.

			if(type == "group"){
				item = getParentItem(item, main_item);
			}
				
			displayCitationInfo(index,"#citationDiv_"+index,item, parent_item);
		},1);
		
	});
	
	
	//Generate:
	//	Member List or Publication List
	if(type == "group"){
		for(var i = 0; i < item.memberList.length; i++){
			var nextIndex = index +"_"+i;
			var mb = item.memberList[i];
			//Generate item
			var memberTr = "<tr>" 
							+ "<td width='18%'><span class=group_item>" + mb.name +"</span></td>" //first column: name
							+ "<td width='10px'>" //second column: button
							+ "<button class='btn btn-mini' id=itemBtn_"+ nextIndex + " expanded=false display=false>"
							+ "<i class=icon-plus-sign></i></button></td>"
							+ "<td id=thirdTd_"+ nextIndex + "></td>" //third column: expanded sub-level
							+ "</tr>";
			$(memberTr).appendTo($("#listTbl_"+index));	
			var sub_container = "#thirdTd_"+nextIndex;
			$(sub_container).hide();	
			//Bind click
			var mid = mb.id;
			var mtype = mb.type;
			var needVerify = mb.needVerify;
			$("#itemBtn_"+nextIndex).bind(
										'click',
										{item:item, nextIndex:nextIndex, mid:mid, mtype:mtype, sub_container:sub_container, main_item:main_item, needVerify:needVerify},
										clickPlusBtn);				
		}
	}
	else if(type == "person"){

		for(var i = 0; i < item.article_list.length; i++){
			var article_i = index+"_"+i;
			
			var article = item.article_list[i];
			var html_li =  getHtmlArticle(article);
			var article_li = "<li id=li_"+ article_i + ">"+html_li+"</li>";  //generate element li
			$(article_li).appendTo($("#listTbl_"+index));
			
			//<!--generate detail button for each <li>-->
			//<!--Id=detailButton_index_i-->
			$("<span class='btn btn-mini' id=detailBtn_"+ article_i+ ">>>details</span>").appendTo($("#li_"+ article_i));
			
			//<!--generate detail_<div>, append to <li> -->
			$("<div class=detail-div id=detailDiv_"+ article_i + " display=false drawopt=false></div>").appendTo($("#li_"+ article_i));				
				
			//<!--generate detail onclick action-->
			$("#detailDiv_" + article_i).hide();		
			$("#detailBtn_" + article_i).bind(
											'click',
											{article_i:article_i,item:item,article:article},
											clickArticle);

		}
	}
	
}



function clickPlusBtn(event){
	var id = event.data.mid;
	var index = event.data.nextIndex;
	var container = event.data.sub_container;
	var type = event.data.mtype;
	var parent_item = event.data.item;
	var main_item = event.data.main_item;
	var needVerify = event.data.needVerify;
	
	if($("#itemBtn_"+index).attr("display") == "false"){
	
		$("#itemBtn_"+index).html("<i class=icon-minus-sign></i>");
		$("#itemBtn_"+index).attr("display","true");
		$("#thirdTd_" + index).show();
	
		if($("#itemBtn_"+index).attr("expanded") == "false"){
		
			$("#itemBtn_"+index).attr("expanded","true");
			
			displayOutline(id, type, container, index, needVerify, main_item, parent_item);
		}		
	}
	else{
		$("#thirdTd_" + index).hide();
		$("#itemBtn_" + index).html("<i class=icon-plus-sign></i>");
		$("#itemBtn_" + index).attr("display","false");
	}
}



function clickArticle(event){

	
	var article_i = event.data.article_i;
	var item = event.data.item;
	var article = event.data.article;
	
	
	if ($("#detailDiv_"+article_i).attr("display") == "false"){ //if not display
	
		$("#detailDiv_"+article_i).show();
		$("#detailDiv_"+article_i).attr("display","true");
		
		if ($("#detailDiv_"+article_i).attr("drawopt") == "false"){ //if never add chart, then draw, and set drawopt=true;
		
			$("#detailDiv_"+article_i).attr("drawopt","true");			
	
			
			//<!--generate detail-content <div>, append to detail_<div> -->
			var html_detail = "&nbsp;&nbsp;";
			if(article.citeLink.length > 0){
				html_detail += "<a href=\"" + article.citeLink + "\">"
					+"<span class=cite_by>Cited by " + article.numCite + "</span></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
			}
			if(article.relatedLink.length > 0){
				html_detail += "<a href=\"" + article.relatedLink + "\">"
						+"<span class=relate_a>Related Articles</span></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
			}
			if(article.versionLink.length > 0){
				html_detail += "<a href=\"" + article.versionLink + "\">" 
						+"<span class=version_no>All " + article.numVersions + " Versions</span></a>";
			}
			if(article.snippet.length > 0){
				html_detail += "<br/><span class=abstract_title>Abstract: </span>" 
						+"<span class=abstract_content>" +article.snippet +"</span>";
			}									
			if(item.showIdentifier && article.identifier.length > 0){
				html_detail += "<br/><b>G-identifier:</b> <span class=identifier>" +article.identifier +"</span>";
			}
			
			$("<div class=detail-content>"+html_detail+"</div>").appendTo($("#detailDiv_"+article_i));
			
			//If citedBy option is true
			if(item.citedBy){ 
			
				//<!--Generate citer-count <div>, append to detail_<div> -->
				var citer = "<b>Top Citers:</b><ul class=citator-ul>";
				var cit_people = article.cit_people;
				if(cit_people != null){
					if(cit_people.length > TOPCITATOR){
						for(var k =0; k<TOPCITATOR; k++){
							citer += "<li>" + cit_people[k][0]+": "+cit_people[k][1] +"</li>";
						}//for
					}else{
						for(var k =0; k < cit_people.length; k++){
							citer += "<li>" + cit_people[k][0]+": "+cit_people[k][1] +"</li>";
						}//for
					}
					var citator_div = "<div class=citator-div id=citator_div_"+article_i+">" + citer +"</ul></div>";
					$(citator_div).appendTo($("#detailDiv_"+article_i));
				}
				
				$("<div class=clearfix></div>").appendTo($("#detailDiv_" + article_i));
								
				//<!--Generate citation-year-chart <div>, append to detail_<div> -->
				var cit_year = article.cit_year;
				if (cit_year != null && cit_year.length>0){
					$("<div class=chart-div id=chart_div_" + article_i + "></div>").appendTo($("#detailDiv_"+ article_i));
					draw("chart_div_"+ article_i,cit_year);
				}
							
				//<!--Generate citation-trend-chart <div>, append to detail_<div>-->
				var cit_trend = article.cit_trend;
				var author_cit_trend = item.cit_trend;
				if (cit_trend != null && cit_trend.length>0 && author_cit_trend != null && author_cit_trend.length > 0){
					$("<div class=chart-trend-div id=chart_trend_div_" + article_i + "></div>").appendTo($("#detailDiv_" + article_i));
					drawTrend("chart_trend_div_" +article_i,cit_trend,author_cit_trend);
				}
				 
			}
			
			//add div to clear float of chart-div and citer-div
			$("<div class=clearfix></div>").appendTo($("#detailDiv_" + article_i));
		}//end if
				
	}else{
		$("#detailDiv_"+article_i).hide();
		$("#detailDiv_"+article_i).attr("display","false");
	}


}

function getHtmlArticle(article){
	var html_li = "";
	if(article.author.length > 0)
		{
			html_li += "<span class=author>"+article.author +"</span> ";
		}
		if(article.year.length > 0)
		{
			html_li += "(<span class=year>" +article.year + "</span>). ";
		}
		if(article.title.length > 0)
		{
			html_li += "<span class=t_title>" + article.title + "</span>. ";
		}
		if(article.proceeding.length > 0)
		{
			html_li += "In <span class=proceeding>" + article.proceeding + "</span>. ";
		}
		if(article.url.length > 0)
		{
			html_li += "[<a href=\"" + article.url + "\">Copy:&nbsp;";
		}
		if(article.source.length > 0)
		{
			html_li += "<span class=doi>" + article.source + "</span></a> ] ";
		}
		
		return html_li;
}

//
//Generate "citation-detail" div
//
function displayCitationInfo(index,citation_container,item, parent_item){

	//Generate toggle action
	
	if($("#citationBtn_"+index).attr("display")=="false"){
			$("#citToggleDiv_"+index).show();
			$("#citationBtn_"+index).html("<i class=icon-chevron-up></i> citation-detail");
			$("#citationBtn_"+index).attr("display","true");				
	}
	else{
		$("#citToggleDiv_"+index).hide();
		$("#citationBtn_"+index).html("<i class=icon-chevron-down></i> citation-detail");
		$("#citationBtn_"+index).attr("display","false");
	}
		
	if($("#citationBtn_"+index).attr("drawopt") == "false"){
		$("#citToggleDiv_"+index).html("");
		$("#citationBtn_"+index).attr("drawopt","true");
	
		//If no citation
		if(typeof(item.totalCit) == "undefined"){
			item.totalCit = 0;
			var html_detail = "<div><i class=icon-asterisk></i>"
							+"<b>Total Citation No.: 0</b></div>";
			$(html_detail).appendTo($("#citToggleDiv_"+index));
			return;
		}
		
		
		//<!--Citation-Total-->
		var html_detail = "<div><i class=icon-asterisk></i>"
							+"<b>Total Citation No.: "+item.totalCit +"</b></div>";
		$(html_detail).appendTo($("#citToggleDiv_"+index));
		
		
		//<!--Citer No.-->
		var citer = "<div class=citator-div><i class=icon-asterisk></i><b>Top Citers:</b><ul>";
		if(item.cit_people.length != 0){
			if(item.cit_people.length > TOPCITATOR){
				for(var k =0; k<TOPCITATOR; k++){
					citer += "<li>" + item.cit_people[k][0]+": "+item.cit_people[k][1] +"</li>";
				}//for
			}else{
				for(var k =0; k<item.cit_people.length; k++){
					citer += "<li>" + item.cit_people[k][0]+": "+item.cit_people[k][1] +"</li>";
				}//for
			}
			var citer_div = citer+"</ul></div>";
			$(citer_div).appendTo($("#citToggleDiv_"+index));
		}
			
		
		//<!--Citation-Year-Chart-->
		var author_cit_div = "<i class=icon-asterisk></i>"
								+"<b>Citation Distribution by Year:</b>"
								+"<div id=author_cit_div_"+index+" class=chart-div></div>";
		$(author_cit_div).appendTo($("#citToggleDiv_"+index));
		draw("author_cit_div_"+index,item.cit_year);
		
		
		//Add div to clear float of chart-div and citator-div
		$("<div class=clearfix></div>").appendTo($("#citToggleDiv_"+index));
		
		
		//<!--Citation-Trend-Chart-->
		var author_trend_cit_div = "<i class=icon-asterisk></i>"
									+"<b>Citation Life Cycle:</b>"
									+"<div class=chart-trend-div id=author_cit_trend_div_"+index+"></div>";
		$(author_trend_cit_div).appendTo($("#citToggleDiv_"+index));
		drawAuthorTrend("author_cit_trend_div_"+index,item.cit_trend,parent_item.cit_trend);
		
		
		//Add div to clear float of chart-div and citator-div
		$("<div class=clearfix></div>").appendTo($("#citToggleDiv_"+index));	
		
	}//end if drawopt
	
}


function displayLoadingGif(container, index){

	if($("#citationBtn_"+index).attr("drawopt") == "false"){
		$(container).show();
//		var loading_gif = "<div class='progress progress-striped active'>" 
//						+"<div class='bar' style='width: 90%;'></div></div>";
//		var loading_gif = "<img src='img/loading.gif' class='img-rounded'></img>";
		var loading_gif = "<div><p class=text-center><strong><em>Loading......<em></strong></p></div>";
		$(loading_gif).appendTo($(container));				
	}
	
	
  

}
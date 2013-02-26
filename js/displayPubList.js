var TOPCITATOR = 5;
google.load("visualization", "1", {packages:["corechart"]}); 

//var return_result = loadPubList();  //call loadPubList, load article list
//var article_list = return_result.article_list;

var main_result = parseMainXml();

$(document).ready(function(){

	var meta = main_result.meta;
	$("#header").html("<h1>" + meta.name + "</h1>");
	
	
	if(meta.type == "person")
	{	
		$("<ol id=ol_1></ol>").appendTo($("#root_list"));			
		displayPerson(main_result,main_result.list.author,"#header","#ol_1",null,null);
	}
	else if(meta.type == "group")
	{
		$("<table class='table'><tbody id=ul_1></tbody></table>").appendTo($("#root_list"));
		displayGroup(main_result.list,null,"0","#header","#ul_1");
	}
});


function displayGroup(group_result,pa_group_result,pa_index,cit_container,list_container){
	
	var m_list = group_result.member_list.entries(); //Hashtable
	var group_cit = group_result.group;
	var html_li = "";
	
	//<!--Generate member list, bind onclick action-->
	for(var i = 0; i<m_list.length; i++){
		var keys = m_list[m_list.length-1-i][0].split("_"); //type_id_name

		//<!--If the member is a person-->
		if(keys[0] == "person"){
		
			html_li = "<td width=20%><span class=person_item>" + keys[2] + "</span></td> ";
			html_li += "<td width='10px'><button class='btn btn-mini' id=item_"+ pa_index + "_" + i +"><i class=icon-plus-sign></i></button></td>";
			
			$("<tr id=li_"+pa_index+"_"+i + " expanded=false>"+html_li+"</tr>").appendTo($(list_container));  //generate element li		
			
			var person_result = m_list[m_list.length-1-i][1];
			if( typeof(person_result.article_list) == "undefined" || person_result.article_list.length == 0){
				$("#item_"+ pa_index + "_" + i).attr("class","person_item_none");
				continue;
			}
			
			$("<td id=person_div_" + pa_index + "_"+i + " display=false></td>").appendTo($("#li_"+pa_index+"_"+i));
			$("#person_div_" + pa_index + "_"+i).hide();
			$("#item_"+ pa_index + "_" + i).bind('click',{i:i, pa_index:pa_index, person_result:person_result, group_cit:group_cit},clickPerson);
		}

		//<!--If the member is a group-->
		else if(keys[0] == "group"){	
		
			html_li = "<td width=10%><span class=group_item>" + keys[2] + "</span></td>";
			html_li += "<td width='10px'><button class='btn btn-mini' id=item_"+ pa_index + "_" + i +"><i class=icon-plus-sign></i></button></td>";
			
			$("<tr id=li_"+pa_index+"_"+i + " expanded=false>"+html_li+"</tr>").appendTo($(list_container));  //generate element li			
			
			var sub_group_result = m_list[m_list.length-1-i][1];
			
			$("<td id=group_div_"+pa_index+"_"+i + " display=false></td>").appendTo($("#li_"+pa_index+"_"+i));
			$("#group_div_"+pa_index+"_"+i).hide();			
			$("#item_"+ pa_index + "_" + i).bind('click',{i:i,pa_index:pa_index, sub_group_result:sub_group_result,group_result:group_result},clickGroup);
		}
	}
	
	//<!--Generate group citation detail, bind onclick action-->
	if(group_result.citedBy && typeof(group_cit.cit_year)!="undefined" && group_cit.cit_year.length > 0){ //if citedBy option is true
		if(pa_group_result == null){
			genAuthorCit(group_cit,group_cit.cit_trend,cit_container,pa_index,"a"); //"a" to avoid duplicate id
		}else{
			genAuthorCit(group_cit,pa_group_result.group.cit_trend,cit_container,pa_index,"a"); //"a" to avoid duplicate id
		}
		
	}
}


function clickGroup(event){
	var group_result = event.data.sub_group_result;
	var pa_group_result = event.data.group_result;
	var pa_index = event.data.pa_index;
	var i = event.data.i;
	
	if($("#group_div_"+pa_index+"_"+i).attr("display") == "false"){
	
		$("#group_div_"+pa_index+"_"+i).show();
		$("#item_"+ pa_index + "_" + i).html("<i class=icon-minus-sign></i>");
		$("#group_div_"+pa_index+"_"+i).attr("display","true");
		
		if($("#li_"+pa_index+"_"+i).attr("expanded") == "false"){
		
			nextPa_index = pa_index + "_" + i;
			$("#li_"+pa_index+"_"+i).attr("expanded","true");
			
			$("<div id=groupDiv_"+pa_index+"_"+i+"></div>").appendTo($("#group_div_"+pa_index+"_"+i));
			$("<br/><p class=lead><b>Member List:</b></p>").appendTo($("#group_div_"+pa_index+"_"+i));
			$("<table id=memberDiv_"+pa_index+"_"+i+" class='table'></table>").appendTo($("#group_div_"+pa_index+"_"+i));
			
			displayGroup(group_result,pa_group_result,nextPa_index,"#groupDiv_"+pa_index+"_"+i,"#memberDiv_"+pa_index+"_"+i);
		}
		
	}
	else{
		$("#group_div_"+pa_index+"_"+i).hide();
		$("#item_"+ pa_index + "_" + i).html("<i class=icon-plus-sign></i>");
		$("#group_div_"+pa_index+"_"+i).attr("display","false");
	}
}


function clickPerson(event){
	
	var group_cit = event.data.group_cit;
	var person_result = event.data.person_result;
	var pa_index = event.data.pa_index;
	var i = event.data.i;
	
	if($("#person_div_" + pa_index + "_"+i).attr("display") == "false"){
	
		$("#person_div_" + pa_index + "_"+i).attr("display","true");
		$("#person_div_" + pa_index + "_"+i).show();
		$("#item_"+ pa_index + "_" + i).html("<i class=icon-minus-sign></i>");
		
		if($("#li_"+pa_index+"_"+i).attr("expanded") == "false"){
			$("#li_"+pa_index+"_"+i).attr("expanded","true");
			
			$("<div id=authorDiv_" + pa_index + "_" + i + "></div>").appendTo($("#person_div_" + pa_index + "_"+i));
			$("<br/><p><strong>Publication List:</strong></p>").appendTo($("#person_div_" + pa_index + "_"+i));
			$("<ol id=articleDiv_" + pa_index + "_" + i  + "></ol>").appendTo($("#person_div_" + pa_index + "_"+i));	
			displayPerson(person_result,
							group_cit,
							"#authorDiv_" + pa_index+"_"+i,
							"#articleDiv_" + pa_index+"_"+i,
							pa_index,
							i);
		}
		
	}
	else{
		$("#person_div_" + pa_index + "_"+i).hide();
		$("#item_"+ pa_index + "_" + i).html("<i class=icon-plus-sign></i>");
		$("#person_div_" + pa_index + "_"+i).attr("display","false");
	}
	
	
	
}



function displayPerson(person_result,group_cit,cit_container,list_container,pa_index,m_index){

	var article_list, author_cit, meta;
	
	if(pa_index == null){ //if personal homepage
		article_list = person_result.list.article_list;
		author_cit = person_result.list.author;
		meta = person_result.meta;


	}else{ //if group homepage
		article_list = person_result.article_list;
		author_cit = person_result.author;
		meta = new Object;
		meta.citedBy = person_result.citedBy
		meta.showIdentifier = person_result.showIdentifier
		meta.fixGSError = person_result.fixGSError;		
	}
	var group_cit_trend = group_cit.cit_trend;


	for(var index=0; index < article_list.length; index++){		
		
		var article = article_list[index];
		
		//<!--generate <li> for each article-->
		//<!--Id=li_pa_index_mIndex_pIndex-->
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
		$("<li id=li_"+pa_index+"_"+m_index+"_"+index + ">"+html_li+"</li>").appendTo($(list_container));  //generate element li
		
		//<!--generate detail button for each <li>-->
		//<!--Id=detailButton_pa_index_mIndex_pIndex-->
		$("<span class='btn btn-mini' id=detailButton_"+pa_index+"_"+m_index+"_"+index+ ">>>details</span>").appendTo($("#li_"+pa_index+"_"+m_index+"_"+index));
		
		//<!--generate detail_<div>, append to <li> -->
		$("<div class=detail-div id=detailDiv_"+pa_index+"_"+m_index+"_" + index + " display=false drawopt=false></div>").appendTo($("#li_"+pa_index+"_"+m_index+"_"+index));				
			
		//<!--generate detail onclick action-->
		$("#detailDiv_"+pa_index+"_"+m_index+"_" + index).hide();		
		$("#detailButton_"+pa_index+"_"+m_index+"_"+index).bind('click',{index:index,pa_index:pa_index,m_index:m_index,person_result:person_result},clicktoggle);
	
	} //for

	if(meta.citedBy && typeof(author_cit.cit_year)!="undefined" && author_cit.cit_year.length > 0){ //if citedBy option is true
		genAuthorCit(author_cit,group_cit_trend,cit_container,pa_index,m_index);
	}
}

//
//onClick of details-button: 
//		Display detail content
//		Draw cit_year chart
//		Insert citors

//		Draw cit_trend comparation chart
//
//
function clicktoggle(event){

	var i = event.data.index;
	var pa_index = event.data.pa_index;
	var m_index = event.data.m_index;
	var person_result = event.data.person_result;
	var article_list, meta;
	var author_cit_trend;
	if(pa_index == null){ //if personal homepage
		article_list = person_result.list.article_list;
		meta = person_result.meta;
		author_cit_trend = person_result.list.author.cit_trend;
	}else{
		article_list = person_result.article_list;
		meta = new Object;
		meta.citedBy = person_result.citedBy
		meta.showIdentifier = person_result.showIdentifier
		meta.fixGSError = person_result.fixGSError;		
		author_cit_trend = person_result.author.cit_trend;
	}
	
	
	if ($("#detailDiv_"+pa_index+"_"+m_index+"_" + i).attr("display") == "false"){ //if not display
	
		$("#detailDiv_"+pa_index+"_"+m_index+"_" + i).show();
		$("#detailDiv_"+pa_index+"_"+m_index+"_" + i).attr("display","true");
		
		if ($("#detailDiv_"+pa_index+"_"+m_index+"_" + i).attr("drawopt") == "false"){ //if never add chart, then draw, and set drawopt=true;
			$("#detailDiv_"+pa_index+"_"+m_index+"_" + i).attr("drawopt","true");			
			
			var article = article_list[i];
			
			//<!--generate detail-content <div>, append to detail_<div> -->
			var html_detail = "&nbsp;&nbsp;&nbsp;";
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
			if((meta.showIdentifier == "yes" || meta.showIdentifier == "y") && article.identifier.length > 0){
				html_detail += "<br/><b>G-identifier:</b> <span class=identifier>" +article.identifier +"</span>";
			}
			
			$("<div class=detail-content>"+html_detail+"</div>").appendTo($("#detailDiv_"+pa_index+"_"+m_index+"_" + i));
			
			//If citedBy option is true
			if(meta.citedBy){ 
			
				//<!--Generate citer-count <div>, append to detail_<div> -->
				var citator = "<b>Top Citers:</b><ul class=citator-ul>";
				var cit_people = article.cit_people;
				if(cit_people != null){
					if(cit_people.length > TOPCITATOR){
						for(var k =0; k<TOPCITATOR; k++){
							citator += "<li>" + cit_people[k][0]+": "+cit_people[k][1] +"</li>";
						}//for
					}else{
						for(var k =0; k < cit_people.length; k++){
							citator += "<li>" + cit_people[k][0]+": "+cit_people[k][1] +"</li>";
						}//for
					}
					$("<div class=citator-div id=citator_div_"+pa_index+"_"+m_index+"_" + i+">" + citator +"</ul></div>").appendTo($("#detailDiv_"+pa_index+"_"+m_index+"_" + i));
				}
				
				$("<div class=clearfix></div>").appendTo($("#detailDiv_"+pa_index+"_"+m_index+"_" + i));
								
				//<!--Generate citation-year-chart <div>, append to detail_<div> -->
				var cit_year = article.cit_year;
				if (cit_year != null && cit_year.length>0){
					$("<div class=chart-div id=chart_div_"+pa_index+"_"+m_index+"_" + i + "></div>").appendTo($("#detailDiv_"+pa_index+"_"+m_index+"_" + i));
					draw("chart_div_"+pa_index+"_"+m_index+"_" + i,cit_year);
				}
							
				//<!--Generate citation-trend-chart <div>, append to detail_<div>-->
				var cit_trend = article.cit_trend;
				if (cit_trend != null && cit_trend.length>0 && author_cit_trend != null && author_cit_trend.length > 0){
					$("<div class=chart-trend-div id=chart_trend_div_"+pa_index+"_"+m_index+"_" + i + "></div>").appendTo($("#detailDiv_"+pa_index+"_"+m_index+"_" + i));
					drawTrend("chart_trend_div_"+pa_index+"_"+m_index+"_" + i,cit_trend,author_cit_trend);
				}
				 
			}
			
			//add div to clear float of chart-div and citator-div
			$("<div class=clearfix></div>").appendTo($("#detailDiv_"+pa_index+"_"+m_index+"_" + i));
		}//end if
				
	}else{
		$("#detailDiv_"+pa_index+"_"+m_index+"_" + i).hide();
		$("#detailDiv_"+pa_index+"_"+m_index+"_" + i).attr("display","false");
	}
	
}

function genAuthorCit(author_cit,group_cit_trend, cit_container,pa_index,index){
	
	//Button & Click Action
	$("<button id=author_cit_"+pa_index+"_"+index+" class='btn btn-primary btn-small' display=false drawopt=false><i class=icon-chevron-down></i> citation-detail</button>").appendTo($(cit_container));
	$("<div id=author_div_"+pa_index+"_"+index+" class=detail-div ></div>").appendTo($(cit_container));
	$("#author_div_"+pa_index+"_"+index).hide();
	
	$("#author_cit_"+pa_index+"_"+index).click(function(){
	
		if($("#author_cit_"+pa_index+"_"+index).attr("display")=="false"){
			$("#author_div_"+pa_index+"_"+index).show();
			$("#author_cit_"+pa_index+"_"+index).html("<i class=icon-chevron-up></i> citation-detail");
			$("#author_cit_"+pa_index+"_"+index).attr("display","true");				
		}
		else{
			$("#author_div_"+pa_index+"_"+index).hide();
			$("#author_cit_"+pa_index+"_"+index).html("<i class=icon-chevron-down></i> citation-detail");
			$("#author_cit_"+pa_index+"_"+index).attr("display","false");
		}
		
		if($("#author_cit_"+pa_index+"_"+index).attr("drawopt") == "false"){
		
			$("#author_cit_"+pa_index+"_"+index).attr("drawopt","true");
		
			//<!--Citation-Total-->
			var html_detail = "<i class=icon-asterisk></i><b>Total Citation No.: "+author_cit.totalCit +"</b>";
			$("<div>"+html_detail+"</div>").appendTo($("#author_div_"+pa_index+"_"+index));
			
			//<!--Citer No.-->
			var citator = "<div class=citator-div><i class=icon-asterisk></i><b>Top Citers:</b><ul>";
			if(author_cit.cit_people.length != 0){
				if(author_cit.cit_people.length > TOPCITATOR){
					for(var k =0; k<TOPCITATOR; k++){
						citator += "<li>" + author_cit.cit_people[k][0]+": "+author_cit.cit_people[k][1] +"</li>";
					}//for
				}else{
					for(var k =0; k<author_cit.cit_people.length; k++){
						citator += "<li>" + author_cit.cit_people[k][0]+": "+author_cit.cit_people[k][1] +"</li>";
					}//for
				}
			}
			var citer_div = citator+"</ul></div>";
			$(citer_div).appendTo($("#author_div_"+pa_index+"_"+index));
			
			//<!--Citation-Year-Chart-->
			var author_cit_div = "<i class=icon-asterisk></i><b>Citation Distribution by Year:</b><div id=author_cit_div_"+pa_index+"_"+index+" class=chart-div></div>";
			$(author_cit_div).appendTo($("#author_div_"+pa_index+"_"+index));
			draw("author_cit_div_"+pa_index+"_"+index,author_cit.cit_year);
			
			
			//Add div to clear float of chart-div and citator-div
			$("<div class=clearfix></div>").appendTo($("#author_div_"+pa_index+"_"+index));
			
			//<!--Citation-Trend-Chart-->
			var author_trend_cit_div = "<i class=icon-asterisk></i><b>Citation Life Cycle:</b><div class=chart-trend-div id=author_cit_trend_div_"+pa_index+"_"+index+"></div>";
			$(author_trend_cit_div).appendTo($("#author_div_"+pa_index+"_"+index));
			drawAuthorTrend("author_cit_trend_div_"+pa_index+"_"+index,author_cit.cit_trend,group_cit_trend);
			//Add div to clear float of chart-div and citator-div
			$("<div class=clearfix></div>").appendTo($("#author_div_"+pa_index+"_"+index));	
			
		}//end if drawopt
		

	
	});
	
	
}


/*
//
//onClick of Citation detail button: display the citation distribution of the author, display the top citers
//
function genAuthorCit(author_cit,group_cit_trend, cit_container,pa_index,index){
	//<!--citation-button-->
	$("<button id=author_cit_"+pa_index+"_"+index+" class='btn btn-primary btn-small'>citation-detail</button>").appendTo($(cit_container));
	$("<div id=author_div_"+pa_index+"_"+index+"><div>").appendTo($(cit_container));
	$("#author_div_"+pa_index+"_"+index).hide();
	
	$("#author_cit_"+pa_index+"_"+index).click(function(){
		$("#author_div_"+pa_index+"_"+index).toggle();
	});
	//<!--citation-total-->
	$("<div class=row><div id=author_cit_total_"+pa_index+"_"+index+" class=span8></div></div>").appendTo($("#author_div_"+pa_index+"_"+index));
	$("#author_cit_total_"+pa_index+"_"+index).html("<b>Total citation: "+author_cit.totalCit +"</b>");
	
	//<!--citation-year-chart-->
	
	var author_cit_vid = "<div id=author_cit_div_"+pa_index+"_"+index+" class=span7></div>";
	
	//<!--citer no.-->
	var citator = "<ul>";
	if(author_cit.cit_people.length != 0){
		if(author_cit.cit_people.length > TOPCITATOR){
			for(var k =0; k<TOPCITATOR; k++){
				citator += "<li>" + author_cit.cit_people[k][0]+": "+author_cit.cit_people[k][1] +"</li>";
			}//for
		}else{
			for(var k =0; k<author_cit.cit_people.length; k++){
				citator += "<li>" + author_cit.cit_people[k][0]+": "+author_cit.cit_people[k][1] +"</li>";
			}//for
		}
	}
	var citer_div = "<div class=span3><b>Top Citers:</b><br\>"+citator+"</div>";

	$("<div class=row>"+author_cit_vid+citer_div+"</div>").appendTo($("#author_div_"+pa_index+"_"+index));
	draw("author_cit_div_"+pa_index+"_"+index,author_cit.cit_year);

	//<!--citation-trend-chart-->
	$("<div class=row><div id=author_cit_trend_div_"+pa_index+"_"+index+" class=span7></div></div>").appendTo($("#author_div_"+pa_index+"_"+index));
	drawAuthorTrend("author_cit_trend_div_"+pa_index+"_"+index,author_cit.cit_trend,group_cit_trend);
	
}
*/
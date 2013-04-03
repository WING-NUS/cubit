var cur_year = 2012;


var authorTable = new Hashtable(); //<id,item>
var mainTable = new Hashtable();


function getMainID(){

	var xmlhttp = createXMLHTTPRequest();
	xmlhttp.open("GET","data/config/main_id.config",false);
	xmlhttp.send();
	
	if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
	{
		var id = xmlhttp.responseText;
		return id;
	}

	
}


//
//Fill parent_item
//
//INPUT:
//	parent_item (already with:)
//			.id
//			.name
//			.type
//			.updateFreq
//			.citeBy (boolean)
//			.showIdentifier  (boolean)
//			.fixGSError : (boolean)
//			.memberList: Array() --> member: Object
//
//RETURN:
//	fill parent_item with:
//			.cit_year
//			.cit_people
//			.cit_trend
//			.totalCit
//			.exSelf_cit_year
//			.exSelf_cit_people
//			.exSelf_cit_trend
//			.exSelf_totalCit
//
function getParentItem(parent_item, main_item){

	//Check whether parent_item already exist in authorTable
	var item = authorTable.get(parent_item.id);
	if(item != null){
		return item;
	}
	
	//If parent_item not exist
	
	var group_cit_year = new Hashtable();
	var group_cit_people = new Hashtable();
	var group_cit_trend = new Array(); //citation trend of group
	var group_cit_trend_count = new Array();
	var group_total = [0];
	
	//For exSelf
	
	var exSelf_group_cit_year = new Hashtable();
	var exSelf_group_cit_people = new Hashtable();
	var exSelf_group_cit_trend = new Array(); //citation trend of group
	var exSelf_group_cit_trend_count = new Array();
	var exSelf_group_total = [0];
	
	//Loop for each memeber to aggregate
	for(var i = 0; i<parent_item.memberList.length; i++){
	
		var mem = parent_item.memberList[i];
		
		if(mem.type == "group")
		{
			var memberItem = authorTable.get(mem.id);  //Check whether already exist
			if(memberItem == null){
				memberItem = getMetaConfig(mem.id); //Get item data from Config.xml
				memberItem = getParentItem(memberItem, main_item);
			}

			aggregateCiation(
							group_cit_year, 
							group_cit_people, 
							memberItem.cit_year, 
							memberItem.cit_people);
			aggregateCitTrend(
								group_cit_trend,
								group_cit_trend_count,
								memberItem.group_cit_trend, 
								memberItem.group_cit_trend_count);
			if(typeof(memberItem.totalCit) != "undefined"){
				group_total[0] += memberItem.totalCit;
			}
								
			//For exSelf
			aggregateCiation(
							exSelf_group_cit_year, 
							exSelf_group_cit_people, 
							memberItem.exSelf_cit_year, 
							memberItem.exSelf_cit_people);
			aggregateCitTrend(
								exSelf_group_cit_trend,
								exSelf_group_cit_trend_count,
								memberItem.exSelf_group_cit_trend, 
								memberItem.exSelf_group_cit_trend_count);

			if(typeof(memberItem.exSelf_totalCit) != "undefined"){
				exSelf_group_total[0] += memberItem.exSelf_totalCit;
			}
			
			
			authorTable.put(mem.id, memberItem);
		}
		else if(mem.type == "person")
		{
			var personItem = authorTable.get(mem.id);  //Check whether already exist
			if(personItem == null){
				personItem = getPersonItem(mem.id, main_item, mem.needVerify);	
			}
		
			aggregateCiation(
							group_cit_year, 
							group_cit_people, 
							personItem.cit_year,
							personItem.cit_people);
			aggregateCitTrend(
								group_cit_trend,
								group_cit_trend_count,
								personItem.cit_trend,
								null);
			if(typeof(personItem.totalCit) != "undefined"){
				group_total[0] += personItem.totalCit;
			}
			
			//For exSelf
			aggregateCiation(
							exSelf_group_cit_year, 
							exSelf_group_cit_people, 
							personItem.exSelf_cit_year,
							personItem.exSelf_cit_people);
			aggregateCitTrend(
								exSelf_group_cit_trend,
								exSelf_group_cit_trend_count,
								personItem.exSelf_cit_trend,
								null);
			if(typeof(personItem.exSelf_totalCit) != "undefined"){
				exSelf_group_total[0] += personItem.exSelf_totalCit;
			}
			
			authorTable.put(mem.id, personItem);
			
		}
	}//Loop for group member end
	
	
	//Fill parent_item with:
	//		.cit_year
	//		.cit_people
	//		.totalCit
	var item_ = getAuthorCitation(
						group_cit_year,
						group_cit_people,
						group_total[0]);
	parent_item.cit_year = item_.cit_year;
	parent_item.cit_people = item_.cit_people;
	parent_item.totalCit = item_.totalCit;
	
	//Fill parent_item with:
	//		.exSelf_cit_year
	//		.exSelf_cit_people
	//		.exSelf_totalCit
	
	var exSelf_item_ = getAuthorCitation(
						exSelf_group_cit_year,
						exSelf_group_cit_people,
						exSelf_group_total[0]);
	parent_item.exSelf_cit_year = exSelf_item_.cit_year;
	parent_item.exSelf_cit_people = exSelf_item_.cit_people;
	parent_item.exSelf_totalCit = exSelf_item_.totalCit;
	
	//Add group_result
	parent_item.group_cit_trend = group_cit_trend;
	parent_item.group_cit_trend_count = group_cit_trend_count;
	
	parent_item.exSelf_group_cit_trend = exSelf_group_cit_trend;
	parent_item.exSelf_group_cit_trend_count = exSelf_group_cit_trend_count;
	
	//Fill parent_item with:
	//		.cit_trend
	var cit_trend = new Array();
	for(var i = 0; i<group_cit_trend.length; i++){
		cit_trend[i] = group_cit_trend[i] / group_cit_trend_count[i];
	}
	parent_item.cit_trend = cit_trend;
	
	//Fill parent_item with:
	//		.exSelf_cit_trend
	var exSelf_cit_trend = new Array();
	for(var i = 0; i<exSelf_group_cit_trend.length; i++){
		exSelf_cit_trend[i] = exSelf_group_cit_trend[i] / exSelf_group_cit_trend_count[i];
	}
	parent_item.exSelf_cit_trend = exSelf_cit_trend;

	//Add into authorTable
	authorTable.put(parent_item.id, parent_item);
	
	return parent_item;
	
}



//
//Aggregate person's citation into Group's citation
//
//Input:
//	group_cit_year: Hashtable
//	group_cit_people: Hashtable
//	person_cit_year: person's year_citation array 
//	person_cit_people: person's people_citaion array
//
//Return:
//	Fill or Set group_cit_year & group_cit_people
//
function aggregateCiation(group_cit_year, group_cit_people, person_cit_year,person_cit_people){
	
	//Aggregate group year citation info
	if( typeof(person_cit_year) != "undefined" && person_cit_year != null) {
		for(var k = 0; k < person_cit_year.length; k++){				
			var year = person_cit_year[k][0];
			var count = person_cit_people[k][1];
			var yy_count = group_cit_year.get(year);
			if(yy_count != null){
				yy_count += count;
				group_cit_year.put(year,yy_count);
			}else{
				group_cit_year.put(year,count);
			}				
			
		}
	}			
	//Aggregate group people citation info
	if( typeof(person_cit_people) != "undefined" && person_cit_people != null) {
		for(var j = 0; j < person_cit_people.length; j++){
			var citor = person_cit_people[j][0];
			var count = person_cit_people[j][1];
			var pp_count = group_cit_people.get(citor);
			if(pp_count != null){
				pp_count += count;
				group_cit_people.put(citor, pp_count);
			}else{
				group_cit_people.put(citor,count);
			}
		}	
	}	
}


//
//Aggregate all members' citation_trend into a group's citation_trend
//INPUT:
//		group_cit_trend: Array (sum of cit_trend of all authors within group)
//		cit_trend_count: Array (sum of cit_trend_count of all authors within group)
//		person_cit_trend: Array (one person's cit_trend)
//		person_cit_trend_count: Null or Array (if one author: null; if one subGroup: Array)
//
//RETURN:
//		add into group_cit_trend and cit_trend_count
//

function aggregateCitTrend(group_cit_trend, cit_trend_count, person_cit_trend, person_cit_trend_count){
			
	for(var i  = 0; i < person_cit_trend.length; i++){

		if(typeof(group_cit_trend[i]) == "undefined"){
			group_cit_trend[i] = person_cit_trend[i];

			if(person_cit_trend_count == null){ //one author
				cit_trend_count[i] = 1;
			}else{ //one group
				cit_trend_count[i] = person_cit_trend_count[i];
			}
			
		}
		else{
			group_cit_trend[i] += person_cit_trend[i];

			if(person_cit_trend_count == null){
				cit_trend_count[i]++;
			}else{
				cit_trend_count[i] += person_cit_trend_count[i];
			}
			
		}
	}

}




//
//Get Person Item from pub_id.xml
//
//	INPUT:
//		person_id
//		main_id
//		needVerify: (boolean)
//	RETURN:
//		person_item: Object
//				.cit_year: Array (citaion no. per year)
//				.cit_people: Array (citaion no. per citor)
//				.cit_trend: Arra (average citation no. per relative year)
//				.totalCit: Int
//				.exSelf_cit_year
//				.exSelf_cit_people
//				.exSelf_cit_trend
//				.exSelf_totalCit
//				.article_list: Array (ariticle: object)
//				.citedBy
//				.showIdentifier
//				.fixGSError
//		
//
function getPersonItem(person_id, name, main_item, needVerify){
	
	//Check whether person_item already exist in authorTable
	var item = authorTable.get(person_id);
	if( item != null){		
		return item;
	}
	
	//If person_item not exist
	var person_item = new Object();  //
	person_item.id = person_id;
	
	//Get meta config
	if(!needVerify) //Read main config
	{
		person_item.updateFreq = main_item.updateFreq;  //Get meta data from main_item
		person_item.citedBy = main_item.citedBy;
		person_item.showIdentifier = main_item.showIdentifier;
		person_item.fixGSError = main_item.fixGSError;
		person_item.orderBy = main_item.orderBy;
		person_item.name = name;
	}
	else   //Read person verified config
	{
		var p_meta = getMetaConfig(person_id); //Get meta data from Config.xml
		person_item.updateFreq = p_meta.updateFreq;  //Get meta data from main_item
		person_item.citedBy = p_meta.citedBy;
		person_item.showIdentifier = p_meta.showIdentifier;
		person_item.fixGSError = p_meta.fixGSError;
		person_item.excludeList = p_meta.excludeList;
		person_item.orderBy = p_meta.orderBy;
		person_item.name = p_meta.name;
	}
	

	//Update publication list
	var need_update_flag = compareTime(person_item.updateFreq);
	if(need_update_flag) //if true, need update
	{ 
		exc_gsnap();
	}
	
	
	//Get publication list

	var query_result, result;
	var article_list = new Array();  //article list
	
	
	var xmlhttp_p = createXMLHTTPRequest();
	var url_pub = "data/publication/pub_" + person_id + ".xml?number=" + Math.random();
	xmlhttp_p.open("GET",url_pub,false);
	xmlhttp_p.send();
//	xmlhttp_p.onreadystatechange = function(){
	if(xmlhttp_p.readyState == 4)
		{
			if(xmlhttp_p.status == 200) //if file exist
			{ 	
				var hash_author_year = new Hashtable();
				var hash_author_people = new Hashtable();
				var author_total = [0];
				
				//For exSelf
				var exSelf_hash_author_year = new Hashtable();
				var exSelf_hash_author_people = new Hashtable();
				var exSelf_author_total = [0];
				
				//Parse publication XML
				query_result = xmlhttp_p.responseXML.documentElement.getElementsByTagName("query")[0];
				
				var i = 0; 
				while(query_result != null) //loop for the articles in pub_id.xml
				{
					var query_str = query_result.attributes.content.nodeValue;
					 //if query author name, get all the results
					if(query_str.indexOf("author") == 0)
					{
						result = query_result.getElementsByTagName("result")[0];		
					
						while(result != null)
						{	
							var article = parsePubXML(
													result,
													hash_author_year,
													hash_author_people,
													person_item,
													author_total,
													exSelf_hash_author_year,
													exSelf_hash_author_people,
													exSelf_author_total);
							if(article != null){ //not in the exclude list
								article_list[i] = article;  //add into article list		
								i++;							
							}
							result = result.nextElementSibling;
													
						}
					}
					 //if query title, get first result
					else if(query_str.indexOf("allintitle") == 0)
					{
						result = query_result.getElementsByTagName("result")[0];
						var article = parsePubXML(
													result,
													hash_author_year,
													hash_author_people,
													person_item,
													author_total,
													exSelf_hash_author_year,
													exSelf_hash_author_people,
													exSelf_author_total);
													
						if(article != null){ //not in the exclude list
							article_list[i] = article;  //add into article list
							i++;
						}
						
					}
					
					query_result = query_result.nextElementSibling; //get next <query...>

				} //processed all articles
				
				//Aggregate citation info for the author

				var item_ = getAuthorCitation(
										hash_author_year,
										hash_author_people,
										author_total[0]
										);
				person_item.cit_year = item_.cit_year;
				person_item.cit_people = item_.cit_people;
				person_item.totalCit = item_.totalCit;
				
				//Aggregate exSelf citation
				var exSelf_item_ = getAuthorCitation(
										exSelf_hash_author_year,
										exSelf_hash_author_people,
										exSelf_author_total[0]
										);
				person_item.exSelf_cit_year = exSelf_item_.cit_year;
				person_item.exSelf_cit_people = exSelf_item_.cit_people;
				person_item.exSelf_totalCit = exSelf_item_.totalCit;
				
				//Average ciation trend for the author
				person_item.cit_trend = getAuthorTrend(article_list,cur_year);
				person_item.exSelf_cit_trend = getAuthorExSelfTrend(article_list,cur_year)
				
				//Order by year or citation
				if(person_item.orderBy == "cite"){
					person_item.article_list = article_list.sort(function(a,b){return b.numCite-a.numCite});
				}else{
					person_item.article_list = article_list.sort(function(a,b){return b.year-a.year});
				}
				
				
				//Add into AuthorTable, Return person_item
				authorTable.put(person_id, person_item);
				return person_item;
				
			}//200 end
			else if (xmlhttp_p.status == 404) //if not exist
			{ 
				if(exc_gsnap())
					return getPersonItem(person_id, main_item, needVerify);						
			}//404 end
		}//readyState == 4 end
	
//	}
	
	

	
}




//
//Parse article from <result id=*></result>
//
//	Input:
//		xx: (result element)
//		_hash_author_year: (add ariticle's citation into author's citation)
//		_hash_author_people: (same as above)
//		person_item: (person's meta data)
//		author_total
//		_exSelf_hash_author_year
//		_exSelf_hash_author_people
//		exSelf_author_total
//
//
//	Return:
//		article: Object
//			article.url
//			article.title
//			article.pdf
//			article.author
//			article.proceeding
//			article.year
//			article.source
//			article.snippet
//			article.relatedLink
//			article.htmlLink
//			article.numVersions
//			article.identifier
//			article.numCite
//			article.exSelf_totalCit  (exclude self citation)
//			article.citeLink
//			article.cit_trend; Array (ith value means the citation no. in the ith published year)
//			article.cit_year : Array (citaion no. per year)
//			article.cit_people: Array (citation no. per citor)
//			article.exSelf_cit_trend
////		article.exSelf_cit_year : Array (exclude self citaion no. per year)
//			article.exSelf_cit_people: Array (exclude self citation no. per citor)
//			
//			
//
function parsePubXML(xx,
					_hash_author_year,
					_hash_author_people,
					person_item,
					author_total,
					_exSelf_hash_author_year, 
					_exSelf_hash_author_people,
					exSelf_author_total
					)
{
	var article = new Object(); //one article
	try{
		article.url = xx.getElementsByTagName("url")[0].firstChild.nodeValue;
	}catch(er){
		article.url = "";
	}
	try{
		article.title = xx.getElementsByTagName("title")[0].firstChild.nodeValue;
	}catch(er){
		article.title = "";
	}
	try{
		article.pdf = xx.getElementsByTagName("pdf")[0].firstChild.nodeValue;
	}catch(er){
		article.pdf = "";
	}
	try{
		article.author = xx.getElementsByTagName("author")[0].firstChild.nodeValue;
	}catch(er){
		article.author = "";
	}
	try{
		article.proceeding = xx.getElementsByTagName("proceeding")[0].firstChild.nodeValue;
	}catch(er){
		article.proceeding = "";
	}
	try{
		article.year = xx.getElementsByTagName("year")[0].firstChild.nodeValue;
	}catch(er){
		article.year = "";
	}
	try{
		article.source = xx.getElementsByTagName("source")[0].firstChild.nodeValue;
	}catch(er){
		article.source = "";
	}
	try{
		article.snippet = xx.getElementsByTagName("snippet")[0].firstChild.nodeValue;
		var ind = article.snippet.toLowerCase().indexOf("abstract"); //remove the first "abstract" string
		if(ind == 0){ 
			article.snippet = article.snippet.substring(9);
		}
		
	}catch(er){
		article.snippet = "";
	}
	try{ 
		article.relatedLink = xx.getElementsByTagName("relatedLink")[0].firstChild.nodeValue;		
	}catch(er){
		article.relatedLink = "";
	}
	try{
		article.htmlLink = xx.getElementsByTagName("htmlLink")[0].firstChild.nodeValue;
	}catch(er){
		article.htmlLink = "";
	}
	try{
		article.numVersions = xx.getElementsByTagName("numVersions")[0].firstChild.nodeValue;
	}catch(er){
		article.numVersions = "";
	}
	try{	//Check exclude list whether current article in, if so return null
		article.versionLink = xx.getElementsByTagName("versionLink")[0].firstChild.nodeValue;
		var regex = /cluster=([\w]*)&/;
		article.identifier = article.versionLink.match(regex)[1];
		if(checkExcludeId(article.identifier,person_item)){ //true: in the exclude list
			return null;
		}
	}catch(er){
		article.versionLink = "";
		article.identifier = ""; 
	}
	try{
		article.numCite = xx.getElementsByTagName("numCite")[0].firstChild.nodeValue;
		author_total[0] += parseInt(article.numCite);
		exSelf_author_total[0] += parseInt(article.numCite);
		
	}catch(er){
		article.numCite = "";
	}
	try{	//Check exclude list whether current article in, if so return null
		article.citeLink = xx.getElementsByTagName("citeLink")[0].firstChild.nodeValue;
		var regex = /cites=([\w]*)&/;
		article.identifier = article.citeLink.match(regex)[1];
		if(checkExcludeId(article.identifier,person_item)){ //true: in the exclude list
			return null;
		}
	}catch(er){
		article.citeLink = "";
		if(article.identifier.length == 0){
			article.identifier = ""; 
		}		
	}
	
	//Get cit_year, cit_people, cit_trend

	var first_year = parseInt(article.year); //from the year of published
	var period = cur_year - first_year +1;
	var exSelf_totalCit = article.numCite;
	if(article.numCite > 0){
	
		var citeby = xx.getElementsByTagName("result");
		
		//
		var hash_year = new Hashtable();
		var hash_people = new Hashtable();
		var year;
		var y_count;
		var ctor;
		var c_count,cc_count;
		
		//For exclude self citation
		var exSelf_hash_year = new Hashtable();
		var exSelf_hash_people = new Hashtable();
		
		var authors = article.author.replace("…","")
		//loop for each citation, get year_count, and people_count
		for(var i=0; i<citeby.length; i++){
		
			var selfCit = 0;
		
			//Count citation for each citer
			try{
				var citators = citeby[i].getElementsByTagName("author")[0].firstChild.nodeValue.split(", ");
				for(var k in citators){
				
					ctor = citators[k];				
					ctor = ctor.replace("…","");
					
					//Count each article citation
					c_count = hash_people.get(ctor);
					if(c_count != null){
						c_count++;
						hash_people.put(ctor,c_count);
					}else{
						hash_people.put(ctor,1);
					}
					
					//Count each author citation
					cc_count = _hash_author_people.get(ctor);
					if(cc_count != null){
						cc_count ++;
						_hash_author_people.put(ctor,cc_count);
					}else{
						_hash_author_people.put(ctor,1);
					}
					
					//Count non-self cited ciation
					
					if(authors.indexOf(ctor) == -1){
					
						//Count each article citation
						c_count = exSelf_hash_people.get(ctor);
						if(c_count != null){
							c_count++;
							exSelf_hash_people.put(ctor,c_count);
						}else{
							exSelf_hash_people.put(ctor,1);
						}
						
						//Count each author citation
						cc_count = _exSelf_hash_author_people.get(ctor);
						if(cc_count != null){
							cc_count ++;
							_exSelf_hash_author_people.put(ctor,cc_count);
						}else{
							_exSelf_hash_author_people.put(ctor,1);
						}
						
					}else{ //if self cited
						selfCit = 1;						
					}					
					
				}//for each citator
			}catch(er){
				continue;
			}
			
			//Count citation for each year
			try{ //some article not have year
				year = parseInt(citeby[i].getElementsByTagName("year")[0].firstChild.nodeValue);
				//FixGSError
				if(person_item.fixGSError){
					if(year < parseInt(article.year)){ //remove uncorrect citation (citing year < published year of the article)
						author_total[0]--;
						exSelf_author_total[0]--;
						continue; 
					}  
				}
					
				//count each article citation in one year
				y_count = hash_year.get(year);
				if(y_count != null){
					y_count++;
					hash_year.put(year,y_count);
				}else{
					hash_year.put(year,1);
				}
				
				//count each author citation in one year
				yy_count = _hash_author_year.get(year);
				if(yy_count != null){
					yy_count ++;
					_hash_author_year.put(year, yy_count);					
				}else{
					_hash_author_year.put(year,1);
				}
				
				//If not selfCit
				if(selfCit == 0){
					
					//FixGSError
					if(person_item.fixGSError){
						if(year < parseInt(article.year)){ //remove uncorrect citation (citing year < published year of the article)
							exSelf_author_total[0]--;
							continue; 
						}  
					}
					
					//Count each article citation in one year
					y_count = exSelf_hash_year.get(year);
					if(y_count != null){
						y_count++;
						exSelf_hash_year.put(year,y_count);
					}else{
						exSelf_hash_year.put(year,1);
					}
					
					//Count each author citation in one year
					yy_count = _exSelf_hash_author_year.get(year);
					if(yy_count != null){
						yy_count ++;
						_exSelf_hash_author_year.put(year, yy_count);					
					}else{
						_exSelf_hash_author_year.put(year,1);
					}
				
				}
				//If selfCit
				else if(selfCit == 1){
					exSelf_author_total[0]--;
					exSelf_totalCit--;
					
				}
				
				
			}catch(er){
				continue;
			}
			
		} //for citeby
		article.exSelf_totalCit = exSelf_totalCit;
		
		//Generate cit_year, cit_people, cit_trend		
		var cit_ = getArticleCit_(hash_year,hash_people,period,first_year);
		article.cit_trend = cit_.cit_trend;
		article.cit_year = cit_.cit_year;
		article.cit_people = cit_.cit_people;
		
		//Generate exSelf cit_year, cit_people, cit_trend
		var exSelfCit_ = getArticleCit_(exSelf_hash_year,exSelf_hash_people,period,first_year);
		article.exSelf_cit_year = exSelfCit_.cit_year;
		article.exSelf_cit_trend = exSelfCit_.cit_trend;
		article.exSelf_cit_people = exSelfCit_.cit_people;
	
	}else{
		var cit_trend = new Array();
		var exSelf_cit_trend = new Array();
		
		for(var j = 0; j< period; j++){
			cit_trend[j] = 0;
			exSelf_cit_trend[j] = 0;
		}
		article.cit_trend = cit_trend;
		article.cit_year = null;
		article.cit_people = null;
		
		article.exSelf_cit_trend = exSelf_cit_trend;
		article.exSelf_cit_year = null;
		article.exSelf_cit_people = null;
	}//if
	
	return article;
}



//
//Generate cit_year, cit_people, cit_trend
//
//INPUT:
//		hash_year
//		hash_people
//
//RETURN:
//		cit_: Object
//			.cit_year
//			.cit_people
//			.cit_trend
//
//
function getArticleCit_(hash_year,hash_people,period,first_year){

	var cit_ = new Object();
	var cit_trend = new Array();
	
	//If hash_year has citation
	if(hash_year != null && hash_year.size() != 0){
	
		//Fill zero to missed year
		var yy = hash_year.entries();
		yy.sort();
		var firstyear = yy[0][0];
		var lastyear = yy[yy.length-1][0];
		for(var y = firstyear+1; y < lastyear; y++){
			if(hash_year.get(y)==null){
				hash_year.put(y,0);
			}
		}
		
		//Get citation trend			
		for(var j = 0; j< period; j++){
			var citCount = hash_year.get(first_year + j); //the jst year's citation count
			if(citCount == null){
				cit_trend[j] = 0;
			}else{
				cit_trend[j] = citCount;
			}
		}
		cit_.cit_trend = cit_trend;
		
		//Sorting the citation info
		cit_.cit_year = hash_year.entries().sort(); //ascending by year
		cit_.cit_people = hash_people.entries().sort(function(a,b){return b[1]-a[1]});  //descending by count
	}		
	else{
		for(var j = 0; j< period; j++){
			cit_trend[j] = 0;
		}
		cit_.cit_trend = cit_trend;
		cit_.cit_year = null;
		cit_.cit_people = null;
	}
	
	return cit_;
}



//
//Aggregate citation info for the author
//
//	Input:
//		_hash_author_year
//		_hash_author_people
//		_author_total
//
//	Return:
//		item filled with:
//				.cit_year
//				.cit_people
//				.totalCit
//
//
function getAuthorCitation(_hash_author_year,_hash_author_people,_author_total){

	var item = new Object();

	//fill zero to unoccured year
	if(_hash_author_year.size()!=0){
		var ent = _hash_author_year.entries();
		ent.sort();
		var first = ent[0][0];
		var last = ent[ent.length-1][0];
		for(var k = first; k<= last; k++){ 
			var count = _hash_author_year.get(k);
			if( count== null){
				_hash_author_year.put(k,0);
			}else{
			
			}
		}
		
		item.cit_year = _hash_author_year.entries().sort(); //ascending by year
		
		item.cit_people = _hash_author_people.entries().sort(function(a,b){return b[1]-a[1]});  //descending by count
		
		item.totalCit = _author_total;
		
	}else{
		item.cit_year = null;
		item.cit_people = null;
		item.totalCit = _author_total;
	}
	
	return item;
}



//
//Calculate citation trend for each author
//By averaging each each article's citation count in sequential year
//
//INPUT:

//		article_list: Array
//		cur_year: number (current year)
//OUPUT:
//		cit_trend: Array
//
//
function getAuthorTrend(article_list,cur_year){

	if(!article_list.length > 0){ //if no article
		var cit_trend = {};
		return cit_trend;
	}

	//Method Start
	var cit_trend = new Array();  //citation trend list: the number of citation / the number of citable articles in the ith year
	var cit_trend_count = new Array(); //the number of citable artiles in the ith year

	//Loop for each article
	for(var i = 0; i< article_list.length; i++){

		var article = article_list[i];
		var a_cit_trend = article.cit_trend; //HashTable
		
		for(var j = 0; j < a_cit_trend.length; j++){ //loop for jth citation no.
			if(typeof(cit_trend[j]) == "undefined"){  //first citation no. in jth year
				cit_trend[j] = a_cit_trend[j];
				cit_trend_count[j] = 1;
			}else{
				cit_trend[j] += a_cit_trend[j];
				cit_trend_count[j]++;
			}
		
		}
		
	}

	//Calculate average citation count
	for(var k = 0; k< cit_trend.length; k++){
		cit_trend[k] = cit_trend[k] / cit_trend_count[k];
	}
	
	return cit_trend;
}



//
//Calculate citation trend for each author
//By averaging each each article's citation count in sequential year
//
//INPUT:

//		article_list: Array
//		cur_year: number (current year)
//OUPUT:
//		exSelfCit_trend: Array
//
//
function getAuthorExSelfTrend(article_list,cur_year){

	if(!article_list.length > 0){ //if no article
		var cit_trend = {};
		return cit_trend;
	}

	//Method Start
	var cit_trend = new Array();  //citation trend list: the number of citation / the number of citable articles in the ith year
	var cit_trend_count = new Array(); //the number of citable artiles in the ith year

	//Loop for each article
	for(var i = 0; i< article_list.length; i++){

		var article = article_list[i];
		var a_cit_trend = article.exSelf_cit_trend; //HashTable
		
		for(var j = 0; j < a_cit_trend.length; j++){ //loop for jth citation no.
			if(typeof(cit_trend[j]) == "undefined"){  //first citation no. in jth year
				cit_trend[j] = a_cit_trend[j];
				cit_trend_count[j] = 1;
			}else{
				cit_trend[j] += a_cit_trend[j];
				cit_trend_count[j]++;
			}
		
		}
		
	}

	//Calculate average citation count
	for(var k = 0; k< cit_trend.length; k++){
		cit_trend[k] = cit_trend[k] / cit_trend_count[k];
	}
	
	return cit_trend;
}



//
//Get meta data from Config file
//
//Input:
//	Config_file_path
//
//Return:
//	metaOpt: Object();
//		metaOpt.id
//		metaOpt.name
//		metaOpt.type
//		metaOpt.updateFreq
//		metaOpt.citeBy (boolean)
//		metaOpt.showIdentifier  (boolean)
//		metaOpt.fixGSError : (boolean)
//		metaOpt.orderBy: (year or cite)
//		metaOpt.memberList: Array() --> member: Object
//											member.id
//											member.type
//											member.name
//											member.needVerify (boolean)
//		metaOpt.excludeList: Hashtable() --> {g-identifier, i}
//
//
function getMetaConfig(id){
	
	var xmlhttp = createXMLHTTPRequest();
	xmlhttp.open("GET","data/config/config_" + id + ".xml?number=" + Math.random(),false);
	xmlhttp.setRequestHeader("Content-type","application/xml");
	
	xmlhttp.send();
	var metaOpt = new Object();
//	xmlhttp.ready
	if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
	{
		var xx = xmlhttp.responseXML.documentElement;
		//Get Id
		metaOpt.id = xx.attributes.id.nodeValue;
		
		//Get Name
		metaOpt.name = xx.attributes.name.nodeValue;
		
		//Get type
		metaOpt.type = xx.attributes.type.nodeValue;
		
		//Get updateFreq
		metaOpt.updateFreq = xx.getElementsByTagName("update_frequency")[0].firstChild.nodeValue;
		
		//Get citedBy option
		if(xx.getElementsByTagName("citedBy")[0].firstChild != null)
		{
			metaOpt.citedBy = true;
		}
		else
		{
			metaOpt.citedBy = false;
		}		
		//Get showIdentifier option
		if(xx.getElementsByTagName("showIndentifier")[0].firstChild != null){
			var show = xx.getElementsByTagName("showIndentifier")[0].firstChild.nodeValue;
			if(show == "yes" || show == "y" || show == "true"){
				metaOpt.showIdentifier = true;
			}else{
				metaOpt.showIdentifier = false;
			}
		}else{
			metaOpt.showIdentifier = false;
		}
		
		//Get fixGSError option
		if(xx.getElementsByTagName("fixGSError")[0].firstChild != null){
			var fix = xx.getElementsByTagName("fixGSError")[0].firstChild.nodeValue;
			if(fix == "yes" || fix == "y" || fix=="true"){
				metaOpt.fixGSError = true;
			}else{
				metaOpt.fixGSError = false;
			}
			
		}else{
			metaOpt.fixGSError = false;
		}
		
		
		//Get orderBy option
		if(xx.getElementsByTagName("orderBy")[0].firstChild != null){
			var orderBy = xx.getElementsByTagName("orderBy")[0].firstChild.nodeValue;
			if(orderBy == "cite" || orderBy == "citation"){
				metaOpt.orderBy = "cite";
			}else{
				metaOpt.orderBy = "year";
			}
		}else{
			metaOpt.orderBy = "year";
		}
		
		
		
		//Get Member list or Exclude g-identifier list
		if(xx.attributes.type.nodeValue == "group")
		{
			metaOpt.excludeList = null;
			var memberList = new Array();
			var m_list = xx.getElementsByTagName("member");
			for(var k =0; k< m_list.length; k++){
				var mem = new Object();
				mem.id = m_list[k].attributes.id.nodeValue;
				mem.type = m_list[k].attributes.type.nodeValue;
				mem.name = m_list[k].attributes.name.nodeValue;
				if(typeof(m_list[k].attributes.needVerify) == "undefined"){
					mem.needVerify = false;
				}else{
					var needed = m_list[k].attributes.needVerify.nodeValue
					if(needed == "yes" || needed == "true" || needed == "y"){
						mem.needVerify = true;
					}else{
						mem.needVerify = false;
					}
				} 
				memberList[k] = mem;
			}
			metaOpt.memberList = memberList;			
		}
		else if (xx.attributes.type.nodeValue == "person")
		{	
			metaOpt.memberList = null;
			metaOpt.excludeList = new Hashtable();
			var ex = xx.getElementsByTagName("exclude")[0].getElementsByTagName("g_identifier");
			for (var i=0; i < ex.length; i++)
			{
				if(ex[i].firstChild != null)
				{
					metaOpt.excludeList.put(ex[i].firstChild.nodeValue,i);
				}
				else{
					metaOpt.excludeList = null;
				}	
			}
		} //end g-identifier
		
	}//end statement == 4
	
	return metaOpt;
}


//
//Given citedLink or versionLink, check whether article in exclude list
//
function checkExcludeId(identifier,p_meta){

	if(p_meta.excludeList != null && p_meta.excludeList.get(identifier) != null)
	{
		return true; //in the list
	}else{
		return false;
	}
}


//
//Get XMLHttpRequest
//
function createXMLHTTPRequest(){
	var xhr_object = null;
	if(window.XMLHttpRequest)
	{
		xhr_object = new XMLHttpRequest();
	}
	else if(window.ActiveXOject)
	{
		xhr_object = new ActiveXObject("Microsoft.XMLHTTP");
	}
	else
	{
		alert("Your browser doesn't provide XMLHttpRequest functionality");
		return;
	}
	return xhr_object;
}



//
//Execute gsnap.pl
//
function exc_gsnap(){
	
	var xmlhttp = createXMLHTTPRequest();	
	var url_gsnap = "cgi-bin/gsnap.pl?number="+Math.random();
	xmlhttp.open("GET",url_gsnap,false);
	xmlhttp.send();
	
	if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
	{
		var response = xmlhttp.responseText;
		if(response == "ready")
		{
			return true;
		}
		else if (response == "failed")
		{
			document.write("GSNAP ERROR!");
			return false;
		}
		else
		{
//			document.write("Unkown ERROR!");
			return false;
		}		
	}
}


//
//If last updated before FREQ days, return true and update recorded time
//
function compareTime(FREQ){

	var current_date = new Date();
	
	var xmlhttp = createXMLHTTPRequest();
	xmlhttp.open("GET","data/latest.time",false);	
	xmlhttp.send();
	
	if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
	{
		var date = xmlhttp.responseText;
		if(date.length > 0)
		{
			var latest_date = new Date(date);
			
			if((current_date.getTime()-latest_date.getTime())/(24*60*60*1000) > FREQ)  //if last updated before FREQ days 		
			{  	
				updateTime(current_date.toUTCString());
				return true; //need update
			}
			else
			{
					return false; //not need update
			}
		}
		else
		{
			updateTime(current_date.toUTCString());
			return true;
		}
	}
	else
	{
		updateTime(current_date.toUTCString());
		return true;
	}
}


//
//Update recorded time
//
function updateTime(time){
	
	var xmlhttp_t = createXMLHTTPRequest();
	xmlhttp_t.open("POST","cgi-bin/update_time.cgi",true);
	xmlhttp_t.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp_t.send("time=" + time);
}

var main_id = "1";

//
//MAIN
//Return:
//		main_result: Object
//			main_result.meta
//			main_result.list
//					if meta.type==person, person_result
//					if meta.type==group, group_result 
//
function parseMainXml(){
	var main_result = new Object();
	
	var main_meta = getMetaConfig("data/config/config_" + main_id +".xml");
	main_result.meta = main_meta;
	
	if(main_meta.type == "person")
	{
		main_result.list = parsePersonXml(main_meta.id, null, "yes");
	}
	else if(main_meta.type == "group")
	{
		main_result.list = parseGroupXml(main_meta.id);
	}

	return main_result;
}

//Parse Group information
//	Input: 
//		group_id
//
//	Return: 
//		group_result: Object 
//			group_result.group: Object
//					group.cit_year: Array
//					group.cit_people: Array
//			group_result.member_list: Hashtable
//					key: type_id_name
//					value: 
//						if type==person, person_result
//						if type==group, group_result
//			group_result.citedBy
//			group_result.showIdentifier
//			group_result.fixGSError
//				
//
function parseGroupXml(group_id){
	
	var group_result = new Object();
	
	var member_list = new Hashtable(); //Recording information of all the members
	var group = new Object(); //Aggregate citation info for the group
	var group_cit_year = new Hashtable();
	var group_cit_people = new Hashtable();
	var group_total = [0];

	var g_meta = getMetaConfig("data/config/config_"+group_id+".xml"); //Get meta data from Config.xml
	
	//Get member list in group config file
	for(var i = 0; i<g_meta.memberList.length; i++){
		var mem = g_meta.memberList[i];
		if(mem.type == "group")
		{
			var subGroup_result = parseGroupXml(mem.id);
			aggregateCiation(group_cit_year, group_cit_people, subGroup_result.group.cit_year, subGroup_result.group.cit_people);
			if(typeof(subGroup_result.group.totalCit) != "undefined"){
				group_total[0] += subGroup_result.group.totalCit;
			}			
			member_list.put("group_" + mem.id + "_" + mem.name, subGroup_result);
		}
		else if(mem.type == "person")
		{
			var person_result = parsePersonXml(mem.id, main_id, "no");			
			aggregateCiation(group_cit_year, group_cit_people, person_result.author.cit_year,person_result.author.cit_people);
			if(typeof(person_result.author.totalCit) != "undefined"){
				group_total[0] += person_result.author.totalCit;
			}
			
			member_list.put("person_" + mem.id + "_" + mem.name, person_result);
			
		}
	}//Loop for group member end
	
	//Fill zero in missed year, sort count by descent
	getAuthorCitation(group,group_cit_year,group_cit_people,group_total[0]);
	
	//Return group_result
	group_result.group = group;
	group_result.member_list = member_list;
	group_result.citedBy = g_meta.citedBy;
	group_result.showIdentifier=g_meta.showIdentifier;
	group_result.fixGSError = g_meta.fixGSError;
	
	return group_result;
}


//
//Aggregate person's citation into Group's citaion
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
	if( typeof(person_cit_year) != "undefined") {
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
	if( typeof(person_cit_people) != "undefined") {
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
//Parse Person information from pub_id.xml
//	Input:
//		person_id
//		main_id
//		needVerify: (a flag)
//	Return:
//		person_result: Object
//				person_result.author: Object
//						author.cit_year
//						author.cit_people			
//				person_result.article_list: Array
//						article: object
//				person_result.citedBy
//				person_result.showIdentifier
//				person_result.fixGSError
//		
//
function parsePersonXml(person_id, main_id, needVerify){
	var person_result = new Object();  //result object (.author, .article_list)
	var p_meta;
	
	if(needVerify == "n" || needVerify == "no" || needVerify == "false") //Read main config
	{
		p_meta = getMetaConfig("data/config/config_"+main_id+".xml"); //Get meta data from Config.xml
	}
	else if(needVerify == "n" || needVerify == "yes" || needVerify == "true")  //Read person verified config
	{
		p_meta = getMetaConfig("data/config/config_"+person_id+".xml"); //Get meta data from Config.xml
	}
	
	var main_meta = getMetaConfig("data/config/config_"+main_id+".xml"); //Get meta data from Config.xml
	
	//Update publication list
	var need_update_flag = compareTime(p_meta.updateFreq);
	if(need_update_flag) //if true, need update
	{ 
		exc_gsnap();
	}
	
	//Get publication list
	var pub_content; //result list
	var query_result, result;
	var article_list = new Array();  //article list
	
	
	var xmlhttp_p = createXMLHTTPRequest();
	var url_pub = "data/publication/pub_" + person_id + ".xml?number=" + Math.random();
	xmlhttp_p.open("GET",url_pub,false);
	xmlhttp_p.send();
	
	if(xmlhttp_p.readyState == 4)
	{
		if(xmlhttp_p.status == 200) //if file exist
		{ 	
			var hash_author_year = new Hashtable();
			var hash_author_people = new Hashtable();
			var author_total = [0];
			
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
						var article = parsePubXML(result,hash_author_year,hash_author_people,p_meta,main_meta,author_total);
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
					var article = parsePubXML(result,hash_author_year,hash_author_people,p_meta,main_meta,author_total);
					if(article != null){ //not in the exclude list
						article_list[i] = article;  //add into article list
						i++;
					}
					
				}
				
				query_result = query_result.nextElementSibling; //get next <query...>

			} //processed all articles
			
			//Aggregate citation info for the author
			var author = new Object();
			getAuthorCitation(author,hash_author_year,hash_author_people,author_total[0]);

			//Return person_result
			person_result.author = author;			
			person_result.article_list = article_list;
			person_result.citedBy = p_meta.citedBy;
			person_result.showIdentifier=p_meta.showIdentifier;
			person_result.fixGSError = p_meta.fixGSError;
			return person_result;
		}
		else if (xmlhttp_p.status == 404) //if not exist
		{ 
			if(exc_gsnap())
			{
				return parsePersonXml();
			}			
		}
	}
}


//
//Parse article from <result id=*></result>
//
//	Input:
//		xx: (result element)
//		_hash_author_year: (add ariticle's citation into author's citation)
//		_hash_author_people: (same as above)
//		p_meta: (person's meta data)
//		main_meta
//		author_total
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
//			article.citeLink
//			article.cit_year
//			article.cit_people
//			
//
function parsePubXML(xx,_hash_author_year,_hash_author_people,p_meta,main_meta,author_total){

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
		if(checkExcludeId(article.identifier,p_meta)){ //true: in the exclude list
			return null;
		}
	}catch(er){
		article.versionLink = "";
		article.identifier = ""; 
	}
	try{
		article.numCite = xx.getElementsByTagName("numCite")[0].firstChild.nodeValue;
		author_total[0] += parseInt(article.numCite);
	}catch(er){
		article.numCite = "";
	}
	try{	//Check exclude list whether current article in, if so return null
		article.citeLink = xx.getElementsByTagName("citeLink")[0].firstChild.nodeValue;
		var regex = /cites=([\w]*)&/;
		article.identifier = article.citeLink.match(regex)[1];
		if(checkExcludeId(article.identifier,p_meta)){ //true: in the exclude list
			return null;
		}
	}catch(er){
		article.citeLink = "";
		if(article.identifier.length == 0){
			article.identifier = ""; 
		}		
	}
	if(article.numCite > 0){
	
		var citeby = xx.getElementsByTagName("result");
		var hash_year = new Hashtable();
		var hash_people = new Hashtable();
		var year;
		var y_count;
		var ctor;
		var c_count,cc_count;
		
		//loop for each citation, get year_count, and people_count
		for(var i=0; i<citeby.length; i++){
		
			//Count citation for each citer
			try{
				var citators = citeby[i].getElementsByTagName("author")[0].firstChild.nodeValue.split(", ");
				for(var k in citators){
				
					ctor = citators[k];
					
					ctor = ctor.replace(/&#8230;/,"");
				
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
				}//for each citator
			}catch(er){
				continue;
			}
			
			//count citation for each year
			try{ //some article not have year
				year = parseInt(citeby[i].getElementsByTagName("year")[0].firstChild.nodeValue);
				if(main_meta.fixGSError){
					if(year < parseInt(article.year)){ //remove uncorrect citation (citing year < published year of the article)
						author_total[0]--;
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
				
			}catch(er){
				continue;
			}
			
		} //for citeby
		
		//Sorting the citation info
		if(hash_year.size() != 0){ //
			//fill zero to missed year
			var yy = hash_year.entries();
			yy.sort();
			var firstyear = yy[0][0];
			var lastyear = yy[yy.length-1][0];
			for(var y = firstyear+1; y < lastyear; y++){
				if(hash_year.get(y)==null){
					hash_year.put(y,0);
				}
			}
			
			article.cit_year = hash_year.entries().sort(); //ascending by year
			article.cit_people = hash_people.entries().sort(function(a,b){return b[1]-a[1]});  //descending by count
		}else{
			article.cit_year = null;
			article.cit_people = null;
		}
	
	}else{
		article.cit_year = null;
		article.cit_people = null;
	}//if
	
	return article;
}


//
//Aggregate citation info for the author
//
//	Input:
//		_author: (object)
//		_hash_author_year
//		_hash_author_people
//
//	Return:
//		_author
//
//
function getAuthorCitation(_author,_hash_author_year,_hash_author_people,_author_total){

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
		
		_author.cit_year = _hash_author_year.entries().sort(); //ascending by year
		
		_author.cit_people = _hash_author_people.entries().sort(function(a,b){return b[1]-a[1]});  //descending by count
		
		_author.totalCit = _author_total;
		return _author;
	}
	

}


//
//Get meta data from main config file
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
//		metaOpt.citeBy
//		metaOpt.showIdentifier
//		metaOpt.fixGSError : boolean
//		metaOpt.memberList: Array() --> member: Object
//											member.id
//											member.type
//											member.name
//		metaOpt.excludeList: Hashtable() --> {g-identifier, i}
//
//
function getMetaConfig(config_path){
	
	var xmlhttp = createXMLHTTPRequest();
	xmlhttp.open("GET",config_path + "?number=" + Math.random(),false);
	xmlhttp.setRequestHeader("Content-type","application/xml");
	xmlhttp.send();
	
	var metaOpt = new Object();
	
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
			metaOpt.showIdentifier = xx.getElementsByTagName("showIndentifier")[0].firstChild.nodeValue;
		}else{
			metaOpt.showIdentifier = "no";
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
			document.write("Unkown ERROR!");
			return false;
		}		
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
	xmlhttp_t.open("POST","cgi-bin/update_time.cgi",false);
	xmlhttp_t.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp_t.send("time=" + time);
}

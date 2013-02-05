
function sendData(content){

		var url = "http://wing.comp.nus.edu.sg/~dongyuanlu/getPub.php";
		var xhr = createCORSRequest("POST", url);
		
		if(!xhr)
		{
			throw new Error ('CORS not supported');
		}
		xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		xhr.setRequestHeader('X-Requested-With', '');
	//	xhr.withCredentials = true;

		xhr.send("content="+content+"&number="+Math.random());

}

//
//
function createCORSRequest(method, url){
	
	var xhr = new XMLHttpRequest();
	
	if("withCredentials" in xhr)
	{
		xhr.open(method,url,true);
	}
	else if(typeof XDomainRequest != "undefined")
	{
		xhr = new XDomainRequest();
		xhr.open(method, url);
	}
	else
	{
		xhr = null;
	}
	return xhr;
}
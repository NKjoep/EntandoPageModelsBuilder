var rootFromString =  function(string){
	var root = null;
	try {
		var testIE = (Browser.ie || Browser.ie6 || Browser.ie7 || Browser.ie8);
		if (undefined != testIE && testIE){
			root = new ActiveXObject('Microsoft.XMLDOM');
			root.async = false;
			root.loadXML(string);
		} else {
			root = new DOMParser().parseFromString(string, 'text/xml');
		}
	}
	catch(e) {
		root = null;
	}
	return root;
};

var readjAPSXml = function(string) {
	var obj = null;
	var dom = rootFromString(string);
	if (dom != null) {
		var root = Slick.search(dom,"frames");
		if (root.length > 0) {
			obj = {};
			for (var i = 0;i<root.length;i++){
				var item = root[i];
				var tag = item.get("tag");
				var children = item.getChildren(); 
				
				obj[tag] = [];
				
				if (children.length > 0) {
					for (var x=0;x<children.length;x++) {
						var frame = children[x];
						var framepos = frame.get("pos");
						var descr = frame.getFirst("descr").get("text");
						obj[tag].push({
							"pos": framepos,
							"descr": descr
						});
					}
				}
			}
		}
	}
	
	return obj;
}

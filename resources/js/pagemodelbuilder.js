var romanize = function (num) {
	if (!+num)
	return false;
	var	digits = String(+num).split(""),
		key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
		       "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
		       "","I","II","III","IV","V","VI","VII","VIII","IX"],
		roman = "",
		i = 3;
	while (i--)
		roman = (key[+digits.pop() + (i * 10)] || "") + roman;
	return Array(+digits.join("") + 1).join("M") + roman;
};


var EntandoPageModelBuilderHelper = {
	rootFromString:  function(string){
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
	},
	readjAPSXml: function(string) {
		var obj = null;
		var dom = EntandoPageModelBuilderHelper.rootFromString(string);
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
							var descrEl = frame.getFirst("descr")
							var descr = descrEl.innerText || descrEl.textContent;
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
	
};


var EntandoPageModelBuilder = new Class({
	Implements: [Events, Options],
	options: {
		resultEl: "result",
		directInput: {
			el: "directInput",
			button: "loadDirectInput"
		},
		JSPCode: {
			el: "jspcode",
			button: "generate_jsp"  
		},
		add: {
			descr: "descr",
			how: "how",
			where: "where",
			form: "addForm"
		},
		refreshButton: "updatepos", 
		copyButton: "copy_click_board",
		saveButton: "save",
		saveForm: "saveform",
		newButton: "new",
		css: {
			toolbar: "toolbar",
			resultSelected: "selected"
		}
	},
	initialize: function(options) {
		this.setOptions(options);
		this.options.resultEl = document.id(this.options.resultEl);
		this.options.directInput.el = document.id(this.options.directInput.el);
		this.options.directInput.button = document.id(this.options.directInput.button);
		
		this.options.JSPCode.el = document.id(this.options.JSPCode.el);
		this.options.JSPCode.button = document.id(this.options.JSPCode.button);
		
		this.options.add.descr = document.id(this.options.add.descr);
		this.options.add.how = document.id(this.options.add.how);
		this.options.add.where = document.id(this.options.add.where);
		this.options.add.form = document.id(this.options.add.form);
		
		this.options.refreshButton = document.id(this.options.refreshButton);
		this.options.copyButton = document.id(this.options.copyButton);
		this.options.saveButton = document.id(this.options.saveButton);
		
		this.options.saveForm = document.id(this.options.saveForm);
		this.options.newButton = document.id(this.options.newButton);
		
		this.AddFunction_setup();
		this.JSPCode_setup();
		this.ClipBoard_setup();
		this.Result_setup();
		this.DirectInput_setup();
		
		//refresh
		this.options.refreshButton.addEvent("click",function(ev){
			ev.preventDefault();
			this.Result_updateFramesPositions();
		}.bind(this));
		
	},
	AddFunction_setup: function() {
		this.options.add.form.addEvent("submit", function(ev){
			ev.preventDefault();
			this.AddFunction_addFrames();
		}.bind(this));	
	},
	AddFunction_addFrames: function() {
		var toolbar = document.getElement("div.toolbar");
		if (null != toolbar ) { 
			toolbar.destroy();
		}
		var val = this.AddFunction_readValues();
		var result = this.options.resultEl;
		var pos = val.where.toInt();
		for (var i=0;i<val.how;i++) {
			var newpos = (pos+i);
			var newDescr = ((val.how>1) ? val.descr +" "+ (romanize(i+1)) : val.descr); 
			var f = this.Result_createNewFrame(newDescr,newpos);
			if (undefined != result.getChildren()[newpos]) {
				f.inject(result.getChildren()[newpos],"before");
			} 
			else {
				f.inject(result);	
			}
		}
		this.Result_updateFramesPositions();
		this.AddFunction_updateWhereSelect();
		this.Clipboard_getClipboardString();
	},
	AddFunction_readValues: function() {
		var descr = this.options.add.descr.get("value");
		var how = this.options.add.how.get("value");
		var where = this.options.add.where.get("value");
		return { "descr": descr, "how": how, "where": where };
	},
	AddFunction_updateWhereSelect: function() {
		var result = this.options.resultEl;
		var children = result.getChildren();					
		var childrenLength = result.getChildren().length;
		var select = this.options.add.where;
		select.empty();
		for (var i = childrenLength; i >= 0; i--) {
			new Element("option",{
				"value": i,
				"text": i
			}).inject(select);
		}
	},
	Result_setup: function() {
		var mythis = this;
		this.options.resultEl.addEvents({
			"click": function(ev){
				var target = ev.target;
				if (target.get("tag") == "span" && target.hasClass("span2")) {
					var text = target.get("text");
					target.set("text","");
					var input = new Element("input",{value: text}).inject(target);
					input.focus();
					input.addEvent("blur",function(ev){
						var toolbar = this[1].options.resultEl.getElement("div.toolbar");
						if (null != toolbar) toolbar.destroy();
						var text = ev.target.get("value");
						ev.target.destroy();
						this[0].set("text",text);
						this[1].Result_updateFramesPositions();
					}.bind([target,mythis]));
				}
				else {
					this.Toolbar_generate(target);	
				}
			}.bind(mythis),
			"blur": function(ev){
				var toolbar = this.options.resultEl.getElement("div.toolbar");
				if (null != toolbar ) { 
					toolbar.destroy();
				}
				var s = this.options.resultEl.getElement(this.options.css.resultSelected);
				if (null != s) {
					s.removeClass(this.options.css.resultSelected);
				}
			}.bind(mythis)
		});
		
		window.addEvent("click", function(ev){
			var t = this.options.resultEl.getElement("div.toolbar");
			var target = ev.target;
			if (t != null) {
				//console.log(target);
				if (t != target && null == (this.options.resultEl.getElement(target))) {
					t.destroy();
					this.options.resultEl.getElement("div.selected").removeClass(this.options.css.resultSelected);
				}
			}		
		}.bind(mythis));
	},
	Result_updateFramesPositions: function() {
		var result = this.options.resultEl;
		var toolbar = result.getElement(this.options.css.toolbar);
		if (null != toolbar ) { 
			toolbar.destroy();
		}
		var s = result.getElement(this.options.css.resultSelected);
		if (null != s) {
			s.removeClass(this.options.css.resultSelected);
		}
		var children = result.getChildren();					
		var childrenLength = result.getChildren().length;
		if (childrenLength>0) {
			for (var i = 0;i<childrenLength;i++){
				var child = children[i].getFirst("span");
				var text = child.get("text");
				text = text.replace(/<frame pos=\"[\d]{1,100}\">/g,'<frame pos="'+i+'">');
				child.set("text",text);
			}
		}
		this.AddFunction_updateWhereSelect();
		this.Clipboard_getClipboardString();
		this.JSPCode_generate();
	},
	Result_createNewFrame: function(descr, pos) {
		var frame = null;
		if (undefined != descr && undefined != pos) {
			frame = new Element("div");
			new Element("span", {
				"class": "span1",
				text: '<frame pos="' + pos + '"><descr>'
			}).inject(frame);
			new Element("span", {
				"class": "span2",
				"title": "Double click to edit",
				text: descr
			}).inject(frame);
			 new Element("span", {
				"class": "span3",
				text: '</descr></frame>'
			}).inject(frame);
		}
		return frame;			
	},
	JSPCode_setup: function() {
		//
		this.options.JSPCode.button.addEvent("click", function(ev){
			ev.preventDefault();
			this.JSPCode_generate();
		}.bind(this));
	},
	JSPCode_generate: function() {
		var container = this.options.JSPCode.el;
		container.empty();
		var frames = this.options.resultEl.getChildren();
		for (var i=0;i<frames.length;i++) {
			var frame = frames[i];
			var tag = new Element("div");
			tag.set("text",'<%-- '+frame.getElement("span.span2").get("text")+' --%>\n\t<wp:show frame="'+i+'" />\n');
			tag.inject(container);
		}
	},
	ClipBoard_setup: function() {
		this.Clipboard_clip = new ZeroClipboard.Client();
		ZeroClipboard.setMoviePath( './resources/ZeroClipboard/ZeroClipboard10.swf' );
		this.Clipboard_clip.setHandCursor(true);  
		this.Clipboard_clip.addEventListener( 'onComplete', function(client,text){ });  
		this.Clipboard_clip.glue(this.options.copyButton);  
		window.addEvent("resize",function(){
			this.Clipboard_clip.reposition();
		}.bind(this));
		
		this.options.copyButton.addEvents({
			"click": function(ev){
				ev.preventDefault();
			}
		});
	},
	Clipboard_getClipboardString: function() {
		var string = this.options.resultEl.get("text");
		string = string.replace(/><descr>/g,">\n\t\t<descr>");
		string = string.replace(/<\/descr><\/frame>/g,"</descr>\n\t</frame>\n\t"); 
		string = "<frames>\n\t"+string+"</frames>";
		string = string.replace(/\t<\/frames>/g,"</frames>");
		this.Clipboard_clip.setText(string);
		//console.log("getclip",string);
		return string;
	},
	Toolbar_generate: function(element) {
		var element = element.getParent();
		var oldel = document.getElement('[class=selected]');
		var mythis = this;
		if (null != oldel) {
			oldel.removeClass("selected");
		}
		element.addClass("selected");
		var toolbar = this.options.resultEl.getElement("div.toolbar");
		if (null != toolbar ) { 
			toolbar.destroy();
		}
		toolbar = new Element("div",{"class": "toolbar"})
		new Element("a", {
			"href": "#",
			"text": " remove",
			"events": {
				"click": function(ev){
					ev.preventDefault();
					this[0].destroy();
					this[1].destroy();
					this[2].Result_updateFramesPositions();
					this[2].AddFunction_updateWhereSelect();
				}.bind([element,toolbar,mythis])
			}
		}).inject(toolbar);
		new Element("a", {
			"href": "#",
			"text": "move-up",
			"events": {
				"click": function(ev){
					ev.preventDefault();
					this[1].destroy();
					if (null != this[0].getPrevious()) {
						this[0].inject(this[0].getPrevious(),"before");
					}
					this[2].Result_updateFramesPositions();
					this[2].AddFunction_updateWhereSelect();
				}.bind([element,toolbar,mythis])
			}
		}).inject(toolbar);
		new Element("a", {
			"href": "#",
			"text": "move-down",
			"events": {
				"click": function(ev){
					ev.preventDefault();
					this[1].destroy();
					if (null != this[0].getNext()) {
						this[0].inject(this[0].getNext(),"after");
					}
					this[2].Result_updateFramesPositions();
					this[2].AddFunction_updateWhereSelect();
				}.bind([element,toolbar,mythis])
			}
		}).inject(toolbar);
		toolbar.inject(element,"after");
	},
	DirectInput_setup: function() {
		var mythis = this;
		var directInput = this.options.directInput.el;
		var loadDirectInput = this.options.directInput.button;
		loadDirectInput.addEvent("click", function(ev){
			ev.preventDefault();
			this[0].loadFromXml(this[1].get("value"));
		}.bind([mythis,directInput]));
	},
	loadFromXml: function(string) {
		var result = this.options.resultEl;
		var array = EntandoPageModelBuilderHelper.readjAPSXml(string);
		if (array != null) {
			result.empty();
			var toolbar = result.getElement("div.toolbar");
			if (null != toolbar) { 
				toolbar.destroy();
			}
			for (var i = 0;i<array.frames.length;i++) {
				var item = array.frames[i];
				var f = this.Result_createNewFrame(item.descr,item.pos);
				f.inject(result);	
			}
			this.Result_updateFramesPositions();
			this.AddFunction_updateWhereSelect(); 
			this.Clipboard_getClipboardString();
		}
		else {
			result.empty();
			new Element("div",{text: "error while loading XML source. Please verify your sintax."}).inject(result);
		}
	}
});

window.addEvent("domready",function(){
	new EntandoPageModelBuilder();
});

var clip = null;
var NewEntandoPageModelsBuilder = new Class({
	Implements: [Events, Options],
	options: {},
	initialize: function() {
		this.setOptions();
		this.options.addframes = {
			form: document.getElement('form[action$="#addFrames"]'),
			description: document.getElement('form[action$="#addFrames"]').getElement('[name="description"]'),
			howmany: document.getElement('form[action$="#addFrames"]').getElement('[name="how-many"]'),
			position: document.getElement('form[action$="#addFrames"]').getElement('[name="position"]'),
			button: document.getElement('form[action$="#addFrames"]').getElement('[name="action:add"]')
		};
		this.options.loadxml = {
			form: document.getElement('form[action$="#loadXml"]'),
			xml: document.getElement('form[action$="#loadXml"]').getElement('[name="xml-source"]'),
			button: document.getElement('form[action$="#loadXml"]').getElement('[name="action:load"]')
		}
		this.options.preview = {
			table: document.getElement(".preview-table"), 
			tbody: document.getElement(".preview-table").getElement(".preview-tbody"), 
			tr: document.getElement(".preview-table").getElement(".preview-sample")
		};
		this.prepareAddFrames();
		this.prepareLoadXmlFrames();
		this.preparePreview();
	},
	prepareAddFrames: function() {
		this.options.addframes.form.addEvent("submit", function(ev){ev.preventDefault()});
		this.options.addframes.button.addEvent("click",function(ev) {
			ev.preventDefault();
			this.insertFrames();
		}.bind(this));
	},
	prepareLoadXmlFrames: function() {
		this.options.loadxml.form.addEvent("submit", function(ev){ev.preventDefault()});
		this.options.loadxml.button.addEvent("click",function(ev) {
			ev.preventDefault();
			this.insertFramesFromXml();
		}.bind(this));
	},
	preparePreview: function() {
		this.options.preview.tr.dispose();
		this.options.preview.tbody.addEvent("click:relay(a.action-delete)", function(ev) {
				ev.preventDefault();
				var tr = ev.target.getParent("tr");
				var pos = this.options.preview.tbody.getElements("tr").indexOf(tr);
				tr.dissolve({
					onComplete: function(){
						this[1].destroy();
						this[0].refreshPreviewPositions(pos);
					}.bind([this, tr])
				});
		}.bind(this));
		this.options.preview.tbody.addEvent("click:relay(a.action-up)", function(ev) {
				ev.preventDefault();
				var tr = ev.target.getParent("tr");
				var trUp = tr.getPrevious();
				if (trUp!=null) {
					var trUpPos = trUp.getElements("td")[0].get("text");
					var trPos = tr.getElements("td")[0].get("text");
					new Fx.Reveal(tr, {
						trUpPos: trUpPos,
						trUp: trUp,
						refresh: this.refreshAll.bind(this),
						onHide: function(tr){
							var trUpPos = this.options.trUpPos;
							var trUp = this.options.trUp;
							tr.getElements("td")[0].set("text", trUpPos);
							tr.inject(trUp, "before");
							this.options.refresh();
							this.reveal();
						}
					}).dissolve();
					new Fx.Reveal(trUp, {
						trPos: trPos,
						onHide: function(trUp){
							var trPos = this.options.trPos;
							trUp.getElements("td")[0].set("text", trPos);
							this.reveal();
						}
					}).dissolve();
				}
		}.bind(this));
		this.options.preview.tbody.addEvent("click:relay(a.action-down)", function(ev) {
				ev.preventDefault();
				var tr = ev.target.getParent("tr");
				var trDown = tr.getNext();
				if (trDown!=null) {
					var trDownPos = trDown.getElements("td")[0].get("text");
					var trPos = tr.getElements("td")[0].get("text");
					new Fx.Reveal(tr, {
						trDownPos: trDownPos,
						trDown: trDown,
						refresh: this.refreshAll.bind(this),
						onHide: function(tr){
							var trDownPos = this.options.trDownPos;
							tr.getElements("td")[0].set("text", trDownPos);
							this.reveal();
						}
					}).dissolve();
					new Fx.Reveal(trDown, {
						trPos: trPos,
						tr: tr,
						refresh: this.refreshAll.bind(this),
						onHide: function(trDown){
							var trPos = this.options.trPos;
							trDown.getElements("td")[0].set("text", trPos);
							trDown.inject(tr, "before");
							this.options.refresh();
							this.reveal();
						}
					}).dissolve();
				}
		}.bind(this));
		this.options.preview.tbody.addEvent("dblclick:relay(.description)", function(ev) {
			ev.stop();
			ev.preventDefault();
			ev.stopPropagation();
			var td = ev.target;
			var oldValue = td.get("text");
			td.set("text", "");
			td.empty();
			var input = new Element("input", {
				type: "text",
				value: oldValue,
				events: {
					"keydown": function(ev) {
						if (ev.key == 'enter') {
							var newValue = this.get("value");
							this.fireEvent("confirm", newValue);
						}
						else if(ev.key=='esc') {
							this.fireEvent("rollback");
						}
					},
					"confirm": function(value) {
						this[0].empty();
						this[0].set("text", value);
						this[1].refreshAll();
					}.bind([td, this, oldValue]),
					"rollback": function() {
						this[0].empty();
						this[0].set("text", this[2]);
					}.bind([td, this, oldValue])
				}
			}).inject(td);
			input.focus();
			input.select();
			new Element("span",{
				"class": "blue radius label",
				"text": "save",
				"styles" : {
					"cursor": "pointer"
				},
				"events" : {
					"click" : function(ev) {
						ev.preventDefault();
						this.fireEvent("confirm", this.get("value"));
					}.bind(input)
				}
			}).inject(td);
			td.appendText(" ");
			new Element("span",{
				"class": "red radius label",
				"text": "discard",
				"styles" : {
					"cursor": "pointer"
				},
				"events" : {
					"click" : function(ev) {
						ev.preventDefault();
						this.fireEvent("rollback");
					}.bind(input)
				}
			}).inject(td);
		}.bind(this));
	},
	insertFrames: function(wantedDescription, wantedPosition, wantedHowMany) {
		var howmany, description, position;
		if (wantedDescription!==undefined&&wantedPosition!==undefined&&wantedHowMany!==undefined) {
			howmany = wantedHowMany;
			description = wantedDescription;
			position = wantedPosition;
		}
		else {
			howmany = new Number(this.options.addframes.howmany.get("value")).valueOf();
			description = this.options.addframes.description.get("value").trim();
			position = new Number(this.options.addframes.position.get("value")).valueOf();
		}
		var romanizedCounter = false;
		if (howmany>1) {
			romanizedCounter = true;
		}
		for (var index = 0; index<howmany; index++) {
			this.createNewFrame(description,position,index, romanizedCounter);
		}
		this.refreshPreviewPositions(position+howmany);
		this.refreshAddFramesPositions();
		this.refreshAll();
	},
	createNewFrame: function(description, position, index, romanizedCounter) {
		description = romanizedCounter ? (description + " " +this.romanize(index+1).trim()) : description;
		index = index !== undefined ? index : 0;
		var tr = this.options.preview.tr.clone();
		var tds = tr.getElements("td");
		tds[0].set("text", position+index);
		tds[1].set("text", description);
		if (position+index == 0) {
			tr.inject(this.options.preview.tbody, "top");
		}
		else {
			var trs = this.options.preview.tbody.getElements("tr");
			if (trs[position+index] != undefined) {
				tr.inject(trs[position+index], "before");
			}
			else {
				tr.inject(this.options.preview.tbody, "bottom");
			}
		}
	},
	insertFramesFromXml: function(wantedXml) {
		var xml;
		if (wantedXml!==undefined) {
			xml = wantedXml;
		}
		else {
			xml = this.options.loadxml.xml.get("value").trim();
		}
		var rootFromString = function rootFromString(string) {
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
		var extractFrames = function(string) {
			var obj = { "frames": [] };
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
		};
		this.options.preview.tbody.empty();
		this.refreshAll();
		var frames = extractFrames(xml).frames;
		Array.each(frames, function(item, index){
			this.createNewFrame(item.descr, new Number(item.pos).valueOf());
		}.bind(this));
		this.refreshAll();
	},
	romanize: function (num) {
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
	},
	refreshPreviewPositions: function(startPosition) {
		var start = 0;
		if (startPosition!==undefined) {
			start = startPosition;
			//console.log("refreshing from: ",start);
		}
		var trs = this.options.preview.tbody.getElements("tr");
		for (var i = start; i < trs.length; i++) {
			var current = trs[i].getElements("td");
			current[0].set("text", i);
		}
	},
	refreshAddFramesPositions: function() {
		var howmany = this.options.preview.tbody.getElements("tr").length;
		this.options.addframes.position.empty();
		var custom = this.options.addframes.position.getNext('div[class="custom dropdown"]');
		var customUl =custom.getElement('ul').empty();
		for (var i = howmany; i >= 0; i--) {
			var opt = new Element("option",{
				"value": i,
				"text": "at position " + i
			}).inject(this.options.addframes.position);
			var li = new Element("li", {
				"text": "at position " + i
			}).inject(customUl);
			if (i==howmany) {
				opt.setProperty("selected", "selected");
				li.addClass("selected");
				custom.getElement(".current").set("text", "at position " + i);
			}
		}
	},
	refreshAll: function() {
		this.refreshXML();
		this.refreshJSP();
		this.refreshSQL();
	},
	refreshXML: function() {
		var xml = document.id("xml-code");
		var string = "<frames>\n\r";
		Array.each(this.options.preview.tbody.getElements("tr"), function(tr) {
			var tds = tr.getElements("td");
			var pos = tds[0].get("text");
			var description = tds[1].get("text");
			string = string + '\t<frame pos="'+pos+'">\n\r';
			string = string + '\t\t<descr>'+description+'</descr>\n\r';
			string = string + "\t</frame>\n\r";
		});
		string = string + "</frames>";
		xml.set("text", string);
	},
	refreshJSP: function() {
		var jsp = document.id("jsp-code");
		var string = "";
		Array.each(this.options.preview.tbody.getElements("tr"), function(tr) {
			var tds = tr.getElements("td");
			var pos = tds[0].get("text");
			var description = tds[1].get("text");
			string = string + '<%-- '+description+' --%>\n\r';
			string = string + '\t<wp:show frame="'+pos+'" />\n\r';
		});
		jsp.set("text", string);	
	},
	refreshSQL: function() {
		var sql = document.id("sql-code");
		var string = "INSERT INTO pagemodels (code, descr, frames, plugincode)\n\tVALUES ('modelcode', 'Sample', '<frames>\n";
		Array.each(this.options.preview.tbody.getElements("tr"), function(tr) {
			var tds = tr.getElements("td");
			var pos = tds[0].get("text");
			var description = tds[1].get("text");
			string = string + '\t<frame pos="'+pos+'">\n\r';
			string = string + '\t\t<descr>'+description.replace(/'/g,"\\'")+'</descr>\n\r';
			string = string + "\t</frame>\n\r";
		});
		string = string + "</frames>', NULL);";
		sql.set("text", string);	
	}
});
window.addEvent("domready", function(){
	new NewEntandoPageModelsBuilder();
})
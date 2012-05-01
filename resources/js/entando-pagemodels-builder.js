var NewEntandoPageModelsBuilder = new Class({
	Implements: [Events, Options],
	options: {},
	initialize: function() {
		this.options.addframes = {
			form: document.getElement('form[action$="#addFrames"]'),
			description: document.getElement('form[action$="#addFrames"]').getElement('[name="description"]'),
			howmany: document.getElement('form[action$="#addFrames"]').getElement('[name="how-many"]'),
			position: document.getElement('form[action$="#addFrames"]').getElement('[name="position"]'),
			button: document.getElement('form[action$="#addFrames"]').getElement('[name="action:add"]'),
			addSingle: document.id("add-single-frame")
		};
		this.options.loadxml = {
			form: document.getElement('form[action$="#loadXml"]'),
			xml: document.getElement('form[action$="#loadXml"]').getElement('[name="xml-source"]'),
			button: document.getElement('form[action$="#loadXml"]').getElement('[name="action:load"]'),
			message: document.id("template-message-xml-load")
		}
		this.options.preview = {
			table: document.getElement(".preview-table"), 
			tbody: document.getElement(".preview-table").getElement(".preview-tbody"), 
			tr: document.getElement(".preview-table").getElement(".preview-sample"),	
			message: document.getElement(".preview-table").getNext("p"),
			mainframe_selector: '[name="main-frame"]'
		};
		this.options.code = {
			xml: document.id("xml-code"),
			jsp: document.id("jsp-code"),
			sql: document.id("sql-code")
		};
		this.options.saveArea = {
			saveButton: document.id("save"),
			saveMessage: document.id("template-message-saved"), 
			savedModelsContainer: document.id("saved-models"),
			disabledElementsWhenNoStorage: document.getElements(".localStorage-disabled")
		};
		this.options.metaData = {
			title: document.id("title"),
			code: document.id("code"),
			plugincode: document.id("plugincode")
		};
		this.setOptions();
		this.setupMetaData();
		this.setupStorage();
		this.prepareAddFrames();
		this.prepareLoadXmlFrames();
		this.preparePreview();
		this.prepareAddSingleFrame();
		this.sortable = null;
		this.prepareCodeArea();
	},
	prepareCodeArea: function() {
		this.options.code.xml.addEvent("click", function(ev){
			ev.target.select();
		});
		this.options.code.jsp.addEvent("click", function(ev){
			ev.target.select();
		});
		this.options.code.sql.addEvent("click", function(ev){
			ev.target.select();
		});
	},
	setupStorage: function() {
		if (window.localStorage!==undefined) {
			this.storedModels = window.localStorage.getItem("entando-page-models-builder-config");
			this.options.saveArea.disabledElementsWhenNoStorage.removeClass("localStorage-disabled");
			if (this.storedModels!==undefined && this.storedModels!==null && this.storedModels.length >0) {
				this.storedModels = JSON.decode(this.storedModels);
				if (!(typeOf(this.storedModels) == 'object')) {
					this.storedModels = {};
				}
			}
			else {
				this.storedModels = {};
			}
			if (this.savedmessageFx===undefined) {
				this.savedmessageFx = new Fx.Morph(this.options.saveArea.saveMessage, {
					link: "cancel",
					duration: 'normal',
					transition: Fx.Transitions.Sine.easeOut,
					onComplete: function(ell) {
						this.savedmessageFx.start({opacity: 0, display: ["", ""]});
					}.bind(this)
				});
			}
			this.options.saveArea.saveButton.addEvent("click", function(ev){
				ev.preventDefault();
				this.storeModel();
				this.savedmessageFx.start({opacity: [1,0], display: ["", ""]});
			}.bind(this));
			this.restoreModelsList();
			this.options.saveArea.savedModelsContainer.addEvent("click:relay(.load-model)", function(ev) {
				ev.preventDefault();
				this.loadStoredModel(ev.target.getParent().retrieve("code"));
				new Fx.Morph(ev.target, {
					duration: 'short',
					transition: Fx.Transitions.Sine.easeOut,
					onComplete: function(ell) {
						new Fx.Morph(ell, {
							duration: 'short',
							transition: Fx.Transitions.Sine.easeOut
						}).start({opacity: [0,1]});
					}
				}).start({opacity: [1,0]});
			}.bind(this));
			this.options.saveArea.savedModelsContainer.addEvent("click:relay(.close)", function(ev) {
				ev.preventDefault();
				var parent = ev.target.getParent();
				this.unStoreModel(parent.retrieve("code"));
				new Fx.Morph(parent, {
					duration: 'short',
					transition: Fx.Transitions.Sine.easeOut,
					onComplete: function(ell) {
						ell.destroy();
					}
				}).start({opacity: [1,0]});
			}.bind(this));
		}
		else {
			this.options.saveArea.disabledElementsWhenNoStorage.destroy();
		}
	},
	storeModel: function() {
		var date = new Date();
		this.storedModels[this.code] = {
			title: this.title,
			code: this.code,
			plugincode: this.plugincode,
			xml: this.options.code.xml.get("value"),
			date: (date.getDate()<10?"0"+date.getDate() : date.getDate()) + "/" + (date.getMonth()<10?"0"+date.getMonth() : date.getMonth()) + "/" + date.getFullYear() + " " + (date.getHours()<10?"0"+date.getHours() : date.getHours()) + ":" + (date.getMinutes()<10?"0"+date.getMinutes() : date.getMinutes()) + ":" + (date.getSeconds()<10?"0"+date.getSeconds() : date.getSeconds())
		};
		window.localStorage.setItem("entando-page-models-builder-config", JSON.encode(this.storedModels));
		this.createSavedModelButtonLoader(this.storedModels[this.code]);
	},
	restoreModelsList: function() {
		Object.each(this.storedModels, function(item){
			this.createSavedModelButtonLoader(item);
		}.bind(this));
	},
	createSavedModelButtonLoader: function(item) {
			var previous = this.options.saveArea.savedModelsContainer.getElement("#model_"+item.code);
				var div = new Element("div", {
					"class": "alert-box success",
					"id": "model_"+item.code
				});
				if (previous!=null) {
					div.inject(previous, "after");
					previous.destroy();
				}
				else {
					div.setStyle("opacity", "0");
					div.inject(this.options.saveArea.savedModelsContainer);
					new Fx.Morph(div, {
						duration: 'short',
						transition: Fx.Transitions.Sine.easeOut
					}).start({opacity: [0,1]});
				}
				div.store("code", item.code);
				new Element("span", {
					"class": "load-model",
					href: "",
					text: item.title + " ("+item.code+", "+item.date+")",
					title: "Saved "+ item.date + ". Click to load",
					styles: {
						cursor: "pointer"
					}
				}).inject(div);
				new Element("a", {
					href: "",
					"class": "close",
					"html": "&times;",
					"title": "Delete "+ item.title+" ("+item.code+")"
				}).inject(div);
	},
	loadStoredModel: function(code) {
		var modelObj = this.storedModels[code];
		if (modelObj!==undefined) {
			this.insertFramesFromXml(modelObj.xml);
			this.options.metaData.title.set("value", modelObj.title);
			this.options.metaData.code.set("value", modelObj.code);
			this.options.metaData.plugincode.set("value", (modelObj.plugincode=='NULL'? "" : modelObj.plugincode));
			this.title=modelObj.title;
			this.code=modelObj.code;
			this.plugincode=modelObj.plugincode;
			this.refreshAll();
		}
	},
	unStoreModel: function(code) {
		delete this.storedModels[code];
		window.localStorage.setItem("entando-page-models-builder-config", JSON.encode(this.storedModels));
	},
	setupMetaData: function() {
		this.title = this.options.metaData.title.get("value") != null && this.options.metaData.title.get("value") != "" ? this.options.metaData.title.get("value") : this.options.metaData.title.getProperty("placeholder");
		this.code = this.options.metaData.code.get("value") != null && this.options.metaData.code.get("value") != "" ? this.options.metaData.code.get("value") : this.options.metaData.code.getProperty("placeholder");
		this.plugincode = this.options.metaData.plugincode.get("value") != null && this.options.metaData.plugincode.get("value") != "" ? this.options.metaData.plugincode.get("value") : "NULL";
		this.options.metaData.title.addEvent("change", function(ev){
			this.title = ev.target.get("value");
			this.refreshSQL();
		}.bind(this));
		this.options.metaData.title.addEvent("keydown", function(ev){
			if(ev.key == 'enter'){
				ev.preventDefault();
				this.title = ev.target.get("value");
				this.refreshSQL();
			}
		}.bind(this));
		this.options.metaData.code.addEvent("change", function(ev){
			this.code = ev.target.get("value").replace(/[^\w\d_\-\.]/g,"");
			ev.target.set("value",this.code);
			this.refreshSQL();
		}.bind(this));
		this.options.metaData.code.addEvent("keydown", function(ev){
			if(ev.key == 'enter'){
				ev.preventDefault();
				this.code = ev.target.get("value").replace(/[^\w\d_\-\.]/g,"");
				ev.target.set("value",this.code);
				this.refreshSQL();
			}
		}.bind(this));
		this.options.metaData.plugincode.addEvent("change", function(ev){
			this.plugincode = ev.target.get("value").replace(/[^\w\d_\-\.]/g,"");
			if (this.plugincode.length<=0) {
				this.plugincode = "NULL";
				ev.target.set("value","");
			}
			else {
				ev.target.set("value",this.plugincode);
			}
			this.refreshSQL();
		}.bind(this));
		this.options.metaData.plugincode.addEvent("keydown", function(ev){
			if(ev.key == 'enter'){
				ev.preventDefault();
				this.plugincode = ev.target.get("value").replace(/[^\w\d_\-\.]/g,"");
				if (this.plugincode.length<=0) {
					this.plugincode = "NULL";
					ev.target.set("value","");
				}
				else {
					ev.target.set("value",this.plugincode);
				}
				this.refreshSQL();
			}
		}.bind(this));
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
		if (this.loadedMessageFx===undefined) {
			this.loadedMessageFx = new Fx.Morph(this.options.loadxml.message, {
				link: "cancel",
				duration: 'normal',
				transition: Fx.Transitions.Sine.easeOut,
				onComplete: function(ell) {
					this.loadedMessageFx.start({opacity: 0, display: ["", ""]});
				}.bind(this)
			});
		}
		this.options.loadxml.button.addEvent("click",function(ev) {
			ev.preventDefault();
			this.insertFramesFromXml();
			this.loadedMessageFx.start({opacity: [1,0], display: ["", ""]});
		}.bind(this));
	},
	preparePreview: function() {
		this.options.preview.disabled=true;
		this.options.preview.tr.dispose();
		this.options.preview.tbody.addEvent("click:relay(a.action-delete)", function(ev) {
				ev.preventDefault();
				var tr = ev.target.getParent("tr");
				var pos = this.options.preview.tbody.getElements("tr").indexOf(tr);
				tr.dissolve({
					onComplete: function(){
						this[0].sortable.removeItems(this[1]);
						this[1].destroy();
						this[0].refreshPreviewPositions(this[2]);
						this[0].refreshAll();
					}.bind([this, tr, pos])
				});
		}.bind(this));
		this.options.preview.tbody.addEvent("click:relay(a.action-up)", function(ev) {
				ev.preventDefault();
				var tr = ev.target.getParent("tr");
				var trUp = tr.getPrevious();
				if (trUp!=null) {
					var trUpPos = trUp.getElement(".position").get("text");
					var trPos = tr.getElement(".position").get("text");
					new Fx.Morph(tr, {
						trUpPos: trUpPos,
						trUp: trUp,
						refreshAll: this.refreshAll.bind(this),
						onComplete: function(tr) {
							var trUpPos = this.options.trUpPos;
							var trUp = this.options.trUp;
							tr.getElements("td")[0].set("text", trUpPos);
							tr.inject(trUp, "before");
							new Fx.Morph(tr, {
								refreshAll: this.options.refreshAll,
								onComplete: function() {
									this.options.refreshAll();
								}
							}).start({opacity: [0,1]});
						}
					}).start({opacity: [1,0]});
					new Fx.Morph(trUp, {
						trPos: trPos,
						onComplete: function(trUp) {
							var trPos = this.options.trPos;
							trUp.getElements("td")[0].set("text", trPos);
							new Fx.Morph(trUp).start({opacity: [0,1]});
						}
					}).start({opacity: [1,0]});
				}
		}.bind(this));
		this.options.preview.tbody.addEvent("click:relay(a.action-down)", function(ev) {
				ev.preventDefault();
				var tr = ev.target.getParent("tr");
				var trDown = tr.getNext();
				if (trDown!=null) {
					var trDownPos = trDown.getElement(".position").get("text");
					var trPos = tr.getElement(".position").get("text");
					new Fx.Morph(tr, {
						trDownPos: trDownPos,
						trDown: trDown,
						onComplete: function(tr){
							var trDownPos = this.options.trDownPos;
							tr.getElement(".position").set("text", trDownPos);
							new Fx.Morph(tr).start({opacity: [0,1]});
						}
					}).start({opacity: [1,0]});
					new Fx.Morph(trDown, {
						trPos: trPos,
						tr: tr,
						refreshAll: this.refreshAll.bind(this),
						onComplete: function(trDown){
							var trPos = this.options.trPos;
							trDown.getElement(".position").set("text", trPos);
							trDown.inject(tr, "before");
							new Fx.Morph(trDown, {
								refreshAll: this.options.refreshAll,
								onComplete: function(trDown){
									this.options.refreshAll();
								}
							}).start({opacity: [0,1]});
						}
					}).start({opacity: [1,0]});
				}
		}.bind(this));
		this.options.preview.tbody.addEvent("dblclick:relay(.description)", function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			var td = ev.target;
			ev.stop();
			if (td.retrieve("edit-status")==null ||td.retrieve("edit-status")==undefined) {
				td.store("edit-status", true);
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
							this[1].refreshXML();
							this[1].refreshJSP();
							this[1].refreshSQL();
							this[0].store("edit-status", null);
						}.bind([td, this, oldValue]),
						"rollback": function() {
							this[0].empty();
							this[0].set("text", this[2]);
							this[0].store("edit-status", null);
							this[1].refreshXML();
							this[1].refreshJSP();
							this[1].refreshSQL();
						}.bind([td, this, oldValue])
					}
				}).inject(td);
				input.focus();
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
			}		
		}.bind(this));
		this.options.preview.tbody.addEvent("mousedown:relay(.description)", function(ev) {
			ev.target.getParent("tr").addClass("while-mousedown");
			ev.target.getParent("tr").removeClass("mouseup");
		});
		this.options.preview.tbody.addEvent("mouseup:relay(.description)", function(ev) {
			ev.target.getParent("tr").removeClass("while-mousedown");
			ev.target.getParent("tr").addClass("mouseup");
		});
		this.options.preview.tbody.addEvent("change:relay("+this.options.preview.mainframe_selector+")", function(ev){
			var status = ev.target.get("checked");
			this.options.preview.tbody.getElements(this.options.preview.mainframe_selector).set("checked", false);
			ev.target.set("checked", status);
			this.refreshXML();
			this.refreshJSP();
			this.refreshSQL();
		}.bind(this));
	},
	prepareAddSingleFrame: function() {
		this.options.addframes.addSingle.addEvent("click", function(ev){
			ev.preventDefault();
			this.createNewFrame();
			this.refreshAll();
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
			this.createNewFrame(description!=null&&description.length>0?description:"frame",position,index, romanizedCounter);
		}
		this.refreshPreviewPositions(position+howmany);
		this.refreshAll();
	},
	createNewFrame: function(description, position, index, romanizedCounter, main) {
		if (this.options.preview.disabled) {
			this.options.preview.table.setStyle("display", "");
			this.options.preview.message.setStyle("display", "");
			$(window).trigger('resize');
			this.options.preview.disabled=false;
		} 
		var tr = this.options.preview.tr.clone();
		var tds = tr.getElements("td");
		description = (description !== undefined && description.length > 0) ? description : tds[1].get("text");
		description = romanizedCounter ? (description + " " +this.romanize(index+1).trim()) : description;
		index = index !== undefined ? index : 0;
		position = position!==undefined ? position : this.options.preview.tbody.getElements("tr").length;
		tr.setStyle("display", "none");
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
		new Fx.Reveal(tr).reveal();
		if (this.sortable==null) {
			this.setupSortable();
		}
		else {
			this.sortable.addItems(tr);
		}
		if (main!==undefined&&main==true) {
			tr.getElement(this.options.preview.mainframe_selector).set("checked", true);
		}
		return tr;
	},
	setupSortable: function() {
		this.sortable = new Sortables(this.options.preview.tbody,{
			clone: false,
			handle: "td:first-child",
			onStart: function(element, clone) {
				element.addClass("while-dragging");
				//clone.addClass("while-dragging");
			},
			onComplete: function(element, clone) {
				this.refreshPreviewPositions();
				this.refreshXML();
				this.refreshJSP();
				this.refreshSQL();
				element.removeClass("while-dragging");
			}.bind(this)
		});
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
					root.loadXML('<?xml version="1.0"?>\n'+string);
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
				var frames = dom.getElementsByTagName("frames")[0];
				if (frames!==undefined) {
					frames = frames.getElementsByTagName("frame");
					var framesWithNoValidPos = [];
					var mainDiscovered = false;
					Array.each(frames, function(child, index) {
						var pos = child.getAttribute("pos");
						var descr = child.getElementsByTagName("descr");
						var main = child.getAttribute("main");
						if (descr!==undefined) {
							descr = descr[0];
						}
						if (descr!==undefined) {
							descr = descr.childNodes[0];
						}
						if (descr!==undefined) {
							descr = descr.nodeValue;
						}
						if (pos===undefined||pos===null) {
							pos = "";
						}
						if (descr===undefined) {
							descr = "Untitled Frame";
						}
						if (main!==undefined && main!==null && !mainDiscovered) {
							main = true;
							mainDiscovered=true;
						}
						else {
							main = false;
						}
							pos = pos.trim().replace(/[\n\r\ta-zA-Z]/g,"");
							if (pos.length>0) {
								pos = new Number(pos).valueOf();
							}
							else {
								pos = null;
							}
							pos = (pos !== Infinity && pos !== NaN && pos !== - Infinity && pos >= 0 ? pos : null);
							descr = descr.trim().replace(/[\n\r\t]/g,"");
							if (pos!==null && obj.frames[pos]===undefined) {
								obj.frames[pos] = {
									pos: pos,
									descr: descr,
									main: main
								};
							}
							else {
								if (obj.frames[index]===undefined) {
									obj.frames[index]="fillme";
								}
								framesWithNoValidPos.push({
									pos: index,
									descr: descr,
									main: main
								});
							}
					});
					obj.frames = obj.frames.sort(function(a,b){
						var a = new Number(a.pos).valueOf(); 
						var b = new Number(b.pos).valueOf();
						if (a!==NaN&&b!==NaN) return a-b;
						if (a==NaN&&b!==NaN) return b;
						if (a!==NaN&&b==NaN) return a;
					});
					for (var i = 0; i<obj.frames.length;i++) {
						if (obj.frames[i] == "fillme") {
							if (framesWithNoValidPos[0]!==undefined) {
								obj.frames[i] = framesWithNoValidPos[0];
								framesWithNoValidPos.shift();
							} 
							else {
								break;
							}
						}
					}
				}
			}
			return obj;
		};
		this.options.preview.tbody.empty();
		var frames = extractFrames(xml).frames;
		Array.each(frames, function(item, index){
			this.createNewFrame(item.descr, index, undefined, false, item.main);
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
	deromanize: function(roman) {
		var roman = roman.split('');
		var lookup = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
		var num = 0;
		var val = 0;
		while (roman.length) {
			val = lookup[roman.shift()];
			num += val * (val < lookup[roman[0]] ? -1:1);
		}
		return num;
	},
	findEndingRomanian: function(string) {
		string = string.split("");
		var test = true;
		var counter = string.length-1;
		while (test) {
			var c = string[counter];
			var check = c.test(/[CDMXLIV]/);
			if (check) {
				counter = counter - 1;
			}
			test = check;
		}
		return string.join("").substring(counter+1);
	},
	refreshPreviewPositions: function(startPosition) {
		var start = 0;
		if (startPosition!==undefined) {
			start = startPosition;
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
		this.refreshAddFramesPositions();
		this.refreshXML();
		this.refreshJSP();
		this.refreshSQL();
		if (this.sortable!==null) { this.sortable.detach(); }
		this.setupSortable();
	},
	refreshXML: function() {
		var string = "<frames>";
		Array.each(this.options.preview.tbody.getElements("tr"), function(tr) {
			var tds = tr.getElements("td");
			var pos = tr.getElement(".position").get("text");
			var tdDescr = tr.getElement(".description");
			var description = tdDescr.getElement("input")==null ? tdDescr.get("text") : tdDescr.getElement("input").get("value") ;
			description = description.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
			var main = tr.getElement(this.options.preview.mainframe_selector).get("checked") == true ? ' main="true"' : '';
			string = string + '\n\t<frame pos="'+pos+'"'+main+'>';
			string = string + '\n\t\t<descr>'+description+'</descr>';
			string = string + "\n\t</frame>";
		}.bind(this));
		string = string + "\n</frames>";
		this.options.code.xml.set("value", string);
	},
	refreshJSP: function() {
		var string = '<%@ taglib prefix="wp" uri="/aps-core" %>\n\n';
		Array.each(this.options.preview.tbody.getElements("tr"), function(tr) {
			var tds = tr.getElements("td");
			var pos = tr.getElement(".position").get("text");
			var tdDescr = tr.getElement(".description");
			var description = tdDescr.getElement("input")==null ? tdDescr.get("text") : tdDescr.getElement("input").get("value") ;
			var main = (tr.getElement(this.options.preview.mainframe_selector).get("checked") == true) ? ' //the main frame' : '';
			string = string + '<%-- '+pos+'. '+description+main+' --%>\n';
			string = string + '\t<wp:show frame="'+pos+'" />\n\n';
		}.bind(this));
		this.options.code.jsp.set("value", string);	
	},
	refreshSQL: function() {
		var string = "-- DELETE FROM pagemodels where code = '"+this.code+"';\n\nINSERT INTO pagemodels (code, descr, frames, plugincode)\n\tVALUES ('"+this.code+"', '"+this.title.replace(/\\/g, "\\\\").replace(/'/g, "\\'")+"', '<frames>";
		Array.each(this.options.preview.tbody.getElements("tr"), function(tr) {
			var tds = tr.getElements("td");
			var pos = tr.getElement(".position").get("text");
			var tdDescr = tr.getElement(".description");
			var description = tdDescr.getElement("input")==null ? tdDescr.get("text") : tdDescr.getElement("input").get("value");
			description = description.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\/g, "\\\\").replace(/'/g, "\\'");
			var main = tr.getElement(this.options.preview.mainframe_selector).get("checked") == true ? ' main="true"' : '';
			string = string + '\n\t<frame pos="'+pos+'"'+main+'>';
			string = string + '\n\t\t<descr>'+description+'</descr>';
			string = string + "\n\t</frame>";
		}.bind(this));
		string = string + "\n</frames>', "+(this.plugincode=="NULL" ? this.plugincode: "'"+this.plugincode+"'")+");";
		this.options.code.sql.set("value", string);	
	}
});
window.addEvent("domready", function(){
	new NewEntandoPageModelsBuilder();
	/* temporary fix for tips nested in tabs */
	Array.each([
		document.getElement('a[href="#preview"]'), 
		document.getElement('a[href="#codeXML"]'), 
		document.getElement('a[href="#codeJSP"]'), 
		document.getElement('a[href="#codeSQL"]')
		], function(item) {
		item.addEvent("click", function(){
			var fn = function(){
				$(window).trigger('resize');
			};
			fn.delay(35);
		});
	});
})
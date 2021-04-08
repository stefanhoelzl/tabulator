import Module from '../../core/Module.js';

import defaultBindings from './defaults/bindings.js';
import defaultActions from './defaults/actions.js';

class Keybindings extends Module{

	constructor(table){
		super(table);

		this.watchKeys = null;
		this.pressedKeys = null;
		this.keyupBinding = false;
		this.keydownBinding = false;

		this.registerTableOption("keybindings", []); //array for keybindings
		this.registerTableOption("tabEndNewRow", false); //create new row when tab to end of table
	}

	initialize(){
		var bindings = this.table.options.keybindings,
		mergedBindings = {};

		this.watchKeys = {};
		this.pressedKeys = [];

		if(bindings !== false){

			for(let key in Keybindings.bindings){
				mergedBindings[key] = Keybindings.bindings[key];
			}

			if(Object.keys(bindings).length){

				for(let key in bindings){
					mergedBindings[key] = bindings[key];
				}
			}

			this.mapBindings(mergedBindings);
			this.bindEvents();
		}
	}

	mapBindings(bindings){
		for(let key in bindings){
			if(Keybindings.actions[key]){
				if(bindings[key]){
					if(typeof bindings[key] !== "object"){
						bindings[key] = [bindings[key]];
					}

					bindings[key].forEach((binding) => {
						this.mapBinding(key, binding);
					});
				}
			}else{
				console.warn("Key Binding Error - no such action:", key);
			}
		}
	}

	mapBinding(action, symbolsList){
		var binding = {
			action: Keybindings.actions[action],
			keys: [],
			ctrl: false,
			shift: false,
			meta: false,
		};

		var symbols = symbolsList.toString().toLowerCase().split(" ").join("").split("+");

		symbols.forEach((symbol) => {
			switch(symbol){
				case "ctrl":
				binding.ctrl = true;
				break;

				case "shift":
				binding.shift = true;
				break;

				case "meta":
				binding.meta = true;
				break;

				default:
				symbol = parseInt(symbol);
				binding.keys.push(symbol);

				if(!this.watchKeys[symbol]){
					this.watchKeys[symbol] = [];
				}

				this.watchKeys[symbol].push(binding);
			}
		});
	}

	bindEvents(){
		var self = this;

		this.keyupBinding = function(e){
			var code = e.keyCode;
			var bindings = self.watchKeys[code];

			if(bindings){

				self.pressedKeys.push(code);

				bindings.forEach(function(binding){
					self.checkBinding(e, binding);
				});
			}
		};

		this.keydownBinding = function(e){
			var code = e.keyCode;
			var bindings = self.watchKeys[code];

			if(bindings){

				var index = self.pressedKeys.indexOf(code);

				if(index > -1){
					self.pressedKeys.splice(index, 1);
				}
			}
		};

		this.table.element.addEventListener("keydown", this.keyupBinding);

		this.table.element.addEventListener("keyup", this.keydownBinding);
	}

	clearBindings(){
		if(this.keyupBinding){
			this.table.element.removeEventListener("keydown", this.keyupBinding);
		}

		if(this.keydownBinding){
			this.table.element.removeEventListener("keyup", this.keydownBinding);
		}
	}

	checkBinding(e, binding){
		var match = true;

		if(e.ctrlKey == binding.ctrl && e.shiftKey == binding.shift && e.metaKey == binding.meta){
			binding.keys.forEach((key) => {
				var index = this.pressedKeys.indexOf(key);

				if(index == -1){
					match = false;
				}
			});

			if(match){
				binding.action.call(this, e);
			}

			return true;
		}

		return false;
	}
}

Keybindings.moduleName = "keybindings";

//load defaults
Keybindings.bindings = defaultBindings;
Keybindings.actions = defaultActions;

export default Keybindings;
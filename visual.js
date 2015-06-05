var flow = (function(){
	/* convenience */
	function elementSVG(tag){
		return document.createElementNS("http://www.w3.org/2000/svg", tag);
	}
	function box(id, dir){
		var box = elementSVG("g");
		box.id = id;
		box.setAttribute("data-bind", "tight");
		box.setAttribute("data-dir", dir);
		return box;
	}

	/* make elements */
	function ioCell(io, id){
		var g = elementSVG("g");
		g.id = id;
		if(io.type !== undefined){
			g.classList.add(io.type);
		}
		if(io.description !== undefined){
			var title = elementSVG("title");
			g.appendChild(title);
			var titletext = document.createTextNode(io.description);
			title.appendChild(titletext);
		}
		var rect = elementSVG("rect");
		g.appendChild(rect);
		var text = elementSVG("text");
		g.appendChild(text);
		var node = document.createTextNode(io.name);
		text.appendChild(node);
		return g;
	}
	function ioBoxes(ios, id){
		var me = box(id, "v");
		ios.map(function(io, n){
			me.appendChild(ioCell(io, id + "." + n));
		});
		return me;
	}
	function bodyBox(fn, id){
		var me = ioCell(fn, id);
		me.classList.add("body");
		return me;
	}
	function view(func, id){
		var me = box(id, "h");
		me.classList.add("fn");
		me.appendChild(ioBoxes(func.in, id + '.in'));
		me.appendChild(bodyBox(func, id + '.body'));
		me.appendChild(ioBoxes(func.out, id + '.out'));
		return me;
	}

	return {
		View : function(func, id){
			return view(func, id);
		},
	}
})();

var fns = {
	"476131ca": { name: "+", description: "N = n + n",
		in: [	{ name: "n", type: "int" }, { name: "n", type: "int" }, ],
		out: [	{ name: "N", type: "int" }, ],
	},
	"4c12fbae": { name: "-", description: "N = n₁ - n₂",
		in: [	{ name: "n₁", type: "int" }, { name: "n₂", type: "int" }, ],
		out: [	{ name: "N", type: "int" }, ],
	},
	"2c4916e2": { name: "-", description: "N = -n",
		in: [	{ name: "n", type: "int" }, ],
		out: [	{ name: "N", type: "int" }, ],
	},
	"941145c4": { name: ">", description: "B = n₁ > n₂",
		in: [	{ name: "n₁", type: "int" }, { name: "n₂", type: "int" }, ],
		out: [	{ name: "B", type: "bool" }, ],
	},
	"5165da0e": { name: "±", description: "N₁, N₂ = n₁ ± n₂",
		in: [	{ name: "n₁", type: "int" }, { name: "n₂", type: "int" }, ],
		out: [	{ name: "N₁", type: "int" }, { name: "N₂", type: "int" }, ],
		fns: [	{ ref: "476131ca" }, { ref: "4c12fbae" } ],
		map: [
			{ fr:"in.0", to:"0.in.0" },
			{ fr:"in.1", to:"0.in.1" },
			{ fr:"in.0", to:"1.in.0" },
			{ fr:"in.1", to:"1.in.1" },
			{ fr:"0.out.0", to:"out.0" },
			{ fr:"1.out.0", to:"out.1" },
		]
	},
	"5966100c": { name: "foolish", description: "",
		in: [
			{ name: "n", type: "int" },
			{ name: "n", type: "int" },
		],
		out: [
			{ name: "N", type: "int" },
			{ name: "N", type: "int" },
			{ name: "--N--", type: "int" },
		],
	},
};

var me;
var svg;
function draw(){
	svg = document.getElementsByTagName("svg")[0];
	example = flow.View(fns["5165da0e"], "5165da0e");
	svg.appendChild(example);
	normalize(example);
	example.setAttribute("transform", "translate(20, 20)");
}

function getMinBoxes(node){
	var zero = { width: 0, height: 0, };
	if(node.tagName === "rect"){
		return zero;
	} else if(node.tagName == "text"){
		var base = node.getBBox();
		var fontsize = window.getComputedStyle(node, null).getPropertyValue("font-size").slice(0, -2);
		return {
			width: base.width + fontsize/2,
			height: base.height + fontsize/4,
		};
	} else if(node.tagName == "g"){
		var ret = {};
		if(node.id !== undefined){
			ret.id = node.id;
		}

		ret.children = [];
		for(var i=0; i<node.children.length; i++){
			ret.children[i] = getMinBoxes(node.children[i]);
		}

		var maxBox = ret.children.reduce(function(a, b){
			return {
				width: a.width > b.width ? a.width : b.width,
				height: a.height > b.height ? a.height : b.height,
			}
		}, zero);

		var sumBox = ret.children.reduce(function(a, b){
			return {
				width: a.width + b.width,
				height: a.height + b.height,
			}
		}, zero);

		if(node.dataset.bind === "tight" && node.dataset.dir === "h"){
			ret.width = sumBox.width;
			ret.height = maxBox.height;
		} else if(node.dataset.bind === "tight" && node.dataset.dir === "v"){
			ret.width = maxBox.width;
			ret.height = sumBox.height;
		} else {
			ret.width = maxBox.width;
			ret.height = maxBox.height;
		}
		return ret;
	}
	return zero;
}

function setBoxes(node, spec){
	if(node.tagName === "rect"){
		node.setAttribute("width", spec.width);
		node.setAttribute("height", spec.height);
	} else if(node.tagName === "text"){
		node.setAttribute("x", spec.width/2 - node.getBBox().width/2);
		node.setAttribute("y", spec.height/2 + node.getBBox().height/4);
	} else if(node.tagName === "g"){
		if(spec.x !== undefined && spec.y !== undefined){
			node.setAttribute("transform", "translate("+spec.x+","+spec.y+")");
		}

		var heightD = spec.heightO === undefined ? 0 :
			(spec.height - spec.heightO)/spec.children.length;
		var widthD = spec.widthO === undefined ? 0 :
			(spec.width - spec.widthO)/spec.children.length;

		var width = 0;
		var height = 0;
		for(var i=0; i<node.children.length; i++){
			spec.children[i].widthO = spec.children[i].width;
			spec.children[i].heightO = spec.children[i].height;
			spec.children[i].x = width;
			spec.children[i].y = height;
			if(node.dataset.bind === "tight" && node.dataset.dir === "h"){
				spec.children[i].width += widthD;
				width += spec.children[i].width;
				spec.children[i].height = spec.height;
			} else if(node.dataset.bind === "tight" && node.dataset.dir === "v"){
				spec.children[i].height += heightD;
				height += spec.children[i].height;
				spec.children[i].width = spec.width;
			} else {
				spec.children[i].width = spec.width;
				spec.children[i].height = spec.height;
			}
			setBoxes(node.children[i], spec.children[i]);
		}
	}
}

function normalize(node){
	svg = document.getElementsByTagName("svg")[0];
	setBoxes(node, getMinBoxes(node));
}

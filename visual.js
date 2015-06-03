var flow = (function(){
	/* to calculate cells spans properly */
	function gcf(a, b){
		if(b == 0) return a;
		a = a % b;
		return gcf(b, a);
	}
	function lcm(a, b){
		return a*b/gcf(a,b);
	}

	/* convenience */
	function elementSVG(tag){
		return document.createElementNS("http://www.w3.org/2000/svg", tag);
	}
	function elementHTML(tag){
		return document.createElementNS("http://www.w3.org/1999/xhtml", tag);
	}

	/* user interaction */
	function move(e){
		var node = this.parentNode;
		var xoffset = e.clientX - node.x.baseVal.value;
		var yoffset = e.clientY - node.y.baseVal.value;
		var movement = function(e){
			node.x.baseVal.value = e.clientX - xoffset;
			node.y.baseVal.value = e.clientY - yoffset;
		}
		window.addEventListener("mousemove", movement);
		window.addEventListener("mouseup", function cleanup (e){
			window.removeEventListener("mousemove", movement);
			window.removeEventListener("mouseup", cleanup);
		});
		return false;
	}

	/* make elements */
	function cell(node, id, rows){
		var td = elementHTML("td");
		var text = document.createTextNode(node.name);
		td.appendChild(text);
		td.setAttribute("rowspan", rows);
		td.setAttribute("id", id);
		if(node.type !== undefined){
			td.setAttribute("class", node.type);
		}
		if(node.description !== undefined){
			td.setAttribute("title", node.description);
		}
		return td;
	}
	function row(cols, id, n, total){
		var row = elementHTML("tr");
		for(i in cols){
			var span = total/cols[i].length;
			if(n % span == 0){
				row.appendChild(cell(cols[i][n/span],
							id + ':' + i + n/span, span));
			}
		}
		return row;
	}
	function inner(func, id){
			var table = elementHTML("table");
			var rowCount = lcm(func.in.length, func.out.length);
			var cols = {i: func.in, b: [func], o: func.out};
			for(var i = 0; i < rowCount; i++){
				table.appendChild(row(cols, id, i, rowCount));
			}
			table.setAttribute("id", id);
			table.setAttribute("class", "fn");
			table.addEventListener("mousedown", move);
			return table;
	}
	return {
		View : function(func, id, par){
			var g = elementSVG("foreignObject");
			var table = inner(func, id);
			g.appendChild(table);
			par.appendChild(g);
			g.setAttribute("width", table.offsetWidth);
			g.setAttribute("height", table.offsetHeight);
			return {
				me: g,
			}
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
			{ fr:[0], to:[0,0] }, { fr:[1], to:[0,1] },
			{ fr:[0], to:[1,0] }, { fr:[1], to:[1,1] },
			{ fr:[0,0], to:[0] }, { fr:[0,1], to:[1] },
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

var me = {};
var svg;
function draw(){
	svg = document.getElementsByTagName("svg")[0];
	for(i in fns){
		me[i] = flow.View(fns[i], i, svg);
	}
	var n=0;
	for(i in me){
		me[i].me.setAttribute("x", 20);
		me[i].me.setAttribute("y", 20 + n*50);
		n++
	}
}

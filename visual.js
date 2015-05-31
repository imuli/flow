function elementSVG(tag){
	return document.createElementNS("http://www.w3.org/2000/svg", tag);
}
function elementHTML(tag){
	return document.createElementNS("http://www.w3.org/1999/xhtml", tag);
}
function ioBox(io, rows){
	var td = elementHTML("td");
	var text = document.createTextNode(io.name);
	td.appendChild(text);
	td.setAttribute("class", io.type);
	td.setAttribute("rowspan", rows);
	return td;
}
function gcf(a, b){
	if(b == 0) return a;
	a = a % b;
	return gcf(b, a);
}
function lcm(a, b){
	return a*b/gcf(a,b);
}
function funcView(func, par){
	var g = elementSVG("foreignObject");
	var table = elementHTML("table");
	table.setAttribute("class", "fn");
	g.appendChild(table);
	par.appendChild(g);
	var rows = lcm(func.in.length, func.out.length);
	var inputs=outputs=[], body;
	var ispan = rows/func.in.length;
	var ospan = rows/func.out.length;
	for(var i = 0; i < rows; i++){
		var row = elementHTML("tr");
		if(i % ispan == 0){
			inputs[i] = ioBox(func.in[i/ispan], ispan);
			row.appendChild(inputs[i]);
		}
		if(i < 1){
			body = ioBox(func, rows);
			row.appendChild(body);
		}
		if(i % ospan == 0){
			outputs[i] = ioBox(func.out[i/ospan], ospan);
			row.appendChild(outputs[i]);
		}
		table.appendChild(row);
	}
	g.setAttribute("width", table.offsetWidth);
	g.setAttribute("height", table.offsetHeight);
	return {
		me: g,
		body: body,
		in: inputs,
		out: outputs,
	}
}

var fns = {
	"476131ca": { name: "+", description: "n + n = N",
		in: [	{ name: "n", type: "int" }, { name: "n", type: "int" }, ],
		out: [	{ name: "N", type: "int" }, ],
	},
	"4c12fbae": { name: "-", description: "n₁ - n₂ = N",
		in: [	{ name: "n₁", type: "int" }, { name: "n₂", type: "int" }, ],
		out: [	{ name: "N", type: "int" }, ],
	},
	"5165da0e": { name: "±", description: "n₁ ± n₂ = N₁, N₂",
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
			{ name: "N", type: "int" },
		],
	},
};

var me = {};
var svg;
function draw(){
	svg = document.getElementsByTagName("svg")[0];
	for(i in fns){
		me[i] = funcView(fns[i], svg);
	}
	var n=0;
	for(i in me){
		n++
		me[i].me.setAttribute("x", 20);
		me[i].me.setAttribute("y", 20 + n*50);
	}
}

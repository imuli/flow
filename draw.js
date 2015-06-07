var graph, paper, root, layout;

function initDraw() {
	graph = new joint.dia.Graph;
	paper = new joint.dia.Paper({
		el: $('#paper'),
		width: "100%",
		height: "100%",
		gridSize: 1,
		model: graph,
		defaultLink: new joint.dia.Link({
			connector: { name: 'smooth' },
			attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' } }
		}),
		validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
			if(magnetT === undefined) return false;
			return magnetS.getAttribute('class') != magnetT.getAttribute('class');
		},
		markAvailable: true
	});

	root = makemodel(fns, '5165da0e');

	joint.layout.DirectedGraph.layout(graph, {});

	paper.on('all', function(){
		console.log(arguments);
	});
}

function fnmodel(fn, id){
	return new joint.shapes.flow.Model({
		id: id,
		position: { x: 20, y: 20 },
		inPorts: fn.in.map(function(x, n){ return {id: 'i' + n, name: x.name }}),
		outPorts: fn.out.map(function(x, n){ return {id: 'o' + n, name: x.name }}),
		attrs: {
			'.label': { text: fn.name },
			rect: { rx: 25, ry: 25 },
			'.inPorts circle': { fill: 'lime', magnet: 'passive', class: 'input' },
			'.outPorts circle': { fill: 'lime', class: 'input' },
		}
	});
}

function which(arr, id){
	for(i = 0; i < arr.length; i++){
		if(arr[i].id == id) return i;
	}
	return -1;
}

function getPortSelector(node, id) {
	var selector = '.inPorts';
	var index = which(node.get('inPorts'),id);

	if (index < 0) {
		selector = '.outPorts';
		index = which(node.get('outPorts'),id);

		if (index < 0) throw new Error("getPortSelector(): Port doesn't exist.");
	}

	return selector + '>g:nth-child(' + (index + 1) + ')>circle';
}

function makemodel(fns, id){
	var fn = fns[id];
	var me = fnmodel(fn, id);
	me.resize(400, 400);
	me.addTo(graph);
	for(var i in fn.fns){
		var sub = fnmodel(fns[fn.fns[i].ref], id + '.' + i);
		me.embed(sub);
		sub.addTo(graph);
	}
	for(var i in fn.map){
		var d = fn.map[i];
		var source = graph.getCell(id + d.fr[0]);
		var target = graph.getCell(id + d.to[0]);
		var link = new joint.shapes.flow.Link({
			source: { id: source.id, selector: getPortSelector(source, d.fr[1]), },
			target: { id: target.id, selector: getPortSelector(target, d.to[1]), },
		});
		link.addTo(graph);
	}
	return me;
}

var fns = {
	"476131ca": { name: "+", description: "N = n + n",
		in: [	{ name: "n", type: "int" }, { name: "n", type: "int" }, ],
		out: [	{ name: "N", type: "int" }, ],
	},
	"4c12fbae": { name: "−", description: "N = n₁ − n₂",
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
			{ fr:["", "i0"], to:[".0","i0"] },
			{ fr:["", "i1"], to:[".0","i1"] },
			{ fr:["", "i0"], to:[".1","i0"] },
			{ fr:["", "i1"], to:[".1","i1"] },
			{ fr:[".0", "o0"], to:["","o0"] },
			{ fr:[".1", "o0"], to:["","o1"] },
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


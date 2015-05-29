var graph, paper;

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
	var me = new joint.shapes.devs.Model({
		position: { x: 0, y: 0 },
		size: { width: 600, height: 600 },
		inPorts: [ 'n₁', 'n₂' ],
		outPorts: [ 'N₁' ],
		attrs: {
			'.label': { text: 'n*n+n*m', 'ref-x': 0.5, 'ref-y': 0.1 },
			rect: { fill: '#2ECC71', rx: 25, ry: 25 },
			'.inPorts circle': { fill: '#16A085', class: 'output' },
			'.outPorts circle': { fill: '#E74C3C', magnet: 'passive', class: 'input' }
		}
	}).addTo(graph);
	var multiply = new joint.shapes.devs.Model({
		position: { x: 50, y: 50 },
		size: { width: 90, height: 90 },
		inPorts: [ 'n₁', 'n₂' ],
		outPorts: [ 'N₁' ],
		attrs: {
			'.label': { text: 'multiply', 'ref-x': 0.5, 'ref-y': 0.4 },
			rect: { fill: '#2ECC71', rx: 25, ry: 25 },
			'.inPorts circle': { fill: '#16A085', magnet: 'passive', class: 'input' },
			'.outPorts circle': { fill: '#E74C3C', class: 'output' }
		}
	}).addTo(graph);
	var add = multiply.clone().translate(300, 0).attr('.label/text', 'add').addTo(graph);
	me.embed(add);
	me.embed(multiply);
	paper.on('all', function(){
		console.log(arguments);
	});

}

function layout() {
	joint.layout.DirectedGraph.layout(graph, {
		rankDir: "LR",
		setLinkVertices: false
	});
}


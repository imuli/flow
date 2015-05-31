function elementSVG(tag){
	return document.createElementNS("http://www.w3.org/2000/svg", tag);
}
function rectText(title, par){
	var rect = elementSVG("rect");
	rect.setAttribute("fill", "none");
	rect.setAttribute("stroke", "black");
	var text = elementSVG("text");
	var innerText = document.createTextNode(title);
	text.appendChild(innerText);
	par.appendChild(rect);
	par.appendChild(text);
	return { edge: rect, text: text };
}
function ioBox(offset, count, height, par){
	return function(it, n){
		var box = rectText(it.name, par);
		var textbox = box.text.getBBox();
		var h = height/count;
		box.edge.setAttribute("class", it.type);
		box.edge.setAttribute("height", h);
		box.edge.setAttribute("y", n*h);
		box.text.setAttribute("y", n*h + h/2 + textbox.height/4);
		return box;
	}
}
function setBoxWidth(box, width, offset){
	box.edge.setAttribute("width", width + 20);
	box.text.setAttribute("x", offset + (width + 20 - box.text.getBBox().width)/2);
	box.edge.setAttribute("x", offset);
}
function normalizeBoxes(b, offset){
	var max = 0;
	for(n in b){ max = Math.max(max, b[n].text.getBBox().width) }
	for(n in b){
		setBoxWidth(b[n], max, offset);
	}
}
function funcView(func, par){
	var g = elementSVG("g");
	par.appendChild(g);
	var body = rectText("", g);
	var height = 20 * Math.max(func.in.length, func.out.length);
	var inputs = func.in.map(ioBox(0, func.in.length, height, g));
	normalizeBoxes(inputs, 0);

	var offset = inputs[0].edge.width.baseVal.value;
	var body = ioBox(offset, 1, height, g)(func, 0);
	setBoxWidth(body, body.text.getBBox().width, offset);

	offset += body.edge.width.baseVal.value;
	var outputs = func.out.map(ioBox(offset, func.out.length, height, g));
	normalizeBoxes(outputs, offset);

	return {
		me: g,
		body: body,
		in: inputs,
		out: outputs,
	}
}

var testfunc = {
	in: [	{ name: "n", type: "int" },
		{ name: "n", type: "int" }, ],
	out: [	{ name: "N", type: "int" }, ],
	name: "+",
}

var me;
var svg;
function draw(){
	svg = document.getElementsByTagName("svg")[0];
	me = funcView(testfunc, svg);
	me.me.setAttribute("transform", "translate(20,20)");
}

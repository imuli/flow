/*! JointJS v0.9.3 - JavaScript diagramming library  2015-02-03 


This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
if (typeof exports === 'object') {

    var joint = {
        util: require('../src/core').util,
        shapes: {
            basic: require('./joint.shapes.basic')
        },
        dia: {
            ElementView: require('../src/joint.dia.element').ElementView,
            Link: require('../src/joint.dia.link').Link
        }
    };
    var _ = require('lodash');
}

joint.shapes.flow = {};

joint.shapes.flow.Model = joint.shapes.basic.Generic.extend(_.extend({}, joint.shapes.basic.PortsModelInterface, {

    markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',
    portMarkup: '<g class="port port<%= id %>"><circle class="port-body"/><text class="port-label"/></g>',

    defaults: joint.util.deepSupplement({

        type: 'flow.Model',
        size: { width: 100, height: 80 },
        
        inPorts: [],
        outPorts: [],

        attrs: {
            '.': { magnet: false },
            '.body': {
                width: 150, height: 250,
                stroke: '#000000'
            },
            '.port-body': {
                r: 10,
                magnet: true,
                stroke: '#000000'
            },
            text: {
                'pointer-events': 'none'
            },
            '.label': { text: '', 'ref-x': .5, 'ref-y': 0.4, ref: '.body', 'text-anchor': 'middle', fill: '#000000' },
            '.inPorts .port-label': { x:-15, dy: 4, 'text-anchor': 'end', fill: '#000000' },
            '.outPorts .port-label':{ x: 15, dy: 4, fill: '#000000' }
        }

    }, joint.shapes.basic.Generic.prototype.defaults),

    getPortAttrs: function(port, index, total, selector, type) {

        var attrs = {};

        var portClass = 'port' + index;
        var portSelector = selector + '>.' + portClass;
        var portLabelSelector = portSelector + '>.port-label';
        var portBodySelector = portSelector + '>.port-body';

        attrs[portLabelSelector] = { text: port.name };
        attrs[portBodySelector] = { port: { id: port.id || _.uniqueId(type) , type: type } };
        attrs[portSelector] = { ref: '.body', 'ref-y': (index + 0.5) * (1 / total) };

        if (selector === '.outPorts') { attrs[portSelector]['ref-dx'] = 0; }

        return attrs;
    }
}));


joint.shapes.flow.Atomic = joint.shapes.flow.Model.extend({

    defaults: joint.util.deepSupplement({

        type: 'flow.Atomic',
        size: { width: 80, height: 80 },
        attrs: {
            '.body': { fill: 'salmon' },
            '.label': { text: 'Atomic' },
            '.inPorts .port-body': { fill: 'PaleGreen' },
            '.outPorts .port-body': { fill: 'Tomato' }
        }

    }, joint.shapes.flow.Model.prototype.defaults)

});

joint.shapes.flow.Coupled = joint.shapes.flow.Model.extend({

    defaults: joint.util.deepSupplement({

        type: 'flow.Coupled',
        size: { width: 200, height: 300 },
        attrs: {
            '.body': { fill: 'seaGreen' },
            '.label': { text: 'Coupled' },
            '.inPorts .port-body': { fill: 'PaleGreen' },
            '.outPorts .port-body': { fill: 'Tomato' }
        }

    }, joint.shapes.flow.Model.prototype.defaults)
});

joint.shapes.flow.Link = joint.dia.Link.extend({

    defaults: {
        type: 'flow.Link',
	connector: { name: 'smooth' },
	attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' } }
    }
});

joint.shapes.flow.ModelView = joint.dia.ElementView.extend(joint.shapes.basic.PortsViewInterface);
joint.shapes.flow.AtomicView = joint.shapes.flow.ModelView;
joint.shapes.flow.CoupledView = joint.shapes.flow.ModelView;


if (typeof exports === 'object') {

    module.exports = joint.shapes.flow;
}

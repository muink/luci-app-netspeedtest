'use strict';
'require view';
'require poll';
'require fs';
'require rpc';
'require uci';
'require ui';
'require form';

var conf = 'netspeedtest';
var instance = 'iperf3';

const callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

function getServiceStatus() {
	return L.resolveDefault(callServiceList(conf), {})
		.then(function (res) {
			var isrunning = false;
			try {
				isrunning = res[conf]['instances'][instance]['running'];
			} catch (e) { }
			return isrunning;
		});
}

return view.extend({
//	handleSaveApply: null,
//	handleSave: null,
//	handleReset: null,

	load: function() {
	return Promise.all([
		getServiceStatus(),
		uci.load('netspeedtest')
	]);
	},

	poll_status: function(nodes, stat) {
		var isRunning = stat[0],
			view = nodes.querySelector('#service_status');

		if (isRunning) {
			view.innerHTML = "<span style=\"color:green;font-weight:bold\">" + instance + " - " + _("SERVER RUNNING") + "</span>";
		} else {
			view.innerHTML = "<span style=\"color:red;font-weight:bold\">" + instance + " - " + _("SERVER NOT RUNNING") + "</span>";
		}
		return;
	},

	render: function(res) {
		var isRunning = res[0];

		let m, s, o;

		m = new form.Map('netspeedtest', _('iperf3 Bandwidth Performance Test'));

		s = m.section(form.NamedSection, '_status');
		s.anonymous = true;
		s.render = function (section_id) {
			return E('div', { class: 'cbi-section' }, [
				E('div', { id: 'service_status' }, _('Collecting data ...'))
			]);
		};

		s = m.section(form.NamedSection, 'config', 'netspeedtest');
		s.anonymous = true;

		o = s.option(form.Flag, 'iperf3_enabled', _('Enable'));
		o.default = o.disabled;
		o.rmempty = false;

		o = s.option(form.Button, '_client_url', _('Download iperf3 client'));
		o.inputtitle = _('Official website');
		o.inputstyle = 'apply';
		o.onclick = function () {
			window.open("https://iperf.fr/iperf-download.php", '_blank');
		};

		s = m.section(form.TypedSection, '_cmd_ref');
		s.anonymous = true;
		s.render = function (section_id) {
			return E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('iperf3 Common commands reference')),
				E('pre', {}, [
"	-c, --client <host>\n\
	-u, --udp                        UDP mode\n\
	-b, --bandwidth <number>[KMG]    target bandwidth in bits/sec (0 for unlimited)\n\
	-t, --time      <number>         time in seconds to transmit for (default 10 secs)\n\
	-i, --interval  <number>         seconds between periodic bandwidth reports\n\
	-P, --parallel  <number>         number of parallel client streams to run\n\
	-R, --reverse                    run in reverse mode (server sends, client receives)\n"
				])
			]);
		};

		return m.render()
		.then(L.bind(function(m, nodes) {
			poll.add(L.bind(function() {
				return Promise.all([
					getServiceStatus()
				]).then(L.bind(this.poll_status, this, nodes));
			}, this), 3);
			return nodes;
		}, this, m));
	}
});

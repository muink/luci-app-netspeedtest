'use strict';
'require view';
'require poll';
'require fs';
'require rpc';
'require uci';
'require ui';
'require form';

var conf = 'librespeed-go';
var instance = 'librespeed-go';

var callServiceList = rpc.declare({
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
		L.resolveDefault(getServiceStatus(), false),
		uci.load('librespeed-go')
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

		var m, s, o;

		m = new form.Map('librespeed-go', _('librespeed Config'));

		s = m.section(form.NamedSection, '_status');
		s.anonymous = true;
		s.render = function (section_id) {
			return E('div', { class: 'cbi-section' }, [
				E('div', { id: 'service_status' }, _('Collecting data ...'))
			]);
		};

		s = m.section(form.NamedSection, 'config', 'librespeed-go');
		s.anonymous = true;

		o = s.option(form.Value, 'listen_port', _('Listen Port'));
		o.default = 8989;
		o.rmempty = false;

		o = s.option(form.Flag, 'enable_http2', _('Enable HTTP2'));
		o.default = o.disabled;
		o.rmempty = false;

		o = s.option(form.Flag, 'enable_tls', _('Enable TLS'));
		o.default = o.disabled;
		o.rmempty = false;
		o.depends('enable_http2', '1');
		o.retain = true;

		o = s.option(form.Value, 'tls_cert_file', _('TLS Cert file'));
		o.default = '/etc/librespeed-go/cert.pem';
		o.rmempty = true;
		o.depends('enable_tls', '1');

		o = s.option(form.Value, 'tls_key_file', _('TLS Key file'));
		o.default = '/etc/librespeed-go/privkey.pem';
		o.rmempty = true;
		o.depends('enable_tls', '1');

		return m.render()
		.then(L.bind(function(m, nodes) {
			poll.add(L.bind(function() {
				return Promise.all([
					L.resolveDefault(getServiceStatus(), false)
				]).then(L.bind(this.poll_status, this, nodes));
			}, this), 3);
			return nodes;
		}, this, m));
	}
});

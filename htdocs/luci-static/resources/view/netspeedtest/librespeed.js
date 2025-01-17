'use strict';
'require view';
'require fs';
'require rpc';
'require uci';
'require ui';
'require form';

return view.extend({
//	handleSaveApply: null,
//	handleSave: null,
//	handleReset: null,

	load() {
	return Promise.all([
		uci.load('netspeedtest'),
		uci.load('librespeed-go')
	]);
	},

	render(res) {
		const port = uci.get('librespeed-go', 'config', 'listen_port') || '8989';
		const ssl = uci.get('librespeed-go', 'config', 'enable_tls') || '0';

		let m, s, o;

		m = new form.Map('netspeedtest', _('librespeed Site Speed Test'));

		s = m.section(form.NamedSection, 'config', 'netspeedtest');
		s.anonymous = true;

		o = s.option(form.Flag, 'librespeed_enabled', _('Enable'));
		o.default = o.disabled;
		o.rmempty = false;

		s = m.section(form.NamedSection, '_iframe');
		s.anonymous = true;
		s.render = function (section_id) {
			if (port === '0') {
				return E('div', { class: 'alert-message warning' },
					_('Random port (port=0) is not supported.<br />Change to a fixed port and try again.'));
			};
			return E('iframe', {
				src: (ssl === '1' ? 'https' : 'http') + '://' + window.location.hostname + ':' + port,
				style: 'width: 100%; min-height: 100vh; border: none; border-radius: 3px;'
			});
		};

		return m.render();
	}
});

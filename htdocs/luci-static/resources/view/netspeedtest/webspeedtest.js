'use strict';
'require view';
'require uci';
'require ui';
'require form';

const testurls = [
	['https://openspeedtest.com/speedtest', _('OpenSpeedTest')],
	//['https://unidata.speedtestcustom.com', _('UNiDATA SpeedTest')], // not have SameSite=None
	//['https://speed.cloudflare.com', _('Cloudflare SpeedTest')], //X-Frame-Options: DENY
	['https://static.hdslb.com', _('Bilibili hdslb')],
	['https://fast.com', _('Netflix Fast')],
	['https://test.ustc.edu.cn', _('USTC EDU SpeedTest')]
];

return view.extend({
//	handleSaveApply: null,
//	handleSave: null,
//	handleReset: null,

	load() {
	return Promise.all([
		uci.load('netspeedtest')
	]);
	},

	render(res) {
		let m, s, o;

		m = new form.Map('netspeedtest', _('Web SpeedTest'));

		s = m.section(form.NamedSection, 'config', 'netspeedtest');

		/* Service switch */
		o = s.option(form.ListValue, '_service_list', _('Service list'));
		o.default = testurls[0][0];
		testurls.forEach((res) => {
			o.value.apply(o, res);
		})
		o.onchange = function(ev, section_id, value) {
			this.default = value;

			const iframe = document.getElementById('speedtest-iframe');
			if (iframe)
				iframe.setAttribute('src', value);
		}

		s = m.section(form.NamedSection, '_iframe');
		s.anonymous = true;
		s.render = function (section_id) {
			return E('iframe', {
				id: 'speedtest-iframe',
				src: this.map.findElement('id', 'widget.cbid.netspeedtest.config._service_list')?.value || testurls[0][0],
				style: 'border:none;width:100%;height:100%;min-height:600px;border:none;overflow:hidden !important;'
			});
		};

		return m.render();
	}
});

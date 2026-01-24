'use strict';
'require view';
'require poll';
'require dom';
'require fs';
'require rpc';
'require uci';
'require ui';
'require form';

const TestTimeout = 240 * 1000; // 4 Minutes
const ResultFile = '/var/speedtest_result';

var callDownloadOokla = rpc.declare({
	object: 'luci.netspeedtest',
	method: 'download_ookla',
	params: ['arch'],
	expect: { '': {} }
});

var callOoklaVerify = rpc.declare({
	object: 'luci.netspeedtest',
	method: 'ookla_verify',
	expect: { '': {} }
});

var callSpeedtest = rpc.declare({
	object: 'luci.netspeedtest',
	method: 'speedtest',
	expect: { '': {} }
});

return view.extend({
//	handleSaveApply: null,
//	handleSave: null,
//	handleReset: null,

	load() {
	return Promise.all([
		callOoklaVerify(),
		L.resolveDefault(fs.read(ResultFile), null),
		L.resolveDefault(fs.stat(ResultFile), {}),
		uci.load('netspeedtest')
	]);
	},

	render(data) {
		const has_ookla = data[0].result;
		const result_content = data[1] ? data[1].trim().split("\n") : [];
		const result_mtime = data[2] ? data[2].mtime * 1000 : 0;

		let m, s, o;

		m = new form.Map('netspeedtest', _('Ookla SpeedTest'));

		s = m.section(form.TypedSection, '_result');
		s.anonymous = true;
		s.render = function(section_id) {
			const El = E('div', { 'id': 'speedtest_result' }, []);
			const Testing = E('span', { 'class': 'spinning', 'style': 'color:yellow;font-weight:bold' }, [
				_('Testing in progress...')
			]);
			const TestS = function(content) {
				return E('div', { 'style': 'max-width:500px' }, [
					E('a', { 'href': content, 'target': '_blank' }, [
						E('img', { 'src': content + '.png', 'style': 'max-width:100%;max-height:100%;	vertical-align:middle' }, [])
					])
				])
			}
			const NoSer = E('span', { 'style': 'color:red;font-weight:bold' }, [ _('No available servers.') ]);
			const TestF = E('span', { 'style': 'color:red;font-weight:bold' }, [ _('Test failed.') ]);
			const TestN = E('span', { 'style': 'color:red;font-weight:bold;display:none' }, [ _('No result.') ]);

			poll.add(function() {
				return L.resolveDefault(fs.read(ResultFile), null).then((res) => {
					const result_content = res ? res.trim().split("\n") : [];
					const result_stat = document.querySelector('#speedtest_result');

					if (result_content.length) {
						if (result_content[0] == 'Testing')
							dom.content(result_stat, [ Testing ]);
						else if (result_content[0].match(/https?:\S+/))
							dom.content(result_stat, [ TestS(result_content[0]) ]);
						else if (result_content[0] == 'No available servers')
							dom.content(result_stat, [ NoSer ]);
						else if (result_content[0] == 'Test failed')
							dom.content(result_stat, [ TestF ]);
					} else
						dom.content(result_stat, [ TestN ]);
				});
			});

			if (result_content.length) {
				if (result_content[0] == 'Testing')
					El.appendChild(Testing);
				else if (result_content[0].match(/https?:\S+/))
					El.appendChild(TestS(result_content[0]));
				else if (result_content[0] == 'No available servers')
					El.appendChild(NoSer);
				else if (result_content[0] == 'Test failed')
					El.appendChild(TestF);
			} else
				El.appendChild(TestN);

			return El;
		}

		s = m.section(form.NamedSection, 'config', 'netspeedtest');
		s.anonymous = true;

		o = s.option(form.Button, '_start', _('Start Test'));
		o.inputtitle = _('Start Test');
		o.inputstyle = 'apply';
		if (result_content.length && result_content[0] == 'Testing' && (Date.now() - result_mtime) < TestTimeout)
			o.readonly = true;
		o.onclick = function(ev, section_id) {
			//L.env.rpctimeout = 180; // 3 minutes
			window.setTimeout(function() {
				window.location = window.location.href.split('#')[0];
			}, L.env.apply_display * 500);

			return callSpeedtest().then((res) => {
				if (!res.result)
					ui.addNotification(null, E('p', _('Test failed: %s').format(res.error)), 'error');
			});
		};

		o = s.option(form.DummyValue, '_ookla_status', _('Ookla® SpeedTest-CLI Status'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			return E('span', {
				id: 'ookla_status',
				style: `color:${has_ookla ? 'green' : 'red'};font-weight:bold`
			}, [ has_ookla ? _('Installed') : _('Not Installed') ]);
		};
		poll.add(function() {
			return callOoklaVerify().then((res) => {
				const has_ookla = res.result;
				const ookla_stat = document.querySelector('#ookla_status');

				if (ookla_stat) {
					ookla_stat.style.color = has_ookla ? 'green' : 'red';
					dom.content(ookla_stat, [ has_ookla ? _('Installed') : _('Not Installed') ]);
				}
			});
		})

		o = s.option(form.Flag, 'proxy_enabled', _('Enable proxy for downloader and test'));
		o.rmempty = false;

		o = s.option(form.ListValue, 'proxy_protocol', _('Proxy Protocol'));
		o.value('http', 'HTTP');
		o.value('https', 'HTTPS');
		o.value('socks5', 'SOCKS5');
		o.value('socks5h', 'SOCKS5H');
		o.default = 'socks5';
		o.rmempty = false;
		o.retain = true;
		o.depends('proxy_enabled', '1');

		o = s.option(form.Value, 'proxy_server', _('Proxy Server'));
		o.placeholder = '[username[:password]@]address:port';
		o.rmempty = false;
		o.retain = true;
		o.depends('proxy_enabled', '1');

		o = s.option(form.ListValue, '_arch', _('System Arch'));
		o.value('i386');
		o.value('x86_64');
		o.value('armel');
		o.value('armhf');
		o.value('aarch64');
		o.default = 'x86_64';
		o.write = function() {};

		o = s.option(form.Button, '_download', _('Download Ookla® SpeedTest-CLI'));
		o.inputtitle = _('Download');
		o.inputstyle = 'apply';
		o.onclick = function(ev, section_id) {
			const arch=this.section.getOption('_arch').formvalue(section_id);
			//console.log(arch);
			return callDownloadOokla(arch).then((res) => {
					if (res.result === true)
						ui.addNotification(null, E('p', _('Successfully download.')));
					else
						ui.addNotification(null, E('p', _('Download failed: %s').format(res.error)), 'error');
				});
		}

		return m.render();
	}
});

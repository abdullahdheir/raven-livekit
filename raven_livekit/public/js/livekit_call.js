/* global LiveKit, frappe */

async function loadSDK() {
  return new Promise(resolve => {
    if (window.LiveKit) return resolve();
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/livekit-client/dist/livekit-client.min.js';
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

async function injectButton() {
  const header = document.querySelector('.raven---chat-header-right');
  if (!header || header.querySelector('.lk-btn')) return;

  await loadSDK();

  const btn = document.createElement('button');
  btn.className = 'btn btn-default btn-icon lk-btn';
  btn.innerHTML = '<i class="fa fa-phone"></i>';
  btn.title = 'Start LiveKit Call';

  btn.onclick = async () => {
    const roomName = frappe.vue_chat.current_room.name;

    // 1) ابعث دعوة لكل الموجودين، وخُذ التوكن لنفسك
    const res = await frappe.call('raven_livekit.livekit.invite', { room: roomName });
    open_livekit_window(res.message, roomName);
  };

  header.prepend(btn);
}

frappe.ready(() => {
  injectButton();
  frappe.router.on('change', injectButton);
});

frappe.realtime.on('livekit_incoming_call', data => {
  const me = frappe.session.user;
  const roomName = frappe.vue_chat.current_room.name;
  if (data.room !== roomName || data.from === me) return; // الدعوة لي؟

  const dlg = frappe.msgprint({
    title: __('Incoming Call'),
    indicator: 'blue',
    message: __(`${data.from} is calling…`),
    primary_action: {
      label: __('Accept'),
      action() {
        open_livekit_window(data, roomName);
        dlg.hide();
      }
    },
    secondary_action: {
      label: __('Decline'),
      action() { dlg.hide(); }
    }
  });
});

function open_livekit_window({ token, ws_url }, roomName) {
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.writeIn(`
    <title>LiveKit – ${roomName}</title>
    <style>html,body{margin:0;height:100%;}</style>
    <div id="stage" style="height:100%"></div>

    <script src="https://unpkg.com/livekit-client/dist/livekit-client.min.js"><\\/script>
    <script>
      (async () => {
        const room = await LiveKit.Room.connect("${ws_url}", "${token}", {
          audio: true, video: true
        });

        // إظهار الفيديو المحلّي
        const elem = document.getElementById('stage');
        LiveKit.createLocalVideoTrack().then(t => t.attach(elem));

        // أغلق تلقائياً إذا خرج آخر مشارك
        room.on('participantDisconnected', () => {
          if (room.participants.size === 0) window.close();
        });
      })();
    <\\/script>
  `);
}

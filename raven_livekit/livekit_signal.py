import frappe
from raven_livekit.livekit_token import get_livekit_token  # يعيد token+ws_url

@frappe.whitelist()
def invite(room):
    """المتصل يطلب هذه الدالة قبل فتح النافذة"""
    res = get_livekit_token(room)
    sender = frappe.session.user
    # أرسل الحدث لكل المستخدمين في الغرفة
    frappe.publish_realtime(
        event='livekit_incoming_call',
        message={'room': room, 'from': sender, **res},
        room=room                         # قناة نفس اسم غرفة Raven
    )
    # دوّن سجل إذا أحببت
    return res
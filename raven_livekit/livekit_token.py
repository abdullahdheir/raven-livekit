import time
import jwt
import textwrap
import frappe
from cryptography.hazmat.primitives import serialization


def _load_private_key(pem):
    return serialization.load_pem_private_key(data=textwrap.dedent(pem).encode(), password=None)


def _get_setting(fieldname):
    try:
        settings = frappe.get_cached_doc("Raven Settings", "Raven Settings")
        return getattr(settings, fieldname, None)
    except Exception:
        return None


@frappe.whitelist()
def get_livekit_token(room):
    api_key = _get_setting(
        "livekit_api_key") or frappe.conf.get("livekit_api_key")
    key_sid = _get_setting(
        "livekit_key_sid") or frappe.conf.get("livekit_key_sid")
    pem_key = _get_setting("livekit_private_key") or frappe.conf.get(
        "livekit_private_key")
    ws_url = _get_setting(
        "livekit_ws_url") or frappe.conf.get("livekit_ws_url")

    if not all([api_key, key_sid, pem_key]):
        frappe.throw(
            "LiveKit credentials are missing in Raven Settings or site_config.json")

    private_key = _load_private_key(pem_key)

    payload = {
        "iss": api_key,
        "sub": frappe.session.user,
        "exp": int(time.time()) + 3600,
        "nbf": int(time.time()) - 5,
        "jti": f"{key_sid}-{int(time.time())}",
        "grants": {
            "room": room,
            "room_join": True,
            "can_publish": True,
            "can_subscribe": True
        }
    }
    token = jwt.encode(payload, private_key, algorithm="RS256")
    return {"token": token, "ws_url": ws_url}

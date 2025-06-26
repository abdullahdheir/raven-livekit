app_name = "raven_livekit"
app_title = "Raven LiveKit"
app_publisher = "Eng. Abdullah Dheir"
app_email = "abdullah.dheir@gmail.com"
app_version = "0.0.1"

app_include_js = ["/assets/raven_livekit/livekit_call.js"]

override_whitelisted_methods = {
    "raven_livekit.livekit.get_token": "raven_livekit.livekit_token.get_livekit_token",
    "raven_livekit.livekit.invite": "raven_livekit.livekit_signal.invite"
}

# IPC Protocol (Extension <-> Native Host)

Transport: Browser Native Messaging (`stdin/stdout` framed JSON).

## Request Types
- `ping`
- `get_challenge`
- `list_entries { origin, challenge }`
- `fill_for_origin { origin, entry_id, challenge, user_gesture }`
- `lock`

## Response Types
- `pong`
- `ack`
- `locked`
- `challenge { token, expires_in_seconds }`
- `entries { entries[] }`
- `fill_data { username, password }`
- `error { code, message }`

## Security Controls
- HTTPS origin required.
- One-time challenge token required for sensitive requests.
- Challenge expires quickly (30 seconds default).
- Manual user gesture required for autofill.
- Domain matching validated in backend before fill response.
- No localhost HTTP/WebSocket bridge.

#!/bin/sh
# =============================================================================
# deactivate.sh — CGI Endpoint: Deactivate (Clear) Active SIM Profile
# =============================================================================
# Clears the active profile marker so no profile is shown as active.
# Modem settings are NOT reverted — they persist in modem NVM. This only
# removes the "active" designation from the UI.
#
# Endpoint: POST /cgi-bin/quecmanager/profiles/deactivate.sh
# Request body: (none required)
# Response: {"success":true}
#       or: {"success":false,"error":"...","detail":"..."}
#
# Install location: /www/cgi-bin/quecmanager/profiles/deactivate.sh
# =============================================================================

# --- Logging -----------------------------------------------------------------
. /usr/lib/qmanager/qlog.sh 2>/dev/null || {
    qlog_init() { :; }
    qlog_debug() { :; }
    qlog_info() { :; }
    qlog_warn() { :; }
    qlog_error() { :; }
}
qlog_init "cgi_profile_deactivate"

# --- Source profile manager library ------------------------------------------
. /usr/lib/qmanager/profile_mgr.sh

# --- HTTP Headers ------------------------------------------------------------
echo "Content-Type: application/json"
echo "Cache-Control: no-cache"
echo "Access-Control-Allow-Origin: *"
echo "Access-Control-Allow-Methods: POST, OPTIONS"
echo "Access-Control-Allow-Headers: Content-Type"
echo ""

# --- Handle CORS preflight ---------------------------------------------------
if [ "$REQUEST_METHOD" = "OPTIONS" ]; then
    exit 0
fi

# --- Validate method ---------------------------------------------------------
if [ "$REQUEST_METHOD" != "POST" ]; then
    echo '{"success":false,"error":"method_not_allowed","detail":"Use POST"}'
    exit 0
fi

qlog_info "Profile deactivate request"

# --- Clear active profile ----------------------------------------------------
clear_active_profile

echo '{"success":true}'

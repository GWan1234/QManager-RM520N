#!/bin/sh
# =============================================================================
# list.sh — CGI Endpoint: List All SIM Profiles
# =============================================================================
# Returns a JSON object containing all profile summaries and the active
# profile ID. No modem interaction — reads from flash only.
#
# Endpoint: GET /cgi-bin/quecmanager/profiles/list.sh
# Response: {"profiles":[...],"active_profile_id":"..."|null}
#
# Install location: /www/cgi-bin/quecmanager/profiles/list.sh
# =============================================================================

# --- Logging -----------------------------------------------------------------
. /usr/lib/qmanager/qlog.sh 2>/dev/null || {
    qlog_init() { :; }
    qlog_debug() { :; }
    qlog_info() { :; }
    qlog_warn() { :; }
    qlog_error() { :; }
}
qlog_init "cgi_profile_list"

# --- Source profile manager library ------------------------------------------
. /usr/lib/qmanager/profile_mgr.sh

# --- HTTP Headers ------------------------------------------------------------
echo "Content-Type: application/json"
echo "Cache-Control: no-cache"
echo "Access-Control-Allow-Origin: *"
echo "Access-Control-Allow-Methods: GET, OPTIONS"
echo "Access-Control-Allow-Headers: Content-Type"
echo ""

# --- Handle CORS preflight ---------------------------------------------------
if [ "$REQUEST_METHOD" = "OPTIONS" ]; then
    exit 0
fi

# --- Serve profile list ------------------------------------------------------
profile_list

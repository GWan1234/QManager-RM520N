#!/bin/sh
# =============================================================================
# get.sh — CGI Endpoint: Get Single SIM Profile
# =============================================================================
# Returns the full profile JSON for a given profile ID.
# No modem interaction — reads from flash only.
#
# Endpoint: GET /cgi-bin/quecmanager/profiles/get.sh?id=<profile_id>
# Response: Full profile JSON or {"success":false,"error":"..."}
#
# Install location: /www/cgi-bin/quecmanager/profiles/get.sh
# =============================================================================

# --- Logging -----------------------------------------------------------------
. /usr/lib/qmanager/qlog.sh 2>/dev/null || {
    qlog_init() { :; }
    qlog_debug() { :; }
    qlog_info() { :; }
    qlog_warn() { :; }
    qlog_error() { :; }
}
qlog_init "cgi_profile_get"

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

# --- Extract profile ID from query string ------------------------------------
# QUERY_STRING format: id=p_1707900000_abc
PROFILE_ID=$(echo "$QUERY_STRING" | sed -n 's/.*id=\([^&]*\).*/\1/p')

if [ -z "$PROFILE_ID" ]; then
    echo '{"success":false,"error":"no_id","detail":"Missing id parameter"}'
    exit 0
fi

# --- Sanitize ID (prevent path traversal) ------------------------------------
# Profile IDs must match: p_<digits>_<hex>
case "$PROFILE_ID" in
    p_[0-9]*_[0-9a-f]*)
        # Valid format — continue
        ;;
    *)
        echo '{"success":false,"error":"invalid_id","detail":"Invalid profile ID format"}'
        exit 0
        ;;
esac

# --- Serve profile -----------------------------------------------------------
if ! profile_get "$PROFILE_ID"; then
    echo '{"success":false,"error":"not_found","detail":"Profile not found"}'
fi

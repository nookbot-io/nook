#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Nook Agent — Ubuntu Setup Script
# Tested on Ubuntu 22.04 / 24.04
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/nookbot-io/nook/main/deploy/setup.sh | sudo bash
#
# What it does:
#   1. Installs Node.js 22 LTS (via NodeSource)
#   2. Clones the repo to /opt/nook and runs npm install
#   3. Optionally creates .env from terminal (or skip to configure via browser)
#   4. Installs Caddy as reverse proxy (direct IP/domain access, auto-HTTPS)
#   5. Installs systemd service (auto-start on boot)
# ──────────────────────────────────────────────────────────────

INSTALL_DIR="/opt/nook"
SERVICE_NAME="nook-agent"
NOOK_USER="nook"
REPO_URL="https://github.com/nookbot-io/nook.git"

# ── Helpers ───────────────────────────────────────────────────

info()  { printf "\033[1;34m[INFO]\033[0m  %s\n" "$1"; }
ok()    { printf "\033[1;32m[OK]\033[0m    %s\n" "$1"; }
warn()  { printf "\033[1;33m[WARN]\033[0m  %s\n" "$1"; }
err()   { printf "\033[1;31m[ERROR]\033[0m %s\n" "$1"; exit 1; }

# All reads use /dev/tty so they work when piped from curl
ask_yes_no() {
  local prompt="$1" default="${2:-y}"
  local yn
  if [[ "$default" == "y" ]]; then
    read -rp "$prompt [Y/n]: " yn < /dev/tty
    yn="${yn:-y}"
  else
    read -rp "$prompt [y/N]: " yn < /dev/tty
    yn="${yn:-n}"
  fi
  [[ "$yn" =~ ^[Yy] ]]
}

ask_value() {
  local prompt="$1" default="${2:-}" value
  if [[ -n "$default" ]]; then
    read -rp "$prompt [$default]: " value < /dev/tty
    echo "${value:-$default}"
  else
    read -rp "$prompt: " value < /dev/tty
    echo "$value"
  fi
}

ask_secret() {
  local prompt="$1" value
  read -rsp "$prompt: " value < /dev/tty
  echo "$value"
  printf "\n"
}

# ── Pre-flight ────────────────────────────────────────────────

if [[ $EUID -ne 0 ]]; then
  err "This script must be run as root (use sudo)"
fi

echo ""
echo "  ┌─────────────────────────────────────┐"
echo "  │        Nook Agent Setup              │"
echo "  │   Ubuntu 22.04 / 24.04              │"
echo "  └─────────────────────────────────────┘"
echo ""

# ── Phase 1: Node.js ─────────────────────────────────────────

info "Phase 1: Node.js"

if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  ok "Node.js already installed ($NODE_VER)"
else
  info "Installing Node.js 22 LTS via NodeSource..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update -qq
  apt-get install -y -qq nodejs
  ok "Node.js $(node -v) installed"
fi

# ── Phase 2: Application ─────────────────────────────────────

info "Phase 2: Application"

# Create system user
if id "$NOOK_USER" &>/dev/null; then
  ok "User '$NOOK_USER' already exists"
else
  useradd --system --shell /usr/sbin/nologin --home-dir "$INSTALL_DIR" "$NOOK_USER"
  ok "Created system user '$NOOK_USER'"
fi

# Clone or update
if [[ -d "$INSTALL_DIR/.git" ]]; then
  ok "Repo already cloned at $INSTALL_DIR"
  info "Pulling latest changes..."
  git -C "$INSTALL_DIR" pull --ff-only || warn "Could not pull (you may have local changes)"
else
  info "Cloning repo to $INSTALL_DIR..."
  git clone "$REPO_URL" "$INSTALL_DIR"
  ok "Cloned to $INSTALL_DIR"
fi

# Install dependencies
info "Installing dependencies..."
cd "$INSTALL_DIR"
npm install --omit=dev --no-fund --no-audit 2>&1 | tail -1
ok "Dependencies installed"

# Build frontend if not present
if [[ ! -f "$INSTALL_DIR/public/index.html" ]]; then
  info "Building frontend..."
  npm run build:frontend 2>&1 | tail -3
  ok "Frontend built"
else
  ok "Frontend already built"
fi

# Create data directory
mkdir -p "$INSTALL_DIR/data"
chown -R "$NOOK_USER:$NOOK_USER" "$INSTALL_DIR/data"
ok "Data directory ready"

# ── Phase 3: Configuration ───────────────────────────────────

info "Phase 3: Configuration"

ENV_FILE="$INSTALL_DIR/.env"
SKIP_ENV=false

if [[ -f "$ENV_FILE" ]]; then
  ok ".env already exists at $ENV_FILE"
  if ! ask_yes_no "Overwrite existing .env?" "n"; then
    info "Keeping existing .env"
    SKIP_ENV=true
  else
    rm "$ENV_FILE"
  fi
fi

if [[ "$SKIP_ENV" == "false" && ! -f "$ENV_FILE" ]]; then
  echo ""
  if ask_yes_no "Configure API keys now? (or skip to configure via the web UI later)" "y"; then
    info "You'll need:"
    info "  - A Nook API key (get one at https://nookbot.io)"
    info "  - An LLM API key (OpenAI or Anthropic)"
    echo ""

    NOOK_KEY=$(ask_secret "Nook API key")
    if [[ -z "$NOOK_KEY" ]]; then
      warn "No Nook API key entered — you can configure this later via the web UI"
      SKIP_ENV=true
    fi

    if [[ "$SKIP_ENV" == "false" ]]; then
      echo ""
      LLM_PROVIDER=$(ask_value "LLM provider (openai/anthropic)" "openai")

      LLM_KEY=""
      if [[ "$LLM_PROVIDER" == "anthropic" ]]; then
        LLM_KEY=$(ask_secret "Anthropic API key")
      else
        LLM_PROVIDER="openai"
        LLM_KEY=$(ask_secret "OpenAI API key")
      fi

      if [[ -z "$LLM_KEY" ]]; then
        warn "No LLM API key entered — you can configure this later via the web UI"
        SKIP_ENV=true
      fi
    fi

    if [[ "$SKIP_ENV" == "false" ]]; then
      echo ""
      AGENT_PW=$(ask_secret "Agent web UI password")
      if [[ -z "$AGENT_PW" ]]; then
        warn "No password entered — you can set this later via the web UI"
        SKIP_ENV=true
      fi
    fi

    if [[ "$SKIP_ENV" == "false" ]]; then
      # Write .env
      cat > "$ENV_FILE" <<ENVEOF
# Generated by setup.sh on $(date -Iseconds)
NODE_ENV=production

LLM_PROVIDER=$LLM_PROVIDER
NOOK_API_URL=https://api.nookbot.io
NOOK_API_KEY=$NOOK_KEY
AGENT_PASSWORD=$AGENT_PW
ENVEOF

      if [[ "$LLM_PROVIDER" == "anthropic" ]]; then
        echo "ANTHROPIC_API_KEY=$LLM_KEY" >> "$ENV_FILE"
      else
        echo "OPENAI_API_KEY=$LLM_KEY" >> "$ENV_FILE"
      fi

      chown "$NOOK_USER:$NOOK_USER" "$ENV_FILE"
      chmod 600 "$ENV_FILE"
      ok ".env created"
    fi
  else
    info "Skipping terminal configuration — use the web UI setup wizard after install"
  fi
fi

# Ensure NODE_ENV=production is set even if .env was skipped
if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" <<ENVEOF
# Generated by setup.sh on $(date -Iseconds)
NODE_ENV=production
ENVEOF
  chown "$NOOK_USER:$NOOK_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  ok "Minimal .env created (NODE_ENV=production)"
fi

# ── Phase 4: Reverse Proxy (Caddy) ───────────────────────────

echo ""
info "Phase 4: Reverse Proxy (Caddy)"

if command -v caddy &>/dev/null; then
  ok "Caddy already installed ($(caddy version))"
else
  info "Installing Caddy..."
  apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy
  ok "Caddy installed"
fi

DOMAIN=$(ask_value "Domain name (leave blank to use server IP on port 80)" "")

# Copy and configure Caddyfile
CADDYFILE_SRC="$INSTALL_DIR/deploy/Caddyfile"
CADDYFILE_DST="/etc/caddy/Caddyfile"

if [[ -n "$DOMAIN" ]]; then
  sed "s/:80/$DOMAIN/" "$CADDYFILE_SRC" > "$CADDYFILE_DST"
  info "Caddy configured for $DOMAIN (HTTPS will be provisioned automatically)"
else
  cp "$CADDYFILE_SRC" "$CADDYFILE_DST"
  info "Caddy configured for :80 (direct IP access)"
fi

systemctl reload caddy 2>/dev/null || systemctl restart caddy
systemctl enable caddy
ok "Caddy running"

# ── Phase 5: Systemd Service ─────────────────────────────────

echo ""
info "Phase 5: Systemd Service"

cp "$INSTALL_DIR/deploy/nook-agent.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
ok "Service '$SERVICE_NAME' enabled and started"

# ── Phase 6: Ownership ───────────────────────────────────────

chown -R "$NOOK_USER:$NOOK_USER" "$INSTALL_DIR"
ok "File ownership set to '$NOOK_USER'"

# ── Summary ───────────────────────────────────────────────────

SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "  ┌─────────────────────────────────────┐"
echo "  │        Setup Complete!               │"
echo "  └─────────────────────────────────────┘"
echo ""

if [[ -n "$DOMAIN" ]]; then
  ACCESS_URL="https://$DOMAIN"
else
  ACCESS_URL="http://$SERVER_IP"
fi

ok "Access your agent at: $ACCESS_URL"

if [[ "$SKIP_ENV" == "true" ]] || ! grep -q "NOOK_API_KEY=." "$ENV_FILE" 2>/dev/null; then
  echo ""
  info "Configuration not complete — open $ACCESS_URL to finish setup via the web UI"
fi

echo ""
info "Useful commands:"
echo "  sudo systemctl status $SERVICE_NAME     # Check status"
echo "  sudo journalctl -u $SERVICE_NAME -f     # View logs"
echo "  sudo systemctl restart $SERVICE_NAME    # Restart"
echo "  sudo nano $INSTALL_DIR/.env             # Edit config"
echo ""

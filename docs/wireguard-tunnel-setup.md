# WireGuard tunnel setup: deploy host ↔ TLS-terminating host

This runbook applies only when an environment's Docker deploy host and its
TLS-terminating host nginx are **different machines** — e.g. after a host
migration moved `next`/`beta`/`dev` off the original all-in-one host. If both
roles still live on the same box, reachable via `127.0.0.1`, none of this
applies. See README.md's Deployment section, "When the deploy host isn't the
TLS-terminating host" subsection, for why WireGuard was chosen over mTLS
between the two nginxes or a persistent SSH tunnel.

Every step below is a manual, human-run action on the two hosts involved.
Nothing in this repo's `bin/deploy-to` or any other script executes any of
this — per this repo's convention (see `CLAUDE.md`), host nginx and other
system-level changes are never automated.

Throughout this doc, "TLS host" means the machine running the
TLS-terminating host nginx (the one with `sites-available/<host>` and
`clusters.conf`); "deploy host" means the machine `bin/deploy-to` targets,
running the `app`/`api` containers. The example subnet used throughout is
`10.66.0.0/30`, with the TLS host at `10.66.0.1` and the deploy host at
`10.66.0.2` — pick your own values for a real environment, but keep them
consistent across every step.

## 1. Install WireGuard on both hosts

WireGuard is mainline in any reasonably current Linux kernel (5.6+), so this
is just installing the userspace tools. Package name is typically
`wireguard` or `wireguard-tools` depending on distro. On Debian/Ubuntu:

```bash
sudo apt update && sudo apt install -y wireguard
```

Other package managers (`dnf`, `pacman`, `apk`, etc.) may name the package
differently — check your distro's package index if `apt` isn't available.

## 2. Generate a keypair on each host

Run this on **both** the TLS host and the deploy host (each host gets its
own, distinct keypair — do not reuse one keypair on both sides), generating
directly inside `/etc/wireguard/` — already root-owned, mode `700` once the
package is installed, and where `wg0.conf` ends up living in steps 4-5, so
there's no separate key-storage location to invent:

```bash
cd /etc/wireguard && wg genkey | tee privatekey | wg pubkey > publickey && chmod 600 privatekey
```

Keep each host's `privatekey` root-only readable and never copy it off that
host. Only the corresponding `publickey` gets shared with the other side.

To copy the values into steps 4-5's config (run on the same host, right
before writing that host's `wg0.conf`):

```bash
echo "PrivateKey: $(cat /etc/wireguard/privatekey)"; echo "PublicKey: $(cat /etc/wireguard/publickey)"
```

Once you've pasted `PrivateKey`'s value into that host's `wg0.conf` (steps
4-5), delete the standalone `privatekey`/`publickey` files:

```bash
rm /etc/wireguard/privatekey /etc/wireguard/publickey
```

`wg0.conf` is the single copy of the secret that actually matters from here
on, and a second forgotten copy is just something a future audit has to
notice and account for.

## 3. Pick a private overlay subnet

Pick a `/30` (enough for a single point-to-point pair) that isn't already in
use on either host for any other VPN/tunnel. This example uses
`10.66.0.0/30`:

- TLS host: `10.66.0.1`
- Deploy host: `10.66.0.2`

Before committing to a subnet, check both hosts for existing WireGuard/VPN
interfaces to avoid a collision — the same spirit as this repo's existing
convention of checking `clusters.conf` for port collisions before picking
new ports (see `CLAUDE.md`):

```bash
ip a; wg show; ls /etc/wireguard/*.conf 2>/dev/null
```

If `10.66.0.0/30` is already taken by another tunnel on either host, pick a
different `/30` and use it consistently through the rest of this runbook.

## 4. Write `/etc/wireguard/wg0.conf` on the TLS host

Fill in `<TLS-HOST-PRIVATE-KEY>` and `<DEPLOY-HOST-PUBLIC-KEY>` before
pasting (values from step 2's `cat`/step-5-peer's `publickey`), then run as
one command:

```bash
sudo tee /etc/wireguard/wg0.conf > /dev/null <<'EOF'
[Interface]
PrivateKey = <TLS-HOST-PRIVATE-KEY>
Address = 10.66.0.1/30
ListenPort = 51820

[Peer]
PublicKey = <DEPLOY-HOST-PUBLIC-KEY>
AllowedIPs = 10.66.0.2/32
EOF
```

`Endpoint` and `PersistentKeepalive` are normally **not** needed in this
`[Peer]` block — they're only required if the TLS host itself is behind NAT,
which usually isn't the case since it's the public-facing TLS front. If your
TLS host *is* behind NAT for some reason, add both here mirroring step 5's
pattern.

## 5. Write `/etc/wireguard/wg0.conf` on the deploy host

Fill in `<DEPLOY-HOST-PRIVATE-KEY>`, `<TLS-HOST-PUBLIC-KEY>`, and
`<tls-host-public-ip-or-hostname>` before pasting, then run as one command:

```bash
sudo tee /etc/wireguard/wg0.conf > /dev/null <<'EOF'
[Interface]
PrivateKey = <DEPLOY-HOST-PRIVATE-KEY>
Address = 10.66.0.2/30

[Peer]
PublicKey = <TLS-HOST-PUBLIC-KEY>
Endpoint = <tls-host-public-ip-or-hostname>:51820
AllowedIPs = 10.66.0.1/32
PersistentKeepalive = 25
EOF
```

`PersistentKeepalive = 25` sends a keepalive packet every 25 seconds, which
is what keeps the tunnel alive through any NAT/firewall sitting in front of
the deploy host — without it, an idle tunnel behind NAT can silently drop
and only recover once new traffic tries to flow.

## 6. Enable and start on both hosts

```bash
sudo systemctl enable --now wg-quick@wg0
```

Run this on both the TLS host and the deploy host. `enable --now` both
starts the interface immediately and gives it reboot-persistence for free —
this is the whole reason WireGuard was chosen over an ad hoc SSH tunnel: no
separate process supervisor (autossh or similar) is needed to keep it alive
across restarts.

## 7. Firewall

Open the UDP `ListenPort` (`51820/udp` in this example) on whichever host
has a firewall in front of it. Whichever side is reachable on the public
internet (typically the TLS host) needs this opened; a deploy host sitting
behind NAT with no inbound firewall rule for this port usually doesn't need
anything (it initiates the connection outbound).

`ufw` example:

```bash
sudo ufw allow 51820/udp
```

`iptables` example:

```bash
sudo iptables -A INPUT -p udp --dport 51820 -j ACCEPT
```

If the host sits behind a cloud provider's security group instead of (or in
addition to) a host firewall, add an equivalent inbound UDP rule for port
`51820` there too.

## 8. Verify tunnel connectivity before touching any app config

Before wiring the tunnel into this app's configuration, confirm the tunnel
itself works, independent of the app:

From the TLS host:

```bash
ping -c3 10.66.0.2
```

From the deploy host:

```bash
ping -c3 10.66.0.1
```

Both must succeed before moving on. If either fails, debug the tunnel itself
(check `wg show`, firewall rules, and that both `[Peer]` public keys/
`AllowedIPs` match the other side's config) rather than proceeding to app
changes.

## 9. Wire it into this app's config

Now that the tunnel IP exists and is verified reachable in both directions:

- **On the deploy host**, in that environment's real `.env.<name>` (not
  `.env.example`), set:

  ```
  APP_LISTEN_IP=10.66.0.2
  ```

  (the deploy host's own tunnel address — this controls the address the
  `app` container's published port binds to; see `.env.example` and
  `infra/docker-compose.production.yml`.)

- **On the TLS host**, update that environment's
  `/etc/nginx/sites-available/<host>` (or the relevant block in
  `/etc/nginx/conf.d/clusters.conf`) so the upstream for this environment
  points at `10.66.0.2:$APP_PORT` instead of `127.0.0.1:$APP_PORT` (use
  whatever `APP_PORT` this environment's real `.env.<name>` on the deploy
  host actually sets, not the compose file's `9881` fallback default).

- **Reload host nginx**:

  ```bash
  sudo nginx -t && sudo systemctl reload nginx
  ```

  This is a manual, human-run step, same as every other host-nginx change in
  this project — `bin/deploy-to` never edits or reloads host nginx for you.

## 10. Redeploy and confirm

Run:

```bash
bin/deploy-to <env> --remote
```

and confirm the live-hash verification step passes. Note that `--remote`
runs this entire check inside the SSH session on the deploy host itself —
it curls the `app` container's own bound address locally there, so a pass
proves the deploy pipeline (and `bin/deploy-to`'s handling of the
non-loopback `APP_LISTEN_IP` bind) works correctly; it does not itself
originate from the TLS host or cross the tunnel. The TLS-host → deploy-host
leg was already proven by step 8's `ping`; to verify it under real traffic,
send a request through the environment's public hostname once host nginx
has been reloaded and confirm it reaches the app.

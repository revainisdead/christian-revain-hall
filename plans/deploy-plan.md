# Deploy Plan

Status: draft. Run BlunderProof on the **existing EC2 instance** and domain, using the same `docker-scripts` and `make` targets as dev, then automate one step at a time toward Terraform.

## Current setup

| | |
|---|---|
| Domain | `christian-revain-hall.com` (http only today); registrar and DNS at **GoDaddy** |
| Instance | EC2 `t2.small` (1 vCPU, 2 GB RAM), us-east-2 |
| Elastic IP | `3.132.194.70` (stays the same through every stage) |
| Private IP | `172.31.1.91` (default VPC) |
| Deploy today | SSH in, then `docker-scripts/setup` + `start` (by hand) |

Each stage below works on its own. Stop at any stage for as long as you like.

---

## Stage 0: Inventory and safety net

Before changing anything on the box:

1. **Snapshot the EBS volume** (EC2 → Volumes → Create snapshot). This is the undo button for everything below.
1. **Back up the Salt setup** (master/minion configs, states, pillar), which worked before and is worth keeping:
   ```bash
   ls /etc/salt /srv/salt /srv/pillar 2>/dev/null        # where it lives; is this box the master, a minion, or both?
   sudo tar czf ~/salt-backup.tgz /etc/salt /srv/salt /srv/pillar
   # then from your machine: scp ubuntu@3.132.194.70:~/salt-backup.tgz .
   ```
   Pillar data often holds secrets, so review it before anything goes into the repo. Salt manages *what's on a box* (packages, files, services); Terraform manages *which boxes and AWS resources exist*. They complement each other, so the Salt states can live on as `infra/salt/` (Stage 2.5).
2. Write down what's there:
   ```bash
   cat /etc/os-release              # OS + version
   free -h; df -h /                 # RAM, disk
   docker --version; docker compose version; docker-compose --version
   docker ps -a; docker volume ls   # old containers/volumes
   systemctl list-units --type=service --state=running | grep -iE "nginx|apache|postgres"
   ```
3. Check the **security group**:
   - Inbound should be only **22** (from your IP, not `0.0.0.0/0`), **80** and **443**.
   - Remove anything else (5432, 8000, 8001, ...).

## Stage 1: BlunderProof on the box with the existing scripts

The aim is to deploy with the same commands as dev, plus `PROD=1` (or `COMPOSE_FILE` in `.env`).

### Repo changes first (on `develop`, merged to `master`)

- [ ] **Compose v2 plugin.** `docker-scripts/setup_docker` installs `docker-compose` **1.29** (v1). The compose files now use v2 features such as `condition: service_completed_successfully`. Install `docker-compose-plugin` from Docker's apt repo instead, and drop the `newgrp docker` line (it opens a subshell and stalls the script).
- [ ] **Stop publishing internal ports in prod:**
  - **Postgres:** the base file publishes `"0:5432"`, a random host port on every interface. Move it to `docker-compose.override.yml` (dev only).
  - **gunicorn:** the prod override publishes `8001:8001`, which bypasses nginx. Use only `expose: [8001]`, so nginx (on the internal network) is the only way in.
- [ ] **Low memory.** The prod `client` service runs `npm run build` on the box, which can run out of memory on a 2 GB instance. Add swap on the box (below), or build `dist/spa` elsewhere (Stage 4).
- [ ] **`make deploy`:** one command for the box: `git pull` + `make update` (rebuild, restart on the new images, migrate).

### On the box (first time)

```bash
# swap: guards npm/pip builds against running out of memory on 2 GB
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# stop the old site (keep its volumes until you're sure)
cd <old checkout> && docker-compose down          # or: docker stop $(docker ps -q)

git clone https://github.com/revainisdead/christian-revain-hall.git blunderproof && cd blunderproof
git checkout master
./docker-scripts/setup_docker                      # once, after the Compose v2 fix above
```

`.env` on the box (never committed):

```bash
COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml   # plain commands = prod, no PROD=1 needed
SECRET_KEY=<new random key, not the dev one>
ALLOWED_HOSTS=christian-revain-hall.com,www.christian-revain-hall.com
CSRF_TRUSTED_ORIGINS=https://christian-revain-hall.com,https://www.christian-revain-hall.com
GOOGLE_CLIENT_ID=<prod client id>
PASSWORD_LOGIN_ENABLED=false
```

Generate the key with:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Then:
```bash
make dev        # builds, starts (nginx :80, gunicorn, db, one-shot client build); Ctrl-C leaves it running
make migrate
```

**Login won't work yet.** Outside DEBUG, session and CSRF cookies are `Secure` (sent only over https), and Google sign-in requires an https origin. Stage 2 fixes both. Until then, the site loads and shows the login page.

## Stage 2: HTTPS and hardening

### HTTPS with Let's Encrypt

- Add a `certbot` service to `docker-compose.prod.yml`. It shares two volumes with nginx: `certbot-www` (the ACME challenge files) and `letsencrypt` (the certificates).
- nginx config:
  - `:80` serves `/.well-known/acme-challenge/` and redirects everything else to https.
  - `:443` uses the certificate and holds today's `/`, `/api`, `/admin`, `/api-auth` and `/static/` locations.
- First certificate:
  ```bash
  docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d christian-revain-hall.com -d www.christian-revain-hall.com
  ```
- Renewal: a cron job runs `certbot renew`, then reloads nginx (`make renew-certs`).
- Django: `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")`. nginx already sends `X-Forwarded-Proto`.
- Google console: add `https://christian-revain-hall.com` as an authorized JavaScript origin.
- **Cost: free.** Let's Encrypt certificates are free and renew automatically every 60–90 days. Don't buy GoDaddy's SSL add-on. AWS's free certificates (ACM) only work behind a load balancer or CloudFront, which costs around $16+/month, so they're overkill for one box.
- **`www`:** not required, but some people type it. Make the bare domain canonical and **301-redirect `www` to it**. That costs nothing: one GoDaddy DNS record, plus `www` on the same certificate.

### GoDaddy DNS

| Type | Name | Value |
|---|---|---|
| A | `@` | `3.132.194.70` (probably already set) |
| CNAME | `www` | `@` (i.e. `christian-revain-hall.com`) |

Both have to resolve before certbot can issue the certificate for both names.

## Stage 2.5: Bring Salt back (optional)

Put the sanitized Salt states in `infra/salt/` (secrets stay in pillar files that aren't committed, or in SSM). Have them describe the box: Docker + Compose plugin, swap, unattended-upgrades, the deploy user, cron jobs (cert renewal, backups). Then a rebuilt box is `salt-call --local state.apply` away, which is a natural step before Terraform.


### Hardening

- [ ] SSH: key-only, from your IP only. Or later, use **SSM Session Manager** and close port 22 entirely (needs an instance IAM role; this is a step toward Terraform).
- [ ] `unattended-upgrades` for OS security patches.
- [ ] **Backups.** Either:
  - a nightly `pg_dump` from the db container to S3 via cron (`make backup-db`), or
  - EBS snapshots on a schedule (AWS Data Lifecycle Manager).

  Test a restore once.
- [ ] Remove the `TEST DJ CONFIG` print from settings (it writes the database password to the logs).

## Stage 3: One-command deploys, then push-to-deploy

1. `make deploy` on the box (Stage 1) is the whole deploy.
2. A GitHub Actions `deploy.yml`, triggered on push to `master` once CI passes:
   - It runs `make deploy` on the box over SSH. The key and host are stored as repo secrets, and the key is a deploy-only user.
   - It's the same command you'd run by hand, just triggered automatically.

## Stage 4: Build in CI, the box only pulls

- CI builds the server image and the client `dist/spa`, then pushes the images to **GHCR** (free with GitHub).
- The prod compose uses `image: ghcr.io/revainisdead/blunderproof-server:<sha>` instead of `build:`. nginx serves the pre-built client from its image.
- The box no longer compiles anything: deploys are fast, the memory problem goes away, and rollback means deploying the previous tag.

## Stage 5: Terraform, adopting what already exists

Terraform doesn't require a new machine. **`terraform import`** adopts existing resources so they're managed as code from then on:

- `aws_instance` (this box), `aws_eip` (`3.132.194.70`), `aws_security_group`, `aws_ebs_volume`
- DNS: GoDaddy has a Terraform provider (community-maintained). Alternatively move only DNS hosting to Route 53 (about $0.50/month per zone) by pointing GoDaddy's nameservers at it, and keep the registration at GoDaddy.
- an S3 bucket for Terraform state (with locking), plus the backup bucket from Stage 2

Run `terraform plan` until it shows **no changes**. At that point the code exactly describes the live setup. After that, changes such as security group rules, the IAM role for SSM, or backup policies go through Terraform.

## Stage 6: Replace the box (when you want to)

With everything in code:
1. Terraform creates a new instance. Use a current type (t3.small or larger) with Docker and the repo installed at first boot (`user_data`), and Postgres data on its own EBS volume.
2. Restore the latest backup, test it at the temporary IP, then move the Elastic IP to it. DNS doesn't change.
3. Snapshot the old instance and terminate it.

## Order of work

| # | Task | Where |
|---|---|---|
| 1 | EBS snapshot + inventory (Stage 0) | You, on AWS / the box |
| 2 | Compose v2 install, prod ports, `make deploy` | Repo (Claude) |
| 3 | First prod run with scripts (Stage 1) | You, on the box |
| 4 | certbot + nginx 443 + Django proxy header (Stage 2) | Repo (Claude), then you run it |
| 5 | Backups + `make backup-db` | Repo, then you schedule it on the box |
| 6 | Push-to-deploy workflow (Stage 3) | Repo |
| 7 | GHCR images (Stage 4) | Repo |
| 8 | Terraform import (Stage 5) | Repo + you (AWS credentials) |

## Decisions

- DNS is at GoDaddy; it stays there for now (Route 53 is optional at Stage 5).
- The old box's Salt setup gets backed up in Stage 0 and may come back as `infra/salt/`.
- `www` 301-redirects to `christian-revain-hall.com`.
- HTTPS via Let's Encrypt (free).

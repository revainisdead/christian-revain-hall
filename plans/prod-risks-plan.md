# Production Risks Plan (AWS, Terraform, bots, cost)

Status: reference checklist, 2026-11-11. The most common ways production on AWS goes wrong (surprise bills, bot traffic, Terraform accidents), applied to BlunderProof's setup in [deploy-plan.md](deploy-plan.md): one EC2 `t2.small` in us-east-2 with an Elastic IP, nginx + gunicorn + Postgres in Docker Compose, Let's Encrypt, DNS at GoDaddy, Terraform later.

Prices are approximate us-east-2 list prices as of writing. Check the AWS pricing pages before deciding on anything.

## The one idea that matters most

**A fixed-size box caps the bill. Per-request services don't.**

On one EC2 instance, bad traffic makes the site *slow*, not *expensive*: the instance costs the same whether it serves 10 requests or 10 million. The bill only runs away through things that charge per request, per GB or per hour of something you forgot: data transfer out, CloudWatch logs, NAT gateways, load balancers, WAF, Lambda, API Gateway, autoscaling. So until there's real traffic:

- Stay on **one box**, sized by hand.
- Add a per-request service only when something specific needs it, and put a **budget alarm** on the account first.

## 1. Bots and scraping

### What will hit the site

| Traffic | What it wants | Cost risk on one box |
|---|---|---|
| Vulnerability scanners | `/wp-admin`, `/.env`, `/.git/config`, `/phpmyadmin` | CPU and log noise. Starts within hours of the site going up. |
| Credential stuffing | `POST /api/auth/login/` with leaked passwords | Low: password login is off in prod (`PASSWORD_LOGIN_ENABLED` defaults to DEBUG). Keep it off. |
| Sign-up spam | Fake accounts | Low while sign-up is Google-only. |
| Search and AI crawlers | Every public URL | Mostly the SPA shell and the piece PNGs: bandwidth. |
| Scrapers / API abuse | `/api/...` | Logged-out requests get a cheap 401. Logged-in abuse is the real risk. |
| **Bot-game abuse** (future) | Hammering "bot, make your move" | Only if bots run on the server: then each move costs engine CPU (see 3). Browser bots cost the server nothing. |
| DDoS | Taking the site down | Rare for a small site. Slows it down; doesn't raise the bill on a fixed box. |

### Defenses, cheapest first

1. **nginx rate limits** (`limit_req`, `limit_conn`) per IP. Strict on `/api/auth/` and on bot-move endpoints, looser on static files. Free, and the first thing to add.
2. **Drop scanner paths in nginx:** `return 444` for `\.php$`, `/wp-`, `/\.env`, `/\.git`. No Django work, tiny logs.
3. **DRF throttling** (`UserRateThrottle`, `AnonRateThrottle`, plus a custom scope for bot moves). It's per user, so it catches abuse from one account spread over many IPs. The default throttle cache is per process; use the Postgres or Redis cache when there's more than one gunicorn worker.
4. **`robots.txt`**: allow the landing page, disallow `/api/`. Only polite crawlers obey it, but it cuts their bandwidth.
5. **Cloudflare free plan in front** (move DNS from GoDaddy to Cloudflare; keep the registration at GoDaddy):
   - free DDoS protection, "Bot Fight Mode", and caching of static files at the edge, so bandwidth leaves Cloudflare instead of AWS;
   - then lock the EC2 security group so ports 80/443 accept **only Cloudflare's IP ranges**, which stops anyone bypassing it.
   - Trade-off: Cloudflare sits in the middle of TLS. Use "Full (strict)" mode and keep the Let's Encrypt certificate on the box.
6. **AWS WAF** only once there's a load balancer or CloudFront (WAF can't attach to a bare EC2). Roughly $5/month per web ACL + $1 per rule + $0.60 per million requests. Cloudflare's free tier covers most of this for a small site.
7. **fail2ban** on SSH and nginx logs, or better, close port 22 and use SSM Session Manager (deploy plan, hardening).

### Don't

- Don't make server-side bot moves or analysis public, unauthenticated endpoints. Anything that costs CPU per request needs a login and a throttle.
- Don't log full request bodies. Logs are where scraping turns into a storage bill.

## 2. Keeping costs low until there's traffic

### Set these up first (free or nearly)

- **AWS Budgets:** a monthly cost budget (for example $25) with email alerts at 50%, 80% and 100% of actual cost and at 100% of *forecasted* cost.
- **Cost Anomaly Detection:** free; emails when spend jumps.
- **Free-tier usage alerts** in the Billing preferences.
- **Tags** on everything (`project=blunderproof`, `env=prod`), and turn them on as cost allocation tags, so the bill breaks down by project.

### Surprise line items to watch

| Item | Why it surprises people | What to do |
|---|---|---|
| **Public IPv4 addresses** | Since 2024 every public IPv4 costs about $0.005/hour (~$3.60/month), attached or not, Elastic IPs included. | Keep exactly one (the Elastic IP). Release any you don't use. |
| **NAT gateway** | About $32/month each plus per-GB processing, even when idle. A common Terraform VPC module default. | Don't create one. A single box in a public subnet doesn't need it. |
| **Load balancer (ALB)** | About $16+/month plus capacity units, before any traffic. | Not until there are two app servers. |
| **RDS** | The smallest instance plus storage plus backups is ~$15–30/month, more with Multi-AZ. | Keep Postgres in Docker with nightly `pg_dump` to S3 until the data or traffic justifies it. |
| **Data transfer out** | The first 100 GB/month to the internet is free across the account. After that, about $0.09/GB. | gzip/brotli in nginx, long cache headers on hashed assets, piece images as WebP, Cloudflare caching. |
| **CloudWatch Logs** | About $0.50/GB ingested, and retention defaults to *never expire*. | Ship only errors. Set retention (14–30 days) on every log group, including in Terraform. |
| **EBS snapshots** | Pile up forever at about $0.05/GB-month. | Data Lifecycle Manager policy: keep the last 7 daily and 4 weekly. |
| **gp2 volumes** | Older default, pricier per GB than gp3. | Use gp3. |
| **T3/T4g "unlimited" mode** | T3 and T4g default to unlimited CPU credits: sustained CPU above baseline is billed extra. | Set `credit_specification { cpu_credits = "standard" }`, or watch the `CPUSurplusCreditsCharged` metric. (T2, the current box, defaults to standard: it slows down instead of charging.) |
| **Secrets Manager** | About $0.40 per secret per month plus API calls. | SSM Parameter Store standard parameters are free. Use those. |
| **Forgotten resources** | Test instances, old volumes, unattached Elastic IPs, a second region you tried once. | Tag everything. Monthly check in Cost Explorer, grouped by service and region. |
| **Container registry** | ECR charges for storage and transfer. | GitHub Container Registry is free for public images (deploy plan stage 4). Add an ECR lifecycle policy if you use ECR. |

### Cheaper compute when you do resize

- **Graviton (`t4g`)** is about 20% cheaper than the same `t3` size. It needs arm64 images: build multi-arch in CI (`docker buildx`). Python, Node and Postgres images all support it.
- A **Savings Plan or reserved instance** (1 year) cuts 30–40% off a box you know you'll keep. Only buy one once the size has settled.
- Scale **up before out:** `t3.small` → `t3.medium` → a bigger box is far cheaper and simpler than a load balancer, autoscaling and RDS.

## 3. Chess-specific: bot opponents (the future `training` app)

**What a bot is.** chess.js and python-chess are *rules* libraries: legal moves, check, mate. A bot adds an **engine** on top: an **evaluation** (a score for a position, starting with material) and a **search** (look ahead a few moves with minimax and alpha-beta pruning, pick the best-scoring one). **BlunderProof writes its own** on chess.js; no Stockfish or other third-party engine. Bot strength comes from search depth and evaluation detail, and the same evaluation can later power training insights such as "was this move better or worse".

**The cost question is CPU, not network.** A bot move over the wire is a few hundred bytes. What costs money is the engine's thinking time, and that depends on where it runs.

**Decided (2026-11-11): chess CPU work runs in the browser wherever it can.** BlunderProof is training only, not competitive, so there's nothing for a player to gain by tampering with their own bot, and strong engines are freely available elsewhere, so shipping our own engine to the browser gives a cheater nothing new. Legal protection comes from `FAIR_PLAY.md` and the license (see 6), not from where code runs.
- The engine runs on the player's device, so server CPU per bot move is zero, and a `t2.small` doesn't care how many bot games run.
- The server's job shrinks to saving games and checking that each move is legal (python-chess), which is cheap.
- Bots: our own search and evaluation on chess.js, run in a Web Worker so the board doesn't freeze while the bot thinks. Harder bots search deeper and evaluate more. chess.js isn't built for speed, so if deep searches get slow, a faster move generator is an option later, still our own code.
- Fair play: a bot that only plays *against you inside BlunderProof* isn't the forbidden feature (that's taking an outside position and returning moves). `FAIR_PLAY.md` covers misuse.

**Accepted trade-off: integrity.** The player's browser controls the bot, so a player could make it lose and fake a win or an achievement. They'd only be fooling themselves in a training tool. If BlunderProof ever adds something competitive between players (leaderboards, prizes), revisit this for those games only.

**If bot moves ever run on the server (not planned)**
- Cap the engine per move by time (`movetime 50–300 ms`) or depth.
- Run moves through a small worker pool instead of one engine per request, so load makes moves slower instead of taking the box down.
- Rate-limit bot moves per user (DRF throttle) and per IP (nginx).
- Watch CPU credits: a `t2.small` has a low baseline (~20% of one vCPU), and engine work burns credits. Watch `CPUCreditBalance`, and move the engine to its own box if needed.

## 4. Terraform: the most common production problems

### State

1. **Local or lost state.** `terraform.tfstate` on one laptop means one spilled coffee and Terraform forgets everything. Use an **S3 backend** with versioning and encryption from day one. The deploy plan already says this; make it the first resource.
2. **No locking:** two applies at once corrupt the state. Terraform 1.10+ supports S3-native locking (`use_lockfile = true`), so a DynamoDB table isn't needed any more.
3. **Secrets end up in state in plain text** (database passwords, `random_password`, SSM values read through data sources). Treat the state bucket as secret: no public access, encrypted, IAM-restricted. Better still, keep secrets out of Terraform: create them once in SSM and only reference their names.
4. **The state bucket gets deleted with everything else.** Create it in a separate tiny bootstrap config, or give it `prevent_destroy`.

### Accidental destroy or replace

5. **"Forces replacement" on a change you thought was small.** Classic triggers:
   - `user_data` edits on an `aws_instance` (replaces the box);
   - an AMI from `data "aws_ami"` with `most_recent = true` (a new AMI is published, and the next `plan` wants a new instance);
   - renaming a security group or changing its description;
   - changing the subnet or availability zone.
   Fixes: pin the AMI ID, put `lifecycle { ignore_changes = [ami, user_data] }` on the instance, and **always read the plan** for `-/+` (replace) and `-` (destroy).
6. **Root volume deleted with the instance:** `delete_on_termination` defaults to `true`. Keep Postgres data on a **separate EBS volume** with `prevent_destroy`, as the deploy plan's stage 6 says.
7. **`prevent_destroy`** on anything that hurts to lose: the Elastic IP, the data volume, the state and backup buckets.
8. **`count` index shifts:** removing item 0 from a `count` list renumbers everything and replaces the rest. Use `for_each` with stable keys.

### Drift and adoption

9. **Console edits drift from code.** Someone opens a port in the console; the next `apply` silently removes it, or the code no longer describes reality. Rule: after Terraform takes over, no console changes. A scheduled `terraform plan -detailed-exitcode` in CI flags drift.
10. **`terraform import` gaps** (deploy plan stage 5): an import adopts the resource, but the code must match **every attribute**, or the first apply "fixes" the live box to match your guess. Iterate until `plan` shows **no changes** before any real apply. Terraform 1.5+ `import` blocks with `-generate-config-out` write a first draft for you.
11. **Default VPC reliance:** resources quietly land in the default VPC and its subnets, which are hard to manage or recreate later. Fine to import as-is now; define a VPC in code when the box is replaced.

### Versions and environments

12. **Unpinned provider versions:** a new AWS provider major version changes behavior under you. Pin with `~>` and **commit `.terraform.lock.hcl`**.
13. **Prod and test in one state:** a mistake in a test change hits prod. When there's a second environment, give it a separate directory and backend (separate states), not just a workspace.
14. **Hard-coded region and account:** use variables, plus `allowed_account_ids` in the provider block, so a wrong `AWS_PROFILE` fails instead of building in another account.

### Security

15. **Long-lived access keys** for Terraform or CI. Use **GitHub Actions OIDC** to assume an IAM role (no stored keys), and SSO or `aws configure sso` locally.
16. **Over-wide security groups:** `0.0.0.0/0` on 22 or 5432. Only 80/443 should be public (or only Cloudflare's ranges); SSH from your IP or none (SSM).
17. **IMDSv1 left on:** require IMDSv2 (`metadata_options { http_tokens = "required" }`). It blocks a class of SSRF credential theft.
18. **The instance role does too much:** give the box only what it uses: write to the backup bucket, read its SSM parameters, SSM Session Manager.

### Process

19. **Apply without a reviewed plan:** CI runs `plan` on the PR and posts it; `apply` runs only on merge, from the saved plan file.
20. **Big-bang modules:** one giant config, or a public "does everything" module that creates NAT gateways and load balancers by default. Start with plain resources, and add modules only when a pattern repeats.

## 5. Other common production failures (not Terraform)

- **Disk fills up:** Docker images, build cache and logs on a small EBS volume. Use `docker system prune` on a schedule, Docker log rotation (`max-size`, `max-file` in `daemon.json`), and a CloudWatch alarm or cron check on disk usage.
- **Out of memory on 2 GB:** `npm run build` and gunicorn workers compete. Add swap (deploy plan) and build images in CI (deploy plan stage 4).
- **Backups that were never restored:** schedule a monthly restore test of the `pg_dump` into a scratch container. A backup you haven't restored is a guess.
- **Certificate renewal fails silently:** alert if the certificate expires in under 14 days (a cron `openssl` check, or an external uptime monitor that checks TLS).
- **No outside uptime check:** a free external monitor (UptimeRobot, Better Stack free tier, or Cloudflare health checks) emails when the site is down.
- **Time-bomb defaults:** `DEBUG` on in prod, `ALLOWED_HOSTS='*'`, password login enabled. Add a `manage.py check --deploy` step to CI for the prod settings.

## 6. Legal and licensing (before going public)

Not legal advice. Have a lawyer read the user-facing terms once there are real users.

- **Show the policy in the app.** Done: the About page (`/#/about`, public, linked at the bottom of the drawer) carries the full policy. Still to do: have sign-up (first Google login) record that the user accepted it (a timestamp on `BpUser`). A policy nobody agreed to is weaker protection.
- **Terms of service and a privacy policy.** Google sign-in stores names and emails, so a privacy policy is expected (and Google's OAuth consent screen asks for one). The terms carry the "provided as is, not liable" language for the hosted site; `FAIR_PLAY.md` sections 4–5 are a start.
- **Repo `LICENSE`:** done. Proprietary, all rights reserved (2026-11-11), with third-party licenses listed. `FAIR_PLAY.md` section 6 now says no forks without written permission.
- **Third-party code:** no Stockfish (decided), so no GPL engine ships to browsers. chess.js (BSD-2-Clause) needs its copyright notice kept. python-chess (GPLv3) runs only on the server, which isn't distribution. Both are credited on the About page.
- **Piece and board art:** done. The set is CC BY-SA 3.0 (confirmed). `LICENSE.txt` in the art folder and a credit with the license link on the About page. If the art is ever edited, the edited art must stay CC BY-SA 3.0 with the credit kept.
- **About / credits page:** done (`pages/AboutPage.vue`). Keep its credits and its copy of `FAIR_PLAY.md` up to date.
- **Trademarks:** keep "Chess.com" and "Lichess" to factual mentions, as `FAIR_PLAY.md` section 4 does. No logos, no implied partnership.

## Checklist by deploy stage

| When | Do |
|---|---|
| Before going public (deploy plan stages 1–2) | Legal items in 6 (policy shown and accepted, terms, privacy policy, art attribution, LICENSE). Budget alarm and Cost Anomaly Detection. nginx rate limits and scanner-path drops. Keep password login off. Docker log rotation. One Elastic IP only. `robots.txt`. External uptime check. |
| Backups (stage 2) | `pg_dump` to S3 with a lifecycle rule. DLM policy for snapshots. A restore test. |
| Terraform (stage 5) | S3 state with versioning, `use_lockfile`, and `prevent_destroy`. Pinned providers and a committed lock file. `plan` shows no changes before the first apply. `prevent_destroy` on the Elastic IP and data volume. IMDSv2. OIDC for CI. Tags. Log retention. |
| First real traffic | Cloudflare in front, security group limited to Cloudflare. DRF throttling. Watch CPU credits and data transfer out. |
| Bots go live (`training`) | Our own bots in the browser (Web Worker); the server checks move legality. |
| Steady traffic | Graviton plus a 1-year Savings Plan. RDS only when Postgres-on-the-box stops being enough. CloudFront or Cloudflare caching for static files. A load balancer only when there are two app servers. |

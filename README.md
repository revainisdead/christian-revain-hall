# BlunderProof

Chess training tool. Never blunder again.

> **Fair play:** BlunderProof is for training only. Using it for assistance during any
> live game, on Chess.com, Lichess, over the board, or anywhere else, is prohibited.
> See [FAIR_PLAY.md](FAIR_PLAY.md).

## Stack

- **Client:** Vue 3 + Quasar (Vite, TypeScript), in `client/`
- **Server:** Django + Django REST Framework, in `server/`
- **Database:** PostgreSQL
- **Environments:** Docker Compose. `docker-compose.yml` is the base; `docker-compose.override.yml` (dev) is loaded automatically; `docker-compose.prod.yml` is for prod (set `COMPOSE_FILE` in `.env`, see `.env.example`). Helper scripts are in `docker-scripts/`.

## Local development

```bash
docker-scripts/setup        # install Docker (Debian) and build images; --skip-install to just build
docker-scripts/start        # start server, client, db
docker-scripts/migrate      # run migrations (also: make | show)
```

- Client (Quasar dev server): http://127.0.0.1:8007
- API (Django): http://127.0.0.1:8008

## Social

- Blog: http://christian-revain-hall.com
- GitHub: https://github.com/revainisdead
- StackOverflow: https://stackoverflow.com/users/6207208/revainisdead
- LinkedIn: https://linkedin.com/in/christianhall8
- Twitter: https://twitter.com/revainisdead

## Contact

> christian-revain-hall@gmail.com

## Credits

Chess piece and board artwork: Cburnett chess set by JohnPablok (`client/public/JohnPablok Cburnett Chess set/`).

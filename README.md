# chess-puzzles

> [!NOTE]
> This project was built entirely with [Claude Code](https://claude.com/claude-code) —
> the port, the puzzle pipeline, the tests, and the browser verification.

One chess puzzle at a time, in a page that fits any viewport. A web port of
[chess-puzzles-menuitem](https://github.com/statico/chess-puzzles-menuitem), a
macOS menu-bar puzzle trainer.

No server, no accounts, no tracking. Static HTML/CSS/JS.

## Develop

```sh
npm install
npm run dev
node test.js    # checks the puzzle data is playable
```

## Puzzles

`public/puzzles.json` holds ~7,400 puzzles sampled from the
[Lichess puzzle database](https://database.lichess.org/) across rating bands
(popularity >= 90, plays >= 1000). It is committed, so deploys don't depend on a
290MB download.

Re-sample it with `sh scripts/fetch-puzzles.sh` (needs `curl` and `zstd`).

## Deploy

Vercel autodetects Vite. Build `npm run build`, output `dist/`.

## Credits

- Puzzles: [Lichess puzzle database](https://database.lichess.org/) — CC0
- Board: [chessground](https://github.com/lichess-org/chessground) — GPL-3.0
- Pieces: Cburnett set, via chessground — GPL-2.0-or-later
- Move validation: [chess.js](https://github.com/jhlywa/chess.js) — BSD-2-Clause

## License

[GPL-3.0-or-later](LICENSE) — required by chessground and the Cburnett pieces.

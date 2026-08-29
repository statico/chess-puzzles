#!/bin/sh
# Sample ~10k Lichess puzzles across rating bands -> public/puzzles.json (committed;
# not a build step, so deploys don't depend on a 290MB download).
# Needs: curl, zstd. Run from repo root: sh scripts/fetch-puzzles.sh
set -eu
PER_BAND=${PER_BAND:-1000}
curl -sfL https://database.lichess.org/lichess_db_puzzle.csv.zst \
  | unzstd \
  | awk -v per="$PER_BAND" -v seed="$(date +%s)" '
    BEGIN { FS=","; srand(seed); printf "[" }
    NR==1 { next }                                  # header
    $6 < 90 || $7 < 1000 { next }                   # popularity, plays: keep good puzzles
    $3 ~ /[a-h][1-8][a-h][1-8][nrb]/ { next }       # under-promotion: board auto-queens
    {
      band = int($4/300); if (band > 9) band = 9    # 300-pt bands, 2700+ lumped
      if (kept[band] >= per) next
      if (rand() > 0.02) next                       # thin the stream so bands fill from all over
      kept[band]++
      printf "%s{\"i\":\"%s\",\"f\":\"%s\",\"m\":\"%s\",\"r\":%d,\"t\":\"%s\"}", (n++?",":""), $1, $2, $3, $4, $8
    }
    END { print "]"; printf "kept %d\n", n > "/dev/stderr" }
  ' > public/puzzles.json
ls -lh public/puzzles.json

// node test.js — checks the sampled puzzle data is actually playable.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'

const puzzles = JSON.parse(readFileSync(new URL('./public/puzzles.json', import.meta.url)))
assert.ok(puzzles.length > 1000, `expected >1000 puzzles, got ${puzzles.length}`)

// every rating band the sampler targets should have puzzles in it
const bands = {}
for (const p of puzzles) bands[Math.min(9, Math.floor(p.r / 300))] = true
for (const b of [3, 4, 5, 6, 7]) assert.ok(bands[b], `no puzzles in rating band ${b}`)

// every solution line must be legal from its FEN, and the player must move second
for (const p of puzzles) {
  const chess = new Chess(p.f)
  const opponent = chess.turn()
  const moves = p.m.split(' ')
  assert.ok(moves.length >= 2, `${p.i}: solution too short`)
  moves.forEach((uci, i) => {
    assert.ok(uci.length < 5 || uci[4] === 'q', `${p.i}: under-promotion ${uci}, board auto-queens`)
    assert.equal(chess.turn(), i % 2 === 0 ? opponent : (opponent === 'w' ? 'b' : 'w'),
      `${p.i}: wrong side to move at ply ${i}`)
    const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] ?? 'q' })
    assert.ok(move, `${p.i}: illegal move ${uci} at ply ${i}`)
  })
}

console.log(`ok — ${puzzles.length} puzzles, all solution lines legal`)

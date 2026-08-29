import { Chess } from 'chess.js'
import { Chessground } from 'chessground'
import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'
import './style.css'

const RATING = 1500
const BANDS = {
  easiest: [-400, -200],
  easier: [-200, -100],
  normal: [-100, 100],
  harder: [100, 200],
  hardest: [200, 400],
}

const $ = (id) => document.getElementById(id)

let puzzles = []
let puzzle, chess, cg, moves = [], idx = 0, playerColor, msgTimer, timers = []

const at = (ms, fn) => timers.push(setTimeout(fn, ms))

function msg(text, cls) {
  clearTimeout(msgTimer)
  $('msg').textContent = text
  $('msg').className = cls || ''
  if (text) msgTimer = setTimeout(() => msg('', ''), 5000)
}

function turnColor() {
  return chess.turn() === 'w' ? 'white' : 'black'
}

function dests() {
  const m = new Map()
  for (const mv of chess.moves({ verbose: true })) {
    if (!m.has(mv.from)) m.set(mv.from, [])
    m.get(mv.from).push(mv.to)
  }
  return m
}

// lastMove omitted (not undefined) so chessground keeps the existing highlight
function setBoard(playable, lastMove) {
  const cfg = {
    fen: chess.fen(),
    turnColor: turnColor(),
    movable: {
      color: playable ? playerColor : undefined,
      dests: playable ? dests() : new Map(),
    },
  }
  if (lastMove) cfg.lastMove = lastMove
  cg.set(cfg)
}

function apply(uci) {
  const from = uci.slice(0, 2), to = uci.slice(2, 4)
  chess.move({ from, to, promotion: uci[4] || 'q' })
  return [from, to]
}

function done() {
  $('hint').disabled = true
  $('solution').disabled = true
  $('next').textContent = 'Next'
  $('next').classList.add('solved')
}

function playOpponent() {
  const last = apply(moves[idx])
  idx++
  if (idx >= moves.length) {
    setBoard(false, last)
    msg(`Puzzle Solved! (ELO ${puzzle.r})`, 'ok')
    done()
  } else {
    setBoard(true, last)
  }
}

function onMove(orig, dest) {
  const piece = cg.state.pieces.get(dest)
  const promo = piece && piece.role === 'pawn' && (dest[1] === '8' || dest[1] === '1')
  const uci = orig + dest + (promo ? 'q' : '')

  if (uci.toLowerCase() !== moves[idx].toLowerCase()) {
    setBoard(true)
    msg('Incorrect move. Try again!', 'bad')
    return
  }

  apply(uci)
  idx++
  if (idx >= moves.length) {
    setBoard(false, [orig, dest])
    msg(`Puzzle Solved! (ELO ${puzzle.r})`, 'ok')
    done()
    return
  }
  setBoard(false, [orig, dest])
  at(300, playOpponent)
}

function load() {
  timers.forEach(clearTimeout)
  timers = []
  const [lo, hi] = BANDS[$('difficulty').value] || BANDS.normal
  const band = puzzles.filter((p) => p.r >= RATING + lo && p.r <= RATING + hi)
  const pool = band.length ? band : puzzles
  puzzle = pool[Math.floor(Math.random() * pool.length)]

  chess = new Chess(puzzle.f)
  moves = puzzle.m.split(' ')
  idx = 0
  playerColor = chess.turn() === 'w' ? 'black' : 'white'

  $('status').textContent = playerColor === 'white' ? '⬜️ White to Move' : '⬛️ Black to Move'
  msg('', '')
  $('hint').disabled = false
  $('solution').disabled = false
  $('next').textContent = 'Skip'
  $('next').classList.remove('solved')

  const cfg = {
    fen: chess.fen(),
    orientation: playerColor,
    turnColor: turnColor(),
    lastMove: undefined,
    coordinates: true,
    animation: { duration: 250 },
    movable: { free: false, color: undefined, dests: new Map(), events: { after: onMove } },
    premovable: { enabled: false },
  }
  if (cg) cg.set(cfg)
  else cg = Chessground($('board'), cfg)

  at(250, playOpponent)
}

$('hint').onclick = () => msg(`Hint: ${moves[idx]}`, 'info')

$('solution').onclick = () => {
  const rest = moves.slice(idx)
  msg('Solution: ' + rest.join(' '), 'warn')
  setBoard(false)
  rest.forEach((uci, k) =>
    at(500 * (k + 1), () => {
      const last = apply(uci)
      cg.set({ fen: chess.fen(), turnColor: turnColor(), lastMove: last })
    }),
  )
  idx = moves.length
  done()
}

$('next').onclick = load

$('difficulty').value = localStorage.getItem('difficulty') || 'normal'
$('difficulty').onchange = () => {
  localStorage.setItem('difficulty', $('difficulty').value)
  load()
}

fetch('/puzzles.json')
  .then((r) => r.json())
  .then((d) => {
    puzzles = d
    load()
  })

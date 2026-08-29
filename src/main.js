import { Chess } from 'chess.js'
import { Chessground } from 'chessground'
import 'chessground/assets/chessground.base.css'
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
let puzzle, chess, cg, moves = [], idx = 0, playerColor, msgTimer, timers = [], hints = 0

const at = (ms, fn) => timers.push(setTimeout(fn, ms))

function msg(text, cls) {
  clearTimeout(msgTimer)
  const el = $('msg')
  el.className = text ? `show ${cls || ''}` : ''
  if (text) {
    el.textContent = text
    msgTimer = setTimeout(() => msg('', ''), 5000)
  }
}

// One pip per move you still owe the puzzle; they fill in as you play.
function pips() {
  const total = Math.floor(moves.length / 2)
  $('pips').innerHTML = '<i></i>'.repeat(total)
  const on = Math.floor(idx / 2)
  $('pips').querySelectorAll('i').forEach((el, k) => el.classList.toggle('on', k < on))
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
  pips()
}

function apply(uci) {
  const from = uci.slice(0, 2), to = uci.slice(2, 4)
  chess.move({ from, to, promotion: uci[4] || 'q' })
  return [from, to]
}

function result(ok) {
  const total = Math.floor(moves.length / 2)
  $('result-mark').textContent = ok ? '✓' : '↩'
  $('result-mark').className = ok ? 'ok' : ''
  $('result-title').textContent = ok ? 'Correct' : 'Solution shown'
  $('result-note').textContent = hints
    ? `${hints} of ${total} hint${total > 1 ? 's' : ''} used`
    : ok
      ? 'No hints used'
      : `Puzzle rated ${puzzle.r}`
  $('result').hidden = false
  $('again').focus({ preventScroll: true })
}

function done() {
  $('hint').disabled = true
  $('solution').disabled = true
  $('next').textContent = 'Next'
  $('next').classList.add('solved')
  idx = moves.length
  pips()
}

function playOpponent() {
  const last = apply(moves[idx])
  idx++
  if (idx >= moves.length) {
    setBoard(false, last)
    done()
    result(true)
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
    msg('Not the move — try again', 'bad')
    return
  }

  cg.setShapes([])
  apply(uci)
  idx++
  if (idx >= moves.length) {
    setBoard(false, [orig, dest])
    done()
    result(true)
    return
  }
  setBoard(false, [orig, dest])
  at(300, playOpponent)
}

function load() {
  $('result').hidden = true
  hints = 0
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

  $('status-text').textContent = playerColor === 'white' ? 'White to move' : 'Black to move'
  $('status').classList.toggle('black', playerColor === 'black')
  $('rating').textContent = puzzle.r
  pips()
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
    drawable: { brushes: { hint: { key: 'h', color: '#1f6feb', opacity: 1, lineWidth: 16 } } },
  }
  if (cg) { cg.set(cfg); cg.setShapes([]) }
  else cg = Chessground($('board'), cfg)

  at(250, playOpponent)
}

$('hint').onclick = () => {
  const from = moves[idx].slice(0, 2)
  hints++
  cg.setShapes([{ orig: from, brush: 'hint' }])
  msg(`Hint: move the piece on ${from}`, 'info')
}

$('solution').onclick = () => {
  const rest = moves.slice(idx)
  msg('Solution: ' + rest.join(' '), 'warn')
  cg.setShapes([])
  setBoard(false)
  rest.forEach((uci, k) =>
    at(500 * (k + 1), () => {
      const last = apply(uci)
      cg.set({ fen: chess.fen(), turnColor: turnColor(), lastMove: last })
      if (k === rest.length - 1) result(false)
    }),
  )
  done()
}

$('next').onclick = load
$('again').onclick = load

document.onkeydown = (e) => {
  if (e.metaKey || e.ctrlKey || e.target.tagName === 'SELECT') return
  const b = { n: 'next', h: 'hint', s: 'solution' }[e.key.toLowerCase()]
  if (b && !$(b).disabled) $(b).click()
}

const board = $('board-theme')
board.value = localStorage.getItem('board') || 'slate'
document.documentElement.dataset.board = board.value
board.onchange = () => {
  localStorage.setItem('board', board.value)
  document.documentElement.dataset.board = board.value
}

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

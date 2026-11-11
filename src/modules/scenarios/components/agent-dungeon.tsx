'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Coins,
  Heart,
  Map as MapIcon,
  Shield,
  Timer,
} from 'lucide-react';
import { Badge, Button, cn } from '@/components/ui';
import type { Difficulty, DungeonContent } from '../content/dungeon';
import type { DungeonMap, Room } from '../content/dungeon-engine';
import {
  DUNGEON_CONFIG,
  bossAt,
  canMove,
  drawQuestion,
  generateMapPool,
  monsterGold,
  pickMonster,
} from '../content/dungeon-engine';

type Phase = 'menu' | 'map' | 'battle' | 'chest' | 'shop' | 'buff' | 'gameover' | 'victory';

type Copy = DungeonContent;

interface BattleState {
  kind: 'monster' | 'boss';
  name: string;
  icon: string;
  hp: number;
  maxHp: number;
  confidence: number;
  maxConfidence: number;
  broken: boolean;
  elite: boolean;
  seconds: number;
  lines?: Record<string, string>;
  gold: number;
}

const DIFFS: Array<{ id: Difficulty; labelKey: string }> = [
  { id: 'easy', labelKey: 'easy' },
  { id: 'normal', labelKey: 'normal' },
  { id: 'hard', labelKey: 'hard' },
];

/** A tiny Web Audio blip; no assets, no dependency. */
function blip(frequency: number, duration = 120, type: OscillatorType = 'square') {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
    window.setTimeout(() => void ctx.close(), duration + 120);
  } catch {
    // Audio is a bonus; never break the game for it.
  }
}

export function AgentDungeon({ copy }: { copy: Copy }) {
  const L = copy.labels as unknown as Record<string, string>;
  const [phase, setPhase] = useState<Phase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [maps, setMaps] = useState<DungeonMap[]>([]);
  const [layer, setLayer] = useState(0);
  const [hp, setHp] = useState<number>(DUNGEON_CONFIG.hp.normal);
  const [maxHp, setMaxHp] = useState<number>(DUNGEON_CONFIG.hp.normal);
  const [gold, setGold] = useState<number>(DUNGEON_CONFIG.gold.normal);
  const [buffs, setBuffs] = useState<Set<string>>(() => new Set());
  const [items, setItems] = useState<string[]>([]);
  const [roomId, setRoomId] = useState('');
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const [cleared, setCleared] = useState<Set<string>>(() => new Set());
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [battleRoomId, setBattleRoomId] = useState('');
  const [question, setQuestion] = useState<Copy['questions'][number] | null>(null);
  const [used, setUsed] = useState<Set<string>>(() => new Set());
  const [choice, setChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; explain: string } | null>(null);
  const [usedItemThisQuestion, setUsedItemThisQuestion] = useState(false);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [triple, setTriple] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [chestBuff, setChestBuff] = useState<Copy['buffs'][number] | null>(null);
  const [shopStock, setShopStock] = useState<{ buff: Copy['buffs'][number] | null; items: Copy['items'][number][] }>({ buff: null, items: [] });
  const [buffChoices, setBuffChoices] = useState<Copy['buffs']>([]);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, gold: 0, kills: 0, layers: 0 });
  const [enemyHit, setEnemyHit] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [shielded, setShielded] = useState(false);
  const [reviveUsed, setReviveUsed] = useState(false);
  const [revive2Used, setRevive2Used] = useState(false);

  const map = maps[layer];
  const currentRoom: Room | undefined = map?.rooms.find((r) => r.id === roomId);
  const bossCopy = map ? bossAt(copy.bosses as never[], layer + 1) : null;

  const roomIcon: Record<string, string> = {
    start: '🚪',
    battle: '⚔️',
    chest: '🎁',
    shop: '🏪',
    boss: '👑',
  };

  useEffect(() => {
    if (phase !== 'battle' || !battle || battle.kind !== 'boss' || feedback) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => (t === null ? null : Math.max(0, t - 1)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, battle, feedback]);

  useEffect(() => {
    if (timeLeft !== 0 || phase !== 'battle' || feedback) return;
    const timer = window.setTimeout(() => answer(-1), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, feedback]);

  function resetRun(nextDifficulty: Difficulty) {
    const nextMaps = generateMapPool(3);
    setDifficulty(nextDifficulty);
    setMaps(nextMaps);
    setLayer(0);
    const hpStart = DUNGEON_CONFIG.hp[nextDifficulty];
    setHp(hpStart);
    setMaxHp(hpStart);
    setGold(DUNGEON_CONFIG.gold[nextDifficulty]);
    setBuffs(new Set());
    setItems([]);
    setUsed(new Set());
    setStats({ correct: 0, wrong: 0, gold: 0, kills: 0, layers: 0 });
    setShielded(false);
    setReviveUsed(false);
    const start = nextMaps[0]!.rooms.find((r) => r.id === nextMaps[0]!.startRoomId)!;
    setRoomId(start.id);
    setVisited(new Set([start.id]));
    setCleared(new Set());
    setBattle(null);
    setQuestion(null);
    setChoice(null);
    setFeedback(null);
    setTimeLeft(null);
    setPhase('map');
  }

  function pickBuffPool(count: number): Copy['buffs'] {
    const pool = copy.buffs.filter((b) => !buffs.has(b.id));
    return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  }

  function enterRoom(room: Room) {
    setRoomId(room.id);
    setVisited((prev) => new Set(prev).add(room.id));
    if (room.type === 'start') return;
    if (room.type === 'chest') {
      const buff = pickBuffPool(1)[0] ?? null;
      if (!buff) {
        setCleared((prev) => new Set(prev).add(room.id));
        return;
      }
      setChestBuff(buff);
      setPhase('chest');
      return;
    }
    if (room.type === 'shop') {
      const buff = pickBuffPool(1)[0] ?? null;
      const shopItems = [...copy.items].sort(() => Math.random() - 0.5).slice(0, 3);
      setShopStock({ buff, items: shopItems });
      setPhase('shop');
      return;
    }
    if (room.type === 'battle' || room.type === 'boss') {
      startBattle(room);
    }
  }

  function moveTo(room: Room) {
    if (phase !== 'map' || !map) return;
    if (battle?.kind === 'boss') return;
    if (!canMove(map, roomId, room.id)) return;
    if (room.type === 'boss' && cleared.has(room.id)) return;
    if (room.type === 'battle' && cleared.has(room.id)) {
      setRoomId(room.id);
      setVisited((prev) => new Set(prev).add(room.id));
      return;
    }
    if (cleared.has(room.id)) {
      setRoomId(room.id);
      setVisited((prev) => new Set(prev).add(room.id));
      return;
    }
    enterRoom(room);
  }

  function startBattle(room: Room) {
    if (!map) return;
    setBattleRoomId(room.id);
    const idx = layer;
    if (room.type === 'boss') {
      const boss = bossCopy!;
      const seconds = boss.seconds + (buffs.has('time') ? 10 : 0) + (buffs.has('time2') ? 15 : 0);
      setBattle({
        kind: 'boss',
        name: boss.name,
        icon: boss.icon,
        hp: boss.hp,
        maxHp: boss.hp,
        confidence: boss.confidence,
        maxConfidence: boss.confidence,
        broken: false,
        elite: false,
        seconds,
        lines: boss.lines,
        gold: DUNGEON_CONFIG.bossGold[difficulty],
      });
      setTimeLeft(seconds);
    } else {
      const monster = pickMonster(copy.monsters, idx + 1);
      const elite = Math.random() < DUNGEON_CONFIG.eliteChance[idx]!;
      setBattle({
        kind: 'monster',
        name: elite ? `${L.elite} ${monster.name}` : monster.name,
        icon: monster.icon,
        hp: elite ? monster.hp + 1 : monster.hp,
        maxHp: elite ? monster.hp + 1 : monster.hp,
        confidence: elite ? 2 : 0,
        maxConfidence: elite ? 2 : 0,
        broken: !elite,
        elite,
        seconds: 0,
        gold: monsterGold(monster, difficulty, idx + 1) * (elite ? 1.5 : 1),
      });
      setTimeLeft(null);
    }
    setFeedback(null);
    setChoice(null);
    const draw = drawQuestion(copy.questions, difficulty, used);
    if (draw) {
      setQuestion(draw.question);
      setUsed(draw.used);
    }
    setEliminated([]);
    setTriple(false);
    setUsedItemThisQuestion(false);
    setPhase('battle');
  }

  function answer(index: number) {
    if (!question || !battle || feedback) return;
    const correct = index === question.answer;
    setChoice(index);
    setFeedback({ correct, explain: question.explain });
    if (correct) {
      setStats((s) => ({ ...s, correct: s.correct + 1 }));
      if (buffs.has('leech2')) setHp((v) => Math.min(maxHp, v + 10));
      else if (buffs.has('leech')) setHp((v) => Math.min(maxHp, v + 5));
      const next = { ...battle };
      if (!next.broken && next.confidence > 0) {
        next.confidence -= 1;
        if (next.confidence === 0) next.broken = true;
      } else {
        let damage = triple ? 3 : 1;
        if (buffs.has('precision') && (next.kind === 'boss' || next.elite)) damage += 1;
        if (buffs.has('precision2') && (next.kind === 'boss' || next.elite)) damage += 2;
        if (buffs.has('crit2') && (next.kind === 'boss' || next.elite)) damage += 2;
        if (buffs.has('berserk') && hp < maxHp * 0.3) damage += 2;
        if (buffs.has('crit') && (next.kind === 'boss' || next.elite)) damage += 1;
        next.hp = Math.max(0, next.hp - damage);
      }
      setBattle(next);
      setEnemyHit(true);
      blip(660, 90, 'square');
      window.setTimeout(() => setEnemyHit(false), 360);
    } else {
      setStats((s) => ({ ...s, wrong: s.wrong + 1 }));
      let damage: number = battle.kind === 'boss' ? DUNGEON_CONFIG.bossDamage[difficulty] : battle.elite ? DUNGEON_CONFIG.eliteDamage[difficulty] : DUNGEON_CONFIG.monsterDamage[difficulty];
      if (buffs.has('armor2')) damage = Math.floor(damage * 0.25);
      else if (buffs.has('armor')) damage = Math.floor(damage / 2);
      if (shielded) {
        damage = 0;
        setShielded(false);
      }
      const nextHp = Math.max(0, hp - damage);
      setHp(nextHp);
      blip(160, 220, 'sawtooth');
      setDamageFlash(true);
      window.setTimeout(() => setDamageFlash(false), 460);
      if (nextHp <= 0) {
        if (buffs.has('revive2') && !revive2Used) {
          setRevive2Used(true);
          setHp(30);
          setBattle({ ...battle, confidence: battle.maxConfidence, broken: battle.kind === 'monster' ? battle.broken : false });
          setTriple(false);
          return;
        }
        if (buffs.has('revive') && !reviveUsed) {
          setReviveUsed(true);
          setHp(30);
          setBattle({ ...battle, confidence: battle.maxConfidence, broken: battle.kind === 'monster' ? battle.broken : false });
          setTriple(false);
          return;
        }
        setPhase('gameover');
        return;
      }
      setBattle({
        ...battle,
        confidence: battle.maxConfidence,
        broken: battle.kind === 'monster' ? battle.broken : false,
      });
    }
    setTriple(false);
  }

  function nextQuestionOrFinish() {
    if (!battle || !question) return;
    if (hp <= 0) {
      setPhase('gameover');
      return;
    }
    if (battle.hp <= 0) {
      winBattle();
      return;
    }
    const draw = drawQuestion(copy.questions, difficulty, used);
    if (draw) {
      setQuestion(draw.question);
      setUsed(draw.used);
    }
    setChoice(null);
    setFeedback(null);
    setEliminated([]);
    setUsedItemThisQuestion(false);
    setTimeLeft(battle.kind === 'boss' ? battle.seconds : null);
  }

  function winBattle() {
    if (!battle || !map) return;
    const earned = Math.round(
      battle.gold *
        (buffs.has('gold') ? 1.5 : 1) *
        (buffs.has('gold2') ? 2 : 1),
    );
    setGold((g) => g + earned);
    setStats((s) => ({ ...s, gold: s.gold + earned, kills: s.kills + 1 }));
    setCleared((prev) => new Set(prev).add(battleRoomId));
    if (battle.elite) {
      const drop = copy.items[Math.floor(Math.random() * copy.items.length)]!;
      if (items.length < DUNGEON_CONFIG.maxItems) setItems((prev) => [...prev, drop.id]);
    }
    if (battle.kind === 'boss') {
      if (layer < 2) {
        setBuffChoices(pickBuffPool(3));
        setPhase('buff');
        setStats((s) => ({ ...s, layers: s.layers + 1 }));
      } else {
        setStats((s) => ({ ...s, layers: 3 }));
        setPhase('victory');
      }
    } else {
      setBattle(null);
      setPhase('map');
    }
  }

  function nextLayer() {
    const next = layer + 1;
    if (!maps[next]) return;
    setLayer(next);
    const start = maps[next]!.rooms.find((r) => r.id === maps[next]!.startRoomId)!;
    setRoomId(start.id);
    setVisited(new Set([start.id]));
    setCleared(new Set());
    setBattle(null);
    setQuestion(null);
    setFeedback(null);
    setPhase('map');
  }

  function grantBuff(id: string) {
    setBuffs((prev) => new Set(prev).add(id));
    if (id === 'tough' || id === 'tough2') {
      const bonus = id === 'tough' ? 30 : 40;
      setMaxHp((m) => m + bonus);
      setHp((h) => h + bonus);
    }
    if (id === 'pack' || id === 'pack2') {
      const count = id === 'pack' ? 2 : 3;
      const extra = [...copy.items].sort(() => Math.random() - 0.5).slice(0, count);
      setItems((prev) => [...prev, ...extra.map((i) => i.id)].slice(0, DUNGEON_CONFIG.maxItems + 3));
    }
  }

  function chooseBuff(buff: Copy['buffs'][number]) {
    grantBuff(buff.id);
    setBuffChoices([]);
    nextLayer();
  }

  function applyItem(id: string) {
    if (usedItemThisQuestion || !question) return;
    if (id === 'heal') {
      if (hp >= maxHp) return;
      setHp((v) => Math.min(maxHp, v + 30));
    }
    if (id === 'eliminate') {
      const wrongs = question.options
        .map((_, i) => i)
        .filter((i) => i !== question.answer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      setEliminated(wrongs);
    }
    if (id === 'triple') setTriple(true);
    if (id === 'shield' || id === 'ward') setShielded(true);
    if (id === 'hourglass' && battle?.kind === 'boss') {
      setTimeLeft((t) => (t ?? 0) + 15);
    }
    if (id === 'freeze' && battle?.kind === 'boss') {
      setTimeLeft((t) => (t ?? 0) + 30);
    }
    if (id === 'gold') {
      setGold((g) => g + 60);
      setStats((s) => ({ ...s, gold: s.gold + 60 }));
    }
    if (id === 'reroll') {
      const draw = drawQuestion(copy.questions, difficulty, used);
      if (draw) {
        setQuestion(draw.question);
        setUsed(draw.used);
        setChoice(null);
        setFeedback(null);
        setEliminated([]);
        setTriple(false);
        setTimeLeft(battle?.kind === 'boss' ? battle.seconds : null);
      }
    }
    if (id === 'bomb' && battle) {
      if (!battle.broken && battle.confidence > 0) {
        const confidence = battle.confidence - 1;
        setBattle({ ...battle, confidence, broken: confidence === 0 });
      } else {
        setBattle({ ...battle, hp: Math.max(0, battle.hp - 2) });
      }
      setEnemyHit(true);
      blip(440, 120, 'triangle');
      window.setTimeout(() => setEnemyHit(false), 360);
    }
    setItems((prev) => {
      const index = prev.indexOf(id);
      return index === -1 ? prev : prev.filter((_, i) => i !== index);
    });
    setUsedItemThisQuestion(true);
  }

  const availableRooms = useMemo(() => {
    if (!map) return new Set<string>();
    const room = map.rooms.find((r) => r.id === roomId);
    return new Set(room?.connections ?? []);
  }, [map, roomId]);

  // Fog of war: you know the room you are in, its neighbours, and anywhere you have been.
  // Everything else is a position, not a type.
  const revealed = new Set<string>([roomId, ...(currentRoom?.connections ?? []), ...visited]);

  if (phase === 'menu') {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="rounded-blob border-2 border-line bg-ink p-6 text-cream shadow-sticker">
          <p className="text-xs font-bold tracking-[0.2em] text-cream/60 uppercase">Agent Dungeon</p>
          <h2 className="mt-2 font-display text-3xl font-bold">{L.title}</h2>
          <p className="mt-2 text-sm text-cream/80">{L.summary}</p>
          <p className="mt-3 text-xs text-cream/60">{L.difficulty}: 3 layers · 3 bosses</p>
        </div>
        <div className="grid gap-2">
          {DIFFS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => resetRun(d.id)}
              className="flex items-center justify-between rounded-blob border-2 border-line bg-paper px-4 py-3 text-left shadow-sticker-sm transition-transform hover:-translate-y-0.5"
            >
              <span>
                <span className="block font-display font-bold">{L[d.labelKey]}</span>
                <span className="text-xs text-ink-soft">
                  {L.hp} {DUNGEON_CONFIG.hp[d.id]} · {L.gold} {DUNGEON_CONFIG.gold[d.id]}
                </span>
              </span>
              <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'gameover' || phase === 'victory') {
    const won = phase === 'victory';
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <div className={cn('rounded-blob border-2 border-line p-6 text-center shadow-sticker', won ? 'bg-butter-soft' : 'bg-coral-soft')}>
          <p className="text-4xl">{won ? '🏆' : '💀'}</p>
          <h2 className="mt-2 font-display text-2xl font-bold">{won ? L.victory : L.gameOver}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {L.layerReached}: {stats.layers}/3 · {L.accuracy}:{' '}
            {stats.correct + stats.wrong === 0 ? 0 : Math.round((stats.correct / (stats.correct + stats.wrong)) * 100)}%
          </p>
        </div>
        <div className="rounded-blob border-2 border-line bg-paper p-4 shadow-sticker-sm">
          <p className="text-sm font-bold text-ink-soft uppercase">{L.stats}</p>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <li>{L.questions}: {stats.correct + stats.wrong}</li>
            <li>{L.correct}: {stats.correct}</li>
            <li>{L.totalGold}: {stats.gold}</li>
            <li>{L.layerReached}: {stats.layers}/3</li>
            <li>{L.buffs}: {buffs.size}</li>
            <li>{L.kills}: {stats.kills}</li>
          </ul>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPhase('menu')}>{L.menu}</Button>
          <Button variant="secondary" onClick={() => resetRun(difficulty)}>
            {L.again}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'battle' && battle && question) {
    const enemyHp = Math.max(0, battle.hp);
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {damageFlash ? (
          <div
            className="animate-damage pointer-events-none fixed inset-0 z-50"
            style={{ boxShadow: 'inset 0 0 90px 24px var(--color-coral)' }}
            aria-hidden
          />
        ) : null}
        <div className="flex items-center justify-between rounded-blob border-2 border-line bg-ink px-4 py-2 text-cream shadow-sticker-sm">
          <span className="text-sm font-bold uppercase">
            {L.layer} {layer + 1}/3 · {L.boss}: {bossCopy?.name ?? ''}
          </span>
          <span className="text-sm">
            {L.hp} {hp}/{maxHp} · {L.gold} {gold}
          </span>
        </div>

        <div className={cn('rounded-blob border-2 border-line bg-paper p-4 shadow-sticker', battle.elite && 'ring-2 ring-butter', enemyHit && 'animate-shake')}>
          <div className="flex items-center gap-3">
            <span className="text-6xl">{battle.icon}</span>
            <div className="flex-1">
              <p className="font-display text-lg font-bold">{battle.name}</p>
              {!battle.broken ? (
                <div className="mt-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
                    <Shield className="h-3 w-3" /> {L.confidence} {battle.confidence}/{battle.maxConfidence}
                  </div>
                  <div className="mt-1 flex gap-1">
                    {Array.from({ length: battle.maxConfidence }).map((_, i) => (
                      <span
                        key={i}
                        className={cn('h-2 flex-1 rounded-pill border-2 border-line', i < battle.confidence ? 'bg-butter' : 'bg-paper')}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-1">
                  <Badge tint="coral">{L.broken}</Badge>
                  <div className="mt-1 flex gap-1">
                    {Array.from({ length: battle.maxHp }).map((_, i) => (
                      <span key={i} className={cn('h-2 flex-1 rounded-pill border-2 border-line', i < enemyHp ? 'bg-coral' : 'bg-paper')} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {battle.kind === 'boss' && timeLeft !== null ? (
              <div className={cn('flex items-center gap-1 rounded-pill border-2 border-line px-2 py-1 text-xs font-bold', timeLeft <= 5 ? 'animate-pulse bg-coral-soft' : 'bg-cream')}>
                <Timer className="h-3 w-3" /> {timeLeft}s
              </div>
            ) : null}
          </div>
          {battle.lines ? (
            <p className="mt-2 text-xs text-ink-soft italic">
              “{!battle.broken ? battle.lines.hit : battle.lines.broken}”
            </p>
          ) : null}
        </div>

        <div className="rounded-blob border-2 border-line bg-paper p-4 shadow-sticker">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-ink-soft uppercase">
              {L.questionNumber} · {question.category}
            </span>
            <span className="text-xs text-ink-soft">{L.attack}</span>
          </div>
          <p className="mt-1 font-display text-lg font-bold">{question.question}</p>
          <div className="mt-3 grid gap-2">
            {question.options.map((option, i) => {
              const hidden = eliminated.includes(i);
              const chosen = choice === i;
              const correct = i === question.answer;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={feedback !== null || hidden}
                  onClick={() => answer(i)}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-base transition-colors',
                    hidden && 'opacity-30 line-through',
                    feedback && correct
                      ? 'border-mint-deep bg-mint-soft'
                      : chosen && !correct
                        ? 'border-coral-deep bg-coral-soft'
                        : 'border-line/30 bg-cream hover:border-line',
                  )}
                >
                  <span>{option}</span>
                  {feedback && correct ? <Badge tint="mint">{L.correct}</Badge> : chosen && !correct ? <Badge tint="coral">{L.wrong}</Badge> : null}
                </button>
              );
            })}
          </div>

          {feedback ? (
            <div className={cn('mt-3 rounded-xl border-2 border-line/30 px-3 py-2 text-base', feedback.correct ? 'bg-mint-soft' : 'bg-coral-soft')}>
              <p className="font-bold">{feedback.correct ? L.correct : L.wrong}</p>
              <p className="mt-1 text-ink-soft">{feedback.explain}</p>
              <div className="mt-2 flex justify-end">
                <Button size="sm" onClick={nextQuestionOrFinish}>
                  {L.next}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-ink-soft uppercase">{L.backpack}</span>
          {items.length === 0 ? <span className="text-xs text-ink-soft">—</span> : null}
          {Array.from(new Set(items)).map((id) => {
            const item = copy.items.find((i) => i.id === id)!;
            return (
              <span key={id} className="group relative">
                <button
                  type="button"
                  disabled={usedItemThisQuestion || feedback !== null}
                  onClick={() => applyItem(id)}
                  className="flex items-center gap-1 rounded-pill border-2 border-line bg-butter-soft px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
                >
                  <span>{item.icon}</span>
                  {item.name} ×{items.filter((x) => x === id).length}
                </button>
                <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-1 hidden w-60 rounded-lg border-2 border-line bg-paper p-2 text-xs font-normal text-ink shadow-sticker-sm group-hover:block">
                  {item.name}: {item.description}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === 'chest' && chestBuff) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 rounded-blob border-2 border-line bg-paper p-5 shadow-sticker">
        <p className="font-display text-xl font-bold">{L.chestTitle}</p>
        <p className="text-base text-ink-soft">{L.chestBody}</p>
        <div className="rounded-blob border-2 border-line bg-butter-soft p-3">
          <p className="font-display font-bold">
            {chestBuff.icon} {chestBuff.name}
          </p>
          <p className="text-sm text-ink-soft">{chestBuff.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              grantBuff(chestBuff.id);
              setCleared((prev) => new Set(prev).add(roomId));
              setChestBuff(null);
              setPhase('map');
            }}
          >
            {L.choose}
          </Button>
          <Button
            variant="secondary"
            disabled={gold < DUNGEON_CONFIG.rerollCost}
            onClick={() => {
              if (gold < DUNGEON_CONFIG.rerollCost) return;
              setGold((g) => g - DUNGEON_CONFIG.rerollCost);
              setChestBuff(pickBuffPool(1)[0] ?? null);
            }}
          >
            {L.reroll}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setChestBuff(null);
              setPhase('map');
            }}
          >
            {L.leave}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'shop') {
    const price = Math.round(DUNGEON_CONFIG.buffPrice[difficulty] * (buffs.has('discount') ? 0.7 : 1));
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-3">
        <div className="flex items-center justify-between rounded-blob border-2 border-line bg-ink px-4 py-2 text-cream shadow-sticker-sm">
          <span className="font-display font-bold">{L.shopTitle}</span>
          <span className="text-xs">
            {L.gold} {gold}
          </span>
        </div>
        <div className="grid gap-2">
          {shopStock.buff ? (
            <div className="flex items-center justify-between gap-2 rounded-blob border-2 border-line bg-paper p-3 shadow-sticker-sm">
              <div>
                <p className="font-display font-bold">
                  {shopStock.buff.icon} {shopStock.buff.name}
                </p>
                <p className="text-sm text-ink-soft">{shopStock.buff.description}</p>
              </div>
              <Button
                size="sm"
                disabled={gold < price}
                onClick={() => {
                  if (gold < price) return;
                  setGold((g) => g - price);
                  grantBuff(shopStock.buff!.id);
                  if (shopStock.buff!.id === 'tough') {
                    setMaxHp((m) => m + 30);
                    setHp((h) => h + 30);
                  }
                  setShopStock((s) => ({ ...s, buff: null }));
                }}
              >
                {L.buy} {price}
              </Button>
            </div>
          ) : null}
          {shopStock.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 rounded-blob border-2 border-line bg-paper p-3 shadow-sticker-sm">
              <div>
                <p className="font-display font-bold">
                  {item.icon} {item.name}
                </p>
                <p className="text-sm text-ink-soft">{item.description}</p>
              </div>
              <Button
                size="sm"
                disabled={gold < item.price[difficulty === 'easy' ? 0 : difficulty === 'normal' ? 1 : 2]}
                onClick={() => {
                  const cost = item.price[difficulty === 'easy' ? 0 : difficulty === 'normal' ? 1 : 2];
                  if (gold < cost) return;
                  setGold((g) => g - cost);
                  setItems((prev) => [...prev, item.id].slice(0, DUNGEON_CONFIG.maxItems));
                  setShopStock((s) => ({ ...s, items: s.items.filter((i) => i.id !== item.id) }));
                }}
              >
                {L.buy} {item.price[difficulty === 'easy' ? 0 : difficulty === 'normal' ? 1 : 2]}
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setCleared((prev) => new Set(prev).add(roomId));
            setPhase('map');
          }}
        >
          {L.leave}
        </Button>
      </div>
    );
  }

  if (phase === 'buff') {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-3">
        <div className="rounded-blob border-2 border-line bg-butter-soft p-4 shadow-sticker-sm">
          <p className="font-display text-xl font-bold">{L.buffTitle}</p>
          <p className="text-base text-ink-soft">{L.buffBody}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {buffChoices.map((buff) => (
            <button
              key={buff.id}
              type="button"
              onClick={() => chooseBuff(buff)}
              className="rounded-blob border-2 border-line bg-paper p-3 text-left shadow-sticker-sm transition-transform hover:-translate-y-0.5"
            >
              <p className="text-2xl">{buff.icon}</p>
              <p className="mt-1 font-display font-bold">{buff.name}</p>
              <p className="text-sm text-ink-soft">{buff.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // map
  if (!map) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 rounded-blob border-2 border-line bg-ink px-3 py-2 text-cream shadow-sticker-sm">
          <MapIcon className="h-4 w-4" aria-hidden />
          <span className="text-xs font-bold">
            {L.layer} {layer + 1}/3 · {L.boss}: {bossCopy?.name}
          </span>
          <span className="ml-auto flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" /> {hp}/{maxHp}
            </span>
            <span className="flex items-center gap-1">
              <Coins className="h-3 w-3" /> {gold}
            </span>
          </span>
        </div>

        <div className="rounded-blob border-2 border-line bg-cream p-3 shadow-sticker">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 16 }).map((_, i) => {
              const x = i % 4;
              const y = Math.floor(i / 4);
              const room = map.rooms.find((r) => r.pos[0] === x && r.pos[1] === y);
              if (!room) return <div key={i} className="aspect-square rounded-lg border-2 border-dashed border-line/20" />;
              const here = room.id === roomId;
              const reachable = availableRooms.has(room.id);
              const isCleared = cleared.has(room.id);
              const wasVisited = visited.has(room.id);
              const known = revealed.has(room.id);
              return (
                <button
                  key={room.id}
                  type="button"
                  disabled={!reachable && !here}
                  onClick={() => moveTo(room)}
                  style={{
                    boxShadow:
                      '0 5px 0 0 var(--color-line), inset 0 2px 0 0 rgba(255,255,255,.55)',
                  }}
                  className={cn(
                    'relative grid aspect-square place-items-center rounded-lg border-2 border-line bg-gradient-to-b from-paper to-cream text-2xl transition-all duration-150 hover:-translate-y-0.5',
                    here ? 'border-coral from-coral-soft to-paper shadow-sticker' : '',
                    reachable && !here && 'animate-pulse border-butter from-butter-soft to-paper',
                    isCleared && 'opacity-60',
                  )}
                >
                  <span className={cn(known ? 'text-3xl' : 'text-lg font-bold text-ink-soft')}>
                    {known ? roomIcon[room.type] : '?'}
                  </span>
                  {isCleared ? (
                    <span className="absolute right-1 bottom-1 text-xs text-mint-deep">✓</span>
                  ) : null}
                  {reachable && !here ? (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-coral" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-sm text-ink-soft">{L.move}</p>

        <div className="flex flex-wrap gap-2">
          {currentRoom?.connections.map((id) => {
            const room = map.rooms.find((r) => r.id === id)!;
            const label = room.type === 'boss' ? L.roomBoss : room.type === 'chest' ? L.roomChest : room.type === 'shop' ? L.roomShop : L.roomBattle;
            return (
              <Button key={id} variant="secondary" size="sm" onClick={() => moveTo(room)}>
                {roomIcon[room.type]} {label}
              </Button>
            );
          })}
        </div>
      </div>

      <aside className="flex flex-col gap-3">
        <div className="rounded-blob border-2 border-line bg-paper p-3 shadow-sticker-sm">
          <p className="text-sm font-bold text-ink-soft uppercase">{L.buffs}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {buffs.size === 0 ? <span className="text-xs text-ink-soft">—</span> : null}
            {[...buffs].map((id) => {
              const buff = copy.buffs.find((b) => b.id === id)!;
              return (
                <span
                  key={id}
                  className="group relative cursor-help rounded-pill border-2 border-line bg-butter-soft px-2.5 py-1.5 text-sm"
                >
                  {buff.icon} {buff.name}
                  <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-1 hidden w-56 rounded-lg border-2 border-line bg-paper p-2 text-xs font-normal text-ink shadow-sticker-sm group-hover:block">
                    {buff.description}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
        <div className="rounded-blob border-2 border-line bg-paper p-3 shadow-sticker-sm">
          <p className="text-sm font-bold text-ink-soft uppercase">{L.backpack}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {items.length === 0 ? <span className="text-xs text-ink-soft">—</span> : null}
            {Array.from(new Set(items)).map((id) => {
              const item = copy.items.find((i) => i.id === id)!;
              return (
                <span
                  key={id}
                  className="group relative cursor-help rounded-pill border-2 border-line bg-cream px-2.5 py-1.5 text-sm"
                >
                  {item.icon} {items.filter((x) => x === id).length}
                  <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-1 hidden w-56 rounded-lg border-2 border-line bg-paper p-2 text-xs font-normal text-ink shadow-sticker-sm group-hover:block">
                    {item.name}: {item.description}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
        {battle?.kind === 'boss' ? <p className="text-xs text-coral-deep">{L.bossLocked}</p> : null}
      </aside>
    </div>
  );
}

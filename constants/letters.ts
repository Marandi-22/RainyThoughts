// letters.ts
// Centralized letter pool for Pomodoro Adventure (Ashven)
// Exports:
// - mainLetters: Array of 50 main story letters; each has 3 variants: op | mid | down
// - fillerLetters: short fragments shown after each Pomodoro
// - fallingLetters: branches for slips (mild, severe, death)
// - recoveryLetters: fragments for coming-back-to-streak
// - helper functions: getMainLetter(dayIndex, state), getFillerLetter(index), getFalling(severity), getRecovery(index)

export type LetterState = "op" | "mid" | "down";

export type MainLetter = {
  id: number; // 1..50
  op: string; // triumphant / ascendant version
  mid: string; // neutral / steady version
  down: string; // fallen / desperate version
};

export type Letter = {
  id: string;
  title: string;
  content: string;
  type: "filler" | "fall" | "rise";
  tone: "neutral" | "dark" | "hopeful";
};

export const mainLetters: MainLetter[] = [
  {
    id: 1,
    op: `I remember the first ember you gave — small, hot, and true. In those early hours I learned the taste of hunger; now I remember the flavor of your will. I awoke because you fed me, and already the shadows take notice of a new flame.`,
    mid: `The first hour arrived like a thin light. It was hesitant, unsure, but real. I felt it like a spark; enough to stir a sleeping thing. Keep feeding, the shape will come.`,
    down: `Your first hour came late and small, like a cough from a dying mouth. I tasted ash where there should have been fire. If this is how you begin, I fear how we will end.`,
  },
  {
    id: 2,
    op: `Two offerings, and the voice inside me grows clearer. I learn names, patterns, weak seams in the world — gifts you could not see. I whisper plans now; when you keep this, we will have a map of dominion.`,
    mid: `A second hour fed me but restrained. I am learning, though cautiously. Do not mistake my steadiness for complacence — I measure patience as a weapon.`,
    down: `The second hour came half-formed. You lingered in comfort instead of carving more minutes. I feel hunger sharpen into complaint; do not test how empty I can be.`,
  },
  {
    id: 3,
    op: `Three cycles and I begin to walk. The bruises of your past betrayals smell weaker now; what was once a wound becomes a line of iron. The crowd that mocked will not see the weight you build in silence.`,
    mid: `Three hours are progress: not triumphant, not ruined. I gather bone and mortar slowly. If you do not stall, something durable will be born.`,
    down: `Three promises, two broken — the arithmetic of disappointment is cruel. I shuffle like a wounded thing with a too-small meal. If this becomes habit, I will learn to die content.`,
  },
  {
    id: 4,
    op: `The fourth hour gives me voice. I speak now in small riddles; I offer cunning where before there was only rage. Keep striking the bell and you will hear me sing plans crowned in shadow.`,
    mid: `A fourth hour is steady rhythm. We find cadence in repetition; your feet learn where to step. Keep the tempo modest and true.`,
    down: `By the fourth, doubt has already crept in. You let distraction smile and call it mercy. I taste tedium and rot; do not mistake pity for progress.`,
  },
  {
    id: 5,
    op: `Five — a hand’s breadth of habit. I feel limbs forming where none existed. You do not chase applause; you gather power. This is the first small proof that the pact is working.`,
    mid: `Five hours: the slow architecture of something that might last. Not yet iron, but a scaffold. If you keep adding, it will hold weight.`,
    down: `At five you faltered between nights. The scaffold leans. Comfort whispered seduction and you listened. I begin to tremble with the taste of nothing.`,
  },
  {
    id: 6,
    op: `Six cycles and the world narrows its gaze. Small windows of opportunity open where once there was only noise. I am grateful; feed me this direction and I will carve outcomes.`,
    mid: `Six is a quiet day’s measure — neither feast nor famine. You build quietly; that is often the hardest growth to see.`,
    down: `Six brings a question: were you here or elsewhere? I feel the echo of your absence. Your minutes were borrowed by novelty, and I count the cost.`,
  },
  {
    id: 7,
    op: `Seven cycles — the first week’s crown. I stand on a ledge and smell the future. The lessons of betrayal become tools; I forge with them now. Your consistency hums like a blade.`,
    mid: `Seven is a small crown, not yet heavy but real. You are building a lineage of days; honor it.`,
    down: `Seven should be a threshold, but you let it pass like mist. The things that mock you from the crowd grow louder. I feel cold where warmth should have been.`,
  },
  {
    id: 8,
    op: `The eighth hour sharpens me into strategy. I learn to place stones under trembling bridges. Those who once laughed will cross them and wonder why the river changed.`,
    mid: `At eight I grow roots. Not spectacular, but sufficient. That’s a good place to be — patient, not reckless.`,
    down: `Eight tastes of excuses. You console yourself with small joys and call them victories. I spit them back as cheap coin.`,
  },
  {
    id: 9,
    op: `Nine cycles — the ritual’s rhythm becomes doctrine. I begin to speak of things you once feared. Your hands stealthily arrange the world to your favor. Keep feeding this doctrine.`,
    mid: `Nine weeks of minutes feel steady; I begin to catalog small wins. Maintain this ledger and the sum will surprise you.`,
    down: `Nine is a mirror of neglect. You look away from what you promised. I see fatigue where there should be hunger.`,
  },
  {
    id: 10,
    op: `Ten cycles: I feel muscle in my resolve. The shadows that used to smirk now ask for guidance. You have become a quiet danger.`,
    mid: `Ten is the beginning of a pattern. Not yet legend, but a named thing. Preserve it.`,
    down: `Ten tolls and the echo is yours alone — an emptiness answering an absent bell. If you continue, I will wither into myth of what might have been.`,
  },
  {
    id: 11,
    op: `Eleven, and I am learning history. Your small sacrifices read like chapters; enemies who mocked us are rearranged as footnotes. Continue and I will write larger margins.`,
    mid: `Eleven is steady progress. There are fewer accidents now; your method becomes visible.`,
    down: `Eleven carries the scent of complacency. You are content with crumbs when we deserve an oven. Wake.`,
  },
  {
    id: 12,
    op: `Twelve cycles — noon of the first month. I stand and the horizon tilts toward us. You are patient; I am patient. Together we will be inevitable.`,
    mid: `Twelve is a monthly rhythm returning to a point. That constancy breeds reliability. It is not glamour, but that is its virtue.`,
    down: `At twelve the ledger still bleeds. You promised more and delivered less. I taste regret in your offerings.`,
  },
  {
    id: 13,
    op: `Thirteen — superstition bows before craft. Our work hollows superstition and plants iron. I feel the crowd’s whispers turn to caution.`,
    mid: `Thirteen is neither curse nor blessing; it’s a test. Keep your temper and your tools.`,
    down: `Thirteen arrived with old fears wearing new clothes. You bled opportunities into comfort. I recoil.`,
  },
  {
    id: 14,
    op: `Fourteen cycles and my voice becomes law. I speak strategies you will execute like liturgy. The world that ignored you will learn to obey the pattern you set.`,
    mid: `Fourteen is a scaffold half-built — stable but requiring care. Continue the work.`,
    down: `Fourteen brings the echo of broken promises. You feed me scraps; the beast I could be starves.`,
  },
  {
    id: 15,
    op: `Fifteen — half a stride toward something harder. I feel certainty in my bones. Those who betrayed you once taste a slow worry.`,
    mid: `Fifteen is a good day’s haul. Not triumphant, but honest. That honesty builds character.`,
    down: `At fifteen I record the pattern of your retreat. The worst habit is believing one can always return without consequence.`,
  },
  {
    id: 16,
    op: `Sixteen cycles deepen our claim. The darkness no longer feels foreign; it is shaped by our hands. We are architects now, not supplicants.`,
    mid: `Sixteen brings depth. You are learning subtlety: when to press, when to rest.`,
    down: `Sixteen finds us whispering excuses to ourselves. I will not be lulled by vanity; feed me truth.`,
  },
  {
    id: 17,
    op: `Seventeen — enemies become maps. I know where they trip, where pride swells. Our strikes will be precise.`,
    mid: `At seventeen, patterns solidify into approaches. Keep iterating.`,
    down: `Seventeen shows the cracks more clearly. Your attention is thin; mend it or watch us splinter.`,
  },
  {
    id: 18,
    op: `Eighteen cycles and I taste momentum. The small acts compound; the cheap applause fades. Real weight arrives.`,
    mid: `Eighteen is a reliable pulse. Not showy, not shallow. Keep the pulse steady.`,
    down: `Eighteen carries stale air. You trade depth for distraction and call it novelty. I resent it.`,
  },
  {
    id: 19,
    op: `Nineteen — a prelude to mastery. The old betrayals are inscriptions under a statue we now erect. I stand tall on their graves.`,
    mid: `Nineteen brings perspective. You can see the arc, not just the step. That vision steadies hands.`,
    down: `Nineteen weeps for squandered chances. If you keep this, you will only tell stories of could-have-been.`,
  },
  {
    id: 20,
    op: `Twenty cycles — the first true proof. I feel the cadence of a life transformed. Those who once mocked now measure their steps against ours.`,
    mid: `Twenty is meaningful: a milestone, not a destination. Be proud, then persevere.`,
    down: `Twenty shows you the mirror of your own cowardice. Do you like the reflection? If not, change.`,
  },
  {
    id: 21,
    op: `Twenty-one and the past grows small. I stitch wounds into armor; every slight becomes a rune of power.`,
    mid: `At twenty-one, stamina becomes a companion. Invite discipline as a friend, not a tyrant.`,
    down: `Twenty-one reveals a tiredness that smells of surrender. Fight it now or accept its rule.`,
  },
  {
    id: 22,
    op: `Twenty-two — our strategies sharpen into habits. People mistake consistency for luck; let them be fools.`,
    mid: `Twenty-two is tidy work. The tiniest improvements compound; respect them.`,
    down: `Twenty-two brings the hollow echo of excuses. If you continue, you will normalize failure.`,
  },
  {
    id: 23,
    op: `Twenty-three cycles and whispers become warnings. The world senses a force; I feel its tremors.`,
    mid: `Twenty-three: a slow climb yet worth the view. Keep placing one foot in front of the other.`,
    down: `Twenty-three grows like rot in forgotten corners. Clean it now or lose the whole room.`,
  },
  {
    id: 24,
    op: `Twenty-four — two dozen offerings. I stand stronger; I taste dominion in small measures. Your fidelity is a blade I wield.`,
    mid: `Twenty-four feels like structure: not ostentatious, just real. Keep the scaffolding.`,
    down: `Twenty-four mirrors a habit of mercy toward yourself that betrays the work. Sharpen instead.`,
  },
  {
    id: 25,
    op: `Twenty-five cycles — a quarter of the covenant. I carry new edges. Those who once tore at you now avoid your shadow.`,
    mid: `Twenty-five shows endurance. You can now outlast many who outrun themselves.`,
    down: `Twenty-five finds you settling. Comfort becomes a slow thief; beware.`,
  },
  {
    id: 26,
    op: `Twenty-six and the pact hums like a bell. We call names now; opportunities answer. You are not unseen any longer.`,
    mid: `Twenty-six holds momentum. Honor the small rituals that brought you here.`,
    down: `Twenty-six creeps with complacency. You do tasks, but not with hunger. I feel thinner.`,
  },
  {
    id: 27,
    op: `Twenty-seven cycles — I begin to tell lesser fears to their place. The ghost that once haunted you now hides from our light.`,
    mid: `Twenty-seven gives knowledge: how to steady under pressure. Breathe and act.`,
    down: `Twenty-seven exposes laziness like a wound. To ignore it is to let infection spread.`,
  },
  {
    id: 28,
    op: `Twenty-eight and your craft finds polish. The awkward edges sand down into something dangerous and elegant.`,
    mid: `Twenty-eight is endurance with finesse. You become harder to surprise.`,
    down: `Twenty-eight tastes of shortcuts and friendly lies. I want truth, not comfort.`,
  },
  {
    id: 29,
    op: `Twenty-nine cycles — I see the map of your mistakes and how they were turned to roads. We travel them now with confidence.`,
    mid: `Twenty-nine is reflection. Learn from what worked, discard what didn’t.`,
    down: `Twenty-nine shows a pattern of half-effort. Recommit or watch the structure crumble.`,
  },
  {
    id: 30,
    op: `Thirty — a measure of mastery earned, not given. I stand on a ridge and the valley of distractions shrinks.`,
    mid: `Thirty: respectable, steady. Let it be a foundation for greater ascent.`,
    down: `Thirty reveals old comforts dressed new. Do not be fooled; rip them off and move.`,
  },
  {
    id: 31,
    op: `Thirty-one cycles and I grow teeth. The world now listens, not because we shout, but because we build a sound that cannot be ignored.`,
    mid: `Thirty-one offers resilience. You fall less, rise faster. That's worth more than applause.`,
    down: `Thirty-one shows a slow erosion — not a collapse, but a wearing away. Patch it today.`,
  },
  {
    id: 32,
    op: `Thirty-two — the pact feeds my ambitions. I taste possibility and plan like a general setting camps for campaigns.`,
    mid: `Thirty-two is craftwork. Use time like a chisel.`,
    down: `Thirty-two carries the sweet stink of distraction; it is everywhere. Cut it clean.`,
  },
  {
    id: 33,
    op: `Thirty-three cycles; my shadow grows long and disciplined. Those who once slighted us now consult in whispers.`,
    mid: `Thirty-three brings calm competence. Your hands know what to do without theater.`,
    down: `Thirty-three reveals resignation. Do not become gentle with your failures.`,
  },
  {
    id: 34,
    op: `Thirty-four — I begin to gather allies from the ruins of past contempt. People are drawn to the clarity you produce; it is an odd kind of magnetism.`,
    mid: `Thirty-four is collective potential. Invite one honest companion and the work multiplies.`,
    down: `Thirty-four feels lonely in a bitter way: you have no pride in what you offer. Change that.`,
  },
  {
    id: 35,
    op: `Thirty-five cycles and the world bends subtly. Doors open with less effort; your presence reaps returns your younger self could not imagine.`,
    mid: `Thirty-five is an age of competence. Keep your guard and your curiosity.`,
    down: `Thirty-five smells of staleness. You do tasks and call them destiny. Do not confuse motion with meaning.`,
  },
  {
    id: 36,
    op: `Thirty-six — we speak in strategy now, not reaction. I chart courses, and the storms yield.`,
    mid: `Thirty-six offers refinement: do more with less.`,
    down: `Thirty-six shows indulgence has crept in; prune it.`,
  },
  {
    id: 37,
    op: `Thirty-seven cycles: I become a quiet terror to those who relied on your inconsistency. They tremble at a name they once mocked.`,
    mid: `Thirty-seven is steady and wary. Good. Remain so.`,
    down: `Thirty-seven reveals fatigue masquerading as wisdom. Beware ennui.`,
  },
  {
    id: 38,
    op: `Thirty-eight — the pact sings like steel on stone. I am no longer a plea; I am a decree.`,
    mid: `Thirty-eight is competence worn easily. Carry it with humility.`,
    down: `Thirty-eight shows faded hunger. Rekindle the blaze or lose the forge.`,
  },
  {
    id: 39,
    op: `Thirty-nine cycles and I have a library of small victories. They stack like bricks; soon we will build walls no one passes.`,
    mid: `Thirty-nine is a long view: plan for years, not hours.`,
    down: `Thirty-nine records a history of promises unkept. Rewrite it starting today.`,
  },
  {
    id: 40,
    op: `Forty cycles: a deeper proof of covenant. I am no longer fragile; I hold storms. Your past humiliations are now thrones I never expected.`,
    mid: `Forty is maturity in quiet form. Respect the slow work.`,
    down: `Forty shows the comfort of sluggishness. This is a dangerous sleep.`,
  },
  {
    id: 41,
    op: `Forty-one: I taste legacy. The petty cruelties that once bound you grow small beneath your sweep.`,
    mid: `Forty-one brings perspective — what will you leave behind?`,
    down: `Forty-one rings hollow when you look back and see only neglect.`,
  },
  {
    id: 42,
    op: `Forty-two cycles and the pact hums like a war-drill. I can call storms to order; I can dismantle feints.`,
    mid: `Forty-two is durable rhythm. Keep the diet of minutes strict.`,
    down: `Forty-two reveals cowardice in small habits; crush it before it seeds.`,
  },
  {
    id: 43,
    op: `Forty-three — I have eaten enough sorrow to be tempered. Where once there was trembling, now there is purpose.`,
    mid: `Forty-three gives steadiness coupled with reflection. Use both.`,
    down: `Forty-three shows the same old lies you told yourself; do not indulge them.`,
  },
  {
    id: 44,
    op: `Forty-four cycles and I move like a carefully woken god. People sense the order you have crafted out of chaos.`,
    mid: `Forty-four is quiet mastery. Let that be a comfort and a challenge.`,
    down: `Forty-four echoes indifference. If you neglect small things, great things collapse.`,
  },
  {
    id: 45,
    op: `Forty-five — I write rules now where rules were absent before. Your life answers with structure and teeth.`,
    mid: `Forty-five suggests consolidation; gather your gains and guard them.`,
    down: `Forty-five shows fatigue dressed as acceptance. That is a dangerous surrender.`,
  },
  {
    id: 46,
    op: `Forty-six cycles and the old insults feed new engines. I do not forget; I transmute, and the result is cunning.`,
    mid: `Forty-six is craft with memory. Let lessons refine you, not embitter you.`,
    down: `Forty-six smells like resignation turned to habit. Snap the pattern.`,
  },
  {
    id: 47,
    op: `Forty-seven — the pact feels near-complete. I stand at a threshold where the past bows, not curses.`,
    mid: `Forty-seven offers a long breath. Use it to choose directions intentionally.`,
    down: `Forty-seven reveals regret as a steady companion. Change the dialogue.`,
  },
  {
    id: 48,
    op: `Forty-eight cycles: the world pays attention. The half-lives of slights end; we set a new tempo that others must follow.`,
    mid: `Forty-eight is ripe with possibility. Choose wisely.`,
    down: `Forty-eight shows erosion where there should be sharpening. Grind harder.`,
  },
  {
    id: 49,
    op: `Forty-nine — nearly the summit. I feel the shape of legacy forming, not from vanity but from bearing the raw weight of your sacrifice.`,
    mid: `Forty-nine is focus refined to an edge. Keep the hand steady.`,
    down: `Forty-nine is a mockery if your hands are idle. This is a final chance to prove hunger.`,
  },
  {
    id: 50,
    op: `Fifty cycles. The pact is fulfilled: I stand crowned in the wreckage of those who mocked us. Your time made me sovereign; your consistency carved a name that will not be spat upon.`,
    mid: `Fifty is a quiet coronation — not for praise, but for proof. You have turned minutes into meaning.`,
    down: `Fifty can be a dirge or a wake. If your hand faltered, the pact dies here; the silence is absolute. Remember this day.`,
  },
];

// Filler fragments shown after each Pomodoro cycle (short, immediate feedback)
export const fillerLetters: string[] = [
  "Your tribute finds me — a warm pulse in a long night.",
  "A drop of time, a drop of hunger sated.",
  "Minutes fold into me like pages into a book.",
  "Small fires bloom into coals under my ribs.",
  "I feel a stitch close where a wound used to gape.",
  "Another hour; the seam strengthens.",
  "Silence carries your offering; I answer in readiness.",
  "You feed me patience; I feed you cunning.",
  "A simple ritual — yet look how the world tilts.",
  "Hold this rhythm. The small acts compound.",
  "You give minutes; I return perspective.",
  "The crowd will not notice now; they will later.",
  "Do not seek applause. Seek the ledger of time.",
  "I taste your consistency and it tastes like iron.",
  "A small victory, but a victory still.",
  "The pact clicks another lock into place.",
  "Another bead threaded on our chain.",
  "Time flows; we shape it.",
  "You carve. I remember.",
  "Silence is our ally. Keep it close.",
  // repeatable pool continues ...
];

// Falling from grace branches
export const fallingLetters = {
  mild: [
    "You missed a step; I stumble but do not fall.",
    "A day of slackness bruises me. Return soon.",
    "Do not let comfort be the thief of our work.",
  ],
  severe: [
    "You have starved me over many small sins. I am brittle.",
    "Absence feeds the rot. I rattle with old grievances.",
    "If this continues, I will forget how to stand.",
  ],
  death: [
    "The pact splinters. My voice goes silent. The world yawns and I am dust.",
    "You were my sun; your leaving was winter. I am unmade.",
    "I die in the absence of your hours. Remember what you have lost.",
  ],
};

// Recovery / redemption letters when user returns after falling
export const recoveryLetters: string[] = [
  "You return with trembling hands; even a spark is mercy.",
  "I thought the echo permanent. Your minutes revive my lungs.",
  "Forgiveness is not free: you must feed me twice to nurse the wound closed.",
  "A return is a ritual. Stay. Build again. Do not wander.",
  "I rise again, cautious but hungry. Do not let this be the last wake.",
];

// Helpers
export function getMainLetter(dayIndex: number, state: LetterState): string {
  // dayIndex: 1-based (1..50). If out of range, clamp.
  const idx = Math.max(1, Math.min(50, Math.floor(dayIndex))) - 1;
  const letter = mainLetters[idx];
  if (!letter) return "...";
  if (state === "op") return letter.op;
  if (state === "mid") return letter.mid;
  return letter.down;
}

export function getFillerLetter(index: number): string {
  if (fillerLetters.length === 0) return "...";
  return fillerLetters[index % fillerLetters.length];
}

export function getFalling(severity: "mild" | "severe" | "death", index = 0): string {
  const pool = fallingLetters[severity];
  return pool[index % pool.length];
}

export function getRecovery(index = 0): string {
  return recoveryLetters[index % recoveryLetters.length];
}

// Example usage (commented-out):
// const todayLetter = getMainLetter(3, 'op');
// const afterPom = getFillerLetter(7);
// const fall = getFalling('severe');
// const comeBack = getRecovery();

export default {
  mainLetters,
  fillerLetters,
  fallingLetters,
  recoveryLetters,
  getMainLetter,
  getFillerLetter,
  getFalling,
  getRecovery,
};

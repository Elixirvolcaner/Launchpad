// Artemis II (historical) and Artemis IV (planned) mission content, plus positive events
// and educational lessons. Event fields:
//   kind: 'historical' | 'planned' | 'simulated' | 'positive'
//   history: what really happened / what is planned (shown in the debrief)
//   lesson: the engineering idea behind the decision
//   choices[].rating: 'best' | 'ok' | 'poor', choices[].why: explanation shown after choosing

const hurt = (s, n) => { if (s.target) s.target.health -= n; };
const hurtAll = (s, n) => s.crew.forEach(c => { c.health -= n; });
const lowerPower = (s, n) => { s.power = Math.max(15, s.power - n); };

export const SOURCE_NOTE = 'Historical details summarise public NASA/ESA/CSA mission reporting as understood when this game was written; game numbers are simplified. Artemis IV content describes plans that may change.';

export const A2_PRELAUNCH = {
  title: 'Launch Abort System · Battery Temperature Reading',
  kind: 'historical',
  text: 'During the countdown, telemetry shows an out-of-family temperature reading on a battery in the Launch Abort System attitude-control motor area. Engineers must decide whether the reading reflects a real hardware problem or a sensor issue before the crew is committed to flight.',
  history: 'Artemis II teams worked through a launch-abort-system battery temperature indication before flight; engineers evaluated the data and cleared the vehicle. (Game summary — exact details simplified.)',
  lesson: 'Launch commit criteria exist so a team never "argues" a vehicle into flight. Cross-checking with independent sensors and engineering analysis is how a reading is cleared — not schedule pressure.',
  choices: [
    { label: 'Hold the count; cross-check redundant sensors & analyze', rating: 'best', moraleDelta: 0,
      why: 'Correct. You used data and redundancy to clear the anomaly. A short hold costs nothing compared with an abort-system failure.' },
    { label: 'Scrub the launch for a full battery replacement', rating: 'ok', moraleDelta: -6,
      why: 'Safe, but conservative: a scrub costs days and money when the anomaly could be cleared with analysis. Sometimes justified — here the data supported flying.' },
    { label: 'Waive the reading and continue the count', rating: 'poor', moraleDelta: -12,
      why: 'Risky. Waiving an abort-system reading without analysis breaks launch commit discipline. You got lucky — the review board will not be impressed.' },
  ],
};

export const CATEGORY_LESSONS = {
  RADIATION: 'Deep space lacks Earth\'s magnetic shielding; crews shelter behind mass (water, supplies) during solar particle events.',
  POWER: 'Spacecraft budget power tightly — shedding non-critical loads early preserves margin for critical systems.',
  HEALTH: 'Small medical issues grow in isolation; early treatment and rest protect the whole crew.',
  'LIFE SUPPORT': 'Life support is the one system you cannot "push through" — fix leaks and scrubbers before anything else.',
  HULL: 'Micrometeoroid damage is rare but serious; isolating a compartment buys time to repair safely.',
  COMMS: 'When the link drops, crews follow pre-planned procedures rather than improvising critical burns.',
  PSYCHOLOGY: 'Behavioural health is mission-critical; contact with home and rest are real countermeasures.',
  CREW: 'Good teams resolve conflict early; leadership and shared downtime keep crews functional.',
  NAVIGATION: 'Small trajectory errors grow with distance — early, small corrections are cheaper than late large ones.',
  THERMAL: 'Thermal control keeps electronics and crew in a narrow range; attitude changes are a cheap first tool.',
  AVIONICS: 'Redundant computers let a crew reboot safely; ground verification catches what one computer cannot.',
  PROPULSION: 'Propellant is the hardest resource to replace — every burn is planned against a reserve.',
  SCIENCE: 'Opportunistic science is valuable, but never at the expense of safety margins.',
  DOCKING: 'Docking is done slowly with abort points; patience beats speed.',
  HARDWARE: 'Spares and simple repairs keep long missions alive.',
  SUPPLIES: 'Food safety matters — contamination can disable a crew.',
  SUCCESS: 'Things going right is the result of preparation.',
};

const A2 = ['artemis2'];
const A4 = ['artemis4'];

export const ARTEMIS_EVENTS = [
  // ---------------- Artemis II required operations ----------------
  { category: 'PROPULSION', title: 'ICPS Perigee Raise & Proximity Ops Demo', operationAt: 0, missions: A2, kind: 'historical',
    text: 'After reaching orbit, the upper stage (ICPS) raises Orion\'s orbit. After separation, the crew flies Orion manually near the spent stage to test handling qualities for future docking.',
    history: 'Artemis II included a high-Earth-orbit checkout and a manual proximity-operations demonstration piloted by the crew using the spent ICPS as a target.',
    lesson: 'Testing manual flying in a safe setting de-risks later dockings with Gateway and landers.',
    choices: [
      { label: 'Fly the full demo at planned range [ -3% Fuel, +15 Science ]', rating: 'best', why: 'Completes a key test objective at modest propellant cost.', act: s => { s.fuel -= s.fuelNeed * (has(s, 'glover') ? 0.02 : 0.03); s.science += 15; } },
      { label: 'Shorten the demo [ -1% Fuel, +5 Science ]', rating: 'ok', why: 'Saves propellant but gathers less handling data.', act: s => { s.fuel -= s.fuelNeed * 0.01; s.science += 5; } },
      { label: 'Fly aggressively close for better data [ -6% Fuel, -10 Morale ]', rating: 'poor', why: 'Closing faster than planned wastes propellant and raises collision risk.', act: s => { s.fuel -= s.fuelNeed * 0.06; s.morale -= 10; } },
    ] },
  { category: 'LIFE SUPPORT', title: 'Toilet (WMS) Malfunction', operationAt: 0.1, missions: A2, kind: 'historical',
    text: 'The Universal Waste Management System — Orion\'s toilet — is not working properly early in the flight. The crew has backup collection bags.',
    history: 'Artemis II crew reported a problem with the toilet early in the mission and worked troubleshooting with Mission Control, using contingency procedures meanwhile. (Summary.)',
    lesson: 'Hygiene systems sound trivial but drive crew health and morale on multi-day flights. Ground-guided troubleshooting plus contingency supplies is standard practice.',
    choices: [
      { label: 'Ground-guided troubleshooting; use backup bags meanwhile [ -6 Morale ]', rating: 'best', why: 'Methodical: keeps the crew safe while the team diagnoses the fault.', act: s => { s.morale -= 6; s.science += 3; } },
      { label: 'Crew improvises a fix without ground [ -12 Health (target), +4 Morale ]', rating: 'poor', why: 'Improvising on a fluid system can contaminate the cabin and hurt a crew member.', act: s => { hurt(s, 12); s.morale += 4; } },
      { label: 'Backup bags only for the whole flight [ -14 Morale ]', rating: 'ok', why: 'Safe but needlessly unpleasant for ten days.', act: s => { s.morale -= 14; } },
    ] },
  { category: 'PROPULSION', title: 'Trans-Lunar Injection Burn', operationAt: 0.2, missions: A2, kind: 'historical',
    text: 'The European Service Module fires to send Orion toward the Moon on a free-return trajectory — a path that brings it home even without another major burn.',
    history: 'Artemis II used a free-return trajectory around the Moon, like Apollo 13 relied on after its emergency.',
    lesson: 'A free-return trajectory is a built-in safety net: if the engine fails later, gravity still brings the crew home.',
    choices: [
      { label: 'Execute TLI as planned [ -10% Fuel ]', rating: 'best', why: 'Nominal burn on the free-return path.', act: s => { s.fuel -= s.fuelNeed * 0.10; } },
      { label: 'Overburn for a faster trip [ -15% Fuel, -8 Morale ]', rating: 'poor', why: 'Leaves the free-return corridor and wastes propellant.', act: s => { s.fuel -= s.fuelNeed * 0.15; s.morale -= 8; } },
    ] },
  { category: 'NAVIGATION', title: 'Outbound Trajectory Correction', operationAt: 0.3, missions: A2, kind: 'historical',
    text: 'Tracking shows a small trajectory error on the outbound translunar leg. A correction burn is scheduled.',
    history: 'Orion missions schedule several outbound trajectory correction burns; small ones are routine.',
    lesson: 'Small, early corrections are cheap; waiting makes the needed change grow.',
    choices: [
      { label: 'Small correction now [ -2% Fuel ]', rating: 'best', why: 'Early correction is most efficient.', act: s => { s.fuel -= s.fuelNeed * 0.02; } },
      { label: 'Skip it and fix later [ -6% Fuel later, -4 Morale ]', rating: 'poor', why: 'The error grows with distance — a later fix costs more.', act: s => { s.fuel -= s.fuelNeed * 0.06; s.morale -= 4; } },
    ] },
  { category: 'LIFE SUPPORT', title: 'Wastewater Vent Blockage', operationAt: 0.4, missions: A2, kind: 'historical',
    text: 'The wastewater vent line appears blocked — likely frozen. Waste water can\'t be dumped overboard.',
    history: 'Artemis II reported a wastewater venting issue consistent with a frozen/blocked line and worked it with the ground. (Summary.)',
    lesson: 'In vacuum, venting water can freeze at the nozzle. Thermal attitude changes or heaters usually clear it; forcing flow can damage hardware.',
    choices: [
      { label: 'Turn the vent toward the Sun & use line heaters [ -6 Power ]', rating: 'best', why: 'Uses thermal physics to melt the ice safely.', act: s => { lowerPower(s, 6); } },
      { label: 'Store wastewater in contingency containers [ -6 Morale ]', rating: 'ok', why: 'Workable, but uses limited storage volume.', act: s => { s.morale -= 6; } },
      { label: 'Pressurize the line to force it clear [ -10 Health (target), -5% Water ]', rating: 'poor', why: 'Forcing a frozen line risks a rupture and spill inside the cabin.', act: s => { hurt(s, 10); s.water *= 0.95; } },
    ] },
  { category: 'SCIENCE', title: 'Lunar Far-Side Flyby & Planned Blackout', operationAt: 0.5, missions: A2, kind: 'historical',
    text: 'Orion swings behind the Moon. As planned, the Moon blocks radio for a while. The crew photographs and describes the far side — humans had not seen it directly since Apollo.',
    history: 'Artemis II passed several thousand km beyond the lunar far side, with a planned loss of signal, and took humans farther from Earth than any crew before. (Summary.)',
    lesson: 'Planned blackouts are rehearsed: all critical commands are uplinked beforehand so the crew needs no ground help while hidden.',
    choices: [
      { label: 'Full observation plan, crew narrates geology [ +30 Science, -4 Power ]', rating: 'best', why: 'Maximizes the unique science return of the flyby.', act: s => { s.science += 30; lowerPower(s, 4); } },
      { label: 'Minimal photos, rest crew [ +10 Science, +6 Morale ]', rating: 'ok', why: 'Restful, but a once-in-a-generation view goes under-used.', act: s => { s.science += 10; s.morale += 6; } },
    ] },
  { category: 'COMMS', title: 'Unplanned Communications Interruption', operationAt: 0.6, missions: A2, kind: 'historical',
    text: 'The link with Earth drops unexpectedly — this is NOT the planned blackout behind the Moon. Controllers must work out whether this is a ground-station, antenna or spacecraft issue.',
    history: 'Artemis II experienced some unplanned communications interruptions in addition to the planned loss of signal behind the Moon. (Summary.)',
    lesson: 'Distinguishing planned from unplanned loss of signal matters: planned outages have procedures; unplanned ones require fault isolation (ground network first, then spacecraft).',
    choices: [
      { label: 'Check Deep Space Network station, then switch antennas [ -4 Power ]', rating: 'best', why: 'Fault isolation from the simplest cause outward.', act: s => { lowerPower(s, 4); } },
      { label: 'Command a spacecraft computer reboot [ -12 Power, -6 Morale ]', rating: 'poor', why: 'Rebooting before isolating the fault adds risk without evidence.', act: s => { lowerPower(s, 12); s.morale -= 6; } },
      { label: 'Wait it out [ -10 Morale ]', rating: 'ok', why: 'The link may return, but you learned nothing about the cause.', act: s => { s.morale -= 10; } },
    ] },
  { category: 'NAVIGATION', title: 'Return Trajectory Correction', operationAt: 0.7, missions: A2, kind: 'historical',
    text: 'Orion is heading home. Entry corridor targeting must be precise: too steep overheats, too shallow skips.',
    history: 'Return correction burns target Orion\'s narrow entry corridor.',
    lesson: 'Entry corridor accuracy is measured in fractions of a degree.',
    choices: [
      { label: 'Precise correction burn [ -3% Fuel ]', rating: 'best', why: 'Puts Orion in the center of the corridor.', act: s => { s.fuel -= s.fuelNeed * 0.03; } },
      { label: 'Accept slight error [ -10 Health all ]', rating: 'poor', why: 'A steeper entry increases g-loads and heating.', act: s => hurtAll(s, 10) },
    ] },
  { category: 'THERMAL', title: 'Entry Profile & Heat Shield', operationAt: 0.8, missions: A2, kind: 'historical',
    text: 'After Artemis I, the heat shield lost more char material than predicted. For Artemis II, NASA kept the shield but changed the entry trajectory to reduce the conditions that caused it.',
    history: 'In December 2024 NASA announced Artemis II would fly the existing heat shield with a modified entry profile rather than the Artemis I skip-entry profile. (Summary.)',
    lesson: 'When hardware behaves unexpectedly, engineers can change how it is used (the operating envelope) instead of redesigning it — if analysis shows margin.',
    choices: [
      { label: 'Fly the modified (approved) entry profile [ +10 Science ]', rating: 'best', why: 'Matches the engineering analysis and the real decision.', act: s => { s.science += 10; } },
      { label: 'Fly the original skip-entry profile [ -15 Health all ]', rating: 'poor', why: 'Repeats the conditions linked to Artemis I char loss.', act: s => hurtAll(s, 15) },
    ] },
  { category: 'RECOVERY', title: 'Parachutes & Pacific Splashdown', operationAt: 0.9, missions: A2, kind: 'historical',
    text: 'Orion\'s parachutes deploy in sequence and the capsule splashes down in the Pacific off San Diego. Navy and NASA teams recover the crew.',
    history: 'Artemis II was planned to splash down in the Pacific Ocean off the coast of San Diego.',
    lesson: 'Recovery is part of the mission — crews are monitored for health immediately after splashdown.',
    choices: [
      { label: 'Standard recovery with medical checks [ +8 Morale ]', rating: 'best', why: 'Safe, by-the-book recovery.', act: s => { s.morale += 8; } },
      { label: 'Rush the crew out for cameras [ -8 Health all ]', rating: 'poor', why: 'Crews returning from space need time to readapt to gravity.', act: s => hurtAll(s, 8) },
    ] },

  // ---------------- Artemis IV planned operations ----------------
  { category: 'PROPULSION', title: 'SLS Block 1B Launch & TLI with I-Hab', operationAt: 0, missions: A4, kind: 'planned',
    text: 'The planned SLS Block 1B with its Exploration Upper Stage sends Orion and the co-manifested I-Hab module toward the Moon.',
    history: 'PLANNED: Artemis IV is planned as the first flight of SLS Block 1B, carrying ESA\'s I-Hab. Block 1B and EUS development status and schedule are subject to change.',
    lesson: 'Co-manifesting cargo with crew saves a launch but adds mass and complexity.',
    choices: [
      { label: 'Nominal TLI [ -10% Fuel ]', rating: 'best', why: 'By the book.', act: s => { s.fuel -= s.fuelNeed * 0.10; } },
      { label: 'Fast transfer [ -16% Fuel ]', rating: 'poor', why: 'Burns reserve needed for Gateway rendezvous.', act: s => { s.fuel -= s.fuelNeed * 0.16; } },
    ] },
  { category: 'DOCKING', title: 'Gateway Rendezvous & I-Hab Docking', operationAt: 0.26, missions: A4, kind: 'planned',
    text: 'Orion arrives at Gateway in Near-Rectilinear Halo Orbit and delivers I-Hab.',
    history: 'PLANNED: Delivery and attachment of I-Hab to Gateway. Gateway budget and schedule have faced uncertainty; details may change.',
    lesson: 'Rendezvous uses holds at set distances so the crew can stop and check before closing in.',
    choices: [
      { label: 'Approach with standard hold points [ -3% Fuel, +15 Science ]', rating: 'best', why: 'Slow and verifiable.', act: s => { s.fuel -= s.fuelNeed * 0.03; s.science += 15; } },
      { label: 'Skip hold points to save time [ -2% Fuel, -15 Morale ]', rating: 'poor', why: 'Removes abort opportunities.', act: s => { s.fuel -= s.fuelNeed * 0.02; s.morale -= 15; } },
    ] },
  { category: 'LIFE SUPPORT', title: 'Vestibule Leak Check', operationAt: 0.36, missions: A4, kind: 'simulated',
    text: 'Before opening hatches into I-Hab, the vestibule between modules must be leak-checked.',
    history: 'SIMULATED: Leak checks before hatch opening are standard practice on the ISS.',
    lesson: 'Pressure-decay checks find tiny leaks before they become dangerous.',
    choices: [
      { label: 'Full pressure-decay check [ -6 Morale ]', rating: 'best', why: 'Takes time but proves the seal.', act: s => { s.morale -= 6; } },
      { label: 'Open the hatch immediately [ -8% Oxygen ]', rating: 'poor', why: 'An unchecked seal can leak.', act: s => { s.oxygen *= 0.92; } },
    ] },
  { category: 'SCIENCE', title: 'Lunar South Pole Surface Expedition', operationAt: 0.5, missions: A4, kind: 'planned',
    text: 'Two crew descend in the Human Landing System to the south polar region to collect samples near permanently shadowed regions.',
    history: 'PLANNED: Artemis IV is planned to include a lunar landing using a SpaceX Starship HLS. Crew have not been named; an ESA astronaut seat has been agreed for Gateway-era missions.',
    lesson: 'Polar ice is valuable for science and future resources, but shadowed regions are extremely cold and dark.',
    choices: [
      { label: 'Standard EVA plan with rest days [ +35 Science, -6 Morale ]', rating: 'best', why: 'Balanced sampling and crew safety.', act: s => { s.science += 35; s.morale -= 6; } },
      { label: 'Extended EVA into a shadowed crater [ +50 Science, -18 Health (target) ]', rating: 'ok', why: 'More science but much higher crew risk.', act: s => { s.science += 50; hurt(s, 18); } },
    ] },
  { category: 'DOCKING', title: 'HLS Ascent & Gateway Redock', operationAt: 0.7, missions: A4, kind: 'planned',
    text: 'The landing team lifts off and redocks with Gateway.',
    history: 'PLANNED: HLS returns the surface crew to Gateway / Orion.',
    lesson: 'Lunar ascent has no backup engine on the surface — redundancy is designed in.',
    choices: [
      { label: 'Nominal ascent timeline [ -3% Fuel ]', rating: 'best', why: 'Planned window, best margins.', act: s => { s.fuel -= s.fuelNeed * 0.03; } },
      { label: 'Delay for extra samples [ -6% Fuel, +12 Science ]', rating: 'ok', why: 'Science bonus but shrinks phasing margin.', act: s => { s.fuel -= s.fuelNeed * 0.06; s.science += 12; } },
    ] },
  { category: 'POWER', title: 'Gateway PPE Power Handshake', operationAt: 0.8, missions: A4, kind: 'simulated',
    text: 'I-Hab must draw power from Gateway\'s Power and Propulsion Element. A converter mismatch appears.',
    history: 'SIMULATED: PPE is planned to provide Gateway power and propulsion.',
    lesson: 'Interfaces between partners\' hardware are verified on the ground — and still need on-orbit checks.',
    choices: [
      { label: 'Step loads in gradually [ -6 Power ]', rating: 'best', why: 'Avoids tripping breakers.', act: s => lowerPower(s, 6) },
      { label: 'Full load immediately [ -20 Power ]', rating: 'poor', why: 'Trips protection circuits.', act: s => lowerPower(s, 20) },
    ] },
  { category: 'THERMAL', title: 'Undock, Trans-Earth Injection & Reentry', operationAt: 0.92, missions: A4, kind: 'planned',
    text: 'Orion undocks from Gateway, burns for Earth, and reenters.',
    history: 'PLANNED: Orion returns crew from Gateway to a Pacific splashdown.',
    lesson: 'Returning from lunar distance means ~11 km/s entry — the hardest heat-shield job in human spaceflight.',
    choices: [
      { label: 'Nominal TEI & entry [ -8% Fuel ]', rating: 'best', why: 'Standard return.', act: s => { s.fuel -= s.fuelNeed * 0.08; } },
      { label: 'Shallower fuel-saving entry [ -4% Fuel, -12 Health all ]', rating: 'poor', why: 'Risk of skip-out and higher loads.', act: s => { s.fuel -= s.fuelNeed * 0.04; hurtAll(s, 12); } },
    ] },

  // ---------------- Simulated deep-space events (random) ----------------
  { category: 'RADIATION', title: 'Van Allen Belt Transit Dose', missions: ['artemis2', 'artemis4'], kind: 'simulated', needs: 'shield',
    text: 'Dosimeters climb as Orion crosses the radiation belts.',
    good: 'Shielding kept doses low.',
    lesson: 'Fast transit through the belts limits dose.',
    choices: [
      { label: 'Crew to sheltered area [ -5 Science ]', rating: 'best', why: 'Mass between crew and radiation.', act: s => { s.science = Math.max(0, s.science - 5); } },
      { label: 'Keep working [ -10 Health all ]', rating: 'poor', why: 'Unnecessary dose.', act: s => hurtAll(s, 10) },
    ] },
];

// ---------------- Positive events ----------------
export const POSITIVE_EVENTS = [
  { category: 'SUCCESS', title: 'Crew Joke Lifts Spirits', kind: 'positive', crewOnly: true,
    text: 'A well-timed joke at dinner has the whole crew laughing.',
    lesson: 'Humour is a real behavioural-health tool on long missions.',
    choices: [{ label: 'Share it with Mission Control [ +10 Morale ]', rating: 'best', why: 'Shared morale boosts ground and crew.', act: s => { s.morale += 10; } }] },
  { category: 'SUCCESS', title: 'Experiment Ahead of Schedule', kind: 'positive',
    text: 'An experiment finished early with clean data.',
    lesson: 'Good procedures make time for bonus science.',
    choices: [
      { label: 'Run a bonus experiment [ +15 Science ]', rating: 'best', why: 'Uses the gained time well.', act: s => { s.science += 15; } },
      { label: 'Give the crew free time [ +8 Morale ]', rating: 'best', why: 'Rest is a good use too.', act: s => { s.morale += 8; } },
    ] },
  { category: 'SUCCESS', title: 'Mission Control Shout-Out', kind: 'positive', crewOnly: true,
    text: 'Mission Control plays a wake-up song chosen by schoolchildren.',
    lesson: 'Wake-up songs are a long NASA tradition connecting crews to home.',
    choices: [{ label: 'Crew thanks the students [ +12 Morale ]', rating: 'best', why: 'Outreach matters.', act: s => { s.morale += 12; } }] },
  { category: 'SUCCESS', title: 'Great Exercise Session', kind: 'positive', crewOnly: true,
    text: 'The crew hit every exercise target today.',
    lesson: 'Exercise counters bone and muscle loss in microgravity.',
    choices: [{ label: 'Log it [ +6 Health all ]', rating: 'best', why: 'Health compounds.', act: s => s.crew.forEach(c => { c.health = Math.min(100, c.health + 6); }) }] },
  { category: 'SUCCESS', title: 'Teamwork Fix Saves Power', kind: 'positive',
    text: 'Engineers on the ground and the crew found an efficiency tweak for the power system.',
    lesson: 'Ground and crew together solve problems neither could alone.',
    choices: [{ label: 'Apply the fix [ +15 Power ]', rating: 'best', why: 'Free margin.', act: s => { s.power = Math.min(100, s.power + 15); } }] },
];

export const ARTEMIS4_FACTS = {
  confirmed: ['Orion crew spacecraft', 'ESA I-Hab module is planned for Gateway', 'An ESA astronaut seat for a Gateway mission has been agreed', 'SpaceX Starship selected as an Artemis Human Landing System'],
  uncertain: ['Launch date (~2028 or later)', 'Crew not yet named', 'SLS Block 1B / Exploration Upper Stage status', 'Gateway budget and schedule'],
};

function has(s, id) { return s.crew.some(c => c.id === id); }

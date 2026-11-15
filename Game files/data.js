// Static game data: missions, rockets, supplies, equipment, astronauts.

// step = days per turn. ISS goes hour by hour (1/24 day).
// Optional mission fields:
//   fixedRocket   – only this vehicle may be flown (historical/planned hardware)
//   fixedCrew     – ids from HIST_CREW; the player's captain then works from the ground
//   captainAboard – false when the captain serves as Flight Director instead of flying
//   recEquip      – equipment Easy difficulty pre-selects
//   tutorial      – the mission doubles as the interactive training flight
export const MISSIONS = [
  { id: 'iss', name: 'Voyage to ISS · Training Flight', days: 1, step: 1 / 24, stepLabel: 'Hour', budget: 350, careerReward: 250, capFactor: 1.0, fuelRatio: 0.65,
    roles: ['Pilot', 'Engineer'], maxCrew: 3, problemChance: 0.15, tutorial: true, recEquip: ['spares', 'medkit'],
    dest: 'ISS (LEO 408 km)', desc: 'Your training flight: a 24-hour trip to dock with the International Space Station, managed hour by hour. A friendly flight instructor coaches you through every step.' },
  { id: 'punch', name: 'PUNCH · Solar Observatory', days: 4, step: 1, stepLabel: 'Phase', budget: 650, careerReward: 350, capFactor: 0.9, fuelRatio: 0.85,
    roles: [], maxCrew: 0, problemChance: 0.20,
    dest: 'Polar low-Earth orbit', desc: 'Launch one spacecraft stack carrying all four uncrewed solar observatories, then deploy one Narrow Field Imager and three Wide Field Imagers into coordinated polar orbits to study the solar wind.' },
  { id: 'artemis2', name: 'Artemis II · Crewed Lunar Flyby', days: 10, step: 1, stepLabel: 'Day', budget: 600, careerReward: 350, capFactor: 0.6, fuelRatio: 1.1,
    roles: [], maxCrew: 0, fixedCrew: ['wiseman', 'glover', 'koch', 'hansen'], captainAboard: false, captainTitle: 'Flight Director',
    fixedRocket: 'sls', problemChance: 0.18, historical: true, recEquip: ['spares', 'comms', 'medkit'],
    launch: 'April 1, 2026', landing: 'April 10, 2026', site: 'Kennedy Space Center · Launch Complex 39B',
    spacecraft: 'Orion "Integrity" + ESA European Service Module',
    dest: 'Lunar flyby & Pacific splashdown',
    desc: 'NASA\'s historic first crewed flight of SLS and Orion: journey around the Moon and return safely home to Earth with the real Artemis II crew.' },
  { id: 'artemis4', name: 'Artemis IV · Gateway & Lunar Landing', days: 30, step: 1, stepLabel: 'Day', budget: 750, careerReward: 450, capFactor: 0.6, fuelRatio: 1.3,
    roles: ['Pilot', 'Engineer', 'Specialist'], maxCrew: 3, fixedRocket: 'sls1b', planned: true, problemChance: 0.20,
    payloadName: 'I-Hab (ESA International Habitation Module)', payloadKg: 10000, recEquip: ['spares', 'comms', 'solar', 'shield'],
    dest: 'Gateway (NRHO) & lunar south pole',
    desc: 'Humanity\'s next leap: deliver the I-Hab module to the Lunar Gateway station, land an exploration team on the lunar south pole, and advance deep space exploration.' },
];

// Difficulty settings simplified for accessibility, learning, and fun across all levels.
export const DIFFICULTIES = {
  easy: { id: 'easy', label: 'Easy (Cadet)', icon: '🟢', autoEquip: true, hints: 'always', eventMult: 0.25, severity: 0.25, positiveShare: 0.80, cascade: 0, extraEventChance: 0.02,
    desc: 'Great for beginners and students! Generous margins, automatic equipment loading, 100% CAPCOM coaching, and frequent positive scientific discoveries.' },
  normal: { id: 'normal', label: 'Normal (Astronaut)', icon: '🟡', autoEquip: true, hints: 'always', eventMult: 0.45, severity: 0.45, positiveShare: 0.65, cascade: 0, extraEventChance: 0.05,
    desc: 'Balanced and educational. Clear CAPCOM suggestions on every event, smooth resource balance, and inspiring NASA achievements.' },
  hard: { id: 'hard', label: 'Hard (Flight Director)', icon: '🔴', autoEquip: false, hints: 'limited', eventMult: 0.70, severity: 0.65, positiveShare: 0.50, cascade: 0.08, extraEventChance: 0.12,
    desc: 'A deeper management challenge with tighter margins, but still forgiving and rewarding for dedicated space enthusiasts.' },
};

// payload in kg to LEO, cost in $M
export const ROCKETS = [
  { id: 'falcon9', name: 'Falcon 9', payload: 28000, cost: 55, height: 7, boosters: 0 },
  { id: 'falconheavy', name: 'Falcon Heavy', payload: 70000, cost: 85, height: 7, boosters: 2 },
  { id: 'sls', name: 'SLS Block 1', payload: 105000, cost: 180, height: 9, boosters: 2 },
  { id: 'sls1b', name: 'SLS Block 1B (planned)', payload: 120000, cost: 210, height: 10, boosters: 2, missionOnly: true },
  { id: 'starship', name: 'Starship', payload: 160000, cost: 95, height: 11, boosters: 0 },
];

export const SPACECRAFT_BASE_KG = 7500;
export const CREW_KG = 80;
export const CREW_COST = 2; // $M per astronaut
export const ITEM_KG = 4;
export const ITEM_COST = 0.05;

// Per astronaut per day - simplified so crew does not rapidly run out of life support
export const RATES = { water: 1.5, oxygen: 0.45 };
export const FOODS = [
  { id: 'freeze', name: 'Freeze-dried', kgPerDay: 0.6, costPerKg: 0.003, morale: 0.1 },
  { id: 'thermo', name: 'Thermostabilized', kgPerDay: 1.0, costPerKg: 0.005, morale: 0.3 },
  { id: 'fresh', name: 'Fresh + Mixed', kgPerDay: 1.4, costPerKg: 0.009, morale: 0.6 },
];
export const SUPPLY_COST_PER_KG = { water: 0.001, oxygen: 0.005 };
export const FUEL_COST_PER_KG = 0.0002;

export const EQUIPMENT = [
  { id: 'solar', name: 'Extra Solar Arrays', kg: 600, cost: 8, info: 'Backup power during failures' },
  { id: 'comms', name: 'High-Gain Antenna', kg: 200, cost: 5, info: 'Stable link to Earth' },
  { id: 'shield', name: 'Radiation Shielding', kg: 900, cost: 10, info: 'Protects from solar flares' },
  { id: 'science', name: 'Science Instruments', kg: 500, cost: 12, info: 'Earns bonus science points' },
  { id: 'medkit', name: 'Advanced Med Bay', kg: 250, cost: 4, info: 'Treats crew illness quickly' },
  { id: 'spares', name: 'Spare Parts Kit', kg: 400, cost: 4, info: 'Repairs breakdowns instantly' },
  { id: 'recycler', name: 'Water Recycler', kg: 500, cost: 12, info: 'Cuts water use by 65%' },
];

// Revised real astronaut roster: 8 real astronauts · 4 male · 4 female · 8 nationalities
// Designed to inspire young people from all walks of life!
export const ASTRONAUTS = [
  {
    id: 'hadfield',
    name: 'Chris Hadfield',
    roles: ['Pilot'],
    nationality: 'Canada',
    agency: 'CSA / NASA',
    look: { spriteIndex: 1, suit: '#eef3f7', country: { code: 'CA' } },
    strengths: ['Perk – Veteran Pilot: Cruise propellant use is 20% lower, and the primary random-event chance is reduced by 25% while aboard.'],
    weaknesses: ['Negative – Extended Checklist Workload: Daily mental-health drain and losses from negative morale are 10% higher. Game-only, role-based trade-off; not a claim about Chris Hadfield.'],
    perk: { name: 'Veteran Pilot', desc: 'Cruise propellant use is 20% lower, and the primary random-event chance is reduced by 25% while aboard.' },
    negative: { name: 'Extended Checklist Workload', desc: 'Daily mental-health drain and losses from negative morale are 10% higher. This is a fictional, role-based gameplay trade-off, not a claim about Chris Hadfield.' },
    realBackground: 'Military test pilot and ISS commander. Commanded Expedition 35, flew on two Space Shuttle missions (STS-74, STS-100), performed Canada\'s first spacewalk, and inspired millions of students worldwide by singing David Bowie\'s "Space Oddity" aboard the ISS.',
    funFacts: [
      'Brought an acoustic guitar to the ISS and recorded music in zero gravity!',
      'Once suffered temporary eye irritation during a spacewalk outside the ISS and calmly stayed focused to finish the mission.',
      'Wrote the bestselling children\'s book "The Darkest Dark" about conquering fear of the dark to become an astronaut.'
    ],
    mods: { fuelMult: 0.8, pilot: true, mentalMult: 1.1 },
    bio: {
      hometown: 'Sarnia, Ontario, Canada',
      education: 'Mechanical Engineering, Royal Military College · M.S. Aviation Systems, University of Tennessee',
      background: 'RCAF fighter pilot, top graduate of the U.S. Air Force Test Pilot School, flew 70+ types of aircraft.',
      interests: 'Playing acoustic guitar, writing books for children, photography, skiing',
      inspiration: 'Watched the Apollo 11 Moon landing on July 20, 1969 at age nine and decided he would become an astronaut.',
      experience: '3 spaceflights · 166 days in space · 2 spacewalks · ISS Commander (Expedition 35)',
      motivation: 'To share the wonder of science and prove that kids anywhere can dream big and achieve the impossible.'
    }
  },
  {
    id: 'cristoforetti',
    name: 'Samantha Cristoforetti',
    roles: ['Pilot'],
    nationality: 'Italy',
    agency: 'ESA',
    look: { spriteIndex: 4, suit: '#0c3a9c', country: { code: 'IT' } },
    strengths: ['Perk – Fighter Pilot Reflexes: Reduces the primary random-event chance by 25% while aboard.'],
    weaknesses: ['Negative – High-Intensity Training Load: Uses 8% more food per mission day. Game-only, role-based trade-off; not a claim about Samantha Cristoforetti.'],
    perk: { name: 'Fighter Pilot Reflexes', desc: 'Reduces the primary random-event chance by 25% while aboard.' },
    negative: { name: 'High-Intensity Training Load', desc: 'Uses 8% more food per mission day. This is a fictional, role-based gameplay trade-off, not a claim about Samantha Cristoforetti.' },
    realBackground: 'Italian Air Force fighter pilot and ISS commander (Expeditions 42/43 & 67/68). First European female ISS commander, completed a historic 199-day mission on the Futura flight and later commanded the Minerva mission.',
    funFacts: [
      'Brewed the very first authentic Italian espresso in space using the experimental "ISSpresso" machine!',
      'Became the first astronaut to post educational science videos directly to TikTok from the space station.',
      'Speaks Italian, English, German, French, and Russian fluently, plus conversational Chinese.'
    ],
    mods: { emergencyBonus: true, pilot: true, foodMult: 1.08 },
    bio: {
      hometown: 'Milan (raised in Malè, Trentino), Italy',
      education: 'M.S. Mechanical Engineering, TU Munich · Aeronautics Science, University of Naples Federico II',
      background: 'Captain and fighter pilot in the Italian Air Force, flying the AMX ground attack jet.',
      interests: 'Hiking, scuba diving, yoga, reading science fiction, learning languages',
      inspiration: 'Fascinated by the stars from the mountain skies of the Italian Alps and watching sci-fi space adventures as a child.',
      experience: '2 spaceflights · 369 days in space · 1 spacewalk (first European female spacewalker)',
      motivation: 'To push the boundaries of human presence in low-Earth orbit and pave the way to lunar exploration.'
    }
  },
  {
    id: 'wakata',
    name: 'Koichi Wakata',
    roles: ['Engineer'],
    nationality: 'Japan',
    agency: 'JAXA',
    look: { spriteIndex: 0, suit: '#2f6fd6', country: { code: 'JP' } },
    strengths: ['Perk – Robotics Expert: Reduces the primary random-event chance by 15% while aboard.'],
    weaknesses: ['Negative – Robotics Duty Load: Daily mental-health drain and losses from negative morale are 10% higher. Game-only, role-based trade-off; not a claim about Koichi Wakata.'],
    perk: { name: 'Robotics Expert', desc: 'Reduces the primary random-event chance by 15% while aboard.' },
    negative: { name: 'Robotics Duty Load', desc: 'Daily mental-health drain and losses from negative morale are 10% higher. This is a fictional, role-based gameplay trade-off, not a claim about Koichi Wakata.' },
    realBackground: 'Aerospace engineer and experienced ISS robotics operator. First Japanese commander of the International Space Station. Veteran of five spaceflights across three different launch vehicles: Space Shuttle, Soyuz, and SpaceX Crew Dragon.',
    funFacts: [
      'Has flown on three generations of spacecraft: NASA Space Shuttle, Russian Soyuz, and SpaceX Dragon!',
      'Has spent over 504 total days living and conducting experiments in space.',
      'Operated the robotic arms that assembled major portions of the Japanese Experiment Module "Kibo".'
    ],
    mods: { roboticsExpert: true, mentalMult: 1.1 },
    bio: {
      hometown: 'Omiya (Saitama City), Japan',
      education: 'B.S. Aeronautical Engineering, M.S. Applied Mechanics, Ph.D. Aerospace Engineering, Kyushu University',
      background: 'Flight maintenance engineer for Japan Airlines before being selected as an astronaut by NASDA/JAXA.',
      interests: 'Baseball, tennis, snow skiing, flying gliders, running',
      inspiration: 'Growing up marveling at airplanes and wondering how machines could fly into the upper atmosphere and beyond.',
      experience: '5 spaceflights · 504 days in space · 2 spacewalks · ISS Commander (Expedition 39)',
      motivation: 'To build reliable robotic systems that make long-term space exploration safer and more sustainable for everyone.'
    }
  },
  {
    id: 'neyadi',
    name: 'Sultan Al Neyadi',
    roles: ['Engineer'],
    nationality: 'UAE',
    agency: 'MBRSC / NASA',
    look: { spriteIndex: 3, suit: '#e8822a', country: { code: 'AE' } },
    strengths: ['Perk – Computer Specialist: Restores 2 extra power points at the end of each mission turn.'],
    weaknesses: ['Negative – Extended Systems Watch: Daily mental-health drain and losses from negative morale are 10% higher. Game-only, role-based trade-off; not a claim about Sultan Al Neyadi.'],
    perk: { name: 'Computer Specialist', desc: 'Restores 2 extra power points at the end of each mission turn.' },
    negative: { name: 'Extended Systems Watch', desc: 'Daily mental-health drain and losses from negative morale are 10% higher. This is a fictional, role-based gameplay trade-off, not a claim about Sultan Al Neyadi.' },
    realBackground: 'Information technology PhD and engineer; first Arab astronaut to perform a spacewalk and completed the Arab world\'s longest space mission (Expedition 68/69, 186 days aboard the ISS). Later appointed UAE Minister of State for Youth.',
    funFacts: [
      'Practiced Brazilian Jiu-Jitsu aboard the ISS to demonstrate microgravity physics!',
      'Completed a 7-hour spacewalk outside the ISS to prepare the station for advanced roll-out solar arrays (iROSAs).',
      'Holds a Ph.D. in Data Leakage Prevention and worked in network security before training as an astronaut.'
    ],
    mods: { powerRecovery: 2, mentalMult: 1.1 },
    bio: {
      hometown: 'Al Ain, Abu Dhabi, United Arab Emirates',
      education: 'B.S. Electronics & Communications, University of Brighton · Ph.D. Information Technology, Griffith University',
      background: 'Military network security engineer in the UAE Armed Forces and published cybersecurity researcher.',
      interests: 'Jiu-jitsu, martial arts, astronomy, reading, desert photography',
      inspiration: 'Stargazing in the Al Ain desert dunes with his father, wondering about the mysteries of deep space.',
      experience: '1 spaceflight · 186 days on ISS · 1 spacewalk (7 hrs 1 min) · First Arab spacewalker',
      motivation: 'To ignite a passion for STEM, computing, and space exploration among young people throughout the Arab world and globally.'
    }
  },
  {
    id: 'jemison',
    name: 'Mae Jemison',
    roles: ['Doctor'],
    nationality: 'United States',
    agency: 'NASA',
    look: { spriteIndex: 5, suit: '#3fae5a', country: { code: 'US' } },
    strengths: ['Perk – Medical Genius: Restores up to 2 physical-health points to every crew member per mission day.'],
    weaknesses: ['Negative – Clinical Research Workload: Uses 8% more food per mission day. Game-only, role-based trade-off; not a claim about Mae Jemison.'],
    perk: { name: 'Medical Genius', desc: 'Restores up to 2 physical-health points to every crew member per mission day.' },
    negative: { name: 'Clinical Research Workload', desc: 'Uses 8% more food per mission day. This is a fictional, role-based gameplay trade-off, not a claim about Mae Jemison.' },
    realBackground: 'Physician, chemical engineer, and the first Black woman to travel into space. Flew aboard Space Shuttle Endeavour on STS-47 (1992), conducting 44 life science and materials experiments. Former Peace Corps medical officer in Sierra Leone and Liberia.',
    funFacts: [
      'Was inspired to reach for space by watching Lieutenant Uhura on Star Trek as a young girl, and later made a guest appearance on Star Trek: The Next Generation!',
      'Trained in modern dance and brought an Alvin Ailey dance poster aboard Space Shuttle Endeavour.',
      'Leads the "100 Year Starship" initiative dedicated to making human travel beyond our solar system possible within a century.'
    ],
    mods: { healer: true, foodMult: 1.08 },
    bio: {
      hometown: 'Decatur, Alabama (raised in Chicago, Illinois), USA',
      education: 'B.S. Chemical Engineering & B.A. African and Afro-American Studies, Stanford · M.D., Cornell University',
      background: 'General practitioner, Peace Corps medical officer in West Africa, researcher in vaccine development.',
      interests: 'Modern dance, theater, cats, gardening, history of science',
      inspiration: 'Growing up with an insatiable curiosity about biology and stars, determined that women and people of color belong in space.',
      experience: '1 spaceflight · STS-47 Endeavour · 190 hours in orbit · 44 life sciences experiments',
      motivation: 'To ensure that technological breakthroughs serve all of humanity and inspire girls and minorities in science.'
    }
  },
  {
    id: 'duque',
    name: 'Pedro Duque',
    roles: ['Navigator'],
    nationality: 'Spain',
    agency: 'ESA',
    look: { spriteIndex: 2, suit: '#2f6fd6', country: { code: 'ES' } },
    strengths: ['Perk – Orbital Precision: Cruise propellant use is 10% lower while aboard.'],
    weaknesses: ['Negative – Navigation Cross-Checks: Daily mental-health drain and losses from negative morale are 10% higher. Game-only, role-based trade-off; not a claim about Pedro Duque.'],
    perk: { name: 'Orbital Precision', desc: 'Cruise propellant use is 10% lower while aboard.' },
    negative: { name: 'Navigation Cross-Checks', desc: 'Daily mental-health drain and losses from negative morale are 10% higher. This is a fictional, role-based gameplay trade-off, not a claim about Pedro Duque.' },
    realBackground: 'Aeronautical engineer who worked on orbital determination models and algorithms for European space missions. Spain\'s first astronaut, flew STS-95 aboard Space Shuttle Discovery and the Cervantes mission aboard Soyuz TMA-3 to the ISS; later served as Spain\'s Minister of Science.',
    funFacts: [
      'Flew to space alongside legendary Mercury astronaut John Glenn on STS-95 in 1998!',
      'Personally helped develop the numerical orbit trajectory models that European satellites use to navigate today.',
      'Served as Spain\'s Cabinet Minister of Science, Innovation and Universities from 2018 to 2021.'
    ],
    mods: { fuelMult: 0.9, mentalMult: 1.1 },
    bio: {
      hometown: 'Madrid, Spain',
      education: 'Degree in Aeronautical Engineering, Polytechnic University of Madrid (top of his graduating class)',
      background: 'Flight operations and orbit determination group at the European Space Operations Centre (ESOC) in Germany.',
      interests: 'Swimming, scuba diving, cycling, classical music, stargazing',
      inspiration: 'Childhood fascination with mathematical mechanics, airplanes, and how rockets escape gravity.',
      experience: '2 spaceflights · STS-95 Discovery & Soyuz TMA-3/ISS Cervantes Mission · 18 days in space',
      motivation: 'To champion public education in mathematics and space science as the ultimate drivers of human progress.'
    }
  },
  {
    id: 'sharman',
    name: 'Helen Sharman',
    roles: ['Specialist'],
    nationality: 'United Kingdom',
    agency: 'Project Juno / UK',
    look: { spriteIndex: 6, suit: '#b03ad6', country: { code: 'GB' } },
    strengths: ['Perk – Chemical Pioneer: Adds 30% to the final mission science score.'],
    weaknesses: ['Negative – First-Flight Adjustment: Daily mental-health drain and losses from negative morale are 10% higher. Game-only, role-based trade-off; not a claim about Helen Sharman.'],
    perk: { name: 'Chemical Pioneer', desc: 'Adds 30% to the final mission science score.' },
    negative: { name: 'First-Flight Adjustment', desc: 'Daily mental-health drain and losses from negative morale are 10% higher. This is a fictional, role-based gameplay trade-off, not a claim about Helen Sharman.' },
    realBackground: 'Chemist and first British astronaut; first woman to visit the Mir space station. Worked as a research chemist for the Mars confectionery company before responding to a famous radio advertisement: "Astronaut wanted: No experience necessary." Selected from nearly 13,000 applicants.',
    funFacts: [
      'Was working as a chocolate scientist researching flavor chemistry at Mars Confectionery when she heard the astronaut radio advert!',
      'Conducted medical, agricultural, and materials science experiments aboard the Russian Mir space station in 1991.',
      'Carried out live amateur radio contacts from space with British schools so students could ask questions about science.'
    ],
    mods: { scienceBonus: 0.30, mentalMult: 1.1 },
    bio: {
      hometown: 'Sheffield, South Yorkshire, England',
      education: 'B.Sc. Chemistry, University of Sheffield · Ph.D., Birkbeck College London',
      background: 'Industrial research chemist developing new materials, luminescence, and confectionery flavor science.',
      interests: 'Running, science outreach for youth, amateur radio, hiking in the Peak District',
      inspiration: 'Belief that ordinary people with curious minds can accomplish extraordinary scientific adventures.',
      experience: '1 spaceflight · Soyuz TM-12 to Mir Space Station (Project Juno) · 8 days in orbit',
      motivation: 'To demystify science for children and prove that curiosity and teamwork can take you to the cosmos.'
    }
  },
  {
    id: 'yaping',
    name: 'Wang Yaping',
    roles: ['Specialist'],
    nationality: 'China',
    agency: 'CMSA',
    look: { spriteIndex: 7, suit: '#d52b1e', country: { code: 'CN' } },
    strengths: ['Perk – Spacewalk Veteran: Adds 15% to the final mission science score.'],
    weaknesses: ['Negative – EVA Recovery Needs: Uses 8% more food per mission day. Game-only, role-based trade-off; not a claim about Wang Yaping.'],
    perk: { name: 'Spacewalk Veteran', desc: 'Adds 15% to the final mission science score.' },
    negative: { name: 'EVA Recovery Needs', desc: 'Uses 8% more food per mission day. This is a fictional, role-based gameplay trade-off, not a claim about Wang Yaping.' },
    realBackground: 'Military transport pilot, astronaut, and the first Chinese woman to perform a spacewalk (6.5 hours outside the Tiangong space station during Shenzhou 13). Known as China\'s "First Space Teacher" for delivering interactive physics lectures from orbit to over 60 million schoolchildren.',
    funFacts: [
      'Taught a live physics lesson from the Tiangong space station that was broadcast directly to 60+ million students across 80,000 schools!',
      'Demonstrated surface tension by building a glowing water sphere floating in zero gravity and inserting a paper flower inside it.',
      'Logged over 1,567 flight hours as an Air Force transport pilot before being chosen as an astronaut.'
    ],
    mods: { scienceBonus: 0.15, foodMult: 1.08 },
    bio: {
      hometown: 'Yantai, Shandong, China',
      education: 'B.S. Flight Engineering, Air Force Aviation University · M.S. Journalism & Communication, Peking University',
      background: 'Transport pilot and squadron flight commander in the People\'s Liberation Army Air Force.',
      interests: 'Photography, music, teaching children science, gymnastics, running',
      inspiration: 'Watched Yang Liwei become the first Chinese astronaut in 2003 and asked herself: "When will our country have a woman astronaut?"',
      experience: '2 spaceflights · Shenzhou 10 & Shenzhou 13 · 197 days in space · 1 spacewalk (6 hrs 25 mins)',
      motivation: 'To light a spark of wonder and discovery in the hearts of children everywhere through science education.'
    }
  },
];

// High-resolution real mission visual assets for "Look Out the Window" and "Check the Cameras"
export const MISSION_VIEWS = {
  iss: {
    id: 'iss',
    missionName: 'Voyage to ISS · International Space Station',
    windowTitle: 'ISS Cupola Observation Window · Planet Earth',
    windowImage: 'assets/image.png',
    gallery: [
      { src: 'assets/image.png', label: 'CUPOLA · CLOUDS OVER EARTH', caption: 'Photograph from the ISS Cupola looking out over Earth\'s clouds, blue oceans, and paper-thin atmospheric veil (408 km altitude).' },
      { src: 'assets/image-6.png', label: 'ISS · CRESCENT EARTH', caption: 'A view from the International Space Station with a crescent Earth beyond the station structure.' }
    ],
    caption: 'Photograph from the ISS Cupola looking out over Earth\'s clouds, blue oceans, and paper-thin atmospheric veil (408 km altitude).',
    description: 'From the seven-windowed Cupola observatory on the International Space Station, astronauts travel at 28,000 km/h (17,500 mph) and witness 16 sunrises and sunsets each day. Looking down upon Earth without political borders inspires the profound psychological transformation known as the "Overview Effect".',
    funFacts: [
      'The ISS circles the entire globe once every 90 minutes—that is faster than a speeding bullet!',
      'The Cupola windows are made of optical-quality quartz silica glass with motorized shutters that close during thruster burns or space debris passes.',
      'Over 270 astronauts from 21 different nations have lived and worked aboard the ISS conducting cancer research, plant growth studies, and water purification testing.'
    ],
    bonusMorale: 8,
    bonusScience: 15
  },
  punch: {
    id: 'punch',
    missionName: 'PUNCH · Polarimeter to Unify the Corona and Heliosphere',
    windowTitle: 'PUNCH Solar Observatory · Low Earth Orbit Camera',
    windowImage: 'assets/image-2.png',
    gallery: [
      { src: 'assets/image-2.png', label: 'PUNCH · SPACECRAFT ABOVE EARTH', caption: 'PUNCH spacecraft in orbit above Earth.' },
      { src: 'assets/image-3.png', label: 'PUNCH · SOLAR OBSERVATORY', caption: 'Artist\'s concept of a PUNCH observatory spacecraft studying the Sun\'s outer atmosphere and solar wind.' }
    ],
    caption: 'NASA\'s PUNCH observatory satellite in polar sun-synchronous orbit over Earth, capturing the Sun\'s outer corona and solar wind.',
    description: 'PUNCH is a NASA Heliophysics Small Explorer mission comprising four suitcase-sized satellites that create global, 3D images of the solar corona and the inner heliosphere. By tracking solar storms (coronal mass ejections) as they head toward Earth, PUNCH helps scientists protect astronauts, satellites, and electric grids.',
    funFacts: [
      'PUNCH flies in a special "sun-synchronous" orbit along the terminator (the dividing line between Earth\'s day and night) so its instruments always view sunlight!',
      'The solar wind streams away from the Sun at over 1.5 million kilometers per hour (1 million mph)!',
      'When solar storm particles collide with gases in Earth\'s upper atmosphere, they create the colorful shimmering lights known as Auroras (Northern and Southern Lights).'
    ],
    bonusMorale: 6,
    bonusScience: 20
  },
  artemis2: {
    id: 'artemis2',
    missionName: 'Artemis II · Crewed Lunar Flyby',
    windowTitle: 'Orion Spacecraft Window · Historic Earthrise over the Moon',
    windowImage: 'assets/artemis-earthrise-clean.webp',
    caption: 'View through Orion\'s spacecraft window: the blue planet Earth rising above the rugged, crater-pocked lunar surface (406,000 km from home).',
    description: 'Artemis II is NASA\'s first crewed flight of the Space Launch System (SLS) rocket and Orion spacecraft. The four astronauts fly farther from Earth than any humans in history, traveling around the Moon\'s far side and returning home via a free-return trajectory to pave the way for permanent human bases on the Moon.',
    funFacts: [
      'At its farthest point behind the Moon, the crew travels roughly 10,000 kilometers beyond the Moon—farther into space than the Apollo astronauts!',
      'Orion\'s windows feature three thick panes: an inner pressure pane, a structural pane, and an outer thermal-and-micrometeoroid shield pane.',
      'From lunar distance, the entire planet Earth looks like a tiny blue marble that can be completely covered with your thumb held at arm\'s length.'
    ],
    bonusMorale: 10,
    bonusScience: 25
  },
  artemis4: {
    id: 'artemis4',
    missionName: 'Artemis IV · Gateway & Lunar Landing',
    windowTitle: 'Orion & Gateway Approach · Moon Silhouette & Solar Corona',
    windowImage: 'assets/image-5.png',
    gallery: [
      { src: 'assets/image-5.png', label: 'GATEWAY · MOONLIT APPROACH', caption: 'A spacecraft and the Moon silhouetted against a distant glow.' },
      { src: 'assets/image-7.png', label: 'ARTEMIS · LUNAR LANDING CONCEPT', caption: 'Concept art showing a lunar lander and crewed lunar surface vehicle.' },
      { src: 'assets/image-8.png', label: 'ARTEMIS · SOUTH POLE FIELDWORK', caption: 'Astronauts working on the lunar surface during a future exploration mission concept.' }
    ],
    caption: 'Orion approaching the Lunar Gateway in Near-Rectilinear Halo Orbit (NRHO), framed against the dark silhouette of the Moon with solar flare glow.',
    description: 'Artemis IV expands humanity\'s permanent outpost at the Moon by delivering ESA\'s International Habitation module (I-Hab) to the Lunar Gateway and transporting two astronauts to the lunar south pole. The south pole contains shadowed craters holding billions of tons of ancient water ice.',
    funFacts: [
      'Water ice at the Moon\'s south pole is priceless: it can be melted for drinking water, split into oxygen for astronauts to breathe, and liquefied into rocket fuel!',
      'The Gateway space station circles the Moon in an orbit shaped like an egg (NRHO), keeping it constantly in sunlight so its solar panels never run out of power.',
      'Astronauts on the lunar surface will test new spacesuits and pressurized rovers that will prepare humanity for the first crewed expedition to Mars.'
    ],
    bonusMorale: 12,
    bonusScience: 30
  }
};

// Rich educational encyclopedia on NASA, the astronaut corps, and space science for kids and families
export const NASA_EDUCATIONAL_CONTENT = {
  aboutNasa: {
    title: 'What is NASA?',
    text: 'NASA stands for the National Aeronautics and Space Administration. Created in 1958, NASA explores space, studies Earth\'s climate and oceans, tests advanced airplanes, and searches for life in the universe. NASA believes that space exploration unites humanity and inspires the next generation of engineers, scientists, and dreamers.'
  },
  becomingAstronaut: {
    title: 'How Can You Become an Astronaut?',
    bullets: [
      'Study STEM: Earn a master\'s degree or Ph.D. in science, technology, engineering, or mathematics.',
      'Gain Experience: Work as a pilot, doctor, research scientist, engineer, or teacher for at least 3 years.',
      'Stay Healthy: Exercise regularly and pass NASA\'s physical fitness and swimming tests.',
      'Practice Teamwork: Astronauts live in tight quarters for months at a time—kindness, communication, and mutual support are essential.',
      'Learn Languages: Astronauts often learn additional languages like English, Russian, or Japanese to work with international partners.',
      'Dream Big: Astronauts come from every background, country, and walk of life. If you are curious and love to learn, space is for you!'
    ]
  },
  howRocketsWork: {
    title: 'How Do Rockets Escape Earth\'s Gravity?',
    text: 'Rockets work by Newton\'s Third Law of Motion: "For every action, there is an equal and opposite reaction." Powerful engines mix rocket fuel (like liquid hydrogen or kerosene) with liquid oxygen inside a combustion chamber. When ignited, super-hot gas shoots out the exhaust nozzle at supersonic speed, pushing the rocket upward with millions of pounds of thrust into the sky!'
  },
  livingInSpace: {
    title: 'What is Daily Life Like in Zero Gravity?',
    bullets: [
      'Sleeping: Astronauts strap their sleeping bags to the walls so they don\'t float around and bump into computers while asleep!',
      'Eating: Food is dehydrated, thermostabilized, or freeze-dried. Tortillas are used instead of sandwich bread because bread leaves crumbs that could float into equipment.',
      'Exercise: Without gravity, muscles and bones weaken. Astronauts must exercise for two hours every day using specialized stationary bicycles, treadmills, and resistance machines.',
      'Water Recycling: Nearly 98% of all moisture aboard the ISS—including sweat and shower runoff—is collected, purified, and recycled into fresh, crystal-clear drinking water!'
    ]
  }
};

// The real Artemis II crew (NASA / CSA). Gameplay modifiers are simulation abstractions, not
// judgements about the real astronauts. Biographies summarise public NASA/CSA biographies.
export const HIST_CREW = [
  { id: 'wiseman', name: 'Reid Wiseman', roles: ['Commander'], agency: 'NASA', hist: true,
    look: { spriteIndex: 3, suit: '#ff6f00', country: { code: 'US' } },
    duty: 'Commander — overall responsibility for the crew and Orion; leads decisions on board and coordinates with Mission Control.',
    strengths: ['Gameplay: steady leadership — the whole crew\'s morale drains more slowly'], weaknesses: ['Historical crew — cannot be swapped'],
    mods: { booster: true },
    bio: { hometown: 'Baltimore, Maryland, USA', education: 'B.S. Computer & Systems Engineering, Rensselaer Polytechnic Institute · M.S. Systems Engineering, Johns Hopkins University',
      background: 'U.S. Navy captain, naval aviator and test pilot. Selected as a NASA astronaut in 2009.',
      interests: 'Family time and outdoor activities (per public interviews)', inspiration: 'A career in naval aviation and flight test that led him to NASA.',
      experience: 'Flew to the ISS in 2014 (Expeditions 40/41, ~165 days) and conducted spacewalks; later served as Chief of the Astronaut Office.',
      motivation: 'Lead the first crew to fly Orion around the Moon and prove the system for the Artemis missions that follow.' } },
  { id: 'glover', name: 'Victor Glover', roles: ['Pilot'], agency: 'NASA', hist: true,
    look: { spriteIndex: 1, suit: '#ff6f00', country: { code: 'US' } },
    duty: 'Pilot — flies Orion, including the manual proximity-operations demonstration, and supports navigation and burns.',
    strengths: ['Gameplay: manual-piloting tasks cost less propellant'], weaknesses: ['Historical crew — cannot be swapped'],
    mods: { pilot: true },
    bio: { hometown: 'Pomona, California, USA', education: 'B.S. General Engineering, Cal Poly San Luis Obispo · M.S. degrees in flight test engineering, systems engineering and military operational art',
      background: 'U.S. Navy captain, naval aviator and test pilot. Selected as a NASA astronaut in 2013.',
      interests: 'Family and community outreach (per public interviews)', inspiration: 'Flight test and naval aviation.',
      experience: 'Pilot of SpaceX Crew-1 and ISS Expedition 64 (2020–21), including spacewalks.',
      motivation: 'Help open the next era of lunar exploration; first person of color assigned to a lunar mission.' } },
  { id: 'koch', name: 'Christina Koch', roles: ['Mission Specialist'], agency: 'NASA', hist: true,
    look: { spriteIndex: 4, suit: '#ff6f00', country: { code: 'US' } },
    duty: 'Mission Specialist 1 — spacecraft systems, life support monitoring, science and crew-health objectives.',
    strengths: ['Gameplay: +15% science from observations and experiments'], weaknesses: ['Historical crew — cannot be swapped'],
    mods: { scienceBonus: 0.15 },
    bio: { hometown: 'Grand Rapids, Michigan (grew up in Jacksonville, North Carolina), USA', education: 'B.S. Electrical Engineering & B.S. Physics, M.S. Electrical Engineering — North Carolina State University',
      background: 'Electrical engineer for NASA Goddard science instruments; worked research stations in Antarctica and the Arctic. Selected as an astronaut in 2013.',
      interests: 'Outdoor adventure and travel (per public interviews)', inspiration: 'A childhood dream of becoming an astronaut.',
      experience: '328 days on the ISS (2019–20), the longest single spaceflight by a woman at that time; took part in the first all-woman spacewalk.',
      motivation: 'Become the first woman to fly on a lunar mission and help build the path to the Moon and Mars.' } },
  { id: 'hansen', name: 'Jeremy Hansen', roles: ['Mission Specialist'], agency: 'CSA', hist: true,
    look: { spriteIndex: 2, suit: '#ff6f00', country: { code: 'CA' } },
    duty: 'Mission Specialist 2 — Canadian Space Agency astronaut; supports systems checkouts, navigation and lunar observations.',
    strengths: ['Gameplay: +10% science from lunar observations'], weaknesses: ['Historical crew — cannot be swapped'],
    mods: { scienceBonus: 0.1 },
    bio: { hometown: 'London, Ontario (grew up near Ingersoll), Canada', education: 'B.Sc. Space Science and M.Sc. Physics, Royal Military College of Canada',
      background: 'Colonel and former CF-18 fighter pilot in the Royal Canadian Air Force. Selected by the CSA in 2009.',
      interests: 'Aviation since his teens as an air cadet (per CSA biography)', inspiration: 'Learning to fly as a youth in the Air Cadets.',
      experience: 'Artemis II is his first spaceflight; previously trained in cave (CAVES) and undersea (NEEMO) analogue missions.',
      motivation: 'First Canadian to fly to the Moon, representing Canada\'s partnership in Artemis.' } },
];

// 1 in 100 chance this shows up in the roster (from the design board).
export const CHICKEN = {
  id: 'chicken', name: 'Cluck Armstrong', roles: ['Pilot', 'Navigator', 'Engineer', 'Doctor', 'Specialist'],
  look: { chicken: true },
  strengths: ['Somehow qualified for every job', 'Crew morale boost: it is a chicken'],
  weaknesses: ['It is a chicken'],
  mods: { chicken: true },
};

export const COMMENTS = [
  'The view of Earth from the cupola never gets old.',
  'Coffee pouch tastes like lukewarm cardboard again.',
  'Finished my treadmill block. Legs feel like zero-G jelly.',
  'Telemetry nominal. Running sensor recalibration anyway.',
  'Floating spaghetti incident in the galley. Do not ask.',
  'Miss the smell of fresh soil and rain.',
  'Logged another spectrum reading from the science bay.',
  'Someone keeps stealing my tortillas from locker B.',
  'Radio delay makes Mission Control jokes land late.',
  'Slept strapped to the wall. Dreams are vivid up here.',
  'The stars are so sharp without an atmosphere.',
  'Checked the water filter. Holding steady.',
  'Thruster pressure check complete. Attitude control is solid.',
  'Earth looks so fragile out there.',
];
export const STRESSED = [
  'I can\'t sleep. The hum of the fans is everywhere.',
  'Please tell my family I\'m okay... I think I am.',
  'Everyone is getting on my nerves today.',
  'I need a break. Just one quiet hour.',
  'My head hurts and the walls feel closer.',
];
export const HUNGRY = [
  'Rations are too thin. My stomach won\'t stop growling.',
  'I\'m so thirsty I can barely focus on the checklist.',
];

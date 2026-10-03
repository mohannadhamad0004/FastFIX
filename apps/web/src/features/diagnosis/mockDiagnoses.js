// TODO: replace with real API call
// Mock AI answers for diagnosisService.js. For each media type the first scenario is the default;
// the others are picked when a keyword appears in the description or file name, so every
// urgency can be tried out:
//
//   Engine sound  default: squealing belt (inspect soon)
//                 "tick", "tap", "click", "knock", "valve": valve train noise (inspect soon)
//                 "grind", "brake", "scrape": worn brake pads (stop driving)
//   Photo         default: check engine light (inspect soon)
//                 "leak", "drip", "puddle", "fluid", "coolant": coolant leak (inspect soon)
//                 "oil", "pressure", "red light": oil pressure warning (stop driving)
//                 "battery", "charging", "alternator": charging system light (inspect soon)
//                 "tire", "tyre", "tread": worn tire (safe to drive)
//   Video         default: blue-grey exhaust smoke (inspect soon)
//                 "white smoke", "sweet": white smoke / coolant burning (stop driving)
//                 "shake", "vibrat", "idle", "misfire": misfire at idle (inspect soon)
//                 "flicker", "dim", "dashboard": flickering lights / alternator (inspect soon)
//
// Suggested skills are the ones mechanics list (SKILLS in auth/signup/constants.js), so the
// "Find a mechanic for this" link filters the directory.

/** @type {Record<import('./types.js').MediaType, Array<Omit<import('./types.js').Diagnosis, 'id' | 'createdAt' | 'mediaType' | 'car' | 'description' | 'fileName' | 'userId'> & { keywords: string[] }>>} */
export const SCENARIOS = {
  audio: [
    {
      keywords: ['squeal', 'squeak', 'screech', 'belt', 'cold start'],
      observations:
        'A high-pitched squeal is loudest in the first seconds after the engine starts and fades as it keeps running. The pitch rises and falls with engine speed, which points to something driven by the accessory belt rather than the engine itself.',
      possibleCauses: [
        { cause: 'Worn or glazed serpentine (accessory) belt', evidence: 'strong' },
        { cause: 'Weak automatic belt tensioner', evidence: 'moderate' },
        { cause: 'Worn idler or tensioner pulley bearing', evidence: 'weak' },
      ],
      urgency: 'soon',
      recommendedChecks: [
        'Inspect the belt for cracks, glazing and fraying',
        'Check belt tension and the tensioner arm movement',
        'Spin the idler and tensioner pulleys by hand and listen for bearing noise',
        'Confirm the belt is aligned on every pulley',
      ],
      suggestedSkill: 'Engine',
    },
    {
      keywords: ['tick', 'tap', 'click', 'knock', 'valve', 'lifter'],
      observations:
        'A light, regular ticking follows engine speed and is clearest at idle. It sounds like it comes from the top of the engine rather than from underneath, and there is no deep knocking under load.',
      possibleCauses: [
        { cause: 'Valve clearance out of adjustment or a noisy hydraulic lifter', evidence: 'strong' },
        { cause: 'Low engine oil level or old, thin oil', evidence: 'moderate' },
        { cause: 'Small exhaust manifold leak', evidence: 'weak' },
      ],
      urgency: 'soon',
      recommendedChecks: [
        'Check the oil level and condition on the dipstick',
        'Listen at the valve cover with a mechanic’s stethoscope',
        'Measure valve clearances if the engine has adjustable valves',
        'Look for soot marks around the exhaust manifold gasket',
      ],
      suggestedSkill: 'Engine',
    },
    {
      keywords: ['grind', 'brake', 'scrape', 'metal'],
      observations:
        'A harsh metal-on-metal grinding sound appears while the car is slowing down. That usually means brake pad friction material is worn through and the backing plate is touching the disc.',
      possibleCauses: [
        { cause: 'Brake pads worn down to the metal backing plate', evidence: 'strong' },
        { cause: 'Scored or damaged brake disc', evidence: 'moderate' },
        { cause: 'Stone or debris caught behind the brake shield', evidence: 'weak' },
      ],
      urgency: 'stop',
      recommendedChecks: [
        'Measure the remaining pad thickness on every wheel',
        'Check the discs for deep scoring and minimum thickness',
        'Check that the calipers slide freely',
        'Road-test the brakes only after the pads are replaced',
      ],
      suggestedSkill: 'Brakes',
    },
  ],

  photo: [
    {
      keywords: ['check engine', 'engine light', 'yellow', 'amber', 'warning'],
      observations:
        'The photo shows the amber check engine light lit on the instrument panel while the engine is running. No red warning lights are visible, and the gauges look normal.',
      possibleCauses: [
        { cause: 'Emission or sensor fault stored by the engine computer (e.g. oxygen sensor)', evidence: 'moderate' },
        { cause: 'Loose or faulty fuel cap causing an evaporative system code', evidence: 'moderate' },
        { cause: 'Ignition misfire', evidence: 'weak' },
      ],
      urgency: 'soon',
      recommendedChecks: [
        'Read the stored fault codes with an OBD-II scanner',
        'Check that the fuel cap is tight and its seal is intact',
        'Look at live sensor data for the code that is stored',
        'Clear the codes after repair and confirm the light stays off',
      ],
      suggestedSkill: 'Computer Diagnostics',
    },
    {
      keywords: ['leak', 'drip', 'puddle', 'fluid', 'coolant', 'green', 'pink'],
      observations:
        'There is a puddle of bright-colored liquid under the front of the car, near the radiator. The color and thin consistency look like engine coolant rather than oil or brake fluid.',
      possibleCauses: [
        { cause: 'Leaking radiator hose or loose hose clamp', evidence: 'strong' },
        { cause: 'Leaking radiator (core or plastic end tank)', evidence: 'moderate' },
        { cause: 'Water pump seal leaking', evidence: 'weak' },
      ],
      urgency: 'soon',
      recommendedChecks: [
        'Check the coolant level with the engine cold',
        'Pressure-test the cooling system to find the leak',
        'Inspect the hoses and clamps around the radiator',
        'Check the water pump weep hole for traces of coolant',
      ],
      suggestedSkill: 'AC & Cooling',
    },
    {
      keywords: ['oil', 'pressure', 'red light', 'oil can'],
      observations:
        'The red oil pressure warning light (oil can symbol) is lit with the engine running. This light means the engine may not be getting enough oil pressure to protect its moving parts.',
      possibleCauses: [
        { cause: 'Very low engine oil level', evidence: 'strong' },
        { cause: 'Faulty oil pressure sensor or its wiring', evidence: 'moderate' },
        { cause: 'Failing oil pump or blocked oil pickup', evidence: 'weak' },
      ],
      urgency: 'stop',
      recommendedChecks: [
        'Check the oil level on the dipstick before running the engine again',
        'Measure the real oil pressure with a mechanical gauge',
        'Test the oil pressure sensor and connector',
        'Look for oil leaks under the engine',
      ],
      suggestedSkill: 'Engine',
    },
    {
      keywords: ['battery', 'charging', 'alternator'],
      observations:
        'The red battery-shaped charging warning light is on while driving. It means the charging system is not keeping the battery charged, so the car is running on battery power alone.',
      possibleCauses: [
        { cause: 'Alternator not charging', evidence: 'strong' },
        { cause: 'Loose or slipping alternator belt', evidence: 'moderate' },
        { cause: 'Corroded battery terminals or a bad ground cable', evidence: 'weak' },
      ],
      urgency: 'soon',
      recommendedChecks: [
        'Measure battery voltage with the engine off and running (about 13.8-14.5 V running)',
        'Check the alternator belt and connectors',
        'Clean and tighten the battery terminals and ground straps',
        'Load-test the battery',
      ],
      suggestedSkill: 'Electrical',
    },
    {
      keywords: ['tire', 'tyre', 'tread', 'wheel'],
      observations:
        'The tire tread in the photo is worn more on the inner edge than the outer edge, but there is still visible tread across the whole width and no damage to the sidewall.',
      possibleCauses: [
        { cause: 'Wheel alignment out of specification (camber or toe)', evidence: 'strong' },
        { cause: 'Tire pressure kept too low', evidence: 'moderate' },
        { cause: 'Worn suspension bushings', evidence: 'weak' },
      ],
      urgency: 'safe',
      recommendedChecks: [
        'Measure tread depth across the tire',
        'Check and set tire pressures',
        'Check the wheel alignment',
        'Inspect control arm bushings and tie rod ends',
      ],
      suggestedSkill: 'Tires & Wheels',
    },
  ],

  video: [
    {
      keywords: ['smoke', 'exhaust', 'blue', 'grey', 'gray'],
      observations:
        'Blue-grey smoke comes out of the exhaust when the engine is revved and briefly after idling. The smoke is thin and hangs in the air, which usually means engine oil is being burned.',
      possibleCauses: [
        { cause: 'Worn valve stem seals (smoke after idling)', evidence: 'moderate' },
        { cause: 'Worn piston rings (smoke under load)', evidence: 'moderate' },
        { cause: 'Turbocharger seal leak, if the engine is turbocharged', evidence: 'weak' },
      ],
      urgency: 'soon',
      recommendedChecks: [
        'Check how fast the oil level drops between services',
        'Do a compression test and a leak-down test',
        'Check the PCV valve and breather hoses',
        'On turbo engines, check the turbo intake for oil',
      ],
      suggestedSkill: 'Engine',
    },
    {
      keywords: ['white smoke', 'sweet', 'steam', 'overheat'],
      observations:
        'Thick white smoke keeps coming from the exhaust after the engine is warm, and it does not clear. Together with a sweet smell, that points to coolant getting into the combustion chambers.',
      possibleCauses: [
        { cause: 'Blown head gasket', evidence: 'strong' },
        { cause: 'Cracked cylinder head', evidence: 'weak' },
        { cause: 'Failed EGR cooler (diesel engines)', evidence: 'weak' },
      ],
      urgency: 'stop',
      recommendedChecks: [
        'Check the coolant level and look for coolant loss',
        'Pressure-test the cooling system',
        'Test the coolant for exhaust gases (block test)',
        'Do a compression test on every cylinder',
      ],
      suggestedSkill: 'Engine',
    },
    {
      keywords: ['shake', 'shaking', 'vibrat', 'idle', 'misfire', 'rough'],
      observations:
        'The engine shakes visibly at idle and the sound is uneven, with a regular stumble. The shaking eases when the engine speed rises, which is typical of a cylinder not firing properly.',
      possibleCauses: [
        { cause: 'Engine misfire from a worn spark plug or failing ignition coil', evidence: 'strong' },
        { cause: 'Worn or broken engine mounts', evidence: 'moderate' },
        { cause: 'Vacuum leak', evidence: 'weak' },
      ],
      urgency: 'soon',
      recommendedChecks: [
        'Read fault codes for misfire on a specific cylinder',
        'Inspect the spark plugs and swap ignition coils between cylinders',
        'Check the engine mounts for cracks and movement',
        'Listen and smoke-test for vacuum leaks',
      ],
      suggestedSkill: 'Engine',
    },
    {
      keywords: ['flicker', 'dim', 'dashboard', 'lights'],
      observations:
        'The dashboard lights and headlights dim and flicker in step with the engine speed. The flicker gets worse when more electrical load is switched on.',
      possibleCauses: [
        { cause: 'Failing alternator voltage regulator', evidence: 'strong' },
        { cause: 'Loose or corroded battery or ground connection', evidence: 'moderate' },
        { cause: 'Slipping alternator belt', evidence: 'weak' },
      ],
      urgency: 'soon',
      recommendedChecks: [
        'Measure charging voltage at idle and at 2000 rpm with loads on',
        'Check the battery terminals and engine-to-body ground straps',
        'Inspect the alternator belt tension',
        'Test the alternator output and ripple',
      ],
      suggestedSkill: 'Electrical',
    },
  ],
}

// The scenario whose keywords best match the description and file name, or the media type's
// default. Longer matches count more, so "white smoke" beats "smoke".
export function pickScenario(mediaType, text) {
  const haystack = text.toLowerCase()
  const scenarios = SCENARIOS[mediaType]
  let best = scenarios[0]
  let bestScore = 0
  for (const scenario of scenarios) {
    const score = scenario.keywords
      .filter((keyword) => haystack.includes(keyword))
      .reduce((sum, keyword) => sum + keyword.length, 0)
    if (score > bestScore) {
      best = scenario
      bestScore = score
    }
  }
  return best
}

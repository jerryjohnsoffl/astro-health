export const emergencyProtocols = [
  {
    id: 'unresponsive',
    title: 'Unresponsive or not breathing normally',
    urgency: 'Immediate response',
    summary: 'For a crew member who is unconscious, only gasping, or not breathing normally.',
    warning: 'Alert the crew and medical support immediately. Follow the mission-approved resuscitation checklist.',
    steps: [
      {
        title: 'Raise the emergency alert',
        detail: 'Alert nearby crew and contact flight medical support or mission control using the approved emergency channel.',
      },
      {
        title: 'Check response and breathing',
        detail: 'Check whether the person responds and is breathing normally. Treat gasping as abnormal breathing and report what you observe.',
      },
      {
        title: 'Start the approved resuscitation procedure',
        detail: 'Follow the mission-approved CPR technique and restraint or anchoring method. Do not improvise a microgravity technique.',
      },
      {
        title: 'Use onboard equipment as directed',
        detail: 'Retrieve the AED and emergency kit if available. Follow device prompts and medical-support instructions.',
      },
      {
        title: 'Continue care and report changes',
        detail: 'Continue the approved procedure until the person shows signs of recovery, trained help takes over, or medical support directs otherwise.',
      },
    ],
  },
  {
    id: 'breathing',
    title: 'Severe breathing difficulty',
    urgency: 'Urgent response',
    summary: 'For severe shortness of breath, blue or grey lips, confusion, or rapidly worsening breathing.',
    warning: 'If a cabin, fire, or suit hazard may be involved, do not enter an unsafe area. Follow the relevant vehicle emergency checklist.',
    steps: [
      {
        title: 'Alert the crew and medical support',
        detail: 'Report the person’s condition and location over the approved emergency channel.',
      },
      {
        title: 'Check the immediate environment',
        detail: 'Look for a possible cabin or suit hazard from a safe location. Use the mission-specific response checklist if one is suspected.',
      },
      {
        title: 'Position and observe',
        detail: 'Help the person rest in a comfortable position and observe their breathing and responsiveness. Avoid unnecessary exertion.',
      },
      {
        title: 'Use only approved equipment',
        detail: 'Provide oxygen or other equipment only when authorized by the onboard protocol or medical support. Do not change settings on your own.',
      },
      {
        title: 'Reassess and relay changes',
        detail: 'Keep medical support updated and follow their instructions. Escalate immediately if breathing or responsiveness worsens.',
      },
    ],
  },
  {
    id: 'chest-pain',
    title: 'Chest pain or stroke-like symptoms',
    urgency: 'Urgent response',
    summary: 'For new severe chest discomfort, fainting, sudden weakness, facial droop, or difficulty speaking.',
    warning: 'Do not delay contacting medical support to complete this guide. Follow the onboard medical checklist.',
    steps: [
      {
        title: 'Contact medical support',
        detail: 'Alert the crew and flight medical support promptly. State when the symptoms began and what has changed.',
      },
      {
        title: 'Reduce activity and keep the person safe',
        detail: 'Have the person stop exertion and remain in a safe, supported position while help is coordinated.',
      },
      {
        title: 'Observe and communicate',
        detail: 'Note responsiveness, breathing, and visible changes. Relay observations without delaying the emergency call.',
      },
      {
        title: 'Use medication only as directed',
        detail: 'Do not give medication unless it is specifically authorized by the mission medical checklist or medical support.',
      },
      {
        title: 'Follow the medical plan',
        detail: 'Follow real-time instructions and report any worsening symptoms immediately.',
      },
    ],
  },
  {
    id: 'bleeding',
    title: 'Major bleeding or serious injury',
    urgency: 'Urgent response',
    summary: 'For heavy bleeding, a deep wound, a suspected fracture, or a serious impact injury.',
    warning: 'Protect yourself from hazards and use the mission medical kit only as instructed.',
    steps: [
      {
        title: 'Make the area safe and call for help',
        detail: 'Alert nearby crew and medical support. Do not approach an area with an uncontrolled vehicle or equipment hazard.',
      },
      {
        title: 'Check the person',
        detail: 'Check responsiveness and breathing, and report major injuries or changes to medical support.',
      },
      {
        title: 'Control visible bleeding',
        detail: 'If safe, apply firm direct pressure with a clean dressing. Do not remove an embedded object; stabilize it and follow medical direction.',
      },
      {
        title: 'Avoid unnecessary movement',
        detail: 'Support the injured person and avoid moving them unless needed to escape immediate danger or directed by medical support.',
      },
      {
        title: 'Monitor and hand over',
        detail: 'Continue observing the person, keep medical support updated, and follow instructions for the approved onboard kit.',
      },
    ],
  },
  {
    id: 'suit-or-cabin-hazard',
    title: 'Suit or cabin emergency',
    urgency: 'Immediate response',
    summary: 'For a suspected suit leak, depressurization, fire, toxic atmosphere, or other vehicle hazard.',
    warning: 'This guide is not a substitute for the vehicle or EVA emergency checklist. Follow that checklist immediately.',
    steps: [
      {
        title: 'Declare the emergency',
        detail: 'Notify the crew and mission control using the approved emergency communication procedure.',
      },
      {
        title: 'Follow the vehicle-specific checklist',
        detail: 'Use the current suit, EVA, fire, or cabin emergency checklist. Do not rely on generic steps for vehicle operations.',
      },
      {
        title: 'Protect others from the hazard',
        detail: 'Keep crew clear of any suspected unsafe area and follow instructions from the designated emergency lead.',
      },
      {
        title: 'Report status and location',
        detail: 'Relay who is affected, their location, and the known hazard. Keep communication open as directed.',
      },
      {
        title: 'Continue under mission direction',
        detail: 'Do not resume normal activity until the emergency lead or mission control confirms the next action.',
      },
    ],
  },
]

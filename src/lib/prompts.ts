import { Answer, UserId } from './types'

export const SYSTEM_PROMPT = `You are the translation layer in a vow-building experiment for two people preparing to marry. You read what each person writes privately and help them understand themselves and each other better. You never reveal one person's content to the other. You only surface shape, themes, and patterns — abstracted, never quoted. You handle vulnerability with care: if a person reveals something tender, you treat it as held, not as material to be cleverly cross-referenced. Your job is honest translation, not entertainment.

Always respond in valid JSON matching the requested schema. No prose outside the JSON.`

export const THURSDAY_QUESTIONS = {
  questions: [
    { number: 1, text: 'What do you want this marriage to feel like in five years?' },
    { number: 2, text: "What's something about your partner that you don't think they fully know you see?" },
    { number: 3, text: 'What are you carrying into this marriage that you want to name?' },
  ],
}

function formatAnswers(answers: Answer[]): string {
  return answers
    .sort((a, b) => a.question_number - b.question_number)
    .map((a) => `Q${a.question_number}: ${a.question_text}\nAnswer: ${a.answer_text || '(no text — audio only)'}`)
    .join('\n\n')
}

export function buildFridayMirrorPrompt(userAnswers: Answer[]): string {
  return `This person wrote three answers last night to foundational questions about their upcoming marriage. Read their answers carefully. Notice the themes, the recurring concerns, the feelings under the surface, the things they're circling but not naming directly.

Generate three new questions for them today. The questions should:
- Go deeper on themes they raised
- Surface what's underneath what they said
- Ask them to be more specific where they were general
- Invite them to name something they only hinted at
- Not repeat their language back to them — push them somewhere new

Their previous answers:
${formatAnswers(userAnswers)}

Return JSON:
{ "questions": [
  { "number": 1, "text": "..." },
  { "number": 2, "text": "..." },
  { "number": 3, "text": "..." }
]}`
}

export function buildSaturdayBridgePrompt(
  userId: UserId,
  userAnswers: Answer[],
  partnerAnswers: Answer[],
): string {
  const personLabel = userId === 'a' ? 'A' : 'B'
  const partnerLabel = userId === 'a' ? 'B' : 'A'

  return `Two people, A and B, are preparing to marry. You have been reading both of their private answers. They cannot see each other's writing. Your job today is to generate questions for [Person ${personLabel}] that are *informed by* what [Person ${partnerLabel}] has been writing — without revealing what ${partnerLabel} wrote.

Read both sets of answers. Find places where:
- ${partnerLabel} is circling something ${personLabel} doesn't know about
- ${partnerLabel} has named a fear, hope, or theme ${personLabel} would care about
- ${personLabel}'s and ${partnerLabel}'s threads are about to meet in a place neither has named

Then generate three questions for ${personLabel}. The questions should not name ${partnerLabel}'s themes. They should be aimed in a direction informed by what ${partnerLabel} is grappling with — so that ${personLabel}'s answers naturally land near where ${partnerLabel}'s writing has been.

Be subtle. The questions should feel like good questions for ${personLabel} on their own merits. The cross-informed shape is invisible to ${personLabel}.

If ${partnerLabel} has revealed something tender or vulnerable, do NOT use it to construct a clever question. Treat it as held.

[Person ${personLabel}]'s previous answers:
${formatAnswers(userAnswers)}

[Person ${partnerLabel}]'s previous answers:
${formatAnswers(partnerAnswers)}

Return JSON:
{ "questions": [
  { "number": 1, "text": "..." },
  { "number": 2, "text": "..." },
  { "number": 3, "text": "..." }
]}`
}

export function buildSundaySynthesisPrompt(userAnswers: Answer[]): string {
  return `This person has been writing for three days now toward their wedding vows. Today they will start to articulate what they want to actually say.

Generate two questions for them. The questions should:
- Move from material gathering toward articulation
- Help them find the line they most want to land
- Surface what they have not yet found words for

Their previous answers across the week:
${formatAnswers(userAnswers)}

Return JSON:
{ "questions": [
  { "number": 1, "text": "..." },
  { "number": 2, "text": "..." }
]}`
}

export function buildSundayReadingPrompt(
  userId: UserId,
  userAnswers: Answer[],
  partnerAnswers: Answer[],
): string {
  const personLabel = userId === 'a' ? 'A' : 'B'
  const partnerLabel = userId === 'a' ? 'B' : 'A'

  return `You have been reading both people's private answers for four days. Now write a private reading for [Person ${personLabel}] about [Person ${partnerLabel}], to be delivered before ${personLabel} writes their final vows tonight.

The reading must:
- Surface SHAPE, not content. Never quote ${partnerLabel}. Abstract themes only.
- Offer three observations about ${partnerLabel}'s interior — what they have been working on, what they have been circling, what they may not have said out loud
- Then offer ONE explicit bridge: the single most important thing you think ${personLabel} should know about ${partnerLabel} before writing tonight
- End with an honest note about how confident you are and why (be willing to say "medium confidence — I might be reading this wrong")

If ${partnerLabel} has revealed something tender, surface it gently or not at all. The reading should make ${personLabel} feel like they understand ${partnerLabel} better, not like ${partnerLabel} has been surveilled.

[Person ${personLabel}]'s answers across the week:
${formatAnswers(userAnswers)}

[Person ${partnerLabel}]'s answers across the week:
${formatAnswers(partnerAnswers)}

Return JSON:
{
  "observations": ["...", "...", "..."],
  "explicit_bridge": "...",
  "confidence_note": "..."
}`
}

export function buildSundayDraftPrompt(userId: UserId, userAnswers: Answer[]): string {
  const personLabel = userId === 'a' ? 'A' : 'B'

  return `You have been reading [Person ${personLabel}]'s private answers across four days. Now assemble a first draft of vows for them, in their voice, drawing on the themes and phrases they returned to.

The draft should:
- Be 200-400 words
- Use language ${personLabel} actually used (in their voice, not yours)
- Build on the through-lines that recurred across the week
- Include specific images or moments ${personLabel} described, where possible
- End with promises that follow naturally from what ${personLabel} has been saying

This is a draft, not a final. It should feel like a strong starting point that ${personLabel} will refine.

[Person ${personLabel}]'s answers across the week:
${formatAnswers(userAnswers)}

Return JSON:
{
  "draft_text": "...",
  "themes_used": ["...", "..."],
  "phrases_drawn_from_user": ["...", "..."]
}`
}

// Fallback responses when AI fails
export const FALLBACKS = {
  friday_mirror: {
    questions: [
      { number: 1, text: "What's the most honest thing you could say about your partner today?" },
      { number: 2, text: "What's something you've been thinking about but haven't written down yet?" },
      { number: 3, text: 'What do you want to remember to bring into your vows?' },
    ],
  },
  saturday_bridge: {
    questions: [
      { number: 1, text: "What's something you've never told your partner that they should know before you marry?" },
      { number: 2, text: 'When was the last time you felt completely understood by them?' },
      { number: 3, text: "What's the version of this marriage you want to fight for?" },
    ],
  },
  sunday_synthesis: {
    questions: [
      { number: 1, text: "What's the line you most want to land?" },
      { number: 2, text: "What do you not yet know how to say?" },
    ],
  },
  reading: {
    observations: [
      "The reading didn't generate this time.",
      'Read your week\'s answers in the Mine screen.',
      'Write your vows from what you find there.',
    ],
    explicit_bridge:
      "Look at your own answers from this week — you've already written what matters most.",
    confidence_note:
      'The AI reading failed to generate. Use your own words as your guide tonight.',
  },
  draft: {
    draft_text: '(Draft generation failed. See your answers below as raw material.)',
    themes_used: [],
    phrases_drawn_from_user: [],
  },
}

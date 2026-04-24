import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from './supabase'
import {
  Answer,
  PhaseName,
  QuestionsContent,
  ReadingContent,
  DraftContent,
  UserId,
} from './types'
import {
  SYSTEM_PROMPT,
  THURSDAY_QUESTIONS,
  FALLBACKS,
  buildFridayMirrorPrompt,
  buildSaturdayBridgePrompt,
  buildSundayBridge2Prompt,
  buildSundayReadingPrompt,
  buildSundayDraftPrompt,
} from './prompts'
import { withRetry, getPartner } from './utils'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder' })

async function callClaude(userPrompt: string, temperature: number): Promise<string> {
  // Use beta messages API with prompt-caching header to cache the stable system prompt
  const response = await (anthropic as Anthropic).beta.messages.create(
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      // Cache the stable system prompt across all calls
      system: [
        {
          type: 'text' as const,
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
      temperature,
      betas: ['prompt-caching-2024-07-31'],
    },
    { timeout: 60_000 },
  )

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}

function parseJSON<T>(raw: string): T {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(cleaned) as T
}

async function getAnswersForUser(
  coupleId: string,
  userId: UserId,
  phases?: PhaseName[],
): Promise<Answer[]> {
  let query = supabaseAdmin
    .from('answers')
    .select('*')
    .eq('couple_id', coupleId)
    .eq('user_id', userId)
    .order('phase')
    .order('question_number')

  if (phases && phases.length > 0) {
    query = query.in('phase', phases)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []) as Answer[]
}

async function upsertContent(
  coupleId: string,
  userId: UserId | null,
  phase: PhaseName,
  contentType: 'questions' | 'reading' | 'draft',
  content: QuestionsContent | ReadingContent | DraftContent,
): Promise<void> {
  const { error } = await supabaseAdmin.from('generated_content').upsert(
    {
      couple_id: coupleId,
      user_id: userId,
      phase,
      content_type: contentType,
      content,
    },
    { onConflict: 'couple_id,user_id,phase,content_type', ignoreDuplicates: true },
  )
  if (error) throw error
}

export async function generateContentForPhase(
  coupleId: string,
  phase: PhaseName,
  userId: UserId,
): Promise<void> {
  if (phase === 'not_started' || phase === 'complete') return

  if (phase === 'thursday_foundation') {
    await upsertContent(coupleId, userId, phase, 'questions', THURSDAY_QUESTIONS)
    return
  }

  if (phase === 'sunday_reveal') {
    await generateSundayReveal(coupleId, userId)
    return
  }

  // Question-generating phases
  const questions = await generateQuestions(coupleId, phase, userId)
  await upsertContent(coupleId, userId, phase, 'questions', questions)
}

async function generateQuestions(
  coupleId: string,
  phase: PhaseName,
  userId: UserId,
): Promise<QuestionsContent> {
  try {
    return await withRetry(async () => {
      let prompt: string
      let temperature = 0.7

      if (phase === 'friday_mirror') {
        const answers = await getAnswersForUser(coupleId, userId, ['thursday_foundation'])
        prompt = buildFridayMirrorPrompt(answers)
      } else if (phase === 'saturday_bridge') {
        const partnerId = getPartner(userId)
        const [userAnswers, partnerAnswers] = await Promise.all([
          getAnswersForUser(coupleId, userId, ['thursday_foundation', 'friday_mirror']),
          getAnswersForUser(coupleId, partnerId, ['thursday_foundation', 'friday_mirror']),
        ])
        prompt = buildSaturdayBridgePrompt(userId, userAnswers, partnerAnswers)
      } else if (phase === 'sunday_bridge_2') {
        const partnerId = getPartner(userId)
        const [userAnswers, partnerAnswers] = await Promise.all([
          getAnswersForUser(coupleId, userId, [
            'thursday_foundation',
            'friday_mirror',
            'saturday_bridge',
          ]),
          getAnswersForUser(coupleId, partnerId, [
            'thursday_foundation',
            'friday_mirror',
            'saturday_bridge',
          ]),
        ])
        prompt = buildSundayBridge2Prompt(userId, userAnswers, partnerAnswers)
      } else {
        throw new Error(`No question generator for phase: ${phase}`)
      }

      const raw = await callClaude(prompt, temperature)
      return parseJSON<QuestionsContent>(raw)
    })
  } catch {
    // Return fallback if all retries failed
    const fallbackKey = phase as keyof typeof FALLBACKS
    const fallback = FALLBACKS[fallbackKey]
    if (fallback && 'questions' in fallback) return fallback as QuestionsContent
    return FALLBACKS.friday_mirror
  }
}

async function generateSundayReveal(coupleId: string, userId: UserId): Promise<void> {
  const partnerId = getPartner(userId)
  const [userAnswers, partnerAnswers] = await Promise.all([
    getAnswersForUser(coupleId, userId),
    getAnswersForUser(coupleId, partnerId),
  ])

  // Generate reading
  let reading: ReadingContent
  try {
    reading = await withRetry(async () => {
      const prompt = buildSundayReadingPrompt(userId, userAnswers, partnerAnswers)
      const raw = await callClaude(prompt, 0.6)
      return parseJSON<ReadingContent>(raw)
    })
  } catch {
    reading = FALLBACKS.reading
  }

  // Generate draft
  let draft: DraftContent
  try {
    draft = await withRetry(async () => {
      const prompt = buildSundayDraftPrompt(userId, userAnswers)
      const raw = await callClaude(prompt, 0.6)
      return parseJSON<DraftContent>(raw)
    })
  } catch {
    draft = {
      ...FALLBACKS.draft,
      phrases_drawn_from_user: userAnswers
        .filter((a) => a.answer_text)
        .slice(0, 5)
        .map((a) => a.answer_text!.split('.')[0].trim()),
    }
  }

  await Promise.all([
    upsertContent(coupleId, userId, 'sunday_reveal', 'reading', reading),
    upsertContent(coupleId, userId, 'sunday_reveal', 'draft', draft),
  ])
}

// Preview content without saving — for admin preview
export async function previewContentForPhase(
  coupleId: string,
  phase: PhaseName,
  userId: UserId,
): Promise<{ questions?: QuestionsContent; reading?: ReadingContent; draft?: DraftContent }> {
  if (phase === 'thursday_foundation') {
    return { questions: THURSDAY_QUESTIONS }
  }

  if (phase === 'sunday_reveal') {
    const partnerId = getPartner(userId)
    const [userAnswers, partnerAnswers] = await Promise.all([
      getAnswersForUser(coupleId, userId),
      getAnswersForUser(coupleId, partnerId),
    ])

    const [readingRaw, draftRaw] = await Promise.allSettled([
      (async () => {
        const raw = await callClaude(
          buildSundayReadingPrompt(userId, userAnswers, partnerAnswers),
          0.6,
        )
        return parseJSON<ReadingContent>(raw)
      })(),
      (async () => {
        const raw = await callClaude(buildSundayDraftPrompt(userId, userAnswers), 0.6)
        return parseJSON<DraftContent>(raw)
      })(),
    ])

    return {
      reading: readingRaw.status === 'fulfilled' ? readingRaw.value : FALLBACKS.reading,
      draft: draftRaw.status === 'fulfilled' ? draftRaw.value : FALLBACKS.draft,
    }
  }

  const questions = await generateQuestions(coupleId, phase, userId)
  return { questions }
}

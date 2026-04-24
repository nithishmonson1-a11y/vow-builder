export type UserId = 'a' | 'b'

export type PhaseName =
  | 'not_started'
  | 'thursday_foundation'
  | 'friday_mirror'
  | 'saturday_bridge'
  | 'sunday_bridge_2'
  | 'sunday_reveal'
  | 'complete'

export const PHASE_ORDER: PhaseName[] = [
  'not_started',
  'thursday_foundation',
  'friday_mirror',
  'saturday_bridge',
  'sunday_bridge_2',
  'sunday_reveal',
  'complete',
]

export const PHASE_LABELS: Record<PhaseName, string> = {
  not_started: 'Not Started',
  thursday_foundation: 'Thursday — Foundation',
  friday_mirror: 'Friday — Mirror',
  saturday_bridge: 'Saturday — Bridge',
  sunday_bridge_2: 'Sunday Morning — Bridge',
  sunday_reveal: 'Sunday Evening — Reveal',
  complete: 'Complete',
}

export const PHASE_QUESTION_COUNTS: Partial<Record<PhaseName, number>> = {
  thursday_foundation: 3,
  friday_mirror: 3,
  saturday_bridge: 3,
  sunday_bridge_2: 3,
}

export interface Couple {
  id: string
  partner_a_id: string
  partner_b_id: string
  current_phase: PhaseName
  phase_started_at: string | null
  experiment_started_at: string | null
  created_at: string
}

export interface Answer {
  id: string
  couple_id: string
  user_id: UserId
  phase: PhaseName
  question_number: number
  question_text: string
  answer_text: string | null
  audio_url: string | null
  input_method: 'voice' | 'text'
  created_at: string
}

export interface GeneratedContent {
  id: string
  couple_id: string
  user_id: UserId | null
  phase: PhaseName
  content_type: 'questions' | 'reading' | 'draft'
  content: QuestionsContent | ReadingContent | DraftContent
  created_at: string
}

export interface QuestionsContent {
  questions: Array<{ number: number; text: string }>
}

export interface ReadingContent {
  observations: string[]
  explicit_bridge: string
  confidence_note: string
}

export interface DraftContent {
  draft_text: string
  themes_used: string[]
  phrases_drawn_from_user: string[]
}

export function getNextPhase(phase: PhaseName): PhaseName | null {
  const idx = PHASE_ORDER.indexOf(phase)
  if (idx === -1 || idx >= PHASE_ORDER.length - 1) return null
  return PHASE_ORDER[idx + 1]
}

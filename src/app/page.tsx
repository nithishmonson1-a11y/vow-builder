import Link from 'next/link'

export const dynamic = 'force-dynamic'

const USER_A_TOKEN = process.env.USER_A_TOKEN!
const USER_B_TOKEN = process.env.USER_B_TOKEN!
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!
const USER_A_NAME = process.env.USER_A_NAME || 'Partner A'
const USER_B_NAME = process.env.USER_B_NAME || 'Partner B'

export default function RootPage() {
  return (
    <main className="bg-cream">

      {/* Above the fold */}
      <section className="min-h-dvh flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm flex flex-col gap-10">

          <div className="text-center">
            <p className="phase-label mb-3">Private</p>
            <h1 className="font-display text-4xl text-ink">Vow Builder</h1>
            <p className="mt-3 font-sans text-sm text-ink-light">
              A four-day journey to your vows
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="phase-label">Your links</p>

            <Link
              href={`/u/${USER_A_TOKEN}`}
              className="card flex items-center justify-between group hover:border-ink-light transition-colors"
            >
              <div>
                <p className="font-sans text-sm font-medium text-ink">{USER_A_NAME}</p>
                <p className="font-sans text-xs text-ink-light mt-0.5 font-mono truncate max-w-[200px]">
                  /u/{USER_A_TOKEN.slice(0, 8)}…
                </p>
              </div>
              <span className="text-ink-light group-hover:text-ink transition-colors">→</span>
            </Link>

            <Link
              href={`/u/${USER_B_TOKEN}`}
              className="card flex items-center justify-between group hover:border-ink-light transition-colors"
            >
              <div>
                <p className="font-sans text-sm font-medium text-ink">{USER_B_NAME}</p>
                <p className="font-sans text-xs text-ink-light mt-0.5 font-mono truncate max-w-[200px]">
                  /u/{USER_B_TOKEN.slice(0, 8)}…
                </p>
              </div>
              <span className="text-ink-light group-hover:text-ink transition-colors">→</span>
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <p className="phase-label">Admin</p>

            <Link
              href={`/admin/${ADMIN_TOKEN}`}
              className="card flex items-center justify-between group hover:border-ink-light transition-colors"
            >
              <div>
                <p className="font-sans text-sm font-medium text-ink">Admin Panel</p>
                <p className="font-sans text-xs text-ink-light mt-0.5">
                  Manage phases &amp; content
                </p>
              </div>
              <span className="text-ink-light group-hover:text-ink transition-colors">→</span>
            </Link>
          </div>

          <p className="text-center font-sans text-xs text-ink-light">
            Keep this page private — links bypass login.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-cream-mid px-6 py-20">
        <div className="max-w-lg mx-auto flex flex-col gap-14">

          <div>
            <p className="phase-label mb-4">How it works</p>
            <h2 className="font-display text-3xl text-ink leading-snug">
              Four days. A few questions each morning. Your vows by Sunday.
            </h2>
          </div>

          <div className="flex flex-col gap-10">
            <div className="flex gap-6 items-start">
              <span className="font-display text-gold text-2xl shrink-0 w-6">1</span>
              <div className="flex flex-col gap-1.5">
                <p className="font-sans text-sm font-medium text-ink uppercase tracking-wide">Thursday — Foundation</p>
                <p className="font-sans text-sm text-ink-light leading-relaxed">
                  You both answer the same three questions, separately and privately. Type or speak — whatever feels more natural. These are the building blocks everything else grows from.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <span className="font-display text-gold text-2xl shrink-0 w-6">2</span>
              <div className="flex flex-col gap-1.5">
                <p className="font-sans text-sm font-medium text-ink uppercase tracking-wide">Friday — Mirror</p>
                <p className="font-sans text-sm text-ink-light leading-relaxed">
                  Your questions are no longer the same. Overnight, the app reads what you wrote and generates new questions written just for you — reflecting your own words back in ways that go a little deeper.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <span className="font-display text-gold text-2xl shrink-0 w-6">3</span>
              <div className="flex flex-col gap-1.5">
                <p className="font-sans text-sm font-medium text-ink uppercase tracking-wide">Saturday — Bridge</p>
                <p className="font-sans text-sm text-ink-light leading-relaxed">
                  Saturday's questions are secretly informed by what your partner has been writing — without revealing any of it. The AI nudges you toward the same territory, so you arrive at your vows from different directions.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <span className="font-display text-gold text-2xl shrink-0 w-6">4</span>
              <div className="flex flex-col gap-1.5">
                <p className="font-sans text-sm font-medium text-ink uppercase tracking-wide">Sunday morning — Bridge</p>
                <p className="font-sans text-sm text-ink-light leading-relaxed">
                  One final round of cross-pollination. The AI has now read four days of both your writing. The questions today push you toward what your partner has been circling all week — still privately, still without quoting them.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-cream-dark border border-cream-mid p-6 flex flex-col gap-4">
            <p className="phase-label">Sunday evening — Reveal</p>
            <p className="font-display text-xl text-ink leading-relaxed">
              Your vows screen unlocks.
            </p>
            <div className="flex flex-col gap-3 pt-2 border-t border-cream-mid">
              <div className="flex flex-col gap-1">
                <p className="font-sans text-xs font-medium text-ink uppercase tracking-wide">A reading</p>
                <p className="font-sans text-sm text-ink-light leading-relaxed">
                  Observations about the person you're marrying, drawn from everything they wrote this week. Something to carry into the ceremony.
                </p>
              </div>
              <div className="flex flex-col gap-1 pt-3 border-t border-cream-mid">
                <p className="font-sans text-xs font-medium text-ink uppercase tracking-wide">A first draft</p>
                <p className="font-sans text-sm text-ink-light leading-relaxed">
                  A set of vows written in your voice, using your phrases, your themes, your words. A starting point — or, if it feels right, the thing itself.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* How the AI works */}
      <section className="border-t border-cream-mid px-6 py-20 bg-cream-dark">
        <div className="max-w-lg mx-auto flex flex-col gap-12">

          <div>
            <p className="phase-label mb-4">How the AI works</p>
            <h2 className="font-display text-3xl text-ink leading-snug">
              It reads. It listens. It doesn't guess.
            </h2>
            <p className="mt-4 font-sans text-sm text-ink-light leading-relaxed">
              The AI in Vow Builder has one job: to help you find what you already know. It doesn't write your vows for you. It writes with the material you give it.
            </p>
          </div>

          <div className="flex flex-col gap-8">

            <div className="flex flex-col gap-2">
              <p className="font-sans text-xs font-medium text-ink uppercase tracking-wide">Each night, it reads your answers</p>
              <p className="font-sans text-sm text-ink-light leading-relaxed">
                After you finish a day's questions, the AI reads everything you've written — not to summarise it, but to notice what's there. Themes that keep recurring. Things you said carefully. Things you said quickly. The next morning's questions are written from that reading.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-sans text-xs font-medium text-ink uppercase tracking-wide">Questions are personal, not generic</p>
              <p className="font-sans text-sm text-ink-light leading-relaxed">
                Your partner is answering different questions than you are. The AI writes for each of you separately, based on what each of you actually wrote. It's not a template — it's a response.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-sans text-xs font-medium text-ink uppercase tracking-wide">The draft is written in your voice</p>
              <p className="font-sans text-sm text-ink-light leading-relaxed">
                The Sunday draft pulls phrases, images, and sentences from your own answers across the week. The AI arranges them into something that sounds like vows — because the raw material already was. You'll recognise yourself in it.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-sans text-xs font-medium text-ink uppercase tracking-wide">Nothing crosses over</p>
              <p className="font-sans text-sm text-ink-light leading-relaxed">
                Your answers are yours. Your partner's reading and draft are generated from their writing alone. The app keeps both sides private from each other throughout. The AI never shows one of you what the other wrote.
              </p>
            </div>

          </div>

          <div className="border border-cream-mid p-5">
            <p className="font-sans text-xs text-ink-light italic leading-relaxed">
              Voice answers are transcribed using speech recognition before being passed to the AI. The words it works with are always yours — spoken or typed.
            </p>
          </div>

        </div>
      </section>

    </main>
  )
}

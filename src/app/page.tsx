import Link from 'next/link'

const USER_A_TOKEN = process.env.USER_A_TOKEN!
const USER_B_TOKEN = process.env.USER_B_TOKEN!
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!
const USER_A_NAME = process.env.USER_A_NAME || 'Partner A'
const USER_B_NAME = process.env.USER_B_NAME || 'Partner B'

export default function RootPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-cream px-6 py-16">
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
    </main>
  )
}

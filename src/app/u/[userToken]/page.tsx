import { notFound } from 'next/navigation'
import { TodayScreen } from './TodayScreen'

interface PageProps {
  params: { userToken: string }
}

export default async function UserPage({ params }: PageProps) {
  const { userToken } = params

  let userId: 'a' | 'b' | null = null
  if (userToken === process.env.USER_A_TOKEN) userId = 'a'
  else if (userToken === process.env.USER_B_TOKEN) userId = 'b'

  if (!userId) notFound()

  const userName = userId === 'a' ? (process.env.USER_A_NAME || 'Partner A') : (process.env.USER_B_NAME || 'Partner B')

  return <TodayScreen userToken={userToken} userId={userId} userName={userName} />
}

import { notFound } from 'next/navigation'
import { AdminPanel } from './AdminPanel'

interface PageProps {
  params: { adminToken: string }
}

export default async function AdminPage({ params }: PageProps) {
  const { adminToken } = params

  if (adminToken !== process.env.ADMIN_TOKEN) notFound()

  return <AdminPanel adminToken={adminToken} />
}

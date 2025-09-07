import { redirect } from 'next/navigation'
import LazlleLogo from '@/components/LazlleLogo'

export default function HomePage() {
  // Root domain homepage - redirect to admin panel
  redirect('/admin')
}
// app/page.tsx
import { redirect } from 'next/navigation'

export default function Home() {
  // Dès qu'on arrive sur "/", on envoie l'utilisateur sur /login
  redirect('/login')
}

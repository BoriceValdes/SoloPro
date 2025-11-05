export const dynamic = 'force-static' // SSG

export default function SsgInfo() {
  return (
    <div className="container">
      <h1>Page statique (SSG)</h1>
      <div className="card">
        <p>
          Cette page est générée au build (Static Site Generation) et
          servie telle quelle par Next.js.
        </p>
        <p style={{ fontSize: 14 }}>
          Elle sert uniquement d&apos;exemple pour montrer SSG dans ton
          projet fil rouge.
        </p>
      </div>
    </div>
  )
}

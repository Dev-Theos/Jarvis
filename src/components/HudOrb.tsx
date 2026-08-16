export function HudOrb({ active }: { active: boolean }) {
  return (
    <div className={`orb ${active ? 'orb--active' : ''}`} aria-hidden>
      <div className="orb__ring orb__ring--a" />
      <div className="orb__ring orb__ring--b" />
      <div className="orb__core">
        <span>JARVIS</span>
      </div>
    </div>
  );
}

/* ============================================================
   Tweaks panel UI — density, font, accent, radius/shadow, theme
   ============================================================ */
function TweaksUI({ t, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Brand" />
      <TweakColor label="Accent" value={t.accent}
        options={["#3FB984", "#F0685E", "#4C6FFF", "#8B6FE8", "#E8975A"]}
        onChange={(v) => setTweak("accent", v)} />

      <TweakSection label="Typography" />
      <TweakSelect label="UI font" value={t.font}
        options={["Figtree", "Hanken Grotesk", "Onest", "System"]}
        onChange={(v) => setTweak("font", v)} />

      <TweakSection label="Layout" />
      <TweakSlider label="Corner radius" value={t.radius} min={0.4} max={1.7} step={0.1}
        onChange={(v) => setTweak("radius", v)} />
      <TweakSlider label="Shadow depth" value={t.shadow} min={0} max={1.7} step={0.1}
        onChange={(v) => setTweak("shadow", v)} />
    </TweaksPanel>
  );
}
window.TweaksUI = TweaksUI;

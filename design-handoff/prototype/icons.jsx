/* ============================================================
   Icons — minimal 1.6px stroke set. currentColor.
   ============================================================ */
const Ic = (() => {
  const S = ({ children, size = 18, fill = "none", sw = 1.7, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
         stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
         strokeLinejoin="round" style={style} aria-hidden="true">{children}</svg>
  );
  return {
    list:   (p) => <S {...p}><line x1="8" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="8" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.1" fill="currentColor" stroke="none"/></S>,
    board:  (p) => <S {...p}><rect x="3" y="4" width="6" height="16" rx="1.5"/><rect x="11" y="4" width="6" height="10" rx="1.5"/><rect x="19" y="4" width="2.5" height="13" rx="1.2" stroke="none" fill="none"/><rect x="19" y="4" width="2" height="13" rx="1" stroke="none"/></S>,
    inbox:  (p) => <S {...p}><path d="M4 13h4l1.5 3h5L16 13h4"/><path d="M4 13 6 5h12l2 8v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/></S>,
    plus:   (p) => <S {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></S>,
    close:  (p) => <S {...p}><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></S>,
    chevR:  (p) => <S {...p}><polyline points="9 6 15 12 9 18"/></S>,
    chevD:  (p) => <S {...p}><polyline points="6 9 12 15 18 9"/></S>,
    chevDown:(p)=> <S {...p}><polyline points="6 9 12 15 18 9"/></S>,
    check:  (p) => <S {...p}><polyline points="4 12.5 9.5 18 20 6"/></S>,
    flag:   (p) => <S {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></S>,
    calendar:(p)=> <S {...p}><rect x="4" y="5" width="16" height="16" rx="2.5"/><line x1="4" y1="9.5" x2="20" y2="9.5"/><line x1="8.5" y1="3" x2="8.5" y2="6.5"/><line x1="15.5" y1="3" x2="15.5" y2="6.5"/></S>,
    search: (p) => <S {...p}><circle cx="11" cy="11" r="6.5"/><line x1="16" y1="16" x2="21" y2="21"/></S>,
    filter: (p) => <S {...p}><path d="M4 6h16M7 12h10M10 18h4"/></S>,
    copy:   (p) => <S {...p}><rect x="9" y="9" width="11" height="11" rx="2.2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></S>,
    trash:  (p) => <S {...p}><polyline points="4 7 20 7"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2"/><path d="M6 7l1 13a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 20L18 7"/></S>,
    dots:   (p) => <S {...p}><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></S>,
    settings:(p)=> <S {...p}><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1 5.3 5.3"/></S>,
    sun:    (p) => <S {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M19.4 4.6l-1.8 1.8M6.4 17.6l-1.8 1.8"/></S>,
    moon:   (p) => <S {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5z"/></S>,
    arrowRight:(p)=> <S {...p}><line x1="4" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></S>,
    target: (p) => <S {...p}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/></S>,
    layers: (p) => <S {...p}><path d="M12 3 21 8l-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></S>,
    cube:   (p) => <S {...p}><path d="M12 3 21 8v8l-9 5-9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/></S>,
    eyeOff: (p) => <S {...p}><path d="M3 3l18 18M10.6 6.2A8.9 8.9 0 0 1 12 6c5 0 9 6 9 6a14 14 0 0 1-3 3.3M6.2 6.2A14 14 0 0 0 3 12s4 6 9 6a8.5 8.5 0 0 0 3.3-.66"/><path d="M9.7 9.7a3.2 3.2 0 0 0 4.5 4.5"/></S>,
    lock:   (p) => <S {...p}><rect x="5" y="11" width="14" height="9" rx="2.2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></S>,
    sparkle:(p) => <S {...p}><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"/></S>,
    globe:  (p) => <S {...p}><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.4 2.5 14.6 0 17M12 3.5c-2.5 2.4-2.5 14.6 0 17"/></S>,
    bolt:   (p) => <S {...p}><path d="M13 3 5 13h6l-1 8 8-10h-6z"/></S>,
    grip:   (p) => <S {...p}><circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"/></S>,
    corner: (p) => <S {...p}><path d="M9 7l-5 5 5 5M4 12h11a5 5 0 0 0 5-5V4" /></S>,
    pin:    (p) => <S {...p}><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z"/><line x1="12" y1="14" x2="12" y2="21"/></S>,
    tag:    (p) => <S {...p}><path d="M3 12.5V5a2 2 0 0 1 2-2h7.5L21 11.5a2 2 0 0 1 0 2.8L14.3 21a2 2 0 0 1-2.8 0L3 12.5z"/><circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none"/></S>,
    edit:   (p) => <S {...p}><path d="M4 20h4L19 9l-4-4L4 16z"/><line x1="13.5" y1="6.5" x2="17.5" y2="10.5"/></S>,
    table:  (p) => <S {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9.5" x2="21" y2="9.5"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="10" y1="9.5" x2="10" y2="20"/></S>,
    sliders:(p) => <S {...p}><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/><circle cx="9" cy="8" r="2.3"/><circle cx="15" cy="16" r="2.3"/></S>,
    key:    (p) => <S {...p}><circle cx="8" cy="8" r="4.2"/><path d="M11 11l8 8M16 16l2.5-2.5M19 19l2-2"/></S>,
    keyRound:(p)=> <S {...p}><circle cx="7.5" cy="15.5" r="4"/><path d="M10.3 12.7 19 4M16 7l2.5 2.5M14 9l2 2"/></S>,
    chevUpDown:(p)=> <S {...p}><polyline points="8 9 12 5.5 16 9"/><polyline points="8 15 12 18.5 16 15"/></S>,
    cmd:    (p) => <S {...p}><path d="M7.5 4.5A2.5 2.5 0 1 0 10 7v10a2.5 2.5 0 1 0 2.5-2.5h-1M16.5 19.5A2.5 2.5 0 1 0 14 17V7a2.5 2.5 0 1 0-2.5 2.5h1"/></S>,
    plusBox:(p) => <S {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><line x1="12" y1="8.5" x2="12" y2="15.5"/><line x1="8.5" y1="12" x2="15.5" y2="12"/></S>,
    arrowSwap:(p)=> <S {...p}><path d="M7 4 4 7l3 3M4 7h11M17 20l3-3-3-3M20 17H9"/></S>,
    eye:    (p) => <S {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3.1"/></S>,
    spark:  (p) => <S {...p}><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"/></S>,
    folder: (p) => <S {...p}><path d="M3.5 7.5a2 2 0 0 1 2-2h3.2a2 2 0 0 1 1.5.7l1 1.3h7.3a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2z"/></S>,
  };
})();
window.Ic = Ic;

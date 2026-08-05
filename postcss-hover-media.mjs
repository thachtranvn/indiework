/**
 * Gate author `:hover` rules behind `@media (hover: hover) and (pointer: fine)`.
 *
 * Touch browsers latch `:hover` after the first tap and often withhold the
 * click — especially when hover reveals hidden children. Mixed selectors
 * (hover + `[data-open]` / `:focus-visible`) are split so non-hover states
 * still apply on phones.
 */
function hoverOnlyWhenHoverable() {
  return {
    postcssPlugin: 'hover-only-when-hoverable',
    Rule(rule, { AtRule }) {
      if (!rule.selector.includes(':hover')) return;

      let parent = rule.parent;
      while (parent) {
        if (
          parent.type === 'atrule' &&
          parent.name === 'media' &&
          parent.params.includes('hover')
        ) {
          return;
        }
        parent = parent.parent;
      }

      const hoverSelectors = [];
      const restSelectors = [];
      for (const selector of rule.selectors) {
        if (selector.includes(':hover')) hoverSelectors.push(selector);
        else restSelectors.push(selector);
      }

      if (restSelectors.length > 0) {
        rule.before(rule.clone({ selectors: restSelectors }));
      }

      if (hoverSelectors.length === 0) {
        rule.remove();
        return;
      }

      rule.selectors = hoverSelectors;
      // `pointer: fine` is required: iPadOS (and some iOS builds) still match
      // `(hover: hover)` during a finger tap, which reintroduces sticky hover
      // and cancels the click whenever hover toggles `pointer-events`.
      const media = new AtRule({
        name: 'media',
        params: '(hover: hover) and (pointer: fine)',
      });
      rule.replaceWith(media);
      media.append(rule);
    },
  };
}

hoverOnlyWhenHoverable.postcss = true;

export default hoverOnlyWhenHoverable;

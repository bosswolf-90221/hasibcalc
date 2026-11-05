// On a phone the answer sits below the fields, so a long form hides it. While the fields are on screen and the
// answer is not, a thin bar at the bottom repeats it; tapping the bar scrolls to the full result.
// It repeats what is already on the page, so assistive technology skips it.
export function mountPeek(fields: Element, answer: Element) {
  const bar = document.createElement('button');
  bar.type = 'button';
  bar.className = 'result-peek';
  bar.tabIndex = -1;
  bar.setAttribute('aria-hidden', 'true');
  bar.hidden = true;
  const label = bar.appendChild(document.createElement('span'));
  const value = bar.appendChild(document.createElement('b'));
  document.body.append(bar);

  let hasResult = false;
  let fieldsInView = false;
  let answerInView = false;
  const phone = window.matchMedia('(max-width: 860px)');
  // AdSense marks its anchor ad with this attribute. While one is showing, the bar stays out of the way.
  const anchorAd = () => document.querySelector('ins.adsbygoogle[data-anchor-status="displayed"]') !== null;
  const sync = () => { bar.hidden = !(hasResult && fieldsInView && !answerInView && phone.matches && !anchorAd()); };

  new IntersectionObserver(([e]) => { fieldsInView = e.isIntersecting; sync(); }).observe(fields);
  new IntersectionObserver(([e]) => { answerInView = e.isIntersecting; sync(); }).observe(answer);
  phone.addEventListener('change', sync);
  bar.addEventListener('click', () => answer.scrollIntoView({ block: 'center' }));

  /** Pass the label and value of the current result, or nothing when there is no result. */
  return (l?: string, v?: string) => {
    hasResult = Boolean(v);
    label.textContent = l ?? '';
    value.textContent = v ?? '';
    sync();
  };
}

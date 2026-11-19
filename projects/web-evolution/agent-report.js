const reportTime = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
});
const publicationDate = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
});

function reportParagraphs(results, assigned) {
  const checked = results.length;
  const weather = results.find(({ id }) => id === 'weather');
  const article = results.filter(({ id }) => id !== 'weather').flatMap(({ data }) => data)
    .sort((first, second) => second.published - first.published)[0];
  const count = `${checked} of ${assigned} assigned source${assigned === 1 ? '' : 's'}`;
  const findings = [];
  if (weather) {
    const { clouds, temperature, validAt } = weather.data;
    findings.push(`Open-Meteo’s model put ${weather.source} at ${clouds}% cloud cover and ${temperature.toFixed(1)} °C at ${reportTime.format(validAt)}.`);
  }
  if (article) findings.push(`The latest NASA update I found was “${article.title}” (published ${publicationDate.format(article.published)}).`);

  let next = 'I’d recheck conditions for your actual location before making an outdoor plan today.';
  if (weather && Math.abs(Date.now() - weather.data.validAt.getTime()) <= 3 * 60 * 60 * 1000) {
    next = weather.data.clouds >= 65
      ? 'For today, I’d keep an indoor backup near the reference location and check again closer to viewing time.'
      : 'For today, I’d sketch a tentative viewing plan near the reference location and check local conditions before heading out.';
  }
  if (article) next += ' Open the NASA update in the source list for the full story.';
  if (findings.length === 0) next = 'I’d try the sources again before making a plan for today. You can still explore the simulated plan.';

  return [
    `I checked ${count}.${findings.length ? ` ${findings.join(' ')}` : ' I didn’t find usable current information in this run.'}`,
    `${next} I’ll keep checking these sources every five minutes while this briefing is open and visible.`,
    'Would you like another source check or help exploring the observing scenario?',
  ];
}

export function createAgentReport(root, status, refresh, signal) {
  const wrapper = document.createElement('section');
  wrapper.className = 'agent-report';
  wrapper.setAttribute('aria-labelledby', 'agent-report-title');
  const glyphs = ['✧', '✦', '✶', '✷'];
  wrapper.innerHTML = `
    <div class="agent-report-heading">
      <span class="agent-report-mark" aria-hidden="true">✦</span>
      <div><h4 id="agent-report-title">Agent debrief</h4><p>Template-based briefing from public sources</p></div>
    </div>
    <div class="agent-report-progress">
      <div class="agent-report-stars" aria-hidden="true">${glyphs.map((glyph, index) => `<span style="--star-index:${index}">${glyph}</span>`).join('')}</div>
      <p class="agent-report-stage" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>
    <div class="agent-report-copy"></div>
    <div class="agent-report-actions" hidden>
      <button type="button" class="agent-report-recheck">Recheck sources</button>
      <button type="button" class="agent-report-scenario">Open observing scenario</button>
    </div>`;
  status.after(wrapper);

  const copy = wrapper.querySelector('.agent-report-copy');
  const stars = wrapper.querySelector('.agent-report-stars');
  const stage = wrapper.querySelector('.agent-report-stage');
  const actions = wrapper.querySelector('.agent-report-actions');
  const recheck = wrapper.querySelector('.agent-report-recheck');
  const minimumPreparation = 1600;
  let preparationStarted = 0;
  let timer;

  function cancel() {
    clearTimeout(timer);
  }

  function pending() {
    cancel();
    preparationStarted = performance.now();
    wrapper.dataset.agentReport = 'checking';
    copy.setAttribute('aria-hidden', 'true');
    copy.textContent = '';
    stage.textContent = 'Thinking…';
    stars.hidden = false;
    recheck.setAttribute('aria-disabled', 'true');
  }

  function finish() {
    cancel();
    wrapper.dataset.agentReport = 'ready';
    copy.removeAttribute('aria-hidden');
    stars.hidden = true;
    stage.textContent = 'Briefing ready.';
    actions.hidden = false;
    recheck.removeAttribute('aria-disabled');
  }

  function write(results, assigned, reducedMotion) {
    clearTimeout(timer);
    const paragraphs = reportParagraphs(results, assigned);
    const lines = paragraphs.map(() => document.createElement('p'));
    if (reducedMotion) {
      lines.forEach((line, index) => { line.textContent = paragraphs[index]; });
      copy.replaceChildren(...lines);
      finish();
      return;
    }

    const beginWriting = () => {
      timer = undefined;
      if (signal.aborted) return;
      wrapper.dataset.agentReport = 'writing';
      stage.textContent = 'Writing…';
      copy.setAttribute('aria-hidden', 'true');
      const words = paragraphs.map((paragraph) => paragraph.match(/\S+\s*/g));
      let paragraph = 0;
      let cursor = 0;
      copy.replaceChildren(lines[0]);

      function tick() {
        if (signal.aborted) return;
        const line = words[paragraph];
        const phrase = line.slice(cursor, cursor + 3).join('');
        lines[paragraph].append(phrase);
        cursor += 3;
        if (cursor < line.length) {
          timer = setTimeout(tick, /[.!?]$/.test(phrase.trim()) ? 105 : 54);
        } else if (++paragraph < lines.length) {
          cursor = 0;
          copy.append(lines[paragraph]);
          timer = setTimeout(tick, 125);
        } else finish();
      }
      tick();
    };
    const remaining = Math.max(0, minimumPreparation - (performance.now() - preparationStarted));
    if (remaining) timer = setTimeout(beginWriting, remaining);
    else beginWriting();
  }

  function unassigned() {
    cancel();
    wrapper.dataset.agentReport = 'unassigned';
    copy.removeAttribute('aria-hidden');
    copy.textContent = 'Choose an interest to tell me what to check. You can also open the simulated observing scenario.';
    stars.hidden = true;
    stage.textContent = 'No sources are assigned.';
    recheck.disabled = true;
    actions.hidden = false;
  }

  recheck.addEventListener('click', () => {
    if (recheck.getAttribute('aria-disabled') !== 'true') refresh();
  }, { signal });
  wrapper.querySelector('.agent-report-scenario').addEventListener('click', () => {
    const scenario = root.querySelector('.briefing-scenario');
    if (!scenario) return;
    scenario.open = true;
    scenario.querySelector('summary').focus();
  }, { signal });
  signal.addEventListener('abort', cancel, { once: true });

  return { pending, write, unassigned };
}

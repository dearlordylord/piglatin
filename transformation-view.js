// The user's drag is time. Frames are pure functions of trace and event position;
// perceptual clarity must be evaluated by watching motion while scrubbing.
const pitch = 34;
const visible = c => ({ ' ': '␠', '\t': '⇥', '\n': '↵' }[c] ?? c);
const ease = value => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

export function compileTransformation(source, trace) {
  const tokens = [], glyphs = [];
  let outputOffset = 0;
  // Accepted input contains ASCII words, digit runs, and preserved separators.
  for (const match of source.matchAll(/[a-zA-Z0-9]+|[^a-zA-Z0-9]/g)) {
    const raw = match[0], start = match.index, end = start + raw.length;
    const word = /^[a-zA-Z]+$/.test(raw);
    const cut = word ? (trace.steps[end].state.prefix ?? '').length : 0;
    const tokenIndex = tokens.length;
    tokens.push({ start, length: raw.length, word, commit: end + 1 });
    for (let i = 0; i < raw.length; i++) {
      const destination = word ? (i < cut ? raw.length - cut + i : i - cut) : i;
      glyphs.push({
        id: `input-${start + i}`, tokenIndex, index: i, source: raw[i],
        final: trace.output[outputOffset + destination], destination,
        role: word ? (i < cut ? 'prefix' : 'stem') : 'preserved', read: start + i + 1,
      });
    }
    if (word) for (let i = 0; i < 2; i++) {
      glyphs.push({
        id: `suffix-${start}-${i}`, tokenIndex, index: i, source: 'ay'[i],
        final: trace.output[outputOffset + raw.length + i], destination: raw.length + i,
        role: 'suffix', read: end + 1,
      });
    }
    outputOffset += raw.length + (word ? 2 : 0);
  }
  return { tokens, glyphs, sourceLength: source.length, width: Math.max(820, trace.output.length * pitch + 100) };
}

export function transformationFrame(model, time) {
  // Recompute shared layout before trajectories: suffix growth changes every
  // downstream destination, including destinations of letters still in flight.
  let added = 0;
  const offsets = model.tokens.map(token => {
    const offset = token.start + added;
    added += token.word ? 2 * ease(time - (token.commit - 1)) : 0;
    return offset;
  });
  const left = (model.width - (model.sourceLength + added) * pitch) / 2 + pitch / 2;
  const sourceLeft = (model.width - model.sourceLength * pitch) / 2 + pitch / 2;
  return model.glyphs.map(glyph => {
    const token = model.tokens[glyph.tokenIndex];
    const commit = ease(time - ((token.word ? token.commit : glyph.read) - 1));
    const sourceX = sourceLeft + (token.start + glyph.index) * pitch;
    const targetX = left + (offsets[glyph.tokenIndex] + glyph.destination) * pitch;
    if (glyph.role === 'suffix') {
      return { x: targetX, y: mix(340, 295, commit), opacity: commit, caseProgress: commit, sourceX };
    }
    const read = ease(time - (glyph.read - 1));
    const laneX = left + (offsets[glyph.tokenIndex] + (glyph.role === 'prefix' ? glyph.index : glyph.destination)) * pitch;
    const laneY = glyph.role === 'prefix' ? 135 : glyph.role === 'stem' ? 215 : 295;
    return {
      x: mix(mix(sourceX, laneX, read), targetX, commit),
      y: mix(mix(65, laneY, read), 295, commit),
      opacity: 1, caseProgress: commit, sourceX,
    };
  });
}

export function createTransformationView(panel, onSeek) {
  const svg = panel.querySelector('svg');
  const slider = panel.querySelector('input');
  const ticks = panel.querySelector('#motion-ticks');
  const caption = panel.querySelector('#motion-event');
  let currentTrace, model, nodes;
  const ns = 'http://www.w3.org/2000/svg';
  function element(tag, attributes, text) {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function prepare(source, trace) {
    currentTrace = trace;
    model = compileTransformation(source, trace);
    svg.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${model.width} 360`);
    // Long phrases scroll rather than shrinking their letters to illegibility.
    svg.style.minWidth = `${model.width}px`;
    ['INPUT', 'PREFIX', 'STEM', 'ASSEMBLY → RESULT'].forEach((label, i) => {
      svg.append(element('text', { x: 16, y: 26 + i * 80, class: 'motion-lane-label' }, label));
    });
    const ghosts = model.glyphs.map(glyph => {
      if (glyph.role === 'suffix') return null;
      const ghost = element('text', { y: 65, class: 'motion-ghost', 'text-anchor': 'middle', opacity: .22 }, visible(glyph.source));
      svg.append(ghost);
      return ghost;
    });
    nodes = model.glyphs.map((glyph, i) => {
      const group = element('g', { 'data-glyph': glyph.id, class: `motion-glyph ${glyph.role}` });
      const original = element('text', { 'text-anchor': 'middle' }, visible(glyph.source));
      const final = element('text', { 'text-anchor': 'middle' }, visible(glyph.final));
      group.append(original, final);
      svg.append(group);
      return { group, original, final, ghost: ghosts[i] };
    });
    slider.max = trace.steps.length - 1;
    ticks.replaceChildren();
    trace.steps.forEach((step, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.style.left = `${i / (trace.steps.length - 1) * 100}%`;
      button.title = `${i}: ${step.rule} ${JSON.stringify(step.character)}`;
      button.setAttribute('aria-label', `Jump to event ${i}: ${step.rule}`);
      button.addEventListener('click', () => onSeek(i));
      ticks.append(button);
    });
  }
  slider.addEventListener('input', () => onSeek(Number(slider.value)));
  // Native range arrows otherwise move only .001 events per keypress.
  slider.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    onSeek(Math.max(0, Math.min(Number(slider.max), Number(slider.value) + (event.key === 'ArrowRight' ? .1 : -.1))));
  });
  return {
    render(source, trace, position) {
      if (currentTrace !== trace) prepare(source, trace);
      const time = Math.max(0, Math.min(trace.steps.length - 1, position));
      transformationFrame(model, time).forEach((pose, i) => {
        const node = nodes[i];
        node.group.setAttribute('transform', `translate(${pose.x},${pose.y})`);
        node.group.setAttribute('opacity', pose.opacity);
        node.original.setAttribute('opacity', 1 - pose.caseProgress);
        node.final.setAttribute('opacity', pose.caseProgress);
        if (node.ghost) node.ghost.setAttribute('x', pose.sourceX);
      });
      slider.value = time;
      slider.setAttribute('aria-valuetext', `Event position ${time.toFixed(2)} of ${trace.steps.length - 1}`);
      const lo = Math.floor(time), hi = Math.min(lo + 1, trace.steps.length - 1);
      caption.textContent = `${time.toFixed(2)} / ${trace.steps.length - 1} · ${lo}: ${trace.steps[lo].rule}${time > lo ? ` → ${hi}: ${trace.steps[hi].rule} (${visible(trace.steps[hi].character)})` : ''}`;
    },
  };
}

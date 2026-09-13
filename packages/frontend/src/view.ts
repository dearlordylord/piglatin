import { Option } from "effect";
import { createLazy, type Document, type Html, type HtmlBuilder } from "foldkit/html";
import type { State, Step, Trace } from "@piglatin/core";
import type { Model } from "./app.ts";
import { Message } from "./messages.ts";
import { transformationFrame, visible, type TransformationModel } from "./transformation.ts";

type Builder = HtmlBuilder<Message>;
const show = (value: unknown) => JSON.stringify(value) ?? "absent";
const notes: Record<Step["rule"], string> = {
  initial: "No word has started. There are no capitalization or digit facts yet.",
  startWord: "The first character starts a word and establishes its classification.",
  appendPrefix: "This consonant extends the prefix that will move to the end.",
  completeQu: "The u stays with the preceding q in the movable prefix.",
  startStem: "An eligible vowel starts the part that stays at the front.",
  appendStem: "This character extends the stem.",
  finish: "Commit the pending word and preserve the separator, or finish the complete input.",
  leadingQuote: "Preserve the opening quote before the word.",
  trailingPunctuation: "Commit the word and preserve punctuation at this boundary.",
};
const presets = ['Hello! queen', '"SQUARE!!"', '2?8', 'hello\tworld\n', '1a', 'square', '00123', 'flower', 'string', 'apple', 'brrr', ''];
const lazyContract = createLazy(), lazyControls = createLazy(), lazyDiagram = createLazy(), lazyTrace = createLazy(), lazyInspector = createLazy();

function inputView(source: string, h: Builder): Html {
  return h.div([h.Id("input-panel"), h.Class("panel")], [
    h.textarea([h.Id("input"), h.AriaLabel("Input text"), h.Value(source), h.OnInput(value => Message.ChangedInput({ value }))]),
    h.div([h.Id("presets")], presets.map(value => h.keyed("button")(value, [h.OnClick(Message.ChangedInput({ value }))], [show(value)]))),
    h.button([h.Id("load"), h.Class("primary"), h.OnClick(Message.Restarted())], ["Restart walkthrough"]),
  ]);
}

function contractView(source: string, result: Model["result"], h: Builder): Html {
  const fragments: Html[] = [];
  if (result.ok) for (const match of source.matchAll(/[a-zA-Z0-9]+|[^a-zA-Z0-9]/g)) {
    const word = match[0];
    if (!/^[a-zA-Z]+$/.test(word)) {
      fragments.push(h.p([], [h.span([h.Class("tag")], [show(word)]), " Preserved exactly"]));
      continue;
    }
    const state = result.steps[match.index + word.length].state;
    fragments.push(h.p([], [
      h.strong([], [word]), " → ", h.span([h.Class("tag")], [state.stem?.toLowerCase() || "∅"]),
      " + ", h.span([h.Class("tag")], [state.prefix?.toLowerCase() || "∅"]), " + ", h.span([h.Class("tag")], ["ay"]),
      ` · restore ${word === word.toUpperCase() ? "uppercase" : word[0] === word[0].toUpperCase() ? "title case" : "lowercase"}`,
    ]));
  }
  return h.section([h.Id("contract-panel"), h.Class("panel")], [
    h.div([h.Id("contract")], result.ok
      ? [h.h2([], ["Accepted"]), h.div([h.Class("result")], [show(result.output)])]
      : [h.h2([], ["Rejected"]), h.p([], [result.error]), h.p([], ["No translation or reducer walkthrough runs for this input."])]),
    h.details([], [h.summary([], ["Word rotation and preserved fragments"]), h.div([h.Id("fragments")], fragments)]),
  ]);
}

function motionView(model: TransformationModel, trace: Trace, time: number, h: Builder): Html {
  const poses = transformationFrame(model, time);
  const lo = Math.floor(time), hi = Math.min(lo + 1, trace.steps.length - 1);
  return h.section([h.Id("transformation-view"), h.Class("panel")], [
    h.div([h.Class("motion-viewport"), h.Tabindex(0), h.Role("region"), h.AriaLabel("Word transformation; scroll horizontally for long inputs")], [
      h.svg([h.Id("motion-stage"), h.ViewBox(`0 0 ${model.width} 360`), h.Style({ minWidth: `${model.width}px` }), h.Role("img"), h.AriaLabel("Letters transforming at the selected event position")], [
        ...["INPUT", "PREFIX", "STEM", "ASSEMBLY → RESULT"].map((label, i) => h.keyed("text")(`lane-${i}`, [h.X("16"), h.Y(String(26 + i * 80)), h.Class("motion-lane-label")], [label])),
        ...model.glyphs.flatMap((glyph, i) => glyph.role === "suffix" ? [] : [h.keyed("text")(`ghost-${glyph.id}`, [h.X(String(poses[i].sourceX)), h.Y("65"), h.Class("motion-ghost"), h.TextAnchor("middle"), h.Opacity(".22")], [visible(glyph.source)])]),
        ...model.glyphs.map((glyph, i) => {
          const pose = poses[i];
          return h.keyed("g")(glyph.id, [h.DataAttribute("glyph", glyph.id), h.Class(`motion-glyph ${glyph.role}`), h.Transform(`translate(${pose.x},${pose.y})`), h.Opacity(String(pose.opacity))], [
            h.text([h.TextAnchor("middle"), h.Opacity(String(1 - pose.caseProgress))], [visible(glyph.source)]),
            h.text([h.TextAnchor("middle"), h.Opacity(String(pose.caseProgress))], [visible(glyph.final)]),
          ]);
        }),
      ]),
    ]),
    h.input([
      h.Id("motion-time"), h.AriaLabel("Event position"), h.Type("range"), h.Min("0"), h.Max(String(trace.steps.length - 1)), h.Step("0.001"), h.Value(String(time)),
      h.AriaDescribedBy("motion-event"), h.AriaValuetext(`Event position ${time.toFixed(2)} of ${trace.steps.length - 1}`),
      h.OnInput(value => Message.Scrubbed({ position: Number(value) })),
      h.OnKeyDownPreventDefault((key, modifiers) => !modifiers.altKey && !modifiers.ctrlKey && !modifiers.metaKey && ["ArrowLeft", "ArrowRight"].includes(key)
        ? Option.some(Message.Scrubbed({ position: time + (key === "ArrowRight" ? .1 : -.1) })) : Option.none()),
    ]),
    h.div([h.Id("motion-ticks")], trace.steps.map((step, i) => h.keyed("button")(i, [
      h.Type("button"), h.Style({ left: `${i / (trace.steps.length - 1) * 100}%` }),
      h.Title(`${i}: ${step.rule} ${show(step.character)}`), h.AriaLabel(`Jump to event ${i}: ${step.rule}`), h.OnClick(Message.Scrubbed({ position: i })),
    ]))),
    h.p([h.Id("motion-event")], [`${time.toFixed(2)} / ${trace.steps.length - 1} · ${lo}: ${trace.steps[lo].rule}${time > lo ? ` → ${hi}: ${trace.steps[hi].rule} (${visible(trace.steps[hi].character)})` : ""}`]),
    h.p([h.Class("motion-legend")], ["Orange: movable prefix", "Green: stem", "Purple: added suffix"].map(label => h.span([], [label]))),
    h.p([h.Class("muted")], ["The events and reducer state below follow the last completed decision. Spaces, tabs, and newlines appear as ␠, ⇥, and ↵."]),
  ]);
}

function controlsView(source: string, trace: Trace, index: number, h: Builder): Html {
  return h.div([h.Id("step-controls"), h.Class("panel")], [
    h.div([h.Id("chars")], [...source].map((c, i) => h.span([h.Class(`char ${i === trace.steps[index].position - 1 ? "current" : ""}`)], [visible(c)]))),
    h.button([h.Id("back"), h.Attribute("aria-keyshortcuts", "ArrowLeft"), h.Disabled(index === 0), h.OnClick(Message.Stepped({ direction: -1 }))], ["← Back"]),
    h.button([h.Id("next"), h.Class("primary"), h.Attribute("aria-keyshortcuts", "ArrowRight"), h.Disabled(index === trace.steps.length - 1), h.OnClick(Message.Stepped({ direction: 1 }))], ["Next decision →"]),
    h.button([h.Id("end"), h.OnClick(Message.JumpedToResult())], ["Jump to result"]),
    h.span([h.Id("count"), h.AriaLive("polite")], [`Step ${index} / ${trace.steps.length - 1}`]),
    h.span([h.Class("muted")], [" · ← / → to step"]),
  ]);
}

const statePositions: Record<State["kind"], readonly [number, number]> = { leading: [130, 65], prefix: [410, 65], stem: [410, 270], trailingPunctuation: [130, 270] };
function edgePath(a: State["kind"], b: State["kind"]): string {
  const [x, y] = statePositions[a], [xx, yy] = statePositions[b];
  if (a === b) return `M ${x - 35} ${y - 22} C ${x - 90} ${y - 85},${x + 90} ${y - 85},${x + 35} ${y - 22}`;
  const dx = xx - x, dy = yy - y, length = Math.hypot(dx, dy), ux = dx / length, uy = dy / length;
  return `M ${x + ux * 65} ${y + uy * 30} Q ${(x + xx) / 2 - uy * 25} ${(y + yy) / 2 + ux * 25} ${xx - ux * 65} ${yy - uy * 30}`;
}
function diagramView(trace: Trace, index: number, h: Builder): Html {
  const edges = new Map<string, { a: State["kind"]; b: State["kind"]; rules: Set<string> }>();
  for (let i = 1; i < trace.steps.length; i++) {
    const a = trace.steps[i - 1].state.kind, b = trace.steps[i].state.kind, key = `${a}|${b}`;
    const edge = edges.get(key) ?? { a, b, rules: new Set<string>() };
    edge.rules.add(trace.steps[i].rule); edges.set(key, edge);
  }
  const current = trace.steps[index], previous = index > 0 ? trace.steps[index - 1].state.kind : null;
  return h.section([h.Id("state-diagram"), h.Class("panel")], [
    h.h2([], ["State diagram"]), h.p([], ["States visited by this input"]),
    h.div([h.Class("diagram")], [h.svg([h.ViewBox("0 -25 550 360"), h.Role("img"), h.AriaLabel("Observed reducer state transitions")], [
      h.defs([], [h.marker([h.Id("arrow"), h.ViewBox("0 0 10 10"), h.RefX("9"), h.RefY("5"), h.MarkerWidth("6"), h.MarkerHeight("6"), h.Orient("auto-start-reverse")], [h.path([h.D("M 0 0 L 10 5 L 0 10 z"), h.Fill("#245f4d")])])]),
      ...[...edges].map(([key, { a, b, rules }]) => h.keyed("path")(key, [h.Class(`edge ${previous === a && current.state.kind === b ? "selected" : ""}`), h.Attribute("marker-end", "url(#arrow)"), h.D(edgePath(a, b)), h.AriaLabel(`${a} → ${b}: ${[...rules].join(", ")}`)])),
      ...[...new Set(trace.steps.map(step => step.state.kind))].map(kind => {
        const [x, y] = statePositions[kind];
        return h.keyed("g")(kind, [h.DataAttribute("state", kind), h.Tabindex(0), h.Role("button"), h.AriaLabel(`Jump to ${kind}`), h.OnClick(Message.SelectedState({ kind })), h.OnKeyDownPreventDefault(key => key === "Enter" || key === " " ? Option.some(Message.SelectedState({ kind })) : Option.none())], [
          h.rect([h.Class(`node ${kind === current.state.kind ? "selected" : ""}`), h.X(String(x - 85)), h.Y(String(y - 25)), h.Width("170"), h.Height("50"), h.Rx("12")]),
          h.text([h.X(String(x)), h.Y(String(y + 5)), h.TextAnchor("middle")], [kind]),
        ]);
      }),
    ])]),
    h.p([h.Class("result")], [`${previous ?? "∅"} → ${current.state.kind}`]),
    h.p([], ["Event: ", h.strong([], [show(current.character)]), " · decision: ", h.strong([], [current.rule])]),
  ]);
}

function traceView(trace: Trace, index: number, h: Builder): Html {
  const current = trace.steps[index], before = Object.fromEntries(Object.entries(index > 0 ? trace.steps[index - 1].state : {}));
  const changes = Object.entries(current.state).filter(([key, value]) => show(before[key]) !== show(value)).map(([key, value]) => h.p([], [h.strong([], [key]), " ", h.code([], [show(before[key])]), " → ", h.code([h.Class("changed")], [show(value)])]));
  for (const key of Object.keys(before).filter(key => !(key in current.state))) changes.push(h.p([], [h.strong([], [key]), " removed when the word was committed"]));
  return h.section([h.Id("decision-trace"), h.Class("panel")], [
    h.h2([], ["Decision trace"]), h.p([], ["Every row is an actual reducer step. Select a row to inspect what changed."]),
    h.div([h.Class("trace")], [h.table([], [
      h.thead([], [h.tr([], ["Step", "Character", "Decision", "State", "Prefix / stem", "Committed output"].map(label => h.th([], [label])))]),
      h.tbody([], trace.steps.map((step, i) => h.keyed("tr")(i, [h.Class(i === index ? "selected" : "")], [
        h.td([], [h.button([h.DataAttribute("step", String(i)), h.AriaLabel(`Select step ${i}`), h.OnClick(Message.Scrubbed({ position: i }))], [String(i)])]),
        ...[show(step.character), step.rule, step.state.kind, `${show(step.state.prefix ?? "")} / ${show(step.state.stem ?? "")}`, show(step.state.output)].map(value => h.td([], [value])),
      ]))),
    ])]),
    h.h2([], [`Changes at step ${index}`]), ...changes,
  ]);
}

function inspectorView(trace: Trace, index: number, h: Builder): Html {
  const step = trace.steps[index];
  return h.div([h.Id("inspector"), h.Class("grid")], [
    h.section([h.Class("panel")], [
      h.div([h.Class("eyebrow")], ["Selected decision"]), h.h2([h.Id("rule")], [step.rule]),
      h.p([h.Id("explain")], [notes[step.rule]]), h.div([h.Class("eyebrow")], ["Committed output"]),
      h.div([h.Id("output"), h.Class("result")], [step.state.output || "∅"]),
    ]),
    h.section([h.Class("panel")], [h.h2([], ["Reducer state"]), h.dl([h.Id("state")], Object.entries(step.state).flatMap(([key, value]) => [h.dt([], [key]), h.dd([], [typeof value === "object" ? JSON.stringify(value, null, 2) : show(value)])]))]),
  ]);
}

export const view = (model: Model, h: Builder): Document => {
  const index = Math.floor(model.position), trace = model.result;
  return {
    title: "Piglatin Incorporated · and animated", canonical: "https://piglatin.curatorman.com/",
    body: h.main([h.Id("app")], [
      h.nav([], [h.a([h.Class("github-link"), h.Href("https://github.com/dearlordylord/piglatin"), h.AriaLabel("View project on GitHub"), h.Title("View project on GitHub")], [
        h.svg([h.Width("24"), h.Height("24"), h.ViewBox("0 0 24 24"), h.Fill("currentColor"), h.AriaHidden(true), h.Attribute("focusable", "false")], [h.path([h.D(GITHUB_PATH)])]),
      ])]),
      h.h1([], ["Piglatin Incorporated"]), h.p([], ["and animated"]),
      inputView(model.source, h), lazyContract(contractView, [model.source, trace, h]),
      h.div([h.Id("walkthrough"), h.Hidden(!trace.ok)], trace.ok && model.transformation ? [
        motionView(model.transformation, trace, model.position, h),
        lazyControls(controlsView, [model.source, trace, index, h]), lazyDiagram(diagramView, [trace, index, h]),
        lazyTrace(traceView, [trace, index, h]), lazyInspector(inspectorView, [trace, index, h]),
      ] : []),
      h.footer([], ["Pig Latin · contract and composed implementation"]),
    ]),
  };
};

const GITHUB_PATH = "M12 .297C5.37.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.334-5.466-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.805 5.625-5.479 5.922.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.597 24 12.297c0-6.627-5.373-12-12-12";

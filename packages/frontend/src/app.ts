import { Effect, Schema } from "effect";
import { Command, Render, type Runtime, type Update } from "foldkit";
import { TraceResult, visualize } from "@piglatin/core";
import { TransformationModel, compileTransformation } from "./transformation.ts";
import { Message } from "./messages.ts";

export const Model = Schema.Struct({
  source: Schema.String,
  position: Schema.Number,
  result: TraceResult,
  transformation: Schema.NullOr(TransformationModel),
});
export interface Model extends Schema.Schema.Type<typeof Model> {}

export function modelForInput(source: string): Model {
  const result = visualize(source);
  return { source, position: 0, result, transformation: result.ok ? compileTransformation(source, result) : null };
}

// The only UI command adjusts the trace's own scroll container after rendering.
// Letter motion is entirely derived by the view; it needs no command or timer.
const KeepTraceVisible = Command.define("KeepTraceVisible", {
  messages: [Message.ScrolledTrace],
  execute: Effect.gen(function* () {
    yield* Render.afterCommit;
    yield* Effect.sync(() => {
      const container = document.querySelector<HTMLElement>("#decision-trace .trace");
      const row = container?.querySelector<HTMLElement>("tr.selected");
      if (!container || !row || !container.clientHeight) return;
      const box = container.getBoundingClientRect(), selected = row.getBoundingClientRect();
      const header = container.querySelector("thead")?.getBoundingClientRect().height ?? 0;
      const top = box.top + header, bottom = box.top + container.clientHeight;
      if (selected.top < top || selected.bottom > bottom) {
        container.scrollTop += selected.top - (top + (bottom - top - selected.height) / 2);
      }
    });
    return Message.ScrolledTrace();
  }),
});

function seek(model: Model, value: number): Update.Return<Model, Message> {
  if (!model.result.ok || !Number.isFinite(value)) return { model };
  const position = Math.max(0, Math.min(model.result.steps.length - 1, value));
  return {
    model: position === model.position ? model : { ...model, position },
    commands: Math.floor(position) === Math.floor(model.position) ? [] : [KeepTraceVisible()],
  };
}

export const update = (model: Model, message: Message): Update.Return<Model, Message> =>
  Message.match(message, {
    ChangedInput: ({ value }) => ({ model: modelForInput(value) }),
    Scrubbed: ({ position }) => seek(model, position),
    Stepped: ({ direction }) => seek(model, Math.floor(model.position) + direction),
    Restarted: () => seek(model, 0),
    JumpedToResult: () => seek(model, model.result.ok ? model.result.steps.length - 1 : 0),
    SelectedState: ({ kind }) => {
      if (!model.result.ok) return { model };
      const steps = model.result.steps;
      const next = steps.findIndex((step, i) => i > Math.floor(model.position) && step.state.kind === kind);
      return seek(model, next >= 0 ? next : steps.findIndex(step => step.state.kind === kind));
    },
    ScrolledTrace: () => ({ model }),
  });

export const init: Runtime.ApplicationInit<Model, Message> = () => ({ model: modelForInput("Hello! queen") });

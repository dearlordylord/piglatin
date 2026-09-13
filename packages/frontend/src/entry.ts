import "./styles.css";
import { Option } from "effect";
import { Runtime, Subscription } from "foldkit";
import { Model, init, update } from "./app.ts";
import { Message } from "./messages.ts";
import { view } from "./view.ts";

const subscriptions = Subscription.make<Model, Message>()(() => ({
  keyboard: Subscription.persistent(Subscription.fromEventFilterMap<KeyboardEvent, Message>({
    target: () => document,
    type: "keydown",
    toMessage: event => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return Option.none();
      const target = event.target;
      if (target instanceof HTMLElement && (target.closest('input,textarea,select,[role="textbox"],[role="slider"]') || target.isContentEditable)) return Option.none();
      event.preventDefault();
      return Option.some(Message.Stepped({ direction: event.key === "ArrowRight" ? 1 : -1 }));
    },
  })),
}));

Runtime.run(Runtime.makeApplication({
  Model, init, update, view, subscriptions,
  container: document.getElementById("root"),
}));

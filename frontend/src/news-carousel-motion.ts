type Slide = {
  element: HTMLElement;
  position: number;
  rect: DOMRect;
};

function slides(track: HTMLElement): Map<string, Slide> {
  return new Map(
    Array.from(track.querySelectorAll<HTMLElement>(":scope > [data-slide-id]"), (element) => [
      element.dataset.slideId!,
      { element, position: Number(element.dataset.position), rect: element.getBoundingClientRect() },
    ]),
  );
}

export function captureNewsMove(track: HTMLElement, direction: number) {
  const before = slides(track);
  const bounds = track.getBoundingClientRect();
  const outgoing = new Map<string, HTMLElement>();
  for (const [id, slide] of before) {
    const ghost = slide.element.cloneNode(true) as HTMLElement;
    ghost.removeAttribute("data-slide-id");
    ghost.setAttribute("aria-hidden", "true");
    ghost.inert = true;
    ghost.classList.add("news-tile-exit");
    Object.assign(ghost.style, {
      left: `${slide.rect.left - bounds.left}px`,
      top: `${slide.rect.top - bounds.top}px`,
      width: `${slide.rect.width}px`,
      height: `${slide.rect.height}px`,
    });
    outgoing.set(id, ghost);
  }
  return {
    play() {
      const timing = {
        duration: 270,
        easing: getComputedStyle(track).getPropertyValue("--study-ease").trim() || "ease-out",
      };
      const after = slides(track);
      const moving: Animation[] = [];
      const exits: HTMLElement[] = [];
      for (const [id, { element, position, rect }] of after) {
        const from = before.get(id);
        const incoming = !from || direction * (position - from.position) > 0;
        const x = incoming ? direction * (rect.width + 18) : from.rect.left - rect.left;
        const y = incoming ? 0 : from.rect.top - rect.top;
        const scale = incoming ? 0.97 : from.rect.width / rect.width;
        moving.push(element.animate(
          [
            { transform: `translate(${x}px, ${y}px) scale(${scale})`, opacity: incoming ? 0 : 1 },
            { transform: "none", opacity: 1 },
          ],
          timing,
        ));
        if (!incoming) outgoing.delete(id);
      }
      for (const ghost of outgoing.values()) {
        track.appendChild(ghost);
        exits.push(ghost);
        const animation = ghost.animate(
          [{ opacity: 1 }, { opacity: 0, transform: `translateX(${-direction * 100}%)` }],
          timing,
        );
        animation.onfinish = () => ghost.remove();
        moving.push(animation);
      }
      return () => {
        moving.forEach((animation) => animation.cancel());
        exits.forEach((ghost) => ghost.remove());
      };
    },
  };
}

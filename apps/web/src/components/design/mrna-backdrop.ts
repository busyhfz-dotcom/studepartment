type Coordinate = readonly [number, number];
type Curve = readonly [Coordinate, Coordinate, Coordinate, Coordinate];

// The desktop path follows the rise from the lower-left edge toward the heading.
// On narrow screens the strand follows the gutter alongside the stacked cards.
const desktop: readonly Curve[] = [
  [[.038, .758], [.080, .598], [.147, .507], [.269, .433]],
  [[.269, .433], [.397, .355], [.517, .229], [.652, .194]],
];
const mobile: readonly Curve[] = [
  [[.026, .841], [.022, .600], [.047, .363], [.189, .286]],
  [[.189, .286], [.331, .209], [.535, .193], [.707, .165]],
];

function coordinateAt([start, first, second, end]: Curve, t: number, axis: 0 | 1) {
  const remaining = 1 - t;
  return remaining ** 3 * start[axis]
    + 3 * remaining ** 2 * t * first[axis]
    + 3 * remaining * t ** 2 * second[axis]
    + t ** 3 * end[axis];
}

export function createMrnaPainter(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const narrow = width <= 700;
  const [first, second] = narrow ? mobile : desktop;
  const samples = 72;
  const points = Array.from({ length: samples + 1 }, (_, index) => {
    const progress = index / samples;
    const curve = progress < .5 ? first : second;
    const t = progress < .5 ? progress * 2 : (progress - .5) * 2;
    return { x: coordinateAt(curve, t, 0) * width, y: coordinateAt(curve, t, 1) * height };
  });
  const strand = points.map(({ x, y }, index) => {
    const before = points[Math.max(0, index - 1)];
    const after = points[Math.min(samples, index + 1)];
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const length = Math.hypot(dx, dy) || 1;
    // Let the ornament disappear at the ends and behind the brightest type.
    const endFade = Math.min(1, index / 9, (samples - index) / 12);
    const titleFade = x / width < .31 ? 1 : Math.max(.16, 1 - (x / width - .31) * 3);
    return { x, y, nx: -dy / length, ny: dx / length, strength: endFade * titleFade };
  });

  const sheen = ctx.createLinearGradient(points[0].x, 0, points[samples].x, 0);
  sheen.addColorStop(0, "#ededed00");
  sheen.addColorStop(.09, "#ededed56");
  sheen.addColorStop(.40, "#ededed50");
  sheen.addColorStop(.62, "#ededed2b");
  sheen.addColorStop(.84, "#ededed17");
  sheen.addColorStop(1, "#ededed00");

  return (phase: number) => {
    ctx.save();
    ctx.strokeStyle = sheen;
    ctx.fillStyle = "#f1f1f1";
    ctx.lineWidth = narrow ? 1 : 1.45;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();

    for (let index = 0; index <= samples; index++) {
      const point = strand[index];
      const wave = Math.sin(index * .53 - phase * 2) * point.strength * (narrow ? 1.5 : 3);
      const x = point.x + point.nx * wave;
      const y = point.y + point.ny * wave;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Small evenly staggered bases suggest a single strand without lettering.
    for (let index = 4; index < samples; index += 4) {
      const point = strand[index];
      const wave = Math.sin(index * .53 - phase * 2) * point.strength * (narrow ? 1.5 : 3);
      const x = point.x + point.nx * wave;
      const y = point.y + point.ny * wave;
      const glint = .7 + .3 * Math.cos(index * .15 - phase * 2);
      ctx.globalAlpha = (narrow ? .27 : .42) * point.strength * glint;
      ctx.beginPath();
      ctx.arc(x, y, narrow ? 1.35 : 1.95, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
  };
}

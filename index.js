// Remove intro text
setTimeout(() => {
  const el = document.querySelector('.welcome');
  el.classList.add('hidden');
}, 4000);

const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const width = window.innerWidth;
const height = window.innerHeight;

const cellsHorizontal = 30;
const cellsVertical = 12;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();

const { world } = engine;
world.gravity.y = 0;

const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height
  }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls

const walls = [
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];

World.add(world, walls);

// Maze generation

const shuffle = arr => {
  let counter = arr.length;
  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);

    counter--;

    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }

  return arr;
};

const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const verticals = new Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = new Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
  if (grid[row][column]) return;

  grid[row][column] = true;

  const neighbors = shuffle([
    [row - 1, column, 'up'],
    [row, column + 1, 'right'],
    [row + 1, column, 'down'],
    [row, column - 1, 'left']
  ]);

  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;

    // Check if neighbor is out of bounds
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizontal
    )
      continue;

    // Check if neighbor was visited
    if (grid[nextRow][nextColumn]) continue;

    // Remove a wall from either horizontals or verticals
    if (direction === 'left') verticals[row][column - 1] = true;
    else if (direction === 'right') verticals[row][column] = true;
    else if (direction === 'down') horizontals[row][column] = true;
    else if (direction === 'up') horizontals[row - 1][column] = true;

    // Visit next cell
    stepThroughCell(nextRow, nextColumn);
  }
};

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, indexRow) => {
  row.forEach((open, indexColumn) => {
    if (open) return;

    const wall = Bodies.rectangle(
      indexColumn * unitLengthX + unitLengthX / 2,
      indexRow * unitLengthY + unitLengthY,
      unitLengthX,
      10,
      { isStatic: true, label: 'wall', render: { fillStyle: 'red' } }
    );

    World.add(world, wall);
  });
});

verticals.forEach((row, indexRow) => {
  row.forEach((open, indexColumn) => {
    if (open) return;

    const wall = Bodies.rectangle(
      indexColumn * unitLengthX + unitLengthX,
      indexRow * unitLengthY + unitLengthY / 2,
      10,
      unitLengthY,
      { isStatic: true, label: 'wall', render: { fillStyle: 'red' } }
    );

    World.add(world, wall);
  });
});

// Goal

const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.6,
  unitLengthY * 0.6,
  { isStatic: true, label: 'goal', render: { fillStyle: 'green' } }
);

World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
  label: 'ball',
  render: { fillStyle: 'blue' }
});

World.add(world, ball);

const maxVelocity = 15;
const change = 3;

document.addEventListener('keydown', e => {
  e.preventDefault();
  const { x, y } = ball.velocity;
  const { key } = e;

  if (key === 'w' || key === 'ArrowUp') {
    Body.setVelocity(ball, {
      x,
      y: Math.abs(y - change) <= maxVelocity ? y - change : y
    });
  } else if (key === 'd' || key === 'ArrowRight') {
    Body.setVelocity(ball, {
      x: x + change <= maxVelocity ? x + change : x,
      y
    });
  } else if (key === 's' || key === 'ArrowDown') {
    Body.setVelocity(ball, {
      x,
      y: y + change <= maxVelocity ? y + change : y
    });
  } else if (key === 'a' || key === 'ArrowLeft') {
    Body.setVelocity(ball, {
      x: Math.abs(x - change) <= maxVelocity ? x - change : x,
      y
    });
  }
});

// Win Condition

Events.on(engine, 'collisionStart', e => {
  const labels = ['ball', 'goal'];
  e.pairs.forEach(collision => {
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      world.gravity.y = 1;
      for (const body of world.bodies) {
        if (body.label === 'wall' || body.label === 'goal')
          Body.setStatic(body, false);
      }

      document.querySelector('.winner').classList.remove('hidden');
    }
  });
});

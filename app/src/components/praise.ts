const PRAISE = ["Nice!", "Great job!", "You got it!", "Brilliant!", "Spot on!", "Awesome!"];
const ENCOURAGEMENT = ["Almost!", "Good try!", "Next time!", "Keep going!"];

export function praise(): string {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)] ?? "Nice!";
}

export function encouragement(): string {
  return ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)] ?? "Good try!";
}

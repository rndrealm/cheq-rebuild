import { rate, rating, ordinal } from "openskill";

export function updateRatings(
  winner: { mu: number; sigma: number },
  loser: { mu: number; sigma: number },
) {
  const [[newWinner], [newLoser]] = rate([
    [rating({ mu: winner.mu, sigma: winner.sigma })],
    [rating({ mu: loser.mu, sigma: loser.sigma })],
  ]);
  return {
    winner: {
      mu: newWinner.mu,
      sigma: newWinner.sigma,
      displayRating: ordinal(newWinner),
    },
    loser: {
      mu: newLoser.mu,
      sigma: newLoser.sigma,
      displayRating: ordinal(newLoser),
    },
  };
}

export function updateRatingsTie(
  playerA: { mu: number; sigma: number },
  playerB: { mu: number; sigma: number },
) {
  const [[newA], [newB]] = rate(
    [
      [rating({ mu: playerA.mu, sigma: playerA.sigma })],
      [rating({ mu: playerB.mu, sigma: playerB.sigma })],
    ],
    { rank: [1, 1] },
  );
  return {
    playerA: {
      mu: newA.mu,
      sigma: newA.sigma,
      displayRating: ordinal(newA),
    },
    playerB: {
      mu: newB.mu,
      sigma: newB.sigma,
      displayRating: ordinal(newB),
    },
  };
}

import { describe, it, expect } from "vitest";
import {
  normalizeScore,
  expectedScore,
  gainFactor,
  updateRating,
  INITIAL_RATING,
} from "./rating";

describe("normalizeScore", () => {
  it("maps score 0 to 0.5", () => {
    expect(normalizeScore(0)).toBeCloseTo(0.5, 5);
  });

  it("maps positive scores above 0.5", () => {
    expect(normalizeScore(10)).toBeGreaterThan(0.5);
    expect(normalizeScore(10)).toBeLessThan(1);
  });

  it("maps negative scores below 0.5", () => {
    expect(normalizeScore(-10)).toBeLessThan(0.5);
    expect(normalizeScore(-10)).toBeGreaterThan(0);
  });

  it("is monotonically increasing", () => {
    const scores = [-57, -20, -10, -5, 0, 2, 5, 8, 10];
    for (let i = 1; i < scores.length; i++) {
      expect(normalizeScore(scores[i])).toBeGreaterThan(normalizeScore(scores[i - 1]));
    }
  });

  it("maps extreme negative (smin ≈ -57.27) close to 0", () => {
    expect(normalizeScore(-57.27)).toBeLessThan(0.001);
  });

  it("maps smax=10 close to 0.924", () => {
    expect(normalizeScore(10)).toBeCloseTo(1 / (1 + Math.exp(-10 / 4)), 5);
  });
});

describe("expectedScore", () => {
  it("R=0 expects 0", () => {
    expect(expectedScore(0)).toBe(0);
  });

  it("R=1000 expects 0.5", () => {
    expect(expectedScore(1000)).toBeCloseTo(0.5, 5);
  });

  it("R=2000 expects ~0.667", () => {
    expect(expectedScore(2000)).toBeCloseTo(2 / 3, 3);
  });

  it("R=10000 expects ~0.909", () => {
    expect(expectedScore(10000)).toBeCloseTo(10 / 11, 3);
  });

  it("is monotonically increasing", () => {
    const ratings = [0, 500, 1000, 2000, 4000, 7000, 10000];
    for (let i = 1; i < ratings.length; i++) {
      expect(expectedScore(ratings[i])).toBeGreaterThan(expectedScore(ratings[i - 1]));
    }
  });
});

describe("gainFactor", () => {
  it("K(0) = 100", () => {
    expect(gainFactor(0)).toBe(100);
  });

  it("K(1000) ≈ 83.33", () => {
    expect(gainFactor(1000)).toBeCloseTo(100 / 1.2, 2);
  });

  it("K(5000) = 50", () => {
    expect(gainFactor(5000)).toBe(50);
  });

  it("K(10000) ≈ 33.33", () => {
    expect(gainFactor(10000)).toBeCloseTo(100 / 3, 2);
  });

  it("is monotonically decreasing", () => {
    const ratings = [0, 1000, 2000, 5000, 7000, 10000];
    for (let i = 1; i < ratings.length; i++) {
      expect(gainFactor(ratings[i])).toBeLessThan(gainFactor(ratings[i - 1]));
    }
  });
});

describe("updateRating", () => {
  it("INITIAL_RATING is 1000", () => {
    expect(INITIAL_RATING).toBe(1000);
  });

  it("score of 0 at R=1000 keeps rating roughly the same", () => {
    // n(0) = 0.5, E(1000) = 0.5 → delta ≈ 0
    const newRating = updateRating(1000, 0);
    expect(Math.abs(newRating - 1000)).toBeLessThan(0.1);
  });

  it("positive score increases rating", () => {
    const newRating = updateRating(1000, 5);
    expect(newRating).toBeGreaterThan(1000);
  });

  it("negative score decreases rating", () => {
    const newRating = updateRating(1000, -10);
    expect(newRating).toBeLessThan(1000);
  });

  it("higher score produces larger rating gain (monotonicity / honesty incentive)", () => {
    const ratings = [500, 1000, 2000, 4000, 7000];
    const scores = [-20, -5, 0, 3, 5, 8, 10];

    for (const r of ratings) {
      for (let i = 1; i < scores.length; i++) {
        const ratingFromLower = updateRating(r, scores[i - 1]);
        const ratingFromHigher = updateRating(r, scores[i]);
        expect(ratingFromHigher).toBeGreaterThan(ratingFromLower);
      }
    }
  });

  it("never goes below 0", () => {
    const newRating = updateRating(0, -57.27);
    expect(newRating).toBeGreaterThanOrEqual(0);
  });

  it("never goes above 10000", () => {
    const newRating = updateRating(10000, 10);
    expect(newRating).toBeLessThanOrEqual(10000);
  });

  it("convergence: sustained perfect score pushes rating up over time", () => {
    let rating = INITIAL_RATING;
    for (let i = 0; i < 100; i++) {
      rating = updateRating(rating, 10); // max score each time
    }
    expect(rating).toBeGreaterThan(2500);
  });

  it("convergence: sustained terrible score pushes rating down", () => {
    let rating = 5000;
    for (let i = 0; i < 100; i++) {
      rating = updateRating(rating, -57.27); // min score each time
    }
    expect(rating).toBeLessThan(1000);
  });

  it("R=2000 requires score ~2.8 to hold steady", () => {
    // E(2000) ≈ 0.667, n(score) = 0.667 → score ≈ 2.77
    const holdScore = 4 * Math.log(expectedScore(2000) / (1 - expectedScore(2000)));
    const newRating = updateRating(2000, holdScore);
    expect(Math.abs(newRating - 2000)).toBeLessThan(0.1);
  });

  it("low ratings change faster than high ratings for the same score difference", () => {
    // Same score, but at R=500 vs R=8000 — low rating should have bigger absolute delta
    const deltaLow = Math.abs(updateRating(500, 5) - 500);
    const deltaHigh = Math.abs(updateRating(8000, 5) - 8000);
    expect(deltaLow).toBeGreaterThan(deltaHigh);
  });
});

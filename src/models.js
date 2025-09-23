// Data models for climbing competition scores

// Constants
export const ONSIGHT_BONUS = 0.1;
export const TOP_CLIMBS = 5;

export class Climber {
  constructor(firstName, lastName, gender, category) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.gender = gender;
    this.category = category;
    this.climbs = [];
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  totalScore(onsightBonus = 0) {
    const climbScores = [];

    for (const climb of this.climbs) {
      if (climb.sent) {
        const climbScore = climb.points + (climb.onsight ? ONSIGHT_BONUS : 0); // ONSIGHT TIEBREAKER: add .1 per onsight
        climbScores.push({ score: climbScore, climb });
      }
    }

    climbScores.sort((a, b) => b.score - a.score);
    const topClimbs = climbScores.slice(0, TOP_CLIMBS);
    const totalScore = topClimbs.reduce((sum, item) => sum + item.score, 0);
    const bestClimbs = topClimbs.map(item => item.climb);

    return { totalScore, bestClimbs };
  }
}

export class Climb {
  constructor(name, points, sent, onsight) {
    this.name = name;
    this.points = points;
    this.sent = sent;
    this.onsight = onsight;
  }
}

export class Division {
  constructor(gender, category) {
    this.gender = gender.toUpperCase();
    this.category = `${category[0].toUpperCase()}${category.slice(1).toLowerCase()}`;
  }

  toString() {
    return `${this.gender} ${this.category}`;
  }
}

export class Result {
  constructor(climberName, score, numClimbs, gender, category, scoredClimbs) {
    this.climberName = climberName;
    this.score = score;
    this.numClimbs = numClimbs;
    this.gender = gender;
    this.category = category;
    this.scoredClimbs = scoredClimbs;
  }
}
import argparse
import requests
from tabulate import tabulate

from dataclasses import dataclass

ONSIGHT_BONUS = 0.1
TOP_CLIMBS = 5


@dataclass
class Climber:
    first_name: str
    last_name: str
    gender: str
    category: str
    climbs = None

    def total_score(self, onsight_bonus: float = 0) -> float:
        climb_scores = []
        for climb in self.climbs:
            if climb.sent:
                climb_score = climb.points + (.1 if climb.onsight else 0)  # ONSIGHT TIEBREAKER: add .01 per onsight
                # climb_score = climb.points + (onsight_bonus * climb.points if climb.onsight else 0)
                climb_scores.append((climb_score, climb))
        climb_scores.sort(key=lambda x: x[0], reverse=True)
        climb_scores = climb_scores[:TOP_CLIMBS]
        total_score = sum([score for score, _ in climb_scores])
        best_climbs = [climb for _, climb in climb_scores]
        return total_score, best_climbs

    @property
    def full_name(self) -> str:
        return f'{self.first_name} {self.last_name}'


@dataclass
class Climb:
    name: str
    points: int
    sent: bool
    onsight: bool


@dataclass
class Result:
    climber_name: str
    score: float
    num_climbs: int
    gender: str
    category: str
    scored_climbs: list


class Division:
    gender: str
    category: str

    def __init__(self, gender, category):
        self.gender = gender.upper()
        self.category = f'{category[0].upper()}{category[1:].lower()}'

    def __str__(self):
        return f"{self.gender} {self.category}"


def main(filter_gender=None, filter_category=None):
    # get scores
    scores_response = requests.get('https://climbingcompscore.com/api/results')
    scores_data = scores_response.json()

    climbers = {}
    for score in scores_data:
        climber = Climber(
            first_name=score['climberFirstName'],
            last_name=score['climberLastName'],
            gender=score['climber']['gender'],
            category=score['climber']['category'],
        )
        if climber.full_name in climbers:
            continue  # already added

        climbers[climber.full_name] = climber
        climber.climbs = []
        for climb in score['climber']['results']:
            climber.climbs.append(Climb(
                name=climb['problem']['name'],
                points=climb['problem']['value'],
                sent=climb['sent'],
                onsight=climb['onsight'],
            ))

    print(f'FILTER GENDER IS {filter_gender}')
    print(f'FILTER CATEGORY IS {filter_category}')

    all_divisions = set([(climber.gender, climber.category) for climber in climbers.values()])
    all_divisions = [Division(gender=d[0], category=d[1]) for d in all_divisions]
    print(f'ALL CATEGORIES: {[str(d) for d in all_divisions]}')

    # calculate & print results
    all_results = []
    for climber in climbers.values():
        score, scored_climbs = climber.total_score(ONSIGHT_BONUS)
        formatted_scores = [f'{s.points}*' if s.onsight else f'{s.points}' for s in scored_climbs]

        all_results.append(Result(
            climber_name=climber.full_name,
            score=round(score, 2),
            num_climbs=len(scored_climbs),
            gender=climber.gender,
            category=climber.category,
            scored_climbs=', '.join(formatted_scores),
        ))

    category_results = {}
    for d in all_divisions:
        category_results[f'{d}'] = []
        for result in all_results:
            if result.category == d.category and result.gender == d.gender:
                category_results[f'{d}'].append(result)

    results = category_results[f'{Division(filter_gender, filter_category)}']
    results.sort(key=lambda x: x.score, reverse=True)
    if not results:
        print('No results found for the given filters.')
        return
    print(tabulate((results), headers='keys', tablefmt='pretty'))


# parse command line arguments and run main()
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-g', '--gender')
    parser.add_argument('-c', '--category')
    args = parser.parse_args()

    main(filter_gender=args.gender, filter_category=args.category)

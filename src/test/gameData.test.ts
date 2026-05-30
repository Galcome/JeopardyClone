import { describe, expect, it } from 'vitest';
import { validateGameData } from '../shared/gameData';
import type { GameData } from '../shared/types';

const validGame: GameData = {
  title: 'After Hours Answers',
  hostPin: '4242',
  defaultTeams: ['Best Men', 'College', 'Family', 'Chaos'],
  rounds: [
    {
      id: 'round-one',
      title: 'Opening Round',
      valuePrefix: '$',
      categories: [
        {
          id: 'groom',
          title: 'The Groom',
          clues: [
            {
              id: 'groom-200',
              value: 200,
              prompt: 'What city did the groom grow up in?',
              answer: 'Toronto'
            }
          ]
        }
      ]
    }
  ],
  finalChallenge: {
    category: 'Last Call',
    prompt: 'What was the groom drinking the night he met the bride?',
    answer: 'Old Fashioned'
  }
};

describe('validateGameData', () => {
  it('accepts a complete local game file', () => {
    const game = validateGameData(validGame);

    expect(game.title).toBe('After Hours Answers');
    expect(game.rounds[0].categories[0].clues[0].id).toBe('groom-200');
  });

  it('rejects duplicate clue ids across the full game', () => {
    const duplicate: GameData = {
      ...validGame,
      rounds: [
        validGame.rounds[0],
        {
          id: 'round-two',
          title: 'Doubled Round',
          valuePrefix: '$',
          categories: [
            {
              id: 'mandela',
              title: 'Mandela Effect',
              clues: [
                {
                  id: 'groom-200',
                  value: 400,
                  prompt: 'Which line is actually said?',
                  answer: 'No, I am your father'
                }
              ]
            }
          ]
        }
      ]
    };

    expect(() => validateGameData(duplicate)).toThrow(/duplicate clue id/i);
  });

  it('rejects media without a usable src', () => {
    const missingMediaSrc = structuredClone(validGame);
    missingMediaSrc.rounds[0].categories[0].clues[0].media = {
      type: 'image',
      src: '',
      alt: 'A local picture'
    };

    expect(() => validateGameData(missingMediaSrc)).toThrow(/media src/i);
  });

  it('preserves configured values for each round', () => {
    const game = validateGameData({
      ...validGame,
      rounds: [
        validGame.rounds[0],
        {
          id: 'round-two',
          title: 'Doubled Round',
          valuePrefix: '$',
          categories: [
            {
              id: 'trips',
              title: 'Trips',
              clues: [
                {
                  id: 'trips-800',
                  value: 800,
                  prompt: 'Which city hosted the worst hangover?',
                  answer: 'Montreal'
                }
              ]
            }
          ]
        }
      ]
    });

    expect(game.rounds[1].categories[0].clues[0].value).toBe(800);
  });
});


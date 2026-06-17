import type { Clue, ClueMedia, GameData, Round } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value;
}

function requireNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${path} must be a non-negative number`);
  }
  return value;
}

function validateMedia(value: unknown, path: string): ClueMedia | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) throw new Error(`${path} must be an object`);

  const type = requireString(value.type, `${path}.type`);
  if (!['image', 'audio', 'video'].includes(type)) {
    throw new Error(`${path}.type must be image, audio, or video`);
  }

  const src = requireString(value.src, `${path}.media src`);
  return {
    type: type as ClueMedia['type'],
    src,
    alt: typeof value.alt === 'string' ? value.alt : undefined,
    caption: typeof value.caption === 'string' ? value.caption : undefined
  };
}

function validateClue(value: unknown, path: string): Clue {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  const special = value.special;
  if (special !== undefined && special !== 'wager') {
    throw new Error(`${path}.special must be wager when provided`);
  }

  return {
    id: requireString(value.id, `${path}.id`),
    value: requireNumber(value.value, `${path}.value`),
    prompt: requireString(value.prompt, `${path}.prompt`),
    answer: requireString(value.answer, `${path}.answer`),
    notes: typeof value.notes === 'string' ? value.notes : undefined,
    media: validateMedia(value.media, `${path}.media`),
    special: special === 'wager' ? 'wager' : undefined
  };
}

function validateRound(value: unknown, path: string): Round {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  if (!Array.isArray(value.categories) || value.categories.length === 0) {
    throw new Error(`${path}.categories must be a non-empty array`);
  }

  return {
    id: requireString(value.id, `${path}.id`),
    title: requireString(value.title, `${path}.title`),
    transitionTitle: typeof value.transitionTitle === 'string' ? value.transitionTitle : undefined,
    valuePrefix: typeof value.valuePrefix === 'string' ? value.valuePrefix : undefined,
    categories: value.categories.map((category, categoryIndex) => {
      if (!isRecord(category)) throw new Error(`${path}.categories[${categoryIndex}] must be an object`);
      if (!Array.isArray(category.clues) || category.clues.length === 0) {
        throw new Error(`${path}.categories[${categoryIndex}].clues must be a non-empty array`);
      }

      return {
        id: requireString(category.id, `${path}.categories[${categoryIndex}].id`),
        title: requireString(category.title, `${path}.categories[${categoryIndex}].title`),
        hidden: typeof category.hidden === 'boolean' ? category.hidden : undefined,
        clues: category.clues.map((clue, clueIndex) =>
          validateClue(clue, `${path}.categories[${categoryIndex}].clues[${clueIndex}]`)
        )
      };
    })
  };
}

export function validateGameData(value: unknown): GameData {
  if (!isRecord(value)) throw new Error('game data must be an object');
  if (!Array.isArray(value.defaultTeams) || value.defaultTeams.length < 2) {
    throw new Error('defaultTeams must contain at least two teams');
  }
  if (!Array.isArray(value.rounds) || value.rounds.length === 0) {
    throw new Error('rounds must be a non-empty array');
  }
  if (!isRecord(value.finalChallenge)) {
    throw new Error('finalChallenge must be an object');
  }

  const rounds = value.rounds.map((round, index) => validateRound(round, `rounds[${index}]`));
  const clueIds = new Set<string>();
  for (const round of rounds) {
    for (const category of round.categories) {
      for (const clue of category.clues) {
        if (clueIds.has(clue.id)) {
          throw new Error(`duplicate clue id: ${clue.id}`);
        }
        clueIds.add(clue.id);
      }
    }
  }

  const final = value.finalChallenge;
  return {
    title: requireString(value.title, 'title'),
    hostPin: requireString(value.hostPin, 'hostPin'),
    defaultTeams: value.defaultTeams.map((team, index) => requireString(team, `defaultTeams[${index}]`)),
    rounds,
    finalChallenge: {
      category: requireString(final.category, 'finalChallenge.category'),
      prompt: requireString(final.prompt, 'finalChallenge.prompt'),
      answer: requireString(final.answer, 'finalChallenge.answer'),
      notes: typeof final.notes === 'string' ? final.notes : undefined,
      media: validateMedia(final.media, 'finalChallenge.media')
    }
  };
}

export function findClue(game: GameData, roundId: string, categoryId: string, clueId: string): Clue | null {
  const round = game.rounds.find((candidate) => candidate.id === roundId);
  const category = round?.categories.find((candidate) => candidate.id === categoryId);
  return category?.clues.find((candidate) => candidate.id === clueId) ?? null;
}


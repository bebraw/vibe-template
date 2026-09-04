import { DurableObject } from "cloudflare:workers";

export interface RoomChoice {
  id: string;
  label: string;
}

export interface RoomChoiceCount extends RoomChoice {
  votes: number;
}

export interface RoomSnapshot {
  choices: RoomChoiceCount[];
  totalVotes: number;
}

export type RoomVoteResult = { ok: true; snapshot: RoomSnapshot } | { ok: false; code: "invalid-voter-key" | "unknown-choice" };

interface ChoiceRow extends Record<string, SqlStorageValue> {
  id: string;
  label: string;
  position: number;
  vote_count: number;
}

const maximumChoices = 20;
const maximumIdentifierLength = 128;
const maximumLabelLength = 200;

export class RoomState extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS choices (
          id TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          position INTEGER NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS votes (
          voter_key TEXT PRIMARY KEY,
          choice_id TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS votes_choice_id ON votes(choice_id);
      `);
    });
  }

  async getSnapshot(): Promise<RoomSnapshot> {
    return this.readSnapshot();
  }

  async castVote(voterKey: string, choiceId: string): Promise<RoomVoteResult> {
    if (!isIdentifier(voterKey)) return { ok: false, code: "invalid-voter-key" };

    const choice = this.ctx.storage.sql.exec<{ id: string }>("SELECT id FROM choices WHERE id = ?", choiceId).toArray()[0];
    if (!choice) return { ok: false, code: "unknown-choice" };

    this.ctx.storage.sql.exec(
      `INSERT INTO votes (voter_key, choice_id)
       VALUES (?, ?)
       ON CONFLICT(voter_key) DO UPDATE SET choice_id = excluded.choice_id`,
      voterKey,
      choiceId,
    );

    return { ok: true, snapshot: this.readSnapshot() };
  }

  async resetVotes(): Promise<RoomSnapshot> {
    this.ctx.storage.sql.exec("DELETE FROM votes");
    return this.readSnapshot();
  }

  async seedChoices(choices: RoomChoice[]): Promise<RoomSnapshot> {
    validateChoices(choices);

    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec("DELETE FROM votes");
      this.ctx.storage.sql.exec("DELETE FROM choices");

      for (const [position, choice] of choices.entries()) {
        this.ctx.storage.sql.exec("INSERT INTO choices (id, label, position) VALUES (?, ?, ?)", choice.id, choice.label, position);
      }
    });

    return this.readSnapshot();
  }

  private readSnapshot(): RoomSnapshot {
    const rows = this.ctx.storage.sql
      .exec<ChoiceRow>(
        `SELECT choices.id, choices.label, choices.position, COUNT(votes.voter_key) AS vote_count
         FROM choices
         LEFT JOIN votes ON votes.choice_id = choices.id
         GROUP BY choices.id, choices.label, choices.position
         ORDER BY choices.position`,
      )
      .toArray();
    const choices = rows.map(({ id, label, vote_count: votes }) => ({ id, label, votes }));

    return {
      choices,
      totalVotes: choices.reduce((total, choice) => total + choice.votes, 0),
    };
  }
}

function validateChoices(choices: RoomChoice[]): void {
  if (choices.length === 0 || choices.length > maximumChoices) {
    throw new TypeError(`A room must have between 1 and ${maximumChoices} choices.`);
  }

  const ids = new Set<string>();

  for (const choice of choices) {
    if (!isIdentifier(choice.id)) throw new TypeError("Choice ids must be non-empty and at most 128 characters.");
    if (choice.label.trim().length === 0 || choice.label.length > maximumLabelLength) {
      throw new TypeError("Choice labels must be non-empty and at most 200 characters.");
    }
    if (ids.has(choice.id)) throw new TypeError(`Choice id ${JSON.stringify(choice.id)} is duplicated.`);
    ids.add(choice.id);
  }
}

function isIdentifier(value: string): boolean {
  return value.trim().length > 0 && value.length <= maximumIdentifierLength;
}

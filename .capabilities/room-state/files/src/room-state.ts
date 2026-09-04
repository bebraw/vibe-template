import { DurableObject } from "cloudflare:workers";

export interface RoomChoice {
  id: string;
  label: string;
}

export interface RoomChoiceCount extends RoomChoice {
  votes: number;
}

export type RoomStatus = "locked" | "open";

export interface RoomSnapshot {
  choices: RoomChoiceCount[];
  currentSelection: string | null;
  revision: number;
  status: RoomStatus;
  totalVotes: number;
}

export type RoomVoteResult =
  { ok: true; snapshot: RoomSnapshot } | { ok: false; code: "invalid-voter-key" | "room-locked" | "unknown-choice" };

interface ChoiceRow extends Record<string, SqlStorageValue> {
  id: string;
  label: string;
  position: number;
  vote_count: number;
}

interface MetadataRow extends Record<string, SqlStorageValue> {
  revision: number;
  status: RoomStatus;
}

interface VoteCountRow extends Record<string, SqlStorageValue> {
  vote_count: number;
}

interface VoteRow extends Record<string, SqlStorageValue> {
  choice_id: string;
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
        CREATE TABLE IF NOT EXISTS room_metadata (
          singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
          status TEXT NOT NULL CHECK (status IN ('open', 'locked')),
          revision INTEGER NOT NULL
        );
        INSERT INTO room_metadata (singleton, status, revision)
        VALUES (1, 'open', 0)
        ON CONFLICT(singleton) DO NOTHING;
      `);
    });
  }

  async getSnapshot(voterKey?: string): Promise<RoomSnapshot> {
    return this.readSnapshot(voterKey);
  }

  async castVote(voterKey: string, choiceId: string): Promise<RoomVoteResult> {
    if (!isIdentifier(voterKey)) return { ok: false, code: "invalid-voter-key" };
    if (this.readMetadata().status === "locked") return { ok: false, code: "room-locked" };

    const choice = this.ctx.storage.sql.exec<{ id: string }>("SELECT id FROM choices WHERE id = ?", choiceId).toArray()[0];
    if (!choice) return { ok: false, code: "unknown-choice" };

    if (this.readSelection(voterKey) !== choiceId) {
      this.ctx.storage.transactionSync(() => {
        this.ctx.storage.sql.exec(
          `INSERT INTO votes (voter_key, choice_id)
           VALUES (?, ?)
           ON CONFLICT(voter_key) DO UPDATE SET choice_id = excluded.choice_id`,
          voterKey,
          choiceId,
        );
        this.incrementRevision();
      });
    }

    return { ok: true, snapshot: this.readSnapshot(voterKey) };
  }

  async resetVotes(): Promise<RoomSnapshot> {
    const voteCount = this.ctx.storage.sql.exec<VoteCountRow>("SELECT COUNT(*) AS vote_count FROM votes").one().vote_count;
    if (voteCount > 0) {
      this.ctx.storage.transactionSync(() => {
        this.ctx.storage.sql.exec("DELETE FROM votes");
        this.incrementRevision();
      });
    }
    const snapshot = this.readSnapshot();
    console.log(
      JSON.stringify({
        event: "room.reset",
        outcome: voteCount > 0 ? "changed" : "unchanged",
        removedVotes: voteCount,
        revision: snapshot.revision,
      }),
    );
    return snapshot;
  }

  async seedChoices(choices: RoomChoice[], status: RoomStatus = "open"): Promise<RoomSnapshot> {
    validateChoices(choices);
    validateStatus(status);

    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec("DELETE FROM votes");
      this.ctx.storage.sql.exec("DELETE FROM choices");

      for (const [position, choice] of choices.entries()) {
        this.ctx.storage.sql.exec("INSERT INTO choices (id, label, position) VALUES (?, ?, ?)", choice.id, choice.label, position);
      }
      this.ctx.storage.sql.exec("UPDATE room_metadata SET status = ?, revision = revision + 1 WHERE singleton = 1", status);
    });

    return this.readSnapshot();
  }

  async setStatus(status: RoomStatus): Promise<RoomSnapshot> {
    validateStatus(status);
    if (this.readMetadata().status !== status) {
      this.ctx.storage.sql.exec("UPDATE room_metadata SET status = ?, revision = revision + 1 WHERE singleton = 1", status);
    }
    return this.readSnapshot();
  }

  private incrementRevision(): void {
    this.ctx.storage.sql.exec("UPDATE room_metadata SET revision = revision + 1 WHERE singleton = 1");
  }

  private readMetadata(): MetadataRow {
    return this.ctx.storage.sql.exec<MetadataRow>("SELECT status, revision FROM room_metadata WHERE singleton = 1").one();
  }

  private readSelection(voterKey?: string): string | null {
    if (!voterKey || !isIdentifier(voterKey)) return null;
    return this.ctx.storage.sql.exec<VoteRow>("SELECT choice_id FROM votes WHERE voter_key = ?", voterKey).toArray()[0]?.choice_id ?? null;
  }

  private readSnapshot(voterKey?: string): RoomSnapshot {
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
    const metadata = this.readMetadata();

    return {
      choices,
      currentSelection: this.readSelection(voterKey),
      revision: metadata.revision,
      status: metadata.status,
      totalVotes: choices.reduce((total, choice) => total + choice.votes, 0),
    };
  }
}

function validateStatus(status: RoomStatus): void {
  if (status !== "open" && status !== "locked") throw new TypeError('Room status must be "open" or "locked".');
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

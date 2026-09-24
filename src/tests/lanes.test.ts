import { describe, expect, it } from "vitest";
import { FACILITY } from "@/lib/config/site";
import { laneFor, laneNoteFor, parseLane } from "@/lib/lanes";
import { requestedLane } from "@/lib/email";

const laneSession = { resource: "lane" as const };
const simulator = { resource: "simulator" as const };
const instructor = { resource: "instructor" as const };

describe("parseLane", () => {
  it("pads a bare lane number to two digits", () => {
    expect(parseLane("7")).toBe("07");
    expect(parseLane("07")).toBe("07");
    expect(parseLane("12")).toBe("12");
  });

  it("drops anything that is not a real lane", () => {
    expect(parseLane(null)).toBeNull();
    expect(parseLane("")).toBeNull();
    expect(parseLane("0")).toBeNull();
    expect(parseLane(String(FACILITY.laneCount + 1))).toBeNull();
    expect(parseLane("abc")).toBeNull();
    expect(parseLane("007")).toBeNull();
  });
});

describe("laneFor / laneNoteFor", () => {
  it("keeps the lane when the experience runs on a lane", () => {
    expect(laneFor("07", laneSession)).toBe("07");
    expect(laneNoteFor("07", laneSession)).toBe("Lane 07 requested.");
  });

  it("drops the lane once the visitor switches to a simulator or instructor session", () => {
    expect(laneFor("07", simulator)).toBeNull();
    expect(laneFor("07", instructor)).toBeNull();
    expect(laneNoteFor("07", simulator)).toBe("");
    expect(laneNoteFor("07", instructor)).toBe("");
  });

  it("is empty with no lane or no experience chosen yet", () => {
    expect(laneFor(null, laneSession)).toBeNull();
    expect(laneFor("07", null)).toBeNull();
    expect(laneNoteFor(null, laneSession)).toBe("");
    expect(laneNoteFor("07", null)).toBe("");
  });

  it("writes the exact sentence the emails read back", () => {
    expect(requestedLane(laneNoteFor("07", laneSession), laneSession)).toBe("07");
  });
});

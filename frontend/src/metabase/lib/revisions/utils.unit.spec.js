import {
  getRevisionDescription,
  getChangedFields,
  isValidRevision,
} from "./utils";

function getRevision({
  isCreation = false,
  isReversion = false,
  before,
  after,
} = {}) {
  return {
    diff: {
      before,
      after,
    },
    is_creation: isCreation,
    is_reversion: isReversion,
  };
}

function getSimpleRevision({ field, before, after, ...rest }) {
  return getRevision({
    ...rest,
    before: {
      [field]: before,
    },
    after: {
      [field]: after,
    },
  });
}

describe("getRevisionDescription | common", () => {
  it("handles initial revision (entity created)", () => {
    const revision = getRevision({ isCreation: true });
    expect(getRevisionDescription(revision)).toBe("created this");
  });

  it("handles reversions", () => {
    const revision = getRevision({ isReversion: true });
    expect(getRevisionDescription(revision)).toBe(
      "reverted to an earlier revision",
    );
  });

  it("handles renames", () => {
    const revision = getSimpleRevision({
      field: "name",
      before: "Orders",
      after: "Orders by Month",
    });
    expect(getRevisionDescription(revision)).toBe(
      'renamed this to "Orders by Month"',
    );
  });

  it("handles description added", () => {
    const revision = getSimpleRevision({
      field: "description",
      before: null,
      after: "Hello there",
    });
    expect(getRevisionDescription(revision)).toBe("added a description");
  });

  it("handles description change", () => {
    const revision = getSimpleRevision({
      field: "description",
      before: "Hello",
      after: "Hello there",
    });
    expect(getRevisionDescription(revision)).toBe("changed the description");
  });

  it("handles archive revision", () => {
    const revision = getSimpleRevision({
      field: "archived",
      before: false,
      after: true,
    });
    expect(getRevisionDescription(revision)).toBe("archived this");
  });

  it("handles unarchive revision", () => {
    const revision = getSimpleRevision({
      field: "archived",
      before: true,
      after: false,
    });
    expect(getRevisionDescription(revision)).toBe("unarchived this");
  });

  it("returns an array of two changes", () => {
    const revision = getRevision({
      before: {
        name: "Orders",
        archived: true,
      },
      after: {
        name: "Orders by Month",
        archived: false,
      },
    });
    expect(getRevisionDescription(revision)).toEqual([
      'renamed this to "Orders by Month"',
      "unarchived this",
    ]);
  });

  it("returns an array of multiple changes", () => {
    const revision = getRevision({
      before: {
        name: "Orders",
        description: null,
        archived: true,
      },
      after: {
        name: "Orders by Month",
        description: "Test",
        archived: false,
      },
    });
    expect(getRevisionDescription(revision)).toEqual([
      'renamed this to "Orders by Month"',
      "added a description",
      "unarchived this",
    ]);
  });

  it("returns an empty array if can't find a friendly message", () => {
    const revision = getSimpleRevision({
      field: "some_field",
      before: 1,
      after: 2,
    });
    expect(getRevisionDescription(revision)).toEqual([]);
  });

  it("filters out unknown change types", () => {
    const revision = getRevision({
      before: {
        description: null,
        archived: null,
      },
      after: {
        description: "Test",
        archived: false,
      },
    });
    expect(getRevisionDescription(revision)).toBe("added a description");
  });

  it("filters out messages for unknown fields from a complex diff", () => {
    const revision = getRevision({
      before: {
        some_field: 1,
        name: "orders",
      },
      after: {
        some_field: 2,
        name: "Orders",
      },
    });
    expect(getRevisionDescription(revision)).toBe('renamed this to "Orders"');
  });

  it("prefers 'after' state to find changed fields", () => {
    const revision = getRevision({
      before: {
        display: "table",
      },
      after: {
        display: "bar",
        visualization_settings: { "some-flag": true },
        dataset_query: {},
      },
    });
    expect(getRevisionDescription(revision)).toEqual([
      "changed the visualization settings",
      "edited the question",
    ]);
  });
});

describe("getRevisionDescription | questions", () => {
  it("handles query change revision", () => {
    const revision = getSimpleRevision({
      field: "dataset_query",
      before: { "source-table": 1 },
      after: { "source-table": 2 },
    });

    expect(getRevisionDescription(revision)).toBe("edited the question");
  });

  it("handles query change revision when before state is null", () => {
    const revision = getSimpleRevision({
      field: "dataset_query",
      before: null,
      after: { "source-table": 2 },
    });

    expect(getRevisionDescription(revision)).toBe("edited the question");
  });

  it("handles added visualization settings revision", () => {
    const revision = getSimpleRevision({
      field: "visualization_settings",
      before: null,
      after: { "table.pivot": true },
    });

    expect(getRevisionDescription(revision)).toBe(
      "changed the visualization settings",
    );
  });

  it("handles visualization settings changes revision", () => {
    const revision = getSimpleRevision({
      field: "visualization_settings",
      before: {},
      after: { "table.pivot": true },
    });

    expect(getRevisionDescription(revision)).toBe(
      "changed the visualization settings",
    );
  });

  it("handles removed visualization settings revision", () => {
    const revision = getSimpleRevision({
      field: "visualization_settings",
      before: { "table.pivot": true },
      after: null,
    });

    expect(getRevisionDescription(revision)).toBe(
      "changed the visualization settings",
    );
  });
});

describe("getRevisionDescription | dashboards", () => {
  it("handles added card revision", () => {
    const revision = getSimpleRevision({
      field: "cards",
      before: [1, 2],
      after: [1, 2, 3],
    });
    expect(getRevisionDescription(revision)).toBe("added a card");
  });

  it("handles added multiple cards revision", () => {
    const revision = getSimpleRevision({
      field: "cards",
      before: [1, 2],
      after: [1, 2, 3, 4, 5],
    });
    expect(getRevisionDescription(revision)).toBe("added 3 cards");
  });

  it("filters null card values for new card revision", () => {
    const revision = getRevision({
      before: null,
      after: {
        cards: [null, null, 1],
      },
    });
    expect(getRevisionDescription(revision)).toBe("added a card");
  });

  it("handles first card added revision", () => {
    const revision = getRevision({
      before: null,
      after: {
        cards: [1],
      },
    });
    expect(getRevisionDescription(revision)).toBe("added a card");
  });

  it("handles removed cards revision", () => {
    const revision = getSimpleRevision({
      field: "cards",
      before: [1, 2],
      after: [1],
    });
    expect(getRevisionDescription(revision)).toBe("removed a card");
  });

  it("filters null card values for removed card revision", () => {
    const revision = getSimpleRevision({
      field: "cards",
      before: [null, 1, 2],
      after: [null, 1],
    });
    expect(getRevisionDescription(revision)).toBe("removed a card");
  });

  it("handles removed cards revision", () => {
    const revision = getSimpleRevision({
      field: "cards",
      before: [1, 2, 3],
      after: [1],
    });
    expect(getRevisionDescription(revision)).toBe("removed 2 cards");
  });

  it("handles all cards removed revision", () => {
    const revision = getRevision({
      before: {
        cards: [1, 2, 3],
      },
      after: null,
    });
    expect(getRevisionDescription(revision)).toBe("removed 3 cards");
  });

  it("handles rearranged cards revision", () => {
    const revision = getSimpleRevision({
      field: "cards",
      before: [1, 2, 3],
      after: [2, 1, 3],
    });
    expect(getRevisionDescription(revision)).toBe("rearranged the cards");
  });

  it("handles added series revision", () => {
    const revision = getSimpleRevision({
      field: "cards",
      before: [{ series: null }],
      after: [{ series: [4] }],
    });
    expect(getRevisionDescription(revision)).toBe("added series to a question");
  });

  it("handles removed series revision", () => {
    const revision = getSimpleRevision({
      field: "cards",
      before: [{ series: [4] }],
      after: [{ series: null }],
    });
    expect(getRevisionDescription(revision)).toBe(
      "removed series from a question",
    );
  });

  it("handles modified series revision", () => {
    const revision = getSimpleRevision({
      field: "cards",
      before: [{ series: [4, 5] }],
      after: [{ series: [5, 4] }],
    });
    expect(getRevisionDescription(revision)).toBe("modified question's series");
  });
});

describe("isValidRevision", () => {
  it("returns false if there is no diff and it's not creation or reversion action", () => {
    const revision = getRevision({
      isCreation: false,
      isReversion: false,
      before: null,
      after: null,
    });
    expect(isValidRevision(revision)).toBe(false);
  });

  it("returns false if diff contains only unknown fields", () => {
    const revision = getRevision({
      before: {
        not_registered_field: 1,
      },
      after: {
        not_registered_field: 2,
      },
    });
    expect(isValidRevision(revision)).toBe(false);
  });

  it("returns true for creation revision", () => {
    const revision = getRevision({
      isCreation: true,
      isReversion: false,
      before: null,
      after: null,
    });
    expect(isValidRevision(revision)).toBe(true);
  });

  it("returns true for reversion revision", () => {
    const revision = getRevision({
      isCreation: false,
      isReversion: true,
      before: null,
      after: null,
    });
    expect(isValidRevision(revision)).toBe(true);
  });

  it("returns true for change revision", () => {
    const revision = getSimpleRevision({
      field: "name",
      before: "orders",
      after: "Orders",
    });
    expect(isValidRevision(revision)).toBe(true);
  });

  it("returns true if 'before' state is null, but 'after' state is present", () => {
    const revision = getRevision({
      before: null,
      after: {
        cards: [1],
      },
    });
    expect(isValidRevision(revision)).toBe(true);
  });

  it("returns true if 'after' state is null, but 'before' state is present", () => {
    const revision = getRevision({
      before: {
        cards: [1],
      },
      after: null,
    });
    expect(isValidRevision(revision)).toBe(true);
  });
});

describe("getChangedFields", () => {
  it("returns a list of changed fields", () => {
    const revision = getRevision({
      before: {
        name: "Orders",
        description: null,
      },
      after: {
        name: "Orders by Month",
        description: "Hello",
      },
    });
    expect(getChangedFields(revision)).toEqual(["name", "description"]);
  });

  it("returns a list of changed fields if 'before' state is null", () => {
    const revision = getRevision({
      before: null,
      after: {
        cards: [1],
      },
    });
    expect(getChangedFields(revision)).toEqual(["cards"]);
  });

  it("returns a list of changed fields if 'after' state is null", () => {
    const revision = getRevision({
      before: {
        cards: [1],
      },
      after: null,
    });
    expect(getChangedFields(revision)).toEqual(["cards"]);
  });

  it("returns a list with a single changed field", () => {
    const revision = getRevision({
      before: {
        description: null,
      },
      after: {
        description: "Hello",
      },
    });
    expect(getChangedFields(revision)).toEqual(["description"]);
  });

  it("filters out unknown fields", () => {
    const revision = getRevision({
      before: {
        dont_know_this_field: null,
      },
      after: {
        dont_know_this_field: "Hello",
      },
    });
    expect(getChangedFields(revision)).toEqual([]);
  });

  it("returns empty array if diff is missing", () => {
    const revision = {
      diff: null,
    };
    expect(getChangedFields(revision)).toEqual([]);
  });

  it("returns empty array if 'before' and 'after' states missing", () => {
    const revision = getRevision({
      before: null,
      after: null,
    });
    expect(getChangedFields(revision)).toEqual([]);
  });
});

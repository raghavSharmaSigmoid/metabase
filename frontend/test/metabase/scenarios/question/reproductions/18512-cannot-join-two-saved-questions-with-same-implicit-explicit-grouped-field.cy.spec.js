import { restore, popover } from "__support__/e2e/cypress";
import { SAMPLE_DATASET } from "__support__/e2e/cypress_sample_dataset";

const { PRODUCTS, PRODUCTS_ID, REVIEWS, REVIEWS_ID } = SAMPLE_DATASET;

const question1 = getQuestionDetails("18512#1", "Doohickey");
const question2 = getQuestionDetails("18512#2", "Gizmo");

describe.skip("issue 18512", () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/dataset").as("dataset");

    restore();
    cy.signInAsAdmin();
  });

  it("should join two saved questions with the same implicit/explicit grouped field (metabase#18512)", () => {
    cy.createQuestion(question1);
    cy.createQuestion(question2);

    cy.visit("/question/new");
    cy.findByText("Custom question").click();
    cy.findByText("Saved Questions").click();

    cy.findByText("18512#1").click();
    cy.icon("join_left_outer").click();

    popover().within(() => {
      cy.findByText("Sample Dataset").click();
      cy.findByText("Saved Questions").click();
      cy.findByText("18512#2").click();
    });

    popover()
      .findByText("Products → Created At")
      .click();
    popover()
      .findByText("Products → Created At")
      .click();

    cy.button("Visualize").click();

    cy.wait("@dataset").then(({ response }) => {
      expect(response.body.error).to.not.exist;
    });

    cy.contains("Products → Created At");
  });
});

function getQuestionDetails(name, catFilter) {
  return {
    name,
    query: {
      "source-table": REVIEWS_ID,
      joins: [
        {
          fields: "all",
          "source-table": PRODUCTS_ID,
          condition: [
            "=",
            ["field", REVIEWS.PRODUCT_ID, null],
            ["field", PRODUCTS.ID, { "join-alias": "Products" }],
          ],
          alias: "Products",
        },
      ],
      filter: [
        "=",
        ["field", PRODUCTS.CATEGORY, { "join-alias": "Products" }],
        catFilter,
      ],
      aggregation: [
        ["distinct", ["field", PRODUCTS.ID, { "join-alias": "Products" }]],
      ],
      breakout: [
        [
          "field",
          PRODUCTS.CREATED_AT,
          { "join-alias": "Products", "temporal-unit": "month" },
        ],
      ],
    },
  };
}

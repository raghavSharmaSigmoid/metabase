import { restore, popover } from "__support__/e2e/cypress";
import { SAMPLE_DATASET } from "__support__/e2e/cypress_sample_dataset";

const { ORDERS, ORDERS_ID, PRODUCTS } = SAMPLE_DATASET;

const questionDetails = {
  name: "17767",
  query: {
    "source-table": ORDERS_ID,
    aggregation: [["count"]],
    breakout: [["field", PRODUCTS.ID, { "source-field": ORDERS.PRODUCT_ID }]],
  },
};

describe.skip("issue 17767", () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/dataset").as("dataset");

    restore();
    cy.signInAsAdmin();
  });

  it("should be able to do subsequent joins on question with the aggregation that uses implicit joins (metabase#17767)", () => {
    cy.createQuestion(questionDetails, { visitQuestion: true });

    cy.icon("notebook").click();

    cy.findByText("Join data").click();

    // Join "Previous results" with
    popover()
      .contains("Reviews")
      .click();

    // On
    popover()
      .contains("ID")
      .click();
    // =
    popover()
      .contains(/Products? ID/)
      .click();

    cy.button("Visualize").click();
    cy.wait("@dataset").then(({ response }) => {
      expect(response.body.error).not.to.exist;
    });

    cy.findByText("xavier");
  });
});

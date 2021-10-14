import { getValues } from "redux-form";

export const DATABASE_FORM_NAME = "database";

export const activeStepSelector = state => state.setup.activeStep;
export const userDetailsSelector = state => state.setup.userDetails;
export const databaseDetailsSelector = state => state.setup.databaseDetails;
export const allowTrackingSelector = state => state.setup.allowTracking;
export const setupErrorSelector = state => state.setup.setupError;
export const setupCompleteSelector = state => state.setup.setupComplete;

export const selectedDatabaseEngineSelector = state => {
  const formValues = getValues(state.form[DATABASE_FORM_NAME]);
  return formValues ? formValues.engine : undefined;
};

export function skipUserStepSelector(state) {
  return true;
}

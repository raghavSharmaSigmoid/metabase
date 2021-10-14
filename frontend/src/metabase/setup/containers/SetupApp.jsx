/* eslint "react/prop-types": "warn" */
import React, { Component } from "react";
import { connect } from "react-redux";
import fitViewport from "metabase/hoc/FitViewPort";

import Setup from "../components/Setup";

import {
  activeStepSelector,
  allowTrackingSelector,
  DATABASE_FORM_NAME,
  databaseDetailsSelector,
  selectedDatabaseEngineSelector,
  setupCompleteSelector,
  setupErrorSelector,
  skipUserStepSelector,
  userDetailsSelector,
} from "../selectors";
import {
  setUserDetails,
  validatePassword,
  setActiveStep,
  validateDatabase,
  setDatabaseDetails,
  setLanguageDetails,
  setAllowTracking,
  submitSetup,
} from "../actions";

const mapStateToProps = state => ({
  activeStep: activeStepSelector(state),
  userDetails: userDetailsSelector(state),
  databaseDetails: databaseDetailsSelector(state),
  allowTracking: allowTrackingSelector(state),
  setupError: setupErrorSelector(state),
  setupComplete: setupCompleteSelector(state),
  selectedDatabaseEngine: selectedDatabaseEngineSelector(state),
  skipUserStep: skipUserStepSelector(state),
});

const mapDispatchToProps = {
  setLanguageDetails,
  setUserDetails,
  setDatabaseDetails,
  validatePassword,
  setActiveStep,
  validateDatabase,
  setAllowTracking,
  submitSetup,
};

@connect(
  mapStateToProps,
  mapDispatchToProps,
)
@fitViewport
export default class SetupApp extends Component {
  render() {
    return <Setup {...this.props} databaseFormName={DATABASE_FORM_NAME} />;
  }
}

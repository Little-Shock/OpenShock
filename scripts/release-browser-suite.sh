#!/usr/bin/env bash

readonly RELEASE_BROWSER_SUITE_IDS=(
  "setup-e2e"
  "release-gate-onboarding-studio"
  "fresh-workspace-critical-loop"
  "rooms-continue-entry"
  "release-gate-config-persistence-recovery"
)

readonly RELEASE_BROWSER_SUITE_LABELS=(
  "setup spine e2e"
  "onboarding first-start journey"
  "fresh-workspace critical loop"
  "rooms continue entry"
  "config persistence recovery"
)

readonly RELEASE_BROWSER_SUITE_COMMANDS=(
  "test:headed-setup"
  "test:headed-onboarding-studio"
  "test:headed-critical-loop"
  "test:headed-rooms-continue-entry"
  "test:headed-config-persistence-recovery"
)

readonly RELEASE_BROWSER_SUITE_REPORT_TITLES=(
  "Setup Spine E2E"
  "Release Gate Onboarding Studio"
  "Fresh Workspace Critical Loop"
  "Rooms Continue Entry"
  "Release Gate Config Persistence Recovery"
)

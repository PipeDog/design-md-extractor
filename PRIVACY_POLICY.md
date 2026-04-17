# Privacy Policy

Last updated: 2026-04-17

## Overview

DESIGN.md Extractor is a Chrome extension that analyzes the current webpage UI and exports a generated `DESIGN.md` file.

The extension is designed to work in two modes:

- Local mode: analysis runs inside the extension.
- AI mode: the extension sends a structured page summary to a model endpoint configured by the user.

## What data the extension accesses

The extension may access the following information from the currently active webpage:

- Page URL
- Page title
- Page language metadata
- Headings and visible text excerpts
- Visual style signals such as colors, fonts, border radii, spacing cues, and shadows
- Basic UI structure such as navigation, buttons, links, forms, cards, images, and landmarks

The extension does not require account registration and does not maintain a remote service of its own.

## How data is used

The extension uses page data only to:

- analyze the current webpage UI
- generate a `DESIGN.md` document
- save the generated file to the user’s device
- remember the user’s local extension settings

## AI mode and third-party model endpoints

When AI mode is enabled, the extension sends a structured summary of the current page to the model endpoint configured by the user.

This may include:

- selected text excerpts
- layout and component summaries
- detected visual tokens and heuristics
- page metadata needed to generate the final `DESIGN.md`

The extension does not automatically send data to any vendor-owned endpoint by default. The destination endpoint is chosen and configured by the user.

Users are responsible for reviewing the privacy and data handling terms of the model provider they configure.

## Data storage

The extension stores the following data locally in Chrome extension storage:

- extension settings
- model configuration entered by the user
- the most recent generation result metadata

Generated Markdown files are downloaded to the user’s device through Chrome’s download capability.

## Data sharing

The extension does not sell user data.

The extension does not use page data for advertising.

The extension does not transfer user data to third parties except when the user explicitly enables AI mode and configures a third-party model endpoint for content generation.

## Permissions rationale

The extension requests the following permissions only to support its core feature:

- `activeTab`: analyze the current active webpage
- `tabs`: read the current tab URL and context
- `scripting`: inject the content script when needed
- `storage`: save extension settings locally
- `downloads`: download the generated `DESIGN.md`
- `http://*/*` and `https://*/*`: allow analysis on normal web pages selected by the user

## Security and minimization

The extension is designed to minimize data collection:

- it only analyzes the page the user explicitly runs it on
- it supports local mode without remote model calls
- it does not collect browsing history in bulk
- it does not run on browser internal pages such as `chrome://`

## Contact

If you publish this extension publicly, replace this section with your support contact information, such as:

- Publisher name
- Support email
- Project repository URL

# Chrome Web Store 审核说明

本文档用于在提交 Chrome Web Store 审核时，向审核人员说明扩展的用途、测试方法和权限原因。

## Extension purpose

`DESIGN.md Extractor` analyzes the current webpage UI and exports a generated `DESIGN.md` file.

Its single purpose is to help users inspect the current page and turn it into a reusable design-system-style Markdown document.

## How to test

1. Open any normal `http` or `https` webpage.
2. Click the extension icon to open the popup.
3. In the popup:
   - `Local Mode` is available by default.
   - If AI settings are complete, the reviewer can switch between `Local Mode` and `AI Mode`.
4. Click `Analyze and generate DESIGN.md`.
5. The extension will analyze the current page and download a Markdown file.
6. Open the extension settings page to review:
   - model endpoint settings
   - output language
   - generation controls
   - site rules

## Local mode behavior

- Runs fully inside the extension
- Does not require a remote model endpoint
- Produces a basic DESIGN.md draft

## AI mode behavior

- Requires the user to configure:
  - Base URL
  - API Key
  - Model
  - Protocol
- Sends a structured summary of the current page to the configured model endpoint
- Produces a stronger DESIGN.md result

## Permissions explanation

- `activeTab`: needed to analyze the page the user explicitly activates
- `tabs`: needed to read the current tab context and URL
- `scripting`: needed to inject the content script when required
- `storage`: needed to save user settings locally
- `downloads`: needed to download the generated Markdown file
- host permissions for `http://*/*` and `https://*/*`: needed so the extension can analyze normal webpages selected by the user

## Data handling summary

- The extension does not sell user data.
- The extension does not run in the background across arbitrary pages without user action.
- The extension only analyzes the current page when the user explicitly triggers generation.
- If AI mode is enabled, page summary data is sent only to the user-configured model endpoint.

## Reviewer note

If the reviewer does not configure AI settings, the extension can still be fully tested in `Local Mode`.

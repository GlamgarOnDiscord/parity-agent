Parity Proof: proof that your app still does the same thing after a change.
Record your app in use once. After any change (a refactor by an AI coding agent, an upgrade, a rewrite of an old app), Parity replays the same scenarios on both versions and shows every field that differs, with the evidence.
Nothing leaves your machine unless you send it: replays and comparisons run offline with no AI. AI is used only to propose business rules for you to accept and to explain differences, through Meta's API or open-weight models you host yourself; a log lists every call.
The AI never decides what "the same" means: the comparison is plain code. Timestamps and ids are masked on the first run, and a coverage map shows what was not tested.
The README shows it catching a one-cent change in an invoice total that an AI refactor introduced while every test still passed. Every proven scenario exports as plain Playwright tests you keep.
One command for web apps; old Windows apps through a ready-made sandbox. Free and open source.

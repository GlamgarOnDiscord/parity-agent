# X thread: the one cent

Drafted for the submission day (Nov 4, 17:00 Paris). Each post under 280 characters; every number is measured: the runs are in [benchmarks.md](benchmarks.md) and the README, and the spend ($18.07 as logged on Oct 30) in [sprints.md](sprints.md). The founder posts it from their own account; nothing here is posted automatically.

**1/** (with the 30-second square cut of the video)

Every line of this invoice is right. The total is one cent off.

69.21 in a 2006 Windows app. 69.22 in its rebuild. Every test passed.

I built a tool that catches it, field by field, and proves the rest is the same. 🧵

**2/**

The old app adds the unrounded taxes and rounds once. The rebuild adds the rounded amounts.

Nobody wrote that rule down. It was only in the behaviour of a binary with no source.

**3/**

Parity watches someone use the old app and talk about it. Meta's Muse models read the narration and every field on screen, and write the business rules in plain language, each with the frame that proves it. An expert accepts them in a click.

**4/**

Then Muse Code rebuilds the app as a web app, and Parity replays the same scenarios on it.

Virtual Salesman 3: 8 of 8 fields equal, first try, $0.46.

**5/**

The rule I care most about: AI never decides what "the same" means.

Matching and comparison are plain code. AI captures, proposes and explains. Code proves.

**6/**

Not a hand-picked demo: on FrontAccounting, an app I did not write, Parity fuzzed the rebuild against the live app, found 3 items the recording never showed, shrank each to a one- or two-line invoice, and one $0.46 repair closed them. 52 fresh cases at parity.

**7/**

The proof stays. A GitHub Action replays it on every pull request with no model call, and a coding agent can call it over MCP before it opens one.

Change the rounding and the check goes red, with the report attached.

**8/** (with the 15-second network-cut clip)

Local by default. Cut the network and the proof still runs. Every model call is logged with its cost and the bytes sent.

The whole hackathon: $18 of model calls.

**9/**

Try it in two minutes, no API key: clone, `bun install`, `bun run prove`. You get the cent.

Open source, Apache-2.0: github.com/GlamgarOnDiscord/parity-agent

Built for the Meta Global AI Developer Hackathon. If it's useful to you, a vote helps.

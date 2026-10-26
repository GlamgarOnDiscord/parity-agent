# Buyer panel: Parity (free, open-source behavior proof for software changes)

**8 buy · 12 pass** (40% buy) out of 20 simulated buyers. Seed 26, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

## By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| Consultant at an IT services firm doing legacy migrations | 4 | 50%  (thin) |
| Solo developer or freelancer maintaining client apps | 4 | 50%  (thin) |
| Developer in a product team that uses AI coding agents daily | 7 | 43%  (thin) |
| Owner or office manager of a small business running an old Windows app | 3 | 33%  (thin) |
| IT staff in a public body (city, hospital, school district) | 2 | 0%  (thin) |

## By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Tries new GitHub tools | 4 | 100%  (thin) |
| Skeptical of AI tools | 4 | 75%  (thin) |
| Already has a test suite | 3 | 33%  (thin) |
| Needs approval to adopt | 3 | 0%  (thin) |
| Firefighter with no time | 3 | 0%  (thin) |
| Non-technical, relies on a provider | 3 | 0%  (thin) |

## By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $112,000 and up | 7 | 57%  (thin) |
| under $62,000 | 6 | 50%  (thin) |
| $62,000 to $112,000 | 7 | 14%  (thin) |

## Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| convenience | 6 | "Free is nice, but recording scenarios and standing up a Windows sandbox for our old app is not an under-an-hour job, and nobody is changing that app this month anyway. I'd star it on GitHub and forget it." (P003) · "I do merge AI-written PRs and it does make me nervous, but I'm putting out fires all week and recording every scenario of our apps is a project, not a one-hour install. I'd star the repo and never get back to it." (P004) |
| trust | 4 | "The idea matches my job, but a one-cent invoice demo is exactly the toy case I distrust, and I can't put a new tool on a client's legacy migration without security and my manager signing off. Free doesn't help with that, the approval is the cost, and I won't start it for something I haven't seen work on a messy real app." (P002) · "The one-cent invoice catch is exactly what keeps me up after merging AI pull requests, but I can't put a free student project on the machine that runs our billing app and then defend it to whoever signs off. If it's abandoned next year, I'm the one explaining why our checks depend on it." (P005) |
| habit | 2 | "We already have unit tests, Playwright end-to-end tests and CI gating every AI pull request, and nothing has slipped through badly enough to make me add another tool. Being free doesn't change that: setting up recordings and keeping them current costs time I'd rather spend writing the tests directly." (P007) · "We already have unit tests, end-to-end tests and CI, and nothing has slipped through badly enough to make me add another tool. Recording scenarios and triaging diffs sounds like more work than writing the missing test, especially when I'm finally starting a migration I've put off for a year and don't want new moving parts." (P008) |

## Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| need | 7 | "I merged three AI-written PRs this week and only trusted them because CI was green, and the one-cent invoice bug that got past passing tests is exactly the kind of thing that scares me. It's free and a single command, so I'll install it on a weekend and point it at the old app." (P001) · "I merged three agent-written PRs this week and only trusted them because the tests were green, so the one-cent invoice bug the tests missed is exactly what scares me. It's free, one command, and I keep the Playwright tests, so I'll try it on one app this week." (P006) |
| timing | 1 | "I'm about to start the migration I've been dodging for a year, and it's free and runs offline, so one afternoon pointing it at a client app before and after costs me nothing but time. If it shows me a diff my tests missed, it stays; if it buries me in noise, it's gone the same day." (P011) |

## What would flip a no

- A credible case study or a quick run on one of our own legacy apps, done in an afternoon, that catches a real regression, plus a written statement I can hand to security showing it runs fully offline with the AI turned off.
- Our IT provider telling me they're replacing or upgrading the app and running this for me as part of the job.
- Seeing it catch a real regression on one of our own apps in under an hour, from one command, with no scenario-writing on my side.
- A company or a paid support plan behind it with a maintenance commitment, plus a short security write-up I could hand straight to the person who approves tools.
- An AI-written PR that passes our whole suite and still ships a real regression to production. After that I'd try it on that exact flow.
- Seeing it catch a real difference on our own app during the migration, within an hour of setup, that our existing suite missed.
- My provider or a client running it on my actual migration and handing me a short report showing it caught a real break that our tests missed.
- A fully offline mode with the AI parts switched off by default, plus proof it caught a real regression on a codebase like ours, so I can show my manager a concrete case instead of a README demo.
- A client upgrade landing on my desk, plus proof I can go from install to a first diff on a real app in under an hour with AI fully off by default.
- Our IT provider or a dev on my team setting it up and handing me a simple report I can show the client, or a hosted version where I just click through the app and get a plain yes/no per scenario.
- Our IT provider or platform team turning it on for us as a hosted or one-click thing, so I just open a report after the AI agent's change and see what differs.
- A year of steady commits and releases with more than one maintainer, plus a write-up from another public-sector or IT shop that ran it on a real legacy migration.

Buyers say they would buy **1.0 times** in the first month on average.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.

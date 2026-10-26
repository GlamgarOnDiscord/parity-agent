# Buyer panel: Parity (free, open-source behavior proof for software changes)

**3 buy · 17 pass** (15% buy) out of 20 simulated buyers. Seed 26, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

## By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| Owner or office manager of a small business running an old Windows app | 3 | 33%  (thin) |
| Developer in a product team that uses AI coding agents daily | 7 | 29%  (thin) |
| Consultant at an IT services firm doing legacy migrations | 4 | 0%  (thin) |
| IT staff in a public body (city, hospital, school district) | 2 | 0%  (thin) |
| Solo developer or freelancer maintaining client apps | 4 | 0%  (thin) |

## By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Tries new GitHub tools | 4 | 75%  (thin) |
| Needs approval to adopt | 3 | 0%  (thin) |
| Firefighter with no time | 3 | 0%  (thin) |
| Already has a test suite | 3 | 0%  (thin) |
| Non-technical, relies on a provider | 3 | 0%  (thin) |
| Skeptical of AI tools | 4 | 0%  (thin) |

## By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $112,000 and up | 7 | 29%  (thin) |
| under $62,000 | 6 | 17%  (thin) |
| $62,000 to $112,000 | 7 | 0%  (thin) |

## Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 10 | "This is exactly my problem on legacy migrations, but I can't put an unknown tool on a client's app this month. Security would ask what gets sent to Meta's models and whether recordings of client screens leave the machine, and I have no answer to show them." (P002) · "I do need something like this, since I'm merging AI-written changes into an old app I can't fully check myself. But I can't take a free student project to my manager and security people and ask them to let it record screens of our business app and send them to Meta's AI." (P005) |
| convenience | 5 | "I'm not rewriting my old app this month, and if I ever do, whoever I pay to migrate it should be the one proving it works. Recording, sandboxing and confirming a list of business rules on my own machine is way more than an hour I don't have." (P003) · "Free is nice, but I don't have an afternoon to install a local tool, set up a sandbox, record every workflow and then check a list of business rules some AI wrote. I just eyeball the agent's PRs, run what tests we have, and move on." (P004) |
| need | 1 | "Our unit and end-to-end tests in CI already catch what the agent breaks in the PRs I merge, so I don't have a painful gap this would fill. Recording sessions and then reviewing a list of business rules an AI guessed sounds like a second test suite I'd have to babysit." (P007) |
| habit | 1 | "I already have unit tests, end-to-end tests and CI catching regressions, and recording scenarios then checking AI-written business rules sounds like a second test suite to babysit. Free doesn't help much when the real cost is my time in the middle of a migration I've already put off for a year." (P008) |

## Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| need | 3 | "It's free, it runs locally, and I'm merging AI-written PRs every week, so I'll clone it and try it once on the old Windows app. My tests cover the code I know about. They don't cover the business rules nobody ever wrote down." (P001) · "It's free and runs locally, and I'm merging agent-written PRs I don't fully read, so I'd clone it and try it once on a side project. Whether it stays installed depends on the first run, not the pitch." (P006) |

## What would flip a no

- A published case study or a reproducible demo on a messy real-world legacy app, plus a clear statement that capture can run on local models with nothing leaving the machine, so I can get it past our security review.
- My IT provider running it on the migration and handing me a one-page diff I can check in ten minutes, with the evidence for every difference.
- Watching it catch a real regression on one of our own apps in under an hour of setup, fully offline, with no data leaving the box.
- A named company or maintainer offering a paid support plan, plus a one-page security answer showing the recordings and data stay on our machine.
- An agent PR that passes all our tests and still breaks something in production, plus proof that Parity would have caught it with near-zero false positives on a repo like ours.
- Seeing it catch a real regression on a migration like mine that our existing test suite missed, with setup taking under an hour.
- Someone else running it for me, like a provider or a one-click app, plus seeing it catch a real regression on an app like mine that my own clicking around missed.
- A README with a 60-second demo catching a real changed total on a sample web app, installable in one command, plus visible commit activity and more than one maintainer.
- Running it on one small client app during the migration and having it catch a real regression my tests missed, with no noise, in under an hour of setup.
- A demo on a real app where it catches a seeded regression like a changed invoice total, plus proof that capture can run fully offline or that recordings never leave the machine, so I can show security a deterministic diff report and not an AI opinion.
- A clear statement that the Meta models run fully local with no network calls, plus a one-command install that gives me a first diff on a client web app in under an hour.
- Our IT provider offering it as a service: they install it, record the app with me, and hand me the plain-language rules and the list of differences after a migration.

Buyers say they would buy **1.0 times** in the first month on average.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.

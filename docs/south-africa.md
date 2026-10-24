# South African context

Tally targets South African learners. Its authored lessons, all three adaptive
question levels, interactive models, public guides and metadata use `en-ZA` and
rand (`ZAR`, `R`). Examples include a school tuck shop, a spaza shop, a bicycle
repair business, a coffee stall and a bakery. Amounts are simplified learning
examples, not market prices or conversions from foreign currency.

Use `lib/south-africa.ts` for rand formatting, learner number input, date labels
and SAST calendar days. Rand examples use spaces to group thousands and commas
for cents. Inputs also accept decimal points and the older grouped numeric
formats. Debtors/creditors and their control-account names are accepted alongside
trade receivables/payables; cost of goods sold remains an accepted alias for cost
of sales.

The statement of profit or loss is also called an income statement. The statement
of financial position is also called a balance sheet. These terms are introduced
together in “How learning works”. This is an introductory learning app, not a
claim of curriculum accreditation.

VAT is left out of practice calculations unless a question explicitly includes
it. This is a modelling assumption, not a claim that a real supply is VAT-exempt.
Consult current SARS guidance before adding VAT calculations or thresholds.

Daily mixes, streaks, rewards and review dates use South African Standard Time
(`Africa/Johannesburg`). Date arithmetic uses calendar days independently of the
browser’s time zone. Existing ISO date keys, lesson IDs, numeric answers, adaptive
question plans and written takeaways remain compatible. Learners’ own notes are
not rewritten.

Official sources checked on 24 October 2026:

- [South African Reserve Bank: coins](https://www.resbank.co.za/en/home/what-we-do/banknotes-and-coin/Coins) — rand and cent denominations.
- [SARS: value-added tax](https://www.sars.gov.za/types-of-tax/value-added-tax/) — VAT applies according to the vendor and supply; proposed changes and older publications must be checked against current guidance.
- [Department of Basic Education: balance sheet study guide](https://www.education.gov.za/Portals/0/Documents/Manuals/2022%20Study%20Guides/High%20Enrolment%20Study%20Guides%20FINAL/Accounting-Balance%20Sheet.pdf?ver=2022-01-21-105004-000) — local financial-statement terminology.
- [Department of Basic Education: accounting guide](https://www.education.gov.za/Portals/0/CD/Computer/Self-Study_Accounting_Gr_11-12.pdf) — rand examples and debtor/creditor terminology.

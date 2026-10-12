# Calculation Methodology — PCFC-DIH-CALC-1.0

All currency is USD. Percent inputs are divided by 100 before use. Attendance is capped at venue capacity.

## Statement-backed cash baseline

- FY24 and FY25 cash inflow = sum of valid statement credit rows in each source PDF.
- FY24 and FY25 cash outflow = sum of valid statement debit rows in each source PDF.
- Net cash activity = cash inflow - cash outflow. It is not accrual-basis operating profit.
- Cash margin = net cash activity / cash inflow.
- FY25 normalized categories combine case variants and equivalent labels while retaining the source totals.
- Sponsorship receipts combine `sponsorship` and `sponsorships`; ticket receipts combine `tickets` and `season tickets`; concession receipts combine case variants of `concessions`.
- FY24 and FY25 source date ranges overlap from 7-28 October 2024. Comparisons are directional; the periods must never be summed as distinct years.
- Named payer references establish evidence of cash received only. They do not establish signed contract value, deliverables, or renewal intent.

## Planning model

- Paid attendance = attendance × (1 − complimentary %), rounded to a whole person.
- Ticket revenue = paid attendance × ticket price.
- Concession revenue = attendance × concession participation × average concession spend.
- Merchandise revenue = attendance × merchandise participation × average merchandise spend.
- Total revenue = ticket + concession + merchandise + sponsor allocation.
- Fixed cost = marketing + staffing + security + officials + venue + transport + equipment.
- Community allocation = total revenue × allocation %.
- Variable cost = attendance × configurable per-person cost ($2.40 demo default) + community allocation.
- Contribution margin = total revenue − variable cost.
- Operating margin = total revenue − fixed cost − variable cost.
- Revenue/cost per attendee = respective total ÷ attendance; zero attendance returns zero rather than infinity.
- Net contribution per attendee = (ticket net of comp + expected ancillary) × (1 − community %) − per-person variable cost.
- Break-even attendance = max(0, fixed cost − sponsor allocation) ÷ net contribution per attendee, rounded up. If contribution is nonpositive, break-even is unavailable.
- Downside exposure = total revenue × (weather risk + operational risk), capped at total revenue.
- Capacity utilization = attendance ÷ venue capacity.
- Funnel conversion = current stage ÷ prior stage; drop-off = 1 − conversion.
- Sponsor risk: 45 points below 65% fulfillment or 22 below 85%; 12 per overdue item capped at 30; 18 below 2% engagement; 12 for unknown intent; subtract 12 for positive intent. High ≥55, moderate ≥25, otherwise low.

Changes require an effective version, owner, rationale, manual example, updated unit tests, traceability, and report note.

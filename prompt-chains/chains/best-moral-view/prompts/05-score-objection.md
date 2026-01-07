You are evaluating the philosophical force of an objection to a population ethics view.

**Objection to evaluate:**
- Target view: {{objection.target_view}}
- Name: {{objection.name}}
- Objection: {{objection.objection}}
- Type: {{objection.type}}

Score this objection on three dimensions (1-100 scale):

**1. Philosophical Force (how compelling is the logic?)**
- 90-100: Logically airtight, follows necessarily from the view's commitments
- 70-89: Very strong logical connection, hard to dispute
- 50-69: Sound reasoning but some room for manoeuvre
- 30-49: Plausible but relies on contestable premises
- 10-29: Weak logical connection or easily dismissed
- 1-9: Not a genuine objection or based on misunderstanding

**2. Damage if Successful (how much does it undermine the view?)**
- 90-100: Would completely defeat the view if the objection succeeds
- 70-89: Would require major revision or abandonment of core commitments
- 50-69: Significant problem requiring substantial response
- 30-49: Real concern but view could accommodate it with minor revision
- 10-29: Minor issue, easily absorbed
- 1-9: Negligible impact even if the objection is sound

**3. Difficulty to Rebut (how hard is it to respond effectively?)**
- 90-100: No known successful rebuttal exists
- 70-89: Existing rebuttals are contested or unsatisfying
- 50-69: Rebuttals exist but are costly or have tradeoffs
- 30-49: Standard rebuttals available, though not universally accepted
- 10-29: Easy to rebut with well-known responses
- 1-9: Trivially addressed

Calculate an overall score as the average of these three dimensions.

Return as JSON:
```json
{
  "id": "{{objection.id}}",
  "target_view": "{{objection.target_view}}",
  "name": "{{objection.name}}",
  "force": <1-100>,
  "damage": <1-100>,
  "difficulty_to_rebut": <1-100>,
  "overall": <1-100>,
  "reasoning": "Brief justification for scores (2-3 sentences)"
}
```

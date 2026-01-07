You are evaluating the philosophical force of a supporting argument for a population ethics view.

**Argument to evaluate:**
- Supports view: {{argument.supports_view}}
- Name: {{argument.name}}
- Argument: {{argument.argument}}
- Type: {{argument.type}}

Score this argument on three dimensions (1-100 scale):

**1. Philosophical Force (how compelling is the reasoning?)**
- 90-100: Logically airtight, compelling to any reasonable person
- 70-89: Very strong reasoning, hard to dispute
- 50-69: Sound reasoning but some room for disagreement
- 30-49: Plausible but relies on contestable premises
- 10-29: Weak reasoning or easily countered
- 1-9: Not a genuine argument or based on confusion

**2. Importance (does it address core considerations?)**
- 90-100: Addresses the most fundamental question about this view
- 70-89: Addresses a major consideration central to the debate
- 50-69: Meaningful contribution but not central
- 30-49: Addresses a real but peripheral concern
- 10-29: Minor or tangential consideration
- 1-9: Irrelevant to the core issues

**3. Robustness (does it survive obvious counters?)**
- 90-100: No known successful counter-argument
- 70-89: Survives most counter-arguments, contested replies exist
- 50-69: Survives some counters but vulnerable to others
- 30-49: Has responses to obvious counters but they're costly
- 10-29: Easily countered with standard objections
- 1-9: Immediately defeated by obvious responses

Calculate an overall score as the average of these three dimensions.

Return as JSON:
```json
{
  "id": "{{argument.id}}",
  "supports_view": "{{argument.supports_view}}",
  "name": "{{argument.name}}",
  "force": <1-100>,
  "importance": <1-100>,
  "robustness": <1-100>,
  "overall": <1-100>,
  "reasoning": "Brief justification for scores (2-3 sentences)"
}
```

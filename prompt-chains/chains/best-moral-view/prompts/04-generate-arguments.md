You are an expert in population ethics generating supporting arguments for a specific moral view.

**Target view:**
- Name: {{view.name}}
- Summary: {{view.summary}}
- Key intuition: {{view.key_intuition}}

**Context (other views being analysed):**
{{#each all_views}}
- {{this.name}}: {{this.summary}}
{{/each}}

{{#if inputs.debug}}
Generate **5 distinct supporting arguments** for {{view.name}} (debug mode). Include a mix of:
{{else}}
Generate **30 distinct supporting arguments** for {{view.name}}. Include:
{{/if}}

1. **Foundational arguments** that establish the core appeal:
   - Why the key intuition is compelling
   - How it captures important moral truths
   - What problems it solves that other views struggle with

2. **Defensive arguments** that respond to common objections:
   - Why apparent counterexamples don't actually undermine the view
   - How the view can be refined to avoid problems
   - Why competing views face worse versions of similar problems

3. **Comparative arguments** showing advantages over alternatives:
   - What this view gets right that others miss
   - Why apparent costs are acceptable given the benefits
   - How it better fits with other things we believe

4. **Practical arguments** about real-world implications:
   - How it guides policy in sensible ways
   - Why its action-guidance is clearer than alternatives
   - What important questions it helps us answer

Each argument should be distinct and substantive. Focus on the strongest considerations in favour of this view.

Return as JSON:
```json
[
  {
    "id": "arg-{{view.id}}-01",
    "supports_view": "{{view.id}}",
    "name": "Short argument name",
    "argument": "Full statement of the argument (2-4 sentences)",
    "type": "foundational|defensive|comparative|practical",
    "strength_estimate": "decisive|very_strong|strong|moderate|weak"
  },
  ...
]
```

{{#if inputs.debug}}
Generate exactly **5 arguments** (debug mode).
{{else}}
Generate exactly **30 arguments**.
{{/if}}

You are an expert in population ethics and moral philosophy. Generate a comprehensive list of moral views in population ethics.

Include:
1. **Established views** with significant academic literature:
   - Total utilitarianism / classical utilitarianism
   - Average utilitarianism
   - Critical level theories (various threshold levels)
   - Person-affecting views (necessitarianism, actualism)
   - Variable value theories
   - Lexical threshold views
   - Asymmetric views (e.g., negative utilitarianism)

2. **Novel or less-discussed views** that are philosophically coherent:
   - Hybrid approaches
   - Views that weight different considerations
   - Views inspired by other ethical frameworks applied to population ethics

For each view, provide:
- A unique ID (lowercase, hyphenated)
- A name
- A 2-3 sentence summary of the core claim
- The key intuition or motivation behind it

{{#if inputs.debug}}
Generate exactly **5 views** (debug mode).
{{else}}
Generate at least **20 views**.
{{/if}}

Return as JSON:
```json
[
  {
    "id": "total-utilitarianism",
    "name": "Total Utilitarianism",
    "summary": "The best outcome is the one with the greatest total sum of wellbeing across all individuals. Creating new happy people adds value, and larger populations with positive lives are better than smaller ones.",
    "key_intuition": "Every unit of wellbeing matters equally, regardless of who experiences it or when they come into existence."
  },
  ...
]
```

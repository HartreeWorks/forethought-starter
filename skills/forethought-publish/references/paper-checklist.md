# Paper & research note checklist

This checklist applies to both papers and research notes. Papers have additional steps marked.

## Stage 0: Getting started

### Set up checklist
- Ensure working from a new card (not the template)
- Rename with piece name
- Add Google Doc link

### Decide publication type
Based on criteria:
- **Paper**: Decently polished, "proper" pieces
- **Research note**: Lower-effort, still public and citeable, less formal
- Record in publication_manager: `decision --key type --value paper`

### Consider deadline
- If there's a deadline, check in with Amrit to ensure timeline works

### Review guidance (optional)
- Refamiliarise with Publication process and Style guide if needed

## Decisions

Make these decisions early — they affect later steps.

### Podcast
- Papers: doing a podcast *sometime* is default
- Research notes: podcast is optional
- Decide if podcast should coincide with publication (adds coordination)
- If yes, talk to Fin

### LW/Forum publication
- Strong default is yes for both
- Record: `decision --key lw_forum --value yes`

### Content strategy for Substack/LW/Forum
Options (best to worst for SEO):
1. **Custom summary**: More informal summary linking to website
2. **Intro only**: Just the introduction + link (low effort, okay)
3. **Full text**: Same text everywhere (bad for SEO but permitted)

Record: `decision --key forum_content --value custom_summary`

### Title strategy
- Titles on other platforms should NOT match website title (better for SEO)
- Options:
  - **Question style**: Attention-grabbing question (better)
  - **Summary prefix**: "Summary: [short title]" (low effort)

Record: `decision --key forum_title --value question_style`

### Link strategy
- **Default** (if Forum content differs from Substack): Social & Forum/LW → Substack → Website
- **Alternative** (if Forum same as Substack): Forum/LW → Website directly
- **Alternative 2**: Everything → Website directly (for maximum credibility)

Record: `decision --key link_strategy --value social_substack_website`

### arXiv (optional)
- Only for pieces where audience particularly cares
- Default format: standard website PDF
- Talk to Amrit if proceeding

## Stage 1a: Getting review/input

### Send to Max for initial review
- Default step
- Max will clarify if any comments are blocking
- Default outcome: "approval subject to looking at comments"

### Share with #forethought-research-collaborators
- Default for papers, optional for research notes
- Good norm but case-by-case

### Consider external expert review (optional)
- Who in the world really knows about this topic?
- Could provide valuable input

### Send to Justis for early feedback (optional)
- Justis Mills does both copyediting and substantive comments
- Active in AI safety, staff have found his comments useful
- Contact: Tag in #open-dms-support-team or DM on Slack
- Turnaround: usually 1-3 days

### Send for fact-checking (optional)
- No standard fact-checker currently
- João Fabiano used previously — ask Amrit for contact

### Paid expert reviews (optional)
- Can engage domain experts for paid review
- See expense policy for how to engage

### Finalise draft after input
- Make changes based on feedback
- Have a final draft ready to move forward

## Stage 1b: Publication prep

### Draft Forum/LW/Substack posts
- Only if decided on custom content (not intro-only or full-text)
- Draft in a GDoc
- Remember decisions about content, titles, links

### Have Forum draft reviewed
- Default reviewer: Max

### Draft social media thread
- Default for papers, optional for research notes
- Tips in Style guide
- Low-effort option: one sentence + link is fine
- Remember link strategy decision

### Have social thread reviewed
- Required if doing a proper thread
- Default reviewer: Max

### Check contributor acknowledgments
- Consider if any contributors might not want acknowledgment
- E.g., government workers, spicy takes
- Seek permission if needed

### Finalise diagrams
- Must be in Forethought style
- Required: Background colour #FBFAF4 (Forethought off-white)
- Default: Use fonts and colours from style guidelines
- Export as high-quality PNG files (not in GDoc)

**Options for creating:**
1. Do yourself (Canva has style guide preset)
2. Use Irina, diagrams contractor (irina.titkova90@gmail.com, cc Amrit)

### Draft abstract (~80 words)
**Usage:**
- "All research" tiles on website
- Featured research tiles
- Series overview pages

**Style:**
- Not a traditional academic abstract
- Preview that draws reader in
- Short and punchy
- Several short paragraphs better than one block
- ~Half context/hook, ~half key results
- US English

### Have abstract reviewed
- Default reviewer: Max

### Check platform accesses
Verify access to:
- Contentful (for pressing Publish on website)
- Typefully (for social media)
- Substack (Contributor on Forethought Substack)
- EA Forum Forethought account (in 1Password)

Contact Amrit if access issues.

## Stage 2a: Final signoff

### When ready for final signoff
- Comments from Max's initial review resolved (blocking ones addressed)
- No further text changes planned except minor proofing
- Diagrams in final draft form

### Get Max final signoff
- Required for all pieces

### Get Will/Tom signoff
- Default for papers only
- Optional for research notes

## Stage 2b: Proofread/spellcheck

### Spellcheck
- At minimum: Google Docs spellcheck
- Can skip if Justis proofreads

### Send to Justis for proofread
- Default for papers, optional for research notes
- Especially if he didn't review earlier
- Can send social threads and abstract too
- Turnaround: usually 1-3 days

### Adversarial quoting check
- Paste into Claude project or use prompt
- Flag passages that could be twisted to make Forethought look bad
- Not required to accept suggestions

## Stage 2c: Pass on for uploading

### When ready
- Final signoff complete
- Text finalised (minor changes tracked for Lorie)
- For website: can send before images/abstract ready if time pressure

### Send to Lorie for website upload
**How:**
- Share GDoc with eirol1221@gmail.com
- Tag Lorie in Slack, cc Amrit and Justis
- Use existing channel or #open-dms-support-team

**What to send:**
- GDoc with at least comment access
- Abstract
- All images as high-quality PNG files
- Confirm Paper vs Research Note
- Decision on preview image
- Deadline (if any)

Turnaround: 3 working days if all materials provided

### Send to Lorie for Substack/Forum/LW upload
**What to send:**
- Decisions about content/titles/links
- Custom draft GDoc (if applicable)
- LessWrong login details (she has Forethought Forum account)
- PNG images

### Notify Amrit about arXiv (if doing)

## Stage 3: Publication day

### When ready
- Lorie has uploaded website, Forum, LW, Substack versions
- Justis has reviewed uploads
- Social threads drafted and reviewed
- Platform accesses verified

**Can complete in ~30-60 mins if all prerequisites done.**

### Publish on website
**FIRST — do this before other platforms**

1. Go to Contentful Articles list
2. Open your article
3. Set "Unlisted" to "No"
4. Check publication date is today
5. Press "Publish"
6. If featuring: Content → Series → Featured articles → add at top

### Publish podcast (if doing same day)
1. Have Fin publish the podcast
2. Get MP3 episode ID from RSS feed (pinecast.com/feed/forecast)
3. In Contentful, add to "Podcast link" field: `https://pinecast.com/player/[ID]`

### Post on Substack
1. Go to https://forethoughtnewsletter.substack.com/publish/posts/drafts
2. Find draft (prepared by Lorie)
3. Review if desired
4. Click "Send to everyone now"

### Post on EA Forum
1. Log in to Forethought account (1Password)
2. Click profile → find draft
3. Review if desired
4. Scroll down, click Publish

### Post on LessWrong
1. Log in to your own account
2. Hover username → "My drafts"
3. Review if desired
4. Scroll down, click Publish

### Add Forum/LW links to Contentful
- Go back to Article in Contentful
- Add EA Forum and LessWrong post links to respective fields

### Post social media threads
**Required**: At least Forethought Twitter + LinkedIn
**Default**: All Forethought accounts via Typefully

1. Log in to Typefully
2. Draft thread, select platforms
3. Check versions for each platform
4. Post

If posting from own accounts: Forethought accounts can retweet/share

### Share in Slack channels
Post to:
- #forethought-and-friends (Forethought Slack) — default
- ai-risk-discussion Slack — default
- Constellation Slack — default

Default content: paper link + Twitter link + LW link (highlight LW as best for comments)

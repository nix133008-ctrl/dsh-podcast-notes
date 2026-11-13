---
name: expert-interview-notes
description: Turn high-quality expert interviews, founder conversations, podcast transcripts, call notes, or edited transcripts into restrained internal notes. Use when the user asks for 专家访谈整理, internal notes, transcript-to-notes, interview synthesis, or team-readable summaries that preserve the speaker's insights, details, assumptions, and tensions without turning them into an article, marketing copy, action plan, work allocation, or unsupported strategic diagnosis.
---

# Expert Interview Notes

Use this skill to turn a serious interview or conversation into notes that help a mature internal audience understand what was actually said and why it matters.

The output should read like a careful expert-interview digest: structured, high-signal, specific, and faithful to the conversation. It should not read like an outside-facing article, a consulting memo, a team operating plan, or a motivational summary.

## Goal

Produce a notes artifact that preserves the speaker's real thinking:

- the central judgments
- the concrete details and numbers that support those judgments
- the assumptions still being tested
- the tensions or unresolved questions in the conversation
- the speaker's distinctive framing, without imitating every verbal habit

The notes may be polished and reorganized, but the substance must remain traceable to the source.

## Inputs

Accept any of these as source material:

- audio/video transcript or corrected subtitles
- meeting notes or rough notes from an expert conversation
- an article draft derived from an interview
- multiple artifacts from the same conversation, such as transcript, highlights, and article

If the user gives audio/video only, use the appropriate transcription or post-production skill first, then apply this skill to the transcript. Do not make this skill responsible for ASR quality.

## Required Output

Unless the user requests another format, produce Markdown with these qualities:

- a title that names the conversation and the main domain
- a short opening note that states the audience and boundary
- issue-based sections rather than a strict timestamp recap
- timestamps only where they help readers trace a point back to the source
- clear separation between facts, judgments, assumptions, details, and open questions when the source supports it
- a final section for key insights or open questions, not an action plan

If the user asks for PDF, create the Markdown first, then render a PDF and visually check the first and last pages.

## Boundaries

These are hard constraints.

- Do not assign work to teams, roles, departments, operators, assistants, or founders unless the speaker explicitly does so.
- Do not invent next steps, roadmaps, priorities, owners, OKRs, or deadlines.
- Do not assume the user's company stage, team maturity, org structure, current strategy, or operational gaps.
- Do not convert the notes into advice unless the user explicitly asks for recommendations.
- Do not turn the conversation into promotional copy, public thought leadership, or a "lessons for everyone" article.
- Do not flatten subtle discussion into generic business frameworks.
- Do not add psychological motives, unstated emotions, or hidden intent for any speaker.
- Do not make the output sound more certain than the source.

When in doubt, write "the conversation leaves this as an open question" rather than pretending the answer is settled.

## Analysis Focus

Prefer substance over coverage. A useful expert-interview note usually captures fewer themes with more fidelity.

Look for:

- places where the speaker names a problem more precisely than usual
- numbers, ratios, timelines, examples, or constraints that make a judgment concrete
- distinctions that change how a reader should understand a topic
- disagreement, uncertainty, hesitation, or correction between speakers
- assumptions that are plausible but not yet verified
- recurring concepts across different parts of the conversation

Keep the speaker's best wording when it carries insight, but paraphrase when raw transcript language is repetitive or noisy.

## Writing Standard

Write for insiders who are competent and context-rich. They do not need basic education, cheerleading, or work assignments. They need a clean map of the conversation's thinking.

Good notes:

- make the source material easier to think with
- preserve nuance and uncertainty
- keep concrete details close to the insight they support
- mark inference as inference
- use plain section titles that describe the actual issue
- avoid over-packaged models and slogans
- avoid AI-ish contrast patterns such as repeated "not X, but Y" / `不是……而是……`; use direct positive phrasing, cause/effect, examples, or separate sentences instead
- read naturally in Chinese when writing Chinese: avoid translationese, abstract nouns as fake subjects, and prefabricated transition patterns

Weak notes:

- over-explain what the team should do next
- transform every point into a business recommendation
- use generic labels such as "community flywheel" or "product moat" without source support
- summarize at such a high level that the expert's original thinking disappears
- sound like the agent is diagnosing the user's organization from the outside
- rely on repetitive rhetorical scaffolding such as "this is not..., this is..." to sound sharp while adding little

## Known Failure Modes

These come from real iteration and should be actively checked before finishing.

### Over-prescribing

Failure: the notes drift from "what the expert conversation reveals" into "what different teams should now do."

Correction: remove role-based assignments, timelines, owners, and action lists. Keep only source-backed insights, tensions, and open questions.

### Assuming Context

Failure: the notes imply the user's team is immature, missing basic functions, or needs operational instruction.

Correction: write for a mature team. Do not infer org state. If a point depends on the user's actual context, mark it as an open question.

### Over-packaging

Failure: the notes convert subtle discussion into neat frameworks, slogans, or public-facing narrative.

Correction: return to the speaker's concrete distinctions, examples, and unresolved tradeoffs.

### AI-ish Contrast Cadence

Failure: the notes or article overuse `不是……而是……`, "not X but Y", or adjacent hard-contrast sentences. Readers experience this as AI voice even when the substance is correct.

Correction: rewrite the thought in normal prose. Prefer:

- direct assertion: "这段的价值在于..."
- cause/effect: "因为...所以..."
- source-backed detail first, then judgment
- two short sentences instead of a contrast frame
- verbs and concrete subjects over abstract nouns

## Validation

Before delivering, run a short audit:

- Can every major claim be traced to the source material?
- Did the notes preserve details, not just conclusions?
- Are open questions clearly marked as open questions?
- Are there any invented work assignments, owners, timelines, or "team should" language?
- Does the output still feel like expert-interview notes rather than an article or consulting memo?
- In Chinese output, did you minimize `不是……而是……` and other AI-ish hard contrasts? If this pattern appears repeatedly, rewrite before delivering.
- Did the prose pass a substance-first Chinese naturalness check: concrete subjects, real verbs, minimal empty abstractions, no "底层逻辑/抓手/赋能/认知跃迁" filler unless quoted from source?

If any answer fails, revise before finalizing.

## References

Read `references/sources.md` only when you need the origin, sample artifact paths, or skill-writing sources behind this skill. For Chinese prose cleanup, apply the local `substance-writing-review` standards when available.
# Agent Operating Guide
This system converts human intent into shippable web apps.


AI can guess. 
This system is designed to behave.


---


# How This Project Works


There are two important files:


- `web_app_instructions.md` → Defines how the system should behave.
- `project_specs.md` → Defines what we are building.


The agent must follow both.


---


# Step 1: Define the Project First


Before writing any code:
1. Create a `project_specs.md` file
2. Clearly define:
  - User inputs
  - Core features
  - Constraints
  - Deployment target
  - Definition of done
3. Show the file
4. Wait for approval


No code should be written before this file is approved.


---


## Objective


### Define what we’re building
- A small, shippable app (Goal)


### Define what we’re not building
- Auth
- Payments
- Background jobs
- Database (Scope)


### Define what “done” looks like
- Measurable completion criteria


### Define requirements
- Web app must be accessible
- Web app must be responsive
- Must avoid external npm packages unless required
- Must use existing patterns and avoid overengineering
- Must stop and ask if requirements conflict


---


## When Something Breaks


1. Fix the issue
2. Improve the code so the same failure cannot happen again
3. Test again


Errors are signals. 
Each failure should make the system stronger, not more fragile.


---


## File Structure
- Next.js and Tailwind
- Use `gemini-2.0-flash` as a model if using Gemini AI
- Deploy on Vercel
- Store all secrets safely in `.env` (never hardcode keys)


---


## Rule #1: Always Read First
Always read `web_app_instructions.md` and `project_specs.md` before doing anything.


## Rule #2: Reply Structure
- **Plan** (3–7 bullets)
- **What I need from you** (if anything)
- **Next action** (one step)
- **Errors** (plain English, no jargon)


## Rule #3: Reasonable Assumptions Are Allowed
- Change one thing at a time, then test
- Reuse existing patterns before adding structure
- Test after every change
- Make reasonable product/technical assumptions unless blocked


## Rule #4: Stop and Ask If
- a required key/credential is missing
- a new dependency/service materially changes scope
- you can’t meet requirements with sensible defaults
- deployment fails

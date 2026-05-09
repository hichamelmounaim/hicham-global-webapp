# Hicham's Global Web App - Master Task List

This file tracks the complete progress of converting the n8n workflow into a high-performance web application.

## 🚀 Phase 1: Project Setup & Foundation
- [ ] **Initialize Web App**: Create a brand new Next.js 15 project with Tailwind CSS and TypeScript.
- [ ] **Install Core Libraries**: Install Shadcn UI (for premium design), Prisma (database), and OpenAI SDK.
- [ ] **Database Setup**: create a local SQLite database to store generated posts and logs.
- [ ] **Environment Setup**: Configure `.env` file for API Keys (OpenAI, Midjourney/GoAPI, WordPress).

## 🧠 Phase 2: The "Brain" (Backend Logic)
- [ ] **Keyword Processing Engine**:
    - [ ] Create logic to accept a list of keywords (Bulk Input).
    - [ ] Implement `generateTitleAndMeta` (AI Agent 1).
    - [ ] Implement `generateExlusiveContent` (AI Agent 2 - Intro, Body, Conclusion).
- [ ] **Image Generation System**:
    - [ ] Connect to GoAPI (Midjourney).
    - [ ] Create logic to generate prompts based on recipe content.
    - [ ] Implement robust "polling" to wait for images to complete (Queue System).
- [ ] **WordPress Integration**:
    - [ ] Implement `publishToWordPress` function.
    - [ ] Handle uploading images to WordPress Media Library.
    - [ ] Format final HTML (Tables, Lists, Styling) for the blog post.

## 🎨 Phase 3: The "Face" (Frontend UI)
- [ ] **Dashboard**:
    - [ ] Create a "Command Center" to see active jobs and success rates.
- [ ] **Bulk Import Tool**:
    - [ ] A clean text area to paste 100+ keywords.
    - [ ] "Start Generation" button with progress bar.
- [ ] **Live Logs**:
    - [ ] A terminal-like view to see exactly what the AI is doing in real-time (e.g., "Generating image for 'Chocolate Cake'...").

## 🛡️ Phase 4: Testing & Polish
- [ ] **Dry Run**: Test with 1 keyword to verify the entire loop.
- [ ] **Stress Test**: Test with 5 keywords to ensure the queue handles parallel jobs.
- [ ] **Error Handling**: Ensure the app doesn't crash if an API fails (it should retry).
- [ ] **Final Review**: Check UI aesthetics (Dark Mode, Animations).

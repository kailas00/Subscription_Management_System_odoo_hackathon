# Design rules

Brightloop is a working tool: people come to finish a task. Clarity first, one obvious next step per screen.

## Look
- **Type:** Plus Jakarta Sans for the interface; Michroma for the BRIGHTLOOP wordmark; Fira Code only for document numbers (`SUB/2026/00012`). Numbers use tabular figures.
- **Colour:** navy rail and primary actions, white surfaces on a light grey ground. Green / amber / red / blue only when they mean something (paid, paused, overdue, offer). All text passes WCAG AA contrast.
- **Shape:** rounded corners (10 / 16 / 20 / 28 px), one soft shadow, no gradients or glow.
- **Icons:** Lucide only, one size and stroke. Service pictures come from `components/brand/ServiceArt.jsx` or an uploaded photo.
- **Tokens:** colours, radius and motion live in `client/src/index.css` and `tailwind.config.js` — never raw hex in pages.

## Behaviour
- Every page: title, one-line purpose, then the work. Customers see plain words ("Offer", "Bill", "To pay"), staff see the business terms.
- Errors say what is wrong and how to fix it. Buttons name the action ("Record payment", never "Submit").
- Destructive actions ask first. Saving shows a spinner and blocks double clicks.
- Lists have loading, empty and error states; tables turn into cards on phones.
- Keyboard: visible focus, Esc closes dialogs, skip link, Ctrl+K quick jump for staff.
- Motion is short and ease-out; it is switched off for people who prefer reduced motion.

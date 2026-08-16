# 11. Real-World Example: Restaurant Reservation

User: “Jarvis, book me a reservation at Irajá Redux for 11 PM.”

1. Parse restaurant, time; **ask** missing critical fields (date, party size, name, phone).
2. Search legitimate booking paths (`web_search` / `web_fetch`) — OpenTable/website/phone.
3. Check **actual** availability via tool results; never invent slots.
4. If a call is required → **high-risk permission** before dialing.
5. Execute booking path; capture confirmation number / failure reason.
6. Report truthfully: booked / only 10 PM available / could not complete.
7. Store memory only if user wants (“remember my usual restaurant”).

Phase 1: collects details, researches public info, and states that placing the call/booking needs Phase 5 telephony + user confirmation — **does not fake success**.

// The challenge tools (the professional card at /challenge-tools/card and the mirror at /challenge-tools/letter) are
// open only while a challenge is running. When it ends, set this to false: anyone who opens either link then sees
// "the challenge has ended" and an invitation to the next one (the admin still gets the tools, to test and look).
// For the next round, set it back to true on its first day (and the next round's dates below).
//
// This closes the PAGES. The edge function behind them (challenge-tool-generate) still answers a signed-in
// request that bypasses the page; closing it too is a separate deploy.
export const CHALLENGE_TOOLS_OPEN = false;

// The next round, as shown on the "ended" page. The landing page /challenge holds the full details and the sign-up.
export const NEXT_CHALLENGE = {
  dates: "20-24 בדצמבר",
  workshop: "ביום רביעי, 23.12, סדנה מעשית חיה",
  landingPath: "/challenge",
};

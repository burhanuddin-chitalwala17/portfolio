import "server-only";

/*
 * Public LeetCode profile data, from the same GraphQL endpoint leetcode.com's profile page uses.
 * It's unofficial, so every part is optional: whatever fails is simply left out. Results are
 * cached per server instance for a few hours.
 */

const ENDPOINT = process.env.LEETCODE_GRAPHQL_URL || "https://leetcode.com/graphql";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

const QUERIES = {
  solved: `query($username: String!) { matchedUser(username: $username) {
    submitStatsGlobal { acSubmissionNum { difficulty count } } profile { ranking } } }`,
  languages: `query($username: String!) { matchedUser(username: $username) {
    languageProblemCount { languageName problemsSolved } } }`,
  topics: `query($username: String!) { matchedUser(username: $username) { tagProblemCounts {
    advanced { tagName problemsSolved } intermediate { tagName problemsSolved } fundamental { tagName problemsSolved } } } }`,
  badges: `query($username: String!) { matchedUser(username: $username) { badges { displayName } } }`,
  contest: `query($username: String!) { userContestRanking(username: $username) {
    rating attendedContestsCount topPercentage } }`,
  recent: `query($username: String!) { recentAcSubmissionList(username: $username, limit: 10) { title timestamp } }`,
};

async function query(source, username) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com", "User-Agent": "portfolio-chat" },
    body: JSON.stringify({ query: source, variables: { username } }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`LeetCode returned ${response.status}`);
  const body = await response.json();
  if (body.errors?.length) throw new Error(body.errors[0].message);
  return body.data;
}

function shape(parts) {
  const profile = {};
  const solved = parts.solved?.matchedUser;
  if (solved) {
    const counts = Object.fromEntries(solved.submitStatsGlobal.acSubmissionNum.map((row) => [row.difficulty.toLowerCase(), row.count]));
    profile.solved = { total: counts.all, easy: counts.easy, medium: counts.medium, hard: counts.hard };
    profile.ranking = solved.profile?.ranking ?? null;
  }
  const languages = parts.languages?.matchedUser?.languageProblemCount;
  if (languages) {
    profile.languages = [...languages].sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 5)
      .map((row) => ({ name: row.languageName, solved: row.problemsSolved }));
  }
  const tags = parts.topics?.matchedUser?.tagProblemCounts;
  if (tags) {
    profile.topTopics = [...tags.advanced, ...tags.intermediate, ...tags.fundamental]
      .sort((a, b) => b.problemsSolved - a.problemsSolved)
      .slice(0, 10)
      .map((row) => ({ name: row.tagName, solved: row.problemsSolved }));
  }
  const badges = parts.badges?.matchedUser?.badges;
  if (badges) profile.badges = badges.map((badge) => badge.displayName);
  const contest = parts.contest?.userContestRanking;
  if (contest) {
    profile.contest = {
      rating: Math.round(contest.rating),
      contestsAttended: contest.attendedContestsCount,
      topPercentage: contest.topPercentage,
    };
  }
  const recent = parts.recent?.recentAcSubmissionList;
  if (recent) {
    profile.recentlySolved = recent.map((row) => ({
      title: row.title,
      date: new Date(Number(row.timestamp) * 1000).toISOString().slice(0, 10),
    }));
  }
  return profile;
}

const cache = new Map();

/**
 * The public profile of `username`, or null if LeetCode couldn't be reached at all.
 * @returns {Promise<null | {username, fetchedAt, solved?, ranking?, languages?, topTopics?, badges?, contest?, recentlySolved?}>}
 */
export function getLeetcodeProfile(username) {
  const hit = cache.get(username);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = (async () => {
    const names = Object.keys(QUERIES);
    const settled = await Promise.allSettled(names.map((name) => query(QUERIES[name], username)));
    const parts = Object.fromEntries(names.map((name, index) => [name, settled[index].value]));
    const failures = settled.filter((result) => result.status === "rejected");
    if (failures.length === names.length) {
      console.error(`LeetCode profile for ${username} couldn't be loaded:`, failures[0].reason?.message);
      cache.delete(username);
      return null;
    }
    return { username, fetchedAt: new Date().toISOString().slice(0, 10), ...shape(parts) };
  })();
  cache.set(username, { value, expires: Date.now() + CACHE_TTL_MS });
  return value;
}

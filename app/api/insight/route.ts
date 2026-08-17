import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_HABITS = 50;
const MAX_NAME_LENGTH = 60;

type HabitStat = {
  name: string;
  currentStreak: number;
  longestStreak: number;
  last30DayPercent: number;
};

function isValidHabit(value: unknown): value is HabitStat {
  if (typeof value !== "object" || value === null) return false;
  const habit = value as Record<string, unknown>;
  return (
    typeof habit.name === "string" &&
    habit.name.length > 0 &&
    habit.name.length <= MAX_NAME_LENGTH &&
    typeof habit.currentStreak === "number" &&
    typeof habit.longestStreak === "number" &&
    typeof habit.last30DayPercent === "number"
  );
}

function buildPrompt(habits: HabitStat[]): string {
  const lines = habits.map(
    (h) =>
      `- ${h.name}: 現在の継続 ${h.currentStreak} 日 / 最長 ${h.longestStreak} 日 / 直近30日の達成率 ${h.last30DayPercent}%`,
  );
  return [
    "あなたは習慣トラッキングアプリのコーチです。以下の集計データだけを見て、",
    "前向きで具体的な一言コメントを日本語で書いてください。",
    "",
    "ルール:",
    "- 2〜3文、100文字程度まで",
    "- 良い点を1つ具体的に褒める",
    "- 停滞している習慣があれば、責めずに軽く後押しする",
    "- 絵文字は使わない",
    "",
    "習慣データ:",
    ...lines,
  ].join("\n");
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI機能が設定されていません。" },
      { status: 503 },
    );
  }

  let body: { habits?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストが不正です。" },
      { status: 400 },
    );
  }

  if (
    !Array.isArray(body.habits) ||
    body.habits.length === 0 ||
    body.habits.length > MAX_HABITS ||
    !body.habits.every(isValidHabit)
  ) {
    return NextResponse.json(
      { error: "リクエストが不正です。" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
        model: "groq/compound",
        max_tokens: 300,
          messages: [
            { role: "user", content: buildPrompt(body.habits as HabitStat[]) },
          ],
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "AIからの応答に失敗しました。" },
        { status: 502 },
      );
    }

    const data = await response.json();
    const text: string | undefined =
      data.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "AIからの応答に失敗しました。" },
        { status: 502 },
      );
    }

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "AIからの応答に失敗しました。" },
      { status: 502 },
    );
  }
}

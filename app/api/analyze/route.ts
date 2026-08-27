import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 채점 결과 응답 스키마 정의 (JSON 강제)
const feedbackSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    extracted_text: { type: Type.STRING, description: "손글씨에서 판독한 한글 텍스트" },
    total_score: { type: Type.INTEGER, description: "100점 만점 기준 점수" },
    errors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "오류 유형 (문장부호, 띄어쓰기, 맞춤법/오타, 문맥/단어누락)" },
          deducted_points: { type: Type.INTEGER, description: "감점된 점수" },
          wrong_text: { type: Type.STRING, description: "손글씨에서 틀린 부분" },
          correct_text: { type: Type.STRING, description: "바른 표현" },
          child_friendly_reason: { type: Type.STRING, description: "초등 2학년 눈높이 맞춤 설명" },
        },
        required: ["category", "deducted_points", "wrong_text", "correct_text", "child_friendly_reason"]
      }
    },
    praise_message: { type: Type.STRING, description: "격려 또는 칭찬 메시지" }
  },
  required: ["extracted_text", "total_score", "errors", "praise_message"]
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const originalText = formData.get("originalText") as string;
    const handwritingFile = formData.get("handwritingImage") as File;

    if (!handwritingFile) {
      return NextResponse.json({ error: "손글씨 이미지가 필요합니다." }, { status: 400 });
    }

    // 이미지를 Base64로 변환
    const bytes = await handwritingFile.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    const prompt = `
너는 초등학교 2학년 문해력 탐험 대장이자 채점 교사야.
제공된 [원본 글]과 [어린이 손글씨 사진]을 비교해서 정밀 채점해줘.

[원본 글]
${originalText || "원본 텍스트가 제공되지 않았습니다. 손글씨 내용을 읽고 맞춤법과 띄어쓰기를 검사해주세요."}

[채점 규칙]
- 기본 100점에서 시작.
- 문장부호 오류/누락: 개당 -2~3점
- 띄어쓰기 오류: 개당 -5점
- 맞춤법/오타: 개당 -10점
- 단어 누락/문맥 왜곡: 개당 -10~15점
- 초등학교 2학년 눈높이에 맞춰 친근한 비유와 쉬운 언어로 설명할 것.
`;

    const response = await ai.models.generateContent({
    //   model: "gemini-2.5-flash",
    //   model: "gemini-2.5-pro",
    //   model: "gemini-3.1-pro-preview",
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: handwritingFile.type || "image/jpeg"
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: feedbackSchema,
      }
    });

    const result = JSON.parse(response.text || "{}");
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
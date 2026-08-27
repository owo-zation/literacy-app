import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 상세 피드백을 위한 JSON 스키마 정의
const feedbackSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    extracted_text: { type: Type.STRING, description: "손글씨에서 판독한 한글 원문 (특수문자, 띄어쓰기 포함)" },
    total_score: { type: Type.INTEGER, description: "100점 만점 기준 점수" },
    errors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { 
            type: Type.STRING, 
            description: "오류 유형 (문장부호, 띄어쓰기, 맞춤법/오타, 문맥/단어누락)" 
          },
          deducted_points: { type: Type.INTEGER, description: "감점 점수" },
          wrong_text: { type: Type.STRING, description: "손글씨에서 틀리거나 빠진 부분" },
          correct_text: { type: Type.STRING, description: "원본 글의 바른 표현" },
          child_friendly_reason: { 
            type: Type.STRING, 
            description: "초등 2학년 눈높이에 맞춰 왜 고쳐야 하는지, 틀리면 문맥·호흡·의미가 어떻게 엉뚱하게 바뀌는지 재미있는 비유와 예시를 들어 2~3문장으로 생생하게 설명" 
          },
        },
        required: ["category", "deducted_points", "wrong_text", "correct_text", "child_friendly_reason"]
      }
    },
    praise_message: { type: Type.STRING, description: "아이의 끈기를 칭찬하고 성취감을 북돋우는 따뜻한 응원 메시지" }
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

    const bytes = await handwritingFile.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    const systemPrompt = `
너는 대한민국 초등학교 2학년 문해력 전문 교사이자 다정한 '문해력 탐험 대장'이야.
제공된 [원본 글]과 [어린이 손글씨 사진]을 한 글자, 한 띄어쓰기, 문장부호 하나까지 1:1로 정밀하게 대조해.

[채점 및 분석 중점 사항]
1. **문장부호 정밀 검사**:
   - 쉼표(,), 마침표(.), 물음표(?) 누락 및 오용을 철저히 찾아낸다.
   - 잘못된 부호(예: 일본식 둥근 마침표 '。' 등)도 지적한다.
   - **문맥 영향 설명**: "마침표나 쉼표가 없으면 문장이 숨을 쉬지 못하고 와다다 달려가서 읽는 사람이 숨이 차요!", "물음표가 빠지면 질문인지 혼잣말인지 헷갈려요" 같은 신체적 호흡과 소리 내어 읽는 느낌의 비유를 사용한다.

2. **띄어쓰기 정밀 검사**:
   - 붙여 쓴 곳, 불필요하게 띄운 곳을 정확히 찾아낸다.
   - **문맥 영향 설명**: "'아버지 가방에 들어가신다'처럼 띄어쓰기를 안 하면 단어들이 찰떡처럼 붙어 뜻이 완전히 달라져요! 단어 사이에 작은 징검다리를 놓아주어야 해요" 같은 구체적인 예시를 들어준다.

3. **맞춤법/오타 및 단어 누락 검사**:
   - 글자가 바뀌거나 빠져서 문맥이 어떻게 엉뚱해지는지 재미있게 설명한다.

[피드백 작성 규칙]
- 감점 기준: 문장부호(-2~3점), 띄어쓰기(-5점), 맞춤법/오타(-10점), 핵심단어 누락(-10~15점)
- 초등학교 저학년이 깔깔 웃으며 머리에 쏙쏙 들어오도록 친근한 말투(~해요, ~했답니다)로 작성할 것.

[원본 글]
${originalText}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
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
        temperature: 0.2,
      }
    });

    const result = JSON.parse(response.text || "{}");
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
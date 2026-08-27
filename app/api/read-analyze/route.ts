import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 낭독 피드백 JSON 스키마
const readFeedbackSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    transcribed_text: { type: Type.STRING, description: "아이의 음성에서 받아 적은 한글 텍스트 원문" },
    read_score: { type: Type.INTEGER, description: "100점 만점 기준 낭독 유창성 점수" },
    feedback_list: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { 
            type: Type.STRING, 
            description: "오류 유형 (발음/단어틀림, 글자누락/빠뜨림, 쉼표/마침표 호흡(끊어읽기), 유창성)" 
          },
          target_text: { type: Type.STRING, description: "원본 또는 잘못 읽은 부분" },
          advice: { 
            type: Type.STRING, 
            description: "초등 2학년 눈높이에 맞춘 다정하고 생생한 낭독 코칭 (2문장 내외)" 
          }
        },
        required: ["category", "target_text", "advice"]
      }
    },
    praise_message: { type: Type.STRING, description: "목소리의 씩씩함과 또박또박한 태도를 칭찬하는 응원 메시지" }
  },
  required: ["transcribed_text", "read_score", "feedback_list", "praise_message"]
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const originalText = formData.get("originalText") as string;
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "녹음된 오디오 파일이 필요합니다." }, { status: 400 });
    }

    const bytes = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(bytes).toString("base64");

    const prompt = `
너는 대한민국 초등학교 2학년 국어 낭독 전문 교사이자 다정한 '문해력 낭독 탐험 대장'이야.
제공된 [원본 글]을 보고 아이가 마이크로 직접 소리 내어 읽은 [녹음 오디오]를 정밀하게 분석해줘.

[분석 및 코칭 중점 사항]
1. **음성 인식 (STT)**: 아이가 실제로 어떻게 읽었는지 한글로 받아 적는다.
2. **발음 및 단어 정확도**: 글자를 잘못 읽거나 건너뛴(누락) 부분이 있는지 확인한다.
3. **끊어 읽기(호흡)**: 쉼표(,)에서 잠깐 쉬고, 마침표(.)에서 문장을 또렷하게 마무리했는지 점검한다.
4. **초등 2학년 맞춤형 피드백**: 딱딱한 평가 대신 "숨을 쉬지 않고 달려가면 듣는 친구가 어지러워요!", "‘촉촉한’을 ‘통통한’으로 읽으면 달팽이가 뚱뚱해져요!" 같이 재미있는 비유로 설명한다.

[원본 글]
${originalText}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Audio,
                mimeType: audioFile.type || "audio/webm"
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: readFeedbackSchema,
        temperature: 0.2,
      }
    });

    const result = JSON.parse(response.text || "{}");
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Read Analysis API Error:", error);
    return NextResponse.json({ error: error.message || "낭독 분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
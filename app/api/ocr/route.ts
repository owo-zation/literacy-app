import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("sourceImage") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "원본 이미지가 필요합니다." }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    const prompt = `
너는 고성능 한글 문서 판독 AI야.
제공된 이미지에 적힌 한글 본문 텍스트(교과서, 책, 지문 등)를 띄어쓰기와 문장부호까지 원문 그대로 정확하게 추출해줘.
설명이나 인사말은 일절 붙이지 말고 오직 [추출된 텍스트 본문]만 출력해.
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
                data: base64Data,
                mimeType: imageFile.type || "image/jpeg"
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.1,
      }
    });

    return NextResponse.json({ text: response.text?.trim() || "" });

  } catch (error: any) {
    console.error("OCR API Error:", error);
    return NextResponse.json({ error: error.message || "텍스트 추출 실패" }, { status: 500 });
  }
}
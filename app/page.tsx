"use client";

import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import { Camera, RefreshCw, Award, Sparkles, CheckCircle2, BookOpen, Lightbulb, ChevronRight } from "lucide-react";

const SCIENCE_EXAMPLES = [
  {
    id: 1,
    title: "촉촉한 달팽이 이야기",
    text: "비가 내리는 촉촉한 날, 화단에서 기어가는 달팽이를 본 적이 있나요? 달팽이는 몸이 아주 말랑말랑하고 촉촉합니다. 달팽이의 몸이 마르면 위험해지기 때문에, 달팽이는 햇볕이 쨍쨍한 날보다 비가 오거나 흐린 날에 주로 움직입니다. 달팽이의 머리에는 더듬이가 두 쌍 있습니다. 긴 더듬이 끝에는 눈이 있어서 밝고 어두운 것을 구별합니다. 짧은 더듬이는 냄새를 맡는 역할을 합니다. 달팽이는 딱딱한 껍데기를 가지고 태어나며, 몸이 자랄수록 껍데기도 함께 커집니다. 위험한 상황이 오면 달팽이는 껍데기 속으로 쏙 숨어 몸을 보호합니다."
  },
  {
    id: 2,
    title: "자석의 비밀",
    text: "자석은 철로 된 물건을 끌어당기는 특별한 힘이 있습니다. 자석에는 N극과 S극이 있는데, 서로 다른 극끼리는 달라붙고 같은 극끼리는 서로 밀어냅니다. 우리 생활 속 냉장고 문이나 필통에도 자석이 숨어 있습니다."
  }
];

interface AnalysisError {
  category: string;
  deducted_points: number;
  wrong_text: string;
  correct_text: string;
  child_friendly_reason: string;
}

interface AnalysisResult {
  extracted_text: string;
  total_score: number;
  errors: AnalysisError[];
  praise_message: string;
}

export default function Home() {
  const [originalText, setOriginalText] = useState(SCIENCE_EXAMPLES[0].text);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      alert("손글씨 사진을 먼저 올려주세요!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("originalText", originalText);
    formData.append("handwritingImage", selectedImage);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("분석에 실패했습니다.");

      const data: AnalysisResult = await res.json();
      setResult(data);

      if (data.total_score === 100) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      alert(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-amber-50/40 p-4 md:p-8 max-w-3xl mx-auto font-sans">
      {/* 상단 헤더 */}
      <header className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-amber-950 flex items-center justify-center gap-2">
          ✏️ 쑥쑥 문해력 탐험대
        </h1>
        <p className="text-sm text-amber-800 mt-1">
          원본 글과 비교하며 재미있는 글쓰기 비밀을 배워봐요!
        </p>
      </header>

      {/* 1. 예시 문장 및 원본 입력창 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 mb-5">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-800 text-sm">
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span>초등 2학년 과학 이야기 고르기</span>
        </div>
        <div className="flex gap-2 mb-3">
          {SCIENCE_EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setOriginalText(ex.text)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition ${
                originalText === ex.text
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {ex.title}
            </button>
          ))}
        </div>

        <textarea
          value={originalText}
          onChange={(e) => setOriginalText(e.target.value)}
          rows={4}
          placeholder="여기에 원본 문장을 넣거나 직접 수정하세요."
          className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-amber-500 text-slate-800 resize-none leading-relaxed"
        />
      </section>

      {/* 2. 손글씨 사진 업로드 및 대조 버튼 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 mb-6">
        <div className="flex items-center gap-2 mb-3 font-bold text-slate-800 text-sm">
          <Camera className="w-4 h-4 text-amber-600" />
          <span>내가 쓴 손글씨 사진 올리기</span>
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 mb-4">
            <img src={imagePreview} alt="손글씨 미리보기" className="w-full max-h-64 object-contain mx-auto" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm transition"
            >
              사진 다시 고르기
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-amber-200 rounded-xl flex flex-col items-center justify-center gap-2 text-amber-800 bg-amber-50/50 hover:bg-amber-100/50 transition cursor-pointer mb-4"
          >
            <Camera className="w-8 h-8 text-amber-500" />
            <span className="text-sm font-semibold">사진 촬영 또는 앨범에서 선택하기</span>
          </button>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || !selectedImage}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>탐험 대장이 꼼꼼하게 글을 읽고 있어요...</span>
            </>
          ) : (
            <span>🔍 꼼꼼히 대조하고 배움 얻기</span>
          )}
        </button>
      </section>

      {/* 3. 분석 결과 카드 (학습 피드백 우선 구조) */}
      {result && (
        <section className="bg-white rounded-3xl p-6 shadow-xl border border-amber-200 space-y-6 animate-in fade-in duration-300">
          
          {/* A. 탐험 대장의 다정한 격려 메시지 */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-sm mb-1">탐험 대장의 한마디</h3>
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                {result.praise_message}
              </p>
            </div>
          </div>

          {/* B. AI가 인식한 손글씨 본문 */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <p className="text-xs font-bold text-slate-500 mb-1.5">📝 AI가 읽어낸 손글씨</p>
            <p className="text-sm text-slate-800 leading-relaxed font-normal bg-white p-3 rounded-xl border border-slate-100">
              {result.extracted_text}
            </p>
          </div>

          {/* C. [핵심] 초등학생 눈높이 학습 피드백 (가장 크게 부각) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">
                알아두면 쑥쑥 자라는 글쓰기 비밀
              </h2>
            </div>

            {result.errors.length === 0 ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <span className="font-bold">와우! 고칠 곳 없이 완벽하게 잘 썼어요! 🌟</span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {result.errors.map((err, idx) => (
                  <div key={idx} className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-2">
                    {/* 단어 비교 바 */}
                    <div className="flex items-center gap-2 text-xs bg-white px-3 py-1.5 rounded-lg border border-orange-100/80 w-fit">
                      <span className="line-through text-red-500 font-medium">{err.wrong_text}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                      <span className="text-emerald-700 font-bold">{err.correct_text}</span>
                    </div>

                    {/* 친근한 비유 설명 */}
                    <p className="text-xs text-slate-700 font-normal leading-relaxed pl-1">
                      💡 {err.child_friendly_reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* D. 하단 분류별 감점 내역 요약 리포트 */}
          {result.errors.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 mb-2.5">
                📊 분류별 수정 내역
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.errors.map((err, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold text-[11px]">
                        {err.category}
                      </span>
                      <span className="text-slate-600 truncate text-[11px]">{err.wrong_text}</span>
                    </div>
                    <span className="text-red-500 font-bold shrink-0 ml-2">
                      -{err.deducted_points}점
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* E. 하단 최종 점수 및 성취 배지 */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 text-center shadow-inner">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
              최종 탐험 점수
            </span>
            <div className="text-4xl font-black text-amber-600 my-1">
              {result.total_score} <span className="text-lg font-bold text-amber-400">/ 100점</span>
            </div>

            {result.total_score === 100 ? (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-yellow-400 text-amber-950 text-xs px-4 py-1.5 rounded-full font-black shadow-sm">
                <Award className="w-4 h-4 text-amber-900" />
                <span>🥇 문해력 마스터 황금 배지 획득!</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                위의 설명을 읽고 다시 도전해서 100점 황금 배지를 받아보세요!
              </p>
            )}
          </div>

          {/* 다시 도전하기 버튼 */}
          <button
            onClick={() => {
              setSelectedImage(null);
              setImagePreview(null);
              setResult(null);
            }}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> 새로운 사진으로 다시 도전하기
          </button>
        </section>
      )}
    </main>
  );
}
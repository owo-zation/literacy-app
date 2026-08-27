"use client";

import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import { Camera, RefreshCw, Award, AlertCircle, CheckCircle2, BookOpen } from "lucide-react";

// 초등 2학년 과학 예시 데이터
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

  // 이미지 선택 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null); // 이전 결과 초기화
    }
  };

  // 분석 및 대조 요청
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

      // 100점 달성 시 축하 팡파레
      if (data.total_score === 100) {
        confetti({
          particleCount: 120,
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
    <main className="min-h-screen bg-amber-50/50 p-4 md:p-8 max-w-3xl mx-auto font-sans">
      {/* 헤더 */}
      <header className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-amber-900 flex items-center justify-center gap-2">
          ✏️ 쑥쑥 문해력 탐험대
        </h1>
        <p className="text-sm text-amber-700 mt-1">
          원본 글과 내 손글씨를 비교하고 100점 탐험가 배지에 도전해요!
        </p>
      </header>

      {/* 1. 예시 문장 선택 탭 */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 mb-5">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-800 text-sm">
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span>초등 2학년 과학 예시 선택하기</span>
        </div>
        <div className="flex gap-2 mb-3">
          {SCIENCE_EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setOriginalText(ex.text)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                originalText === ex.text
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {ex.title}
            </button>
          ))}
        </div>

        {/* 원본 글 텍스트 편집창 */}
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          원본 글 (직접 수정하거나 복사해 넣을 수 있어요)
        </label>
        <textarea
          value={originalText}
          onChange={(e) => setOriginalText(e.target.value)}
          rows={4}
          className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-amber-500 text-slate-800 resize-none"
        />
      </section>

      {/* 2. 손글씨 사진 업로드 */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 mb-5">
        <div className="flex items-center gap-2 mb-3 font-bold text-slate-800 text-sm">
          <Camera className="w-4 h-4 text-amber-600" />
          <span>손글씨 사진 찍기 또는 가져오기</span>
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 mb-3">
            <img src={imagePreview} alt="손글씨 미리보기" className="w-full max-h-64 object-contain mx-auto" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm"
            >
              다시 선택
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-amber-200 rounded-xl flex flex-col items-center justify-center gap-2 text-amber-700 bg-amber-50/50 hover:bg-amber-100/50 transition cursor-pointer"
          >
            <Camera className="w-8 h-8 text-amber-500" />
            <span className="text-sm font-medium">사진 촬영 또는 앨범에서 선택</span>
          </button>
        )}

        {/* 대조하기 버튼 */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !selectedImage}
          className="w-full mt-2 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>탐험 대장이 꼼꼼히 채점 중...</span>
            </>
          ) : (
            <span>🔍 꼼꼼히 대조하고 점수 받기</span>
          )}
        </button>
      </section>

      {/* 3. 분석 결과 카드 */}
      {result && (
        <section className="bg-white rounded-2xl p-5 shadow-lg border border-amber-200 space-y-4 animate-in fade-in duration-300">
          {/* 점수판 */}
          <div className="text-center pb-4 border-b border-slate-100">
            <span className="text-xs font-semibold px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
              도전 결과
            </span>
            <div className="text-5xl font-black text-amber-600 my-2">
              {result.total_score}
              <span className="text-2xl font-bold text-slate-400"> / 100점</span>
            </div>
            <p className="text-sm font-medium text-slate-700">{result.praise_message}</p>

            {result.total_score === 100 && (
              <div className="mt-3 inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs px-3 py-1.5 rounded-lg font-bold border border-yellow-300">
                <Award className="w-4 h-4 text-yellow-600" />
                <span>🥇 문해력 마스터 황금 배지 획득!</span>
              </div>
            )}
          </div>

          {/* 손글씨 판독 내용 */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-xs font-bold text-slate-500 mb-1">📝 AI가 읽은 내 손글씨</p>
            <p className="text-sm text-slate-800 leading-relaxed">{result.extracted_text}</p>
          </div>

          {/* 오류 및 피드백 목록 */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>찾아낸 실수와 꿀팁</span>
            </h3>

            {result.errors.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>틀린 곳이 하나도 없어요! 완벽합니다 🎉</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {result.errors.map((err, idx) => (
                  <div key={idx} className="p-3 bg-red-50/50 border border-red-100 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                        {err.category} (-{err.deducted_points}점)
                      </span>
                      <span className="text-slate-400">
                        <span className="line-through text-red-500">{err.wrong_text}</span> ➔ <b className="text-emerald-600">{err.correct_text}</b>
                      </span>
                    </div>
                    <p className="text-slate-700 pt-1 font-medium leading-relaxed">
                      💡 {err.child_friendly_reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 다시 쓰기 버튼 */}
          <button
            onClick={() => {
              setSelectedImage(null);
              setImagePreview(null);
              setResult(null);
            }}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 다시 도전하기
          </button>
        </section>
      )}
    </main>
  );
}
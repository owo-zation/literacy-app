"use client";

import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { 
  Camera, RefreshCw, Award, Sparkles, CheckCircle2, 
  BookOpen, Lightbulb, ChevronRight, Play, Pause, 
  Timer, Trophy, Gift, X, ScanText, UploadCloud, ListFilter, Edit3
} from "lucide-react";

// 초등 2학년 과학 예시 데이터
const SCIENCE_EXAMPLES = [
  {
    id: 1,
    title: "촉촉한 달팽이 이야기",
    level: 1,
    text: "비가 내리는 촉촉한 날, 화단에서 기어가는 달팽이를 본 적이 있나요? 달팽이는 몸이 아주 말랑말랑하고 촉촉합니다. 달팽이의 몸이 마르면 위험해지기 때문에, 달팽이는 햇볕이 쨍쨍한 날보다 비가 오거나 흐린 날에 주로 움직입니다. 달팽이의 머리에는 더듬이가 두 쌍 있습니다. 긴 더듬이 끝에는 눈이 있어서 밝고 어두운 것을 구별합니다. 짧은 더듬이는 냄새를 맡는 역할을 합니다. 달팽이는 딱딱한 껍데기를 가지고 태어나며, 몸이 자랄수록 껍데기도 함께 커집니다. 위험한 상황이 오면 달팽이는 껍데기 속으로 쏙 숨어 몸을 보호합니다."
  },
  {
    id: 2,
    title: "자석의 신기한 힘",
    level: 2,
    text: "자석은 철로 된 물건을 끌어당기는 특별한 힘이 있습니다. 자석에는 N극과 S극이 있는데, 서로 다른 극끼리는 달라붙고 같은 극끼리는 서로 밀어냅니다. 우리 생활 속 냉장고 문이나 필통에도 자석이 숨어 있습니다."
  },
  {
    id: 3,
    title: "씨앗의 싹트기",
    level: 2,
    text: "땅속에 심은 작은 씨앗은 물과 햇빛을 받으면 싹을 틔웁니다. 뿌리가 먼저 땅속 깊이 내려가 물을 마시고, 줄기와 잎이 흙을 뚫고 올라와 햇빛을 만납니다."
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

interface Coupon {
  id: string;
  title: string;
  date: string;
  timeSpent: string;
}

export default function Home() {
  const [docTitle, setDocTitle] = useState("사용자글");
  const [originalText, setOriginalText] = useState(SCIENCE_EXAMPLES[0].text);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // 모달 상태
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // 타이머 관련 상태
  const [timerRunning, setTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [savedTimeSpent, setSavedTimeSpent] = useState<string | null>(null);

  // 게이미피케이션 상태
  const [totalExp, setTotalExp] = useState(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

 // 상단 ref 선언부
const fileInputRef = useRef<HTMLInputElement>(null);
const sourceImageInputRef = useRef<HTMLInputElement>(null);
const textareaRef = useRef<HTMLTextAreaElement>(null); // 추가

  // 텍스트 내용 변경 시 높이 자동 조절 (스크롤바 제거)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [originalText]);

  useEffect(() => {
    const savedExp = localStorage.getItem("literacy_exp");
    const savedCoupons = localStorage.getItem("literacy_coupons");
    if (savedExp) setTotalExp(parseInt(savedExp, 10));
    if (savedCoupons) setCoupons(JSON.parse(savedCoupons));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}분 ${secs < 10 ? "0" : ""}${secs}초`;
  };

  const getLevelInfo = (exp: number) => {
    const level = Math.floor(exp / 100) + 1;
    const currentExp = exp % 100;
    let title = "새싹 탐험가 🌱";
    if (level >= 3) title = "우수 탐험가 🌿";
    if (level >= 5) title = "문해력 박사 🌳";
    if (level >= 10) title = "전설의 마스터 👑";
    return { level, currentExp, title };
  };

  const { level, currentExp, title } = getLevelInfo(totalExp);

  // 원본 책/지문 사진 OCR 추출 핸들러
  const handleSourceImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOcrLoading(true);

      const formData = new FormData();
      formData.append("sourceImage", file);

      try {
        const res = await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("원본 글 텍스트 추출에 실패했습니다.");
        const data = await res.json();
        setOriginalText(data.text);
        setDocTitle("사용자글"); // 사진으로 추출 시 기본 제목
      } catch (err: any) {
        alert(err.message || "텍스트 추출 중 오류가 발생했습니다.");
      } finally {
        setOcrLoading(false);
      }
    }
  };

  // 손글씨 이미지 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null);

      if (timerRunning) {
        setTimerRunning(false);
      }
      setSavedTimeSpent(formatTime(seconds));
    }
  };

  // 대조 분석 요청
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

      const newExp = totalExp + data.total_score;
      setTotalExp(newExp);
      localStorage.setItem("literacy_exp", newExp.toString());

      if (data.total_score === 100) {
        confetti({
          particleCount: 160,
          spread: 90,
          origin: { y: 0.6 }
        });

        const newCoupon: Coupon = {
          id: Date.now().toString(),
          title: `🏆 [${docTitle}] 황금 칭찬 쿠폰`,
          date: new Date().toLocaleDateString("ko-KR"),
          timeSpent: savedTimeSpent || formatTime(seconds)
        };
        const updatedCoupons = [newCoupon, ...coupons];
        setCoupons(updatedCoupons);
        localStorage.setItem("literacy_coupons", JSON.stringify(updatedCoupons));
      }
    } catch (err: any) {
      alert(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-amber-50/40 p-4 md:p-8 max-w-3xl mx-auto font-sans pb-16">
      {/* 상단 레벨 & 쿠폰함 바 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200/80 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">
            Lv.{level}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">{title}</span>
              <span className="text-[11px] text-amber-700 bg-amber-100 font-semibold px-2 py-0.5 rounded-full">
                누적 {totalExp} EXP
              </span>
            </div>
            <div className="w-36 md:w-48 bg-slate-100 h-2 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${currentExp}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCouponModal(true)}
          className="flex items-center gap-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
        >
          <Gift className="w-4 h-4 text-orange-600" />
          <span>쿠폰함 ({coupons.length})</span>
        </button>
      </div>

      {/* 헤더 */}
      <header className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-amber-950 flex items-center justify-center gap-2">
          ✏️ 쑥쑥 문해력 탐험대
        </h1>
        <p className="text-xs md:text-sm text-amber-800 mt-1">
          시간을 재며 바르게 쓰고, 100점 황금 칭찬 쿠폰을 모아보세요!
        </p>
      </header>

      {/* 1. 원본 글 준비하기 섹션 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>1. 원본 글 준비하기</span>
          </div>

          <div className="flex items-center gap-2">
            {/* 예시 글 목록보기 버튼 */}
            <button
              onClick={() => setShowExampleModal(true)}
              className="flex items-center gap-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
            >
              <ListFilter className="w-3.5 h-3.5 text-slate-600" />
              <span>📚 예시 글 목록보기</span>
            </button>

            {/* 원본 사진 OCR 버튼 */}
            <input
              type="file"
              accept="image/*"
              ref={sourceImageInputRef}
              onChange={handleSourceImageChange}
              className="hidden"
            />
            <button
              onClick={() => sourceImageInputRef.current?.click()}
              disabled={ocrLoading}
              className="flex items-center gap-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
            >
              {ocrLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>글자 추출 중...</span>
                </>
              ) : (
                <>
                  <ScanText className="w-3.5 h-3.5 text-amber-600" />
                  <span>📷 책 사진 찍어 넣기</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 글 제목 입력 필드 */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-bold text-slate-500 shrink-0">제목:</span>
          <input
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full text-xs md:text-sm font-semibold text-slate-800 bg-transparent focus:outline-none"
          />
        </div>

        {/* 원본 텍스트 직접 수정/확인 창 */}
        <textarea
          ref={textareaRef}
          value={originalText}
          onChange={(e) => setOriginalText(e.target.value)}
          placeholder="여기에 원본 문장을 직접 쓰거나 사진을 찍어 글자를 가져오세요."
          className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-amber-500 text-slate-800 resize-none leading-relaxed overflow-hidden"
        />
      </section>

      {/* 2. 손글씨 필사 타이머 & 사진 업로드 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 mb-6 space-y-4">
        {/* 스톱워치 */}
        <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-amber-600 animate-pulse" />
            <div>
              <p className="text-[11px] font-semibold text-amber-800">필사 시간 측정</p>
              <p className="text-base font-black text-amber-950 font-mono">
                {formatTime(seconds)}
              </p>
            </div>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                timerRunning
                  ? "bg-rose-500 hover:bg-rose-600 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              }`}
            >
              {timerRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> 멈춤
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> 쓰기 시작
                </>
              )}
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setSeconds(0);
              }}
              className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 손글씨 사진 업로드 */}
        <div>
          <div className="flex items-center gap-2 mb-2 font-bold text-slate-800 text-sm">
            <Camera className="w-4 h-4 text-amber-600" />
            <span>2. 손글씨 사진 올리기</span>
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
                className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm transition"
              >
                사진 다시 고르기
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-7 border-2 border-dashed border-amber-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-amber-800 bg-amber-50/50 hover:bg-amber-100/50 transition cursor-pointer mb-3"
            >
              <UploadCloud className="w-7 h-7 text-amber-500" />
              <span className="text-xs font-semibold">필사를 마친 후 사진을 찍거나 올려주세요</span>
            </button>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading || !selectedImage}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>탐험 대장이 꼼꼼하게 대조 중...</span>
              </>
            ) : (
              <span>🔍 꼼꼼히 대조하고 배움 얻기</span>
            )}
          </button>
        </div>
      </section>

      {/* 3. 분석 결과 카드 */}
      {result && (
        <section className="bg-white rounded-3xl p-6 shadow-xl border border-amber-200 space-y-6 animate-in fade-in duration-300">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-sm mb-0.5">탐험 대장의 한마디</h3>
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                {result.praise_message}
              </p>
              {savedTimeSpent && (
                <p className="text-[11px] text-amber-700 font-semibold mt-1">
                  ⏱️ 필사 완주 시간: {savedTimeSpent}
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <p className="text-xs font-bold text-slate-500 mb-1.5">📝 AI가 읽어낸 내 손글씨</p>
            <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-normal bg-white p-3 rounded-xl border border-slate-100">
              {result.extracted_text}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm md:text-base font-bold text-slate-900">
                알아두면 쑥쑥 자라는 글쓰기 비밀
              </h2>
            </div>

            {result.errors.length === 0 ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs md:text-sm flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <span className="font-bold">와우! 틀린 곳 없이 완벽해요! 100점 배지가 쿠폰함에 쏙 들어갔어요 🎉</span>
              </div>
            ) : (
              <div className="space-y-3">
                {result.errors.map((err, idx) => (
                  <div key={idx} className="p-3.5 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2 text-xs bg-white px-2.5 py-1 rounded-lg border border-orange-100/80 w-fit">
                      <span className="line-through text-red-500 font-medium">{err.wrong_text}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                      <span className="text-emerald-700 font-bold">{err.correct_text}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-normal leading-relaxed pl-1">
                      💡 {err.child_friendly_reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {result.errors.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 mb-2">
                📊 분류별 수정 내역
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.errors.map((err, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold text-[10px]">
                        {err.category}
                      </span>
                      <span className="text-slate-600 truncate text-[11px]">{err.wrong_text}</span>
                    </div>
                    <span className="text-red-500 font-bold shrink-0 ml-2 text-xs">
                      -{err.deducted_points}점
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 text-center">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
              최종 점수 및 획득 경험치
            </span>
            <div className="text-4xl font-black text-amber-600 my-1">
              {result.total_score} <span className="text-lg font-bold text-amber-400">/ 100점</span>
            </div>
            <p className="text-xs text-amber-800 font-semibold">
              +{result.total_score} EXP를 얻었어요!
            </p>

            {result.total_score === 100 ? (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-yellow-400 text-amber-950 text-xs px-4 py-1.5 rounded-full font-black shadow-sm animate-bounce">
                <Award className="w-4 h-4 text-amber-900" />
                <span>🥇 황금 칭찬 쿠폰 획득! (쿠폰함 저장됨)</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-2">
                위의 글쓰기 꿀팁을 보고 다시 도전하면 100점 쿠폰을 받을 수 있어요!
              </p>
            )}
          </div>

          <button
            onClick={() => {
              setSelectedImage(null);
              setImagePreview(null);
              setResult(null);
              setSeconds(0);
            }}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> 새로운 사진으로 다시 도전하기
          </button>
        </section>
      )}

      {/* 4. 예시 글 목록 모달 */}
      {showExampleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>초등 2학년 과학 예시 글 목록</span>
              </div>
              <button
                onClick={() => setShowExampleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {SCIENCE_EXAMPLES.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => {
                    setDocTitle(ex.title);
                    setOriginalText(ex.text);
                    setSeconds(0);
                    setTimerRunning(false);
                    setShowExampleModal(false);
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    originalText === ex.text
                      ? "bg-amber-50 border-amber-300 ring-2 ring-amber-200"
                      : "bg-slate-50 border-slate-200 hover:bg-amber-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-800">{ex.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                      난이도 Lv.{ex.level}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {ex.text}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowExampleModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 5. 칭찬 쿠폰함 모달 */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>나의 칭찬 쿠폰함</span>
              </div>
              <button
                onClick={() => setShowCouponModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {coupons.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                아직 획득한 쿠폰이 없어요.<br />100점을 맞아 첫 번째 황금 쿠폰을 모아보세요! 🌟
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-amber-900">{coupon.title}</p>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        {coupon.date} | 완주: {coupon.timeSpent}
                      </p>
                    </div>
                    <Award className="w-6 h-6 text-amber-500 shrink-0" />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowCouponModal(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
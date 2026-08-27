"use client";

import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { 
  Camera, RefreshCw, Award, Sparkles, CheckCircle2, 
  BookOpen, Lightbulb, ChevronRight, Play, Pause, 
  Timer, Trophy, Gift, X, ScanText, UploadCloud, ListFilter, 
  Edit3, Volume2, Eye, EyeOff, PenTool, Headphones, Mic, Square, VolumeUp
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

interface ReadFeedback {
  category: string;
  target_text: string;
  advice: string;
}

interface ReadResult {
  transcribed_text: string;
  read_score: number;
  feedback_list: ReadFeedback[];
  praise_message: string;
}

interface Coupon {
  id: string;
  title: string;
  date: string;
  timeSpent: string;
}

export default function Home() {
  // 모드: "copy" (필사) | "dictation" (받아쓰기) | "read" (소리내어 낭독)
  const [learningMode, setLearningMode] = useState<"copy" | "dictation" | "read">("copy");

  const [docTitle, setDocTitle] = useState("사용자글");
  const [originalText, setOriginalText] = useState(SCIENCE_EXAMPLES[0].text);
  
  // 손글씨 모드 상태
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // 낭독(녹음) 모드 상태
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [readLoading, setReadLoading] = useState(false);
  const [readResult, setReadResult] = useState<ReadResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 받아쓰기 전용 상태
  const [hideText, setHideText] = useState(true);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<0.8 | 1.0>(0.8);

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceImageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sentences = originalText
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

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

  // 음성 재생 (TTS) 
  const speakText = (text: string, rate: number = 0.8) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("현재 브라우저는 음성 읽어주기 기능을 지원하지 않습니다.");
      return;
    }

    window.speechSynthesis.cancel(); // 이전 음성 정지

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = rate; // 또박또박한 속도
    utterance.pitch = 1.05;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // 모범 낭독 재생 / 멈춤 토글 
  const handleToggleModelReading = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      speakText(originalText, 0.9);
    }
  };

  // 녹음 시작
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        // 마이크 스트림 트랙 종료
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setReadResult(null);
      setTimerRunning(true);
      setSeconds(0);
    } catch (err) {
      alert("마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해주세요.");
    }
  };

  // 녹음 중지
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setTimerRunning(false);
      setSavedTimeSpent(formatTime(seconds));
    }
  };

  // 낭독 오디오 분석 요청
  const handleAnalyzeRead = async () => {
    if (!audioBlob) {
      alert("먼저 목소리를 녹음해 주세요!");
      return;
    }

    setReadLoading(true);
    const formData = new FormData();
    formData.append("originalText", originalText);
    formData.append("audio", audioBlob, "reading_audio.webm");

    try {
      const res = await fetch("/api/read-analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("낭독 분석에 실패했습니다.");

      const data: ReadResult = await res.json();
      setReadResult(data);

      const newExp = totalExp + data.read_score;
      setTotalExp(newExp);
      localStorage.setItem("literacy_exp", newExp.toString());

      if (data.read_score === 100) {
        confetti({
          particleCount: 160,
          spread: 90,
          origin: { y: 0.6 }
        });

        const newCoupon: Coupon = {
          id: Date.now().toString(),
          title: `🏆 [${docTitle} (낭독)] 황금 칭찬 쿠폰`,
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
      setReadLoading(false);
    }
  };

  // 원본 사진 OCR 추출 핸들러
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
        setDocTitle("사용자글");
        setCurrentSentenceIndex(0);
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

  // 손글씨 대조 분석 요청
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

        const modeTag = learningMode === "dictation" ? "받아쓰기" : "필사";
        const newCoupon: Coupon = {
          id: Date.now().toString(),
          title: `🏆 [${docTitle} (${modeTag})] 황금 칭찬 쿠폰`,
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
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200/80 mb-5 flex items-center justify-between">
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
      <header className="text-center mb-5">
        <h1 className="text-2xl md:text-3xl font-black text-amber-950 flex items-center justify-center gap-2">
          ✏️ 쑥쑥 문해력 탐험대
        </h1>
        <p className="text-xs md:text-sm text-amber-800 mt-1">
          보고 쓰기(필사), 귀로 듣기(받아쓰기), 큰 소리로 읽기(낭독)로 문해력을 완성해요!
        </p>
      </header>

      {/* 학습 모드 전환 탭 (3개 모드) */}
      <div className="grid grid-cols-3 gap-1.5 bg-amber-200/60 p-1.5 rounded-2xl mb-5 shadow-inner">
        <button
          onClick={() => {
            setLearningMode("copy");
            setHideText(false);
          }}
          className={`py-2 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1 transition cursor-pointer ${
            learningMode === "copy"
              ? "bg-white text-amber-950 shadow-sm"
              : "text-amber-800 hover:text-amber-950"
          }`}
        >
          <PenTool className="w-3.5 h-3.5 text-amber-600" />
          <span>✍️ 보고 쓰기</span>
        </button>

        <button
          onClick={() => {
            setLearningMode("dictation");
            setHideText(true);
          }}
          className={`py-2 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1 transition cursor-pointer ${
            learningMode === "dictation"
              ? "bg-white text-amber-950 shadow-sm"
              : "text-amber-800 hover:text-amber-950"
          }`}
        >
          <Headphones className="w-3.5 h-3.5 text-amber-600" />
          <span>🎧 받아쓰기</span>
        </button>

        <button
          onClick={() => {
            setLearningMode("read");
            setHideText(false);
          }}
          className={`py-2 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1 transition cursor-pointer ${
            learningMode === "read"
              ? "bg-white text-amber-950 shadow-sm"
              : "text-amber-800 hover:text-amber-950"
          }`}
        >
          <Mic className="w-3.5 h-3.5 text-amber-600" />
          <span>🎙️ 소리내 읽기</span>
        </button>
      </div>

      {/* 1. 지문 준비 및 본문 영역 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>1. 학습할 지문 준비</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExampleModal(true)}
              className="flex items-center gap-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
            >
              <ListFilter className="w-3.5 h-3.5 text-slate-600" />
              <span>📚 예시 글 목록</span>
            </button>

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
                  <span>추출 중...</span>
                </>
              ) : (
                <>
                  <ScanText className="w-3.5 h-3.5 text-amber-600" />
                  <span>📷 책 사진 추출</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 제목 입력 */}
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

        {/* 받아쓰기 모드 전용 컨트롤러 */}
        {learningMode === "dictation" && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <Volume2 className="w-4 h-4 text-amber-600" />
                <span>문장별 듣기 ({currentSentenceIndex + 1}/{sentences.length})</span>
              </span>

              <div className="flex items-center gap-1 bg-white border border-amber-200 rounded-lg p-0.5 text-[11px]">
                <button
                  onClick={() => setSpeechRate(0.8)}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    speechRate === 0.8 ? "bg-amber-500 text-white" : "text-slate-600"
                  }`}
                >
                  0.8x (천천히)
                </button>
                <button
                  onClick={() => setSpeechRate(1.0)}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    speechRate === 1.0 ? "bg-amber-500 text-white" : "text-slate-600"
                  }`}
                >
                  1.0x (보통)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => sentences[currentSentenceIndex] && speakText(sentences[currentSentenceIndex], speechRate)}
                disabled={isSpeaking}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold text-xs md:text-sm rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Volume2 className={`w-4 h-4 ${isSpeaking ? "animate-bounce" : ""}`} />
                <span>{isSpeaking ? "읽어주는 중..." : `🔊 ${currentSentenceIndex + 1}번 문장 듣기`}</span>
              </button>

              <button
                onClick={() => speakText(originalText, speechRate)}
                className="px-3 py-3 bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl transition whitespace-nowrap cursor-pointer"
              >
                전체 듣기
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                disabled={currentSentenceIndex === 0}
                onClick={() => {
                  setCurrentSentenceIndex(prev => Math.max(0, prev - 1));
                  window.speechSynthesis.cancel();
                }}
                className="px-3 py-1.5 bg-white border border-amber-200 rounded-lg disabled:opacity-40 font-semibold text-slate-700 cursor-pointer"
              >
                ◀ 이전 문장
              </button>

              <button
                onClick={() => setHideText(!hideText)}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
              >
                {hideText ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{hideText ? "지문 슬쩍 보기" : "지문 다시 가리기"}</span>
              </button>

              <button
                disabled={currentSentenceIndex >= sentences.length - 1}
                onClick={() => {
                  setCurrentSentenceIndex(prev => Math.min(sentences.length - 1, prev + 1));
                  window.speechSynthesis.cancel();
                }}
                className="px-3 py-1.5 bg-white border border-amber-200 rounded-lg disabled:opacity-40 font-semibold text-slate-700 cursor-pointer"
              >
                다음 문장 ▶
              </button>
            </div>
          </div>
        )}

        {/* 낭독 모드 원본 글 낭독 가이드 */}
        {learningMode === "read" && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-amber-600" />
              <span>선생님 목소리로 먼저 들어볼까요?</span>
            </span>
            <button
              onClick={handleToggleModelReading}
              className={`px-3 py-1.5 border font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                isSpeaking
                  ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 animate-pulse"
                  : "bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
              }`}
            >
              {isSpeaking ? (
                <>
                  <Square className="w-3 h-3 fill-white" />
                  <span>낭독 멈추기</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>모범 낭독 듣기</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 텍스트 본문 */}
        <div className="relative">
          {learningMode === "dictation" && hideText && (
            <div className="absolute inset-0 bg-amber-50/95 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center p-4 z-10 border border-amber-200/80 text-center">
              <Headphones className="w-8 h-8 text-amber-500 mb-1" />
              <p className="text-xs font-bold text-amber-950">받아쓰기 모드가 켜져 있어요!</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                위의 <b>[🔊 문장 듣기]</b> 버튼을 누르고 공책에 써보세요.
              </p>
              <button
                onClick={() => setHideText(false)}
                className="mt-2.5 text-[11px] px-3 py-1 bg-white border border-amber-300 text-amber-800 rounded-lg font-bold shadow-xs hover:bg-amber-100 transition cursor-pointer"
              >
                👀 지문 잠깐 확인하기
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={originalText}
            onChange={(e) => {
              setOriginalText(e.target.value);
              setCurrentSentenceIndex(0);
            }}
            placeholder="여기에 원본 문장을 직접 쓰거나 사진을 찍어 글자를 가져오세요."
            className="w-full text-sm p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-amber-500 text-slate-800 resize-none leading-relaxed overflow-hidden"
          />
        </div>
      </section>

      {/* 2-A. [낭독 모드 전용] 마이크 녹음 및 코칭 받기 섹션 */}
      {learningMode === "read" && (
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 mb-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <Mic className="w-4 h-4 text-amber-600" />
            <span>2. 큰 소리로 또박또박 읽기</span>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 text-center space-y-3">
            <div className="font-mono text-2xl font-black text-amber-950">
              {formatTime(seconds)}
            </div>

            {isRecording ? (
              <button
                onClick={stopRecording}
                className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-base animate-pulse cursor-pointer"
              >
                <Square className="w-5 h-5 fill-white" />
                <span>다 읽었어요! (녹음 멈추기)</span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                <Mic className="w-5 h-5" />
                <span>🎙️ 낭독 시작하기 (마이크 켜기)</span>
              </button>
            )}

            {audioUrl && !isRecording && (
              <div className="pt-2 space-y-2">
                <p className="text-xs font-bold text-slate-600">내 목소리 들어보기</p>
                <audio src={audioUrl} controls className="w-full h-10 mx-auto" />
              </div>
            )}
          </div>

          {audioBlob && !isRecording && (
            <button
              onClick={handleAnalyzeRead}
              disabled={readLoading}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {readLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>탐험 대장이 목소리를 귀 기울여 듣고 있어요...</span>
                </>
              ) : (
                <span>🌟 낭독 실력 꼼꼼히 코칭받기</span>
              )}
            </button>
          )}
        </section>
      )}

      {/* 2-B. [필사/받아쓰기 모드] 손글씨 사진 업로드 섹션 */}
      {learningMode !== "read" && (
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 mb-6 space-y-4">
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-amber-600 animate-pulse" />
              <div>
                <p className="text-[11px] font-semibold text-amber-800">
                  {learningMode === "dictation" ? "받아쓰기 소요 시간" : "필사 소요 시간"}
                </p>
                <p className="text-base font-black text-amber-950 font-mono">
                  {formatTime(seconds)}
                </p>
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
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
                    <Play className="w-3.5 h-3.5" /> 시작
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setSeconds(0);
                }}
                className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold cursor-pointer"
              >
                초기화
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 font-bold text-slate-800 text-sm">
              <Camera className="w-4 h-4 text-amber-600" />
              <span>2. 공책에 쓴 손글씨 사진 올리기</span>
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
                  className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm transition cursor-pointer"
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
                <span className="text-xs font-semibold">
                  {learningMode === "dictation"
                    ? "받아쓰기를 마친 후 공책 사진을 찍어 올려주세요"
                    : "필사를 마친 후 사진을 찍거나 올려주세요"}
                </span>
              </button>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading || !selectedImage}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer"
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
      )}

      {/* 3-A. [낭독 모드 분석 결과] */}
      {learningMode === "read" && readResult && (
        <section className="bg-white rounded-3xl p-6 shadow-xl border border-amber-200 space-y-6 animate-in fade-in duration-300">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-sm mb-0.5">낭독 대장의 한마디</h3>
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                {readResult.praise_message}
              </p>
              {savedTimeSpent && (
                <p className="text-[11px] text-amber-700 font-semibold mt-1">
                  ⏱️ 낭독 완주 시간: {savedTimeSpent}
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <p className="text-xs font-bold text-slate-500 mb-1.5">🎙️ AI가 들은 내 목소리 글자</p>
            <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-normal bg-white p-3 rounded-xl border border-slate-100">
              {readResult.transcribed_text}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm md:text-base font-bold text-slate-900">
                더 또박또박 멋지게 읽는 꿀팁
              </h2>
            </div>

            {readResult.feedback_list.length === 0 ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs md:text-sm flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <span className="font-bold">발음과 끊어 읽기가 아나운서처럼 완벽해요! 100점 배지가 발급되었어요 🎉</span>
              </div>
            ) : (
              <div className="space-y-3">
                {readResult.feedback_list.map((fb, idx) => (
                  <div key={idx} className="p-3.5 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                        {fb.category}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{fb.target_text}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-normal leading-relaxed pl-1">
                      💡 {fb.advice}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 text-center">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
              낭독 유창성 점수
            </span>
            <div className="text-4xl font-black text-amber-600 my-1">
              {readResult.read_score} <span className="text-lg font-bold text-amber-400">/ 100점</span>
            </div>
            <p className="text-xs text-amber-800 font-semibold">
              +{readResult.read_score} EXP를 얻었어요!
            </p>

            {readResult.read_score === 100 ? (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-yellow-400 text-amber-950 text-xs px-4 py-1.5 rounded-full font-black shadow-sm animate-bounce">
                <Award className="w-4 h-4 text-amber-900" />
                <span>🥇 낭독 마스터 황금 쿠폰 획득! (쿠폰함 저장됨)</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-2">
                선생님 꿀팁을 보고 다시 소리 내어 읽으면 100점을 받을 수 있어요!
              </p>
            )}
          </div>
        </section>
      )}

      {/* 3-B. [필사/받아쓰기 분석 결과] */}
      {learningMode !== "read" && result && (
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
                  ⏱️ {learningMode === "dictation" ? "받아쓰기" : "필사"} 완주 시간: {savedTimeSpent}
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
                    setCurrentSentenceIndex(0);
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
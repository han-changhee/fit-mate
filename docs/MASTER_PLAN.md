# FitMate — AI 개인화 운동 관리 웹앱 마스터 플랜

> 토스 인앱(Apps in Toss) 미니앱으로 구동되는 AI 개인화 운동 루틴 추천 서비스의 기획 · 수익화(BM) · 기술 아키텍처 · 배포 전략 통합 문서.

**작성 기준일**: 2026-07-24
**대상 플랫폼**: 토스 인앱 웹뷰 (Apps in Toss, `@apps-in-toss/web-framework` 기반)

---

## 목차
1. [서비스 기획 및 UI/UX 스펙](#1-서비스-기획-및-uiux-스펙)
2. [광고 노출 및 수익화 전략 (BM)](#2-광고-노출-및-수익화-전략-bm)
3. [기술 아키텍처 및 구현 계획](#3-기술-아키텍처-및-구현-계획)
4. [배포 및 토스 SDK 연동 체크리스트](#4-배포-및-토스-sdk-연동-체크리스트)

> **참고**: 이 워크스페이스의 기존 토스 인앱 프로젝트(`toss-coin-jump`, `dawn-peach`)를 조사해 실제 사용 가능한 `@apps-in-toss/web-framework` API와 컨벤션을 확인한 뒤 작성했다. 아래 문서에 등장하는 함수/모듈명(`TossAds`, `IAP`, `TossPay`, `requestNotificationAgreement` 등)은 실제 SDK export 기준이다.

---

## 1. 서비스 기획 및 UI/UX 스펙

### 1.1 핵심 사용자 여정 (User Journey)

```
토스 앱 진입
   │
   ▼
[스플래시/로딩] ── 익명 사용자 식별(getAnonymousKey) ──▶ 최초 사용자?
   │                                                        │
   │ Yes                                                    │ No
   ▼                                                        ▼
[온보딩 3단계]                                        [홈 — 오늘의 루틴]
 ① 체력 수준 선택                                            │
 ② 운동 목적 선택(다이어트/근력/유연성/재활 등)                    │
 ③ 선호 부위 선택(상체/하체/코어/전신, 중복 가능)                  │
   │                                                        │
   └────────────────────────────────────────────────────────┘
                              │
                              ▼
                    [홈 — 오늘의 루틴 카드]
                    스트릭, 오늘 목표, "루틴 생성/시작" CTA
                              │
                              ▼
                 [AI 루틴 생성 대기 화면] (2~4초, 전면광고 자리)
                              │
                              ▼
                      [루틴 상세/미리보기]
                      운동 목록, 예상 소요시간, 난이도
                              │
                              ▼
                        [운동 진행 화면]
                    타이머 + 세트/횟수 기록 + 다음 동작
                              │
                              ▼
                      [운동 완료 화면]
                보상(포인트/뱃지) + 보상형 광고 + 공유
                              │
                              ▼
                    [히스토리 / 통계 화면]
                주간 캘린더, 누적 운동량, 스트릭 그래프
```

핵심 원칙: **"3탭 이내에 오늘의 운동을 시작할 수 있어야 한다"**. 홈 화면 진입 → 루틴 생성 대기 → 운동 시작까지 최소 클릭 경로를 유지한다.

### 1.2 필수 화면 구조

| # | 화면 | 목적 | 진입 조건 | 이탈/다음 액션 |
|---|------|------|-----------|----------------|
| 1 | 온보딩 (3스텝) | 체력/목적/선호부위 수집 | 최초 실행(로컬 `Storage`에 플래그 없음) | 완료 시 홈으로, `Storage`에 프로필 저장 |
| 2 | 홈 | 오늘의 루틴 진입점, 스트릭/레벨 노출 | 앱 재진입 시 기본 화면 | "루틴 생성" 탭 → 대기 화면 |
| 3 | 루틴 생성 대기 | AI 응답 대기 시간을 자연스럽게 소비 | 홈에서 CTA 클릭 | API 응답 도착 시 자동 전환(+전면광고 후) |
| 4 | 루틴 상세/미리보기 | 오늘 루틴 확인, 부위/난이도 재조정 | 생성 완료 | "시작하기" → 운동 진행 |
| 5 | 운동 진행 | 실시간 타이머/세트 기록 | 루틴 시작 | 마지막 동작 완료 시 완료 화면 |
| 6 | 운동 완료 | 성취감 제공, 보상 지급, 공유 유도 | 모든 세트 완료 또는 중도 종료 | 홈 또는 히스토리로 |
| 7 | 히스토리/통계 | 리텐션 유도, 성장 시각화 | 하단 탭 or 홈에서 진입 | 뒤로가기 |
| 8 | 설정/프로필 | 알람 시간 설정, 구독 관리 | 하단 탭 | 뒤로가기 |

레이아웃 원칙: 토스 인앱 웹뷰는 세로 고정, 노치/제스처 영역이 있으므로 `env(safe-area-inset-*)`를 모든 화면 상/하단 여백에 반영한다(iOS 스와이프 뒤로가기 제스처는 `setIosSwipeGestureEnabled`로 필요 시 제어).

### 1.3 게이미피케이션 요소

- **스트릭(연속 출석)**: 하루 1회 이상 운동 완료 시 스트릭 +1. 스트릭 끊김 방지용 "프리즈" 아이템(보상형 광고 시청 또는 구독자 무료 제공)
- **레벨/뱃지 시스템**: 누적 운동 횟수 기반 레벨업, 부위별 마스터 뱃지(예: "코어 10회 완료 → 코어 마스터")
- **주간 챌린지**: 매주 갱신되는 미션(예: "이번 주 3회 이상 운동"), 완료 시 포인트 지급
- **캐릭터/아바타 성장**: 운동 완료 포인트로 아바타 커스터마이징 아이템 획득 — 시각적 진척감을 주는 저비용 리텐션 장치
- **친구 공유 랭킹**: `getTossShareLink(path, ogImageUrl)`로 개인 기록 공유 링크 생성, `share()`로 네이티브 공유 시트 호출

### 1.4 리워드 아이디어

- 운동 완료 직후 보상형 동영상 광고 시청 → 포인트 2배 지급
- `grantPromotionReward`를 활용한 프로모션성 보상(신규 유입 이벤트, 복귀 유저 리워드 등 서버 컨트롤 캠페인)
- `requestReview()` 호출은 "10일 연속 달성 직후"처럼 사용자가 긍정적 감정을 느끼는 타이밍에만 1회성으로 트리거(과다 호출 시 심사/사용자 경험에 악영향)

---

## 2. 광고 노출 및 수익화 전략 (BM)

### 2.1 광고 배치 지도

| 위치 | 광고 유형 | SDK 호출 | 노출 빈도 제한 | 비고 |
|------|-----------|----------|----------------|------|
| AI 루틴 생성 대기 화면 | 전면 광고 | `loadFullScreenAd()` → `showFullScreenAd()` | 세션당 1회, 최소 3분 간격 | 사용자가 대기 중이라 이탈 손실 최소, 체감 로딩 시간과 자연스럽게 겹침 |
| 홈 화면 카드 사이 | 배너 | `TossAds.attachBanner(adGroupId, container, { theme: 'auto', variant: 'card' })` | 상시 노출, `onNoFill`/`onAdFailedToRender` 시 자동 숨김 | 콘텐츠 흐름 방해 최소화 위해 카드 사이 1곳만 |
| 운동 진행(타이머) 화면 하단 | 배너 | `TossAds.attachBanner` | 상시, 실패 시 숨김 | 콘텐츠를 가리지 않는 하단 배너만 — 전면광고는 여전히 금지(공통 원칙 참고) |
| 운동 완료 화면 | 보상형 동영상 | `loadFullScreenAd()`/`showFullScreenAd()`(리워드형 슬롯) | 사용자가 명시적으로 "보상받기" 탭할 때만 | 강제 노출 금지 — 옵트인만 |
| 히스토리/통계 화면 하단 | 배너 | `TossAds.attachBanner` | 상시, 실패 시 숨김 | 부가 화면이라 낮은 우선순위 |

**공통 원칙**
- 앱 시작 시 `TossAds.initialize()` 1회 호출, 이후 각 화면에서 `isSupported()` 체크(`safeIsSupported` 래퍼로 감싸 웹뷰 밖 프리뷰에서도 안전하게 동작)
- 전면 광고는 "사용자가 어차피 기다리는 지점"에만 배치하고, 운동 진행 중(타이머 도중)에는 절대 노출하지 않는다 — 몰입 흐름을 깨는 배치는 리텐션에 직접적으로 악영향
- 광고 로드 실패는 항상 조용히 실패(UI 숨김)하도록 처리하여 전체 화면이 깨지지 않게 한다(`dawn-peach/src/components/AdBanner.tsx`의 try/catch + `onAdFailedToRender` 패턴 재사용)

### 2.2 추가 수익 모델

**프리미엄 루틴 구독 (핵심 부가 수익원)**
- `IAP.createSubscriptionPurchaseOrder({ options: { sku, offerId, ... } })`로 월간/연간 구독 상품 결제
- 구독 혜택: 광고 전체 제거, AI 루틴 고도화(부상 이력/식단 연동 등 정교한 프롬프트), 전문 트레이너 제작 루틴팩 무제한 열람, 스트릭 프리즈 무제한
- 결제-지급 흐름: `IAP.getPendingOrders()` → 서버에서 영수증 검증 → `IAP.completeProductGrant({ params: { orderId } })`로 지급 확정. 앱 재실행 시 `IAP.getCompletedOrRefundedOrders()`로 구독 상태 동기화(환불 반영)

**1회성 상품**
- 특정 전문가 루틴팩(예: "4주 마라톤 대비 팩")을 단건 결제로 판매: `TossPay.checkoutPayment({ params: { payToken } })`
- 정기결제가 필요한 별도 빌링 시나리오는 `TossPay.requestTossPayPaysBilling({ wrappedToken })` 활용 가능(구독은 IAP 우선 검토, 페이먼츠 자체 빌링은 특수 케이스용)

**서버 검증 원칙**
- 모든 결제 완료/환불 이벤트는 클라이언트 신뢰 없이 **서버(Edge Function)에서 주문 상태를 재검증한 뒤** 재화(구독 상태, 프리미엄 플래그)를 지급한다. 클라이언트에서 받은 `orderId`만으로 즉시 지급하지 않는다.

### 2.3 수익화 우선순위 로드맵

1. **MVP**: 배너 광고(홈) + 전면 광고(루틴 생성 대기) — 별도 서버 없이도 광고 SDK 초기화만으로 즉시 매출 발생
2. **1차 확장**: 보상형 광고(운동 완료) — 사용자 옵트인 기반이라 이탈 리스크 낮음
3. **2차 확장**: 프리미엄 구독(IAP) — AI 루틴 품질 차별화가 선행되어야 전환율이 나옴, 최소 1~2개월 무료 사용자 데이터 축적 후 도입 권장

---

## 3. 기술 아키텍처 및 구현 계획

### 3.1 추천 기술 스택

기존 워크스페이스의 두 토스 인앱 프로젝트(`toss-coin-jump`, `dawn-peach`)와 동일한 컨벤션을 따른다 — 이미 검증된 조합이며 토스 인앱 심사/배포 파이프라인과 호환성이 확인되어 있다.

| 영역 | 선택 | 비고 |
|------|------|------|
| 프레임워크 | React 18 + TypeScript | `dawn-peach`와 동일 |
| 번들러 | rsbuild (`@rsbuild/core`, `@rsbuild/plugin-react`) | Vite보다 토스 인앱 빌드 요구사항과의 호환성이 이미 검증됨 |
| 스타일 | Tailwind CSS v4 (`@rsbuild/plugin-tailwindcss`) | 유틸리티 클래스 직접 사용, 별도 CSS 구조 최소화 |
| 토스 SDK | `@apps-in-toss/web-framework` | 광고(TossAds/GoogleAdMob), 결제(IAP/TossPay), 알림, Storage, 위치 등 브릿지 전부 포함 |
| 백엔드 | Vercel Edge Functions (`api/*.ts`) | `dawn-peach` 패턴과 동일 — 서버 시크릿(AI API 키) 보호 목적 |
| AI 루틴 생성 | Gemini API (Google AI Studio) | 무료 티어로 시작 가능(`gemini-flash-lite-latest` 기준), 서버 사이드에서만 호출, 클라이언트에 API 키 노출 금지 |
| 로컬 개발 | rsbuild dev server + middleware | `server.setup`에서 `api/*.ts`와 동일한 핸들러 함수를 재사용해 `npm run dev`만으로 전체 플로우 검증 |

### 3.2 디렉토리 구조 (제안)

```
fit-mate/
├── granite.config.ts          # Apps-in-Toss 앱 매니페스트
├── rsbuild.config.ts          # 번들러 설정 + dev 미들웨어
├── package.json
├── tsconfig.json
├── index.html
├── api/
│   └── routine.ts             # Vercel Edge Function: AI 루틴 생성
├── src/
│   ├── index.tsx
│   ├── App.tsx                 # 화면 상태 전환(라우터 없이 useState 기반, 소규모 앱에 적합)
│   ├── screens/
│   │   ├── OnboardingScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── RoutineLoadingScreen.tsx
│   │   ├── RoutinePreviewScreen.tsx
│   │   ├── WorkoutSessionScreen.tsx
│   │   ├── WorkoutCompleteScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── AdBanner.tsx        # dawn-peach 패턴 재사용
│   │   ├── WorkoutTimer.tsx
│   │   ├── StreakBadge.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useUserProfile.ts   # Storage 브릿지 + localStorage 폴백
│   │   ├── useStreak.ts
│   │   └── useWorkoutReminder.ts
│   ├── lib/
│   │   ├── bridgeSupport.ts    # safeIsSupported 래퍼
│   │   ├── adSupport.ts        # 광고 지원 여부 체크
│   │   ├── iapSupport.ts       # 구독/결제 지원 여부 체크
│   │   └── routineApi.ts       # /api/routine 호출 래퍼
│   └── constants/
└── docs/
    └── MASTER_PLAN.md          # 본 문서
```

### 3.3 AI 루틴 추천 데이터 흐름

```
[클라이언트]                         [Vercel Edge Function]              [Gemini API]
사용자 프로필(체력/목적/부위)
    │  POST /api/routine
    ▼
──────────────────────────────▶  api/routine.ts
                                      │  프롬프트 구성
                                      │  (프로필 + 최근 운동 이력)
                                      ▼
                                 ──────────────────▶  Gemini API 호출
                                                          (responseSchema로 구조화된 JSON 강제)
                                                          │
                                      ◀──────────────────  루틴 JSON 응답
                                      │  스키마 검증/정규화
    ◀──────────────────────────────  │
루틴 JSON 렌더링                      응답 반환
```

**API 명세 초안 — `POST /api/routine`**

Request:
```json
{
  "fitnessLevel": "beginner | intermediate | advanced",
  "goal": "weight_loss | muscle_gain | flexibility | rehab",
  "targetAreas": ["upper", "lower", "core", "full_body"],
  "recentHistory": [
    { "date": "2026-07-23", "completedAreas": ["core"] }
  ]
}
```

Response:
```json
{
  "routineId": "r_20260724_abc123",
  "estimatedMinutes": 25,
  "difficulty": "intermediate",
  "exercises": [
    {
      "name": "플랭크",
      "targetArea": "core",
      "sets": 3,
      "durationSec": 40,
      "restSec": 20,
      "notes": "허리가 처지지 않도록 유지"
    }
  ]
}
```

- 프로덕션: `api/routine.ts`를 Vercel Edge Function(`export const config = { runtime: 'edge' }`)으로 구현
- 로컬 개발: `rsbuild.config.ts`의 `server.setup`에서 동일 핸들러 함수를 `/api/routine` 미들웨어로 마운트(`dawn-peach/rsbuild.config.ts` 패턴)
- Gemini API 키는 서버 전용 env(`GEMINI_API_KEY`)로만 접근, 클라이언트 번들에 절대 포함되지 않도록 함
- Google AI Studio(aistudio.google.com)에서 무료로 API 키 발급 가능. 무료 티어는 모델별 분당/일일 요청 한도가 있으므로 사용자 증가 시 유료 티어 전환 필요

### 3.4 알람/푸시 구현 전략

토스 인앱 웹뷰는 일반 브라우저의 Web Push API(Service Worker 기반)를 사용할 수 없는 제약이 있다. 이를 고려해 2단계 전략을 제안한다.

**1차 전략 — 토스 인앱 알림 브릿지**
- `requestNotificationAgreement({ options: { templateCode }, onEvent, onError })`로 사용자 알림 동의를 받는다
- `templateCode`는 **토스 파트너 콘솔에서 사전 승인받아야 발급**되므로, 실제 발송 가능한 알림 문구/시점을 미리 기획하고 심사 신청 필요(개발 착수 전 리드타임으로 고려)
- 사용자가 설정 화면에서 지정한 운동 시간을 서버에 저장 → 서버 스케줄러(예: cron)가 해당 시간에 맞춰 알림 발송을 트리거

**2차 전략 — 인앱 로컬 리마인드 (보조 수단)**
- 앱이 포그라운드에 있을 때, 클라이언트 로컬 타이머로 "오늘의 운동 아직 안 하셨어요" 배너를 홈 화면 진입 시 조건부 노출(마지막 운동 완료 시각 기준)
- 네이티브 푸시가 승인되기 전(개발 초기)에도 최소한의 리마인드 경험을 제공하기 위한 폴백

**공통 안전 패턴**
- 모든 SDK `.isSupported()` 체크는 인앱 웹뷰 밖(일반 브라우저 프리뷰)에서 예외를 던지므로, `lib/bridgeSupport.ts`의 `safeIsSupported()`로 항상 감싼다
- 사용자 프로필/스트릭 등 로컬 상태는 `Storage`(토스 브릿지) 우선 사용, 브릿지 미지원 환경(프리뷰)에서는 `window.localStorage`로 자동 폴백

---

## 4. 배포 및 토스 SDK 연동 체크리스트

### 4.1 SDK 연동 가이드라인

- [ ] `granite.config.ts`에 앱 매니페스트 작성: `appName`, `brand.displayName`/`icon`/`primaryColor`, `webViewProps.type`, 필요한 `permissions`(예: 알림 관련 권한) 선언
- [ ] 앱 최초 진입 시점에 `TossAds.initialize()` 1회 호출 후 광고 관련 기능 사용
- [ ] 토스 파트너 콘솔에서 사전 등록/승인 필요 항목 확인:
  - 광고 슬롯(`adGroupId`) 발급
  - IAP 상품(구독/소모성/비소모성) 등록 및 심사
  - 알림 템플릿 코드(`templateCode`) 승인
- [ ] 모든 SDK 호출 지점에 `isSupported()` + try/catch 안전 래핑 적용(인앱 웹뷰 밖 프리뷰/테스트 환경 대응)

### 4.2 출시 전 필수 검증

**보안**
- [ ] User-Agent 검증 및 `webViewProps` 설정으로 비정상 접근(일반 브라우저 직접 접속 등) 시 안내 화면 처리
- [ ] AI API 키, 결제 검증 키 등 시크릿이 클라이언트 번들에 포함되지 않았는지 빌드 산출물(`dist/`) 검사
- [ ] 결제/구독 지급은 반드시 서버 사이드 재검증 후 처리(클라이언트 신뢰 금지)

**성능**
- [ ] Lighthouse 모바일 성능 점수 목표 설정 및 측정(FCP/LCP/TBT 기준 관리)
- [ ] 번들 경량화: 코드 스플리팅(화면 단위 lazy load), 이미지 최소 포맷/사이즈 적용
- [ ] 저사양 단말 및 불안정 네트워크(지하철 등) 환경 시나리오 테스트

**QA**
- [ ] 광고/결제 플로우 샌드박스 환경 e2e 테스트(전면광고 노출, 보상형 광고 지급, 구독 결제-환불 흐름)
- [ ] iOS WKWebView / Android WebView 양쪽에서 터치 반응성, 안전영역(safe-area) 렌더링 확인
- [ ] 인앱 웹뷰 밖(일반 브라우저) 프리뷰 시 앱이 크래시 없이 "기능 미지원" 상태로 우아하게 동작하는지 확인

**토스 심사 대응**
- [ ] 알림 발송 문구/빈도가 스팸성으로 판단되지 않도록 사전 조율
- [ ] 광고 노출이 콘텐츠/핵심 기능을 가리거나 오인 클릭을 유도하지 않는지 셀프 점검
- [ ] 개인정보(위치, 운동 이력 등) 수집 목적과 `permissions` 선언이 일치하는지 확인

---

## 다음 단계

이 문서는 기획·BM·기술·배포 관점의 통합 계획이다. 진행 현황과 남은 순서는 다음과 같다.

1. ~~`granite.config.ts` / `rsbuild.config.ts` / 기본 React 골격 스캐폴딩~~ — 완료
2. ~~온보딩 → 홈 → 루틴 생성 대기까지 코어 플로우 프로토타입(더미 루틴 데이터)~~ — 완료
3. ~~`api/routine.ts` 구현 및 Gemini API 연동~~ — 완료(코드 반영), **`GEMINI_API_KEY` 환경변수 설정만 남음**
4. Vercel 배포 연결 — CLI로 1차 배포 완료(https://fit-mate-cyan.vercel.app), GitHub 저장소 자동 연결은 별도 승인 필요
5. 광고 SDK 연동(배너 → 전면 → 보상형 순으로 단계적 적용)
6. 토스 파트너 콘솔 앱 등록 및 광고 슬롯/알림 템플릿 코드 발급
7. IAP 구독 연동은 무료 사용자 데이터/피드백 축적 이후 착수

// .ait로 빌드된 앱은 우리 웹 정적 자산을 로컬로 번들링해서 오프라인으로 띄우기
// 때문에, 상대경로(`/api/...`)로 fetch하면 배포된 Vercel 서버가 아니라 그 로컬
// 번들의 오리진을 기준으로 해석돼 요청이 엉뚱한 곳으로 간다. 그래서 API 호출은
// 항상 절대 URL로 실제 서버를 명시한다.
export const API_BASE_URL = 'https://fit-mate-cyan.vercel.app';

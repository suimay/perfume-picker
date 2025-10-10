export default function App() {
  return (
    <div style={{padding: 24, fontFamily: "ui-sans-serif, system-ui"}}>
      <h1 style={{fontSize: 24, marginBottom: 8}}>✅ App 렌더링 성공</h1>
      <p>이 화면이 보이면 Vite→React→root 마운트 체인은 정상입니다.</p>
      <ul>
        <li>만약 기존 App에서 흰 화면이면, 컴포넌트/컨텍스트 내부 에러일 가능성이 큽니다.</li>
        <li>브라우저 콘솔의 빨간 에러를 캡처해서 알려 주세요.</li>
      </ul>
    </div>
  );
}

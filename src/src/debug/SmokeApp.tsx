export default function SmokeApp() {
  return (
    <div style={{padding: 24, fontFamily: "ui-sans-serif, system-ui"}}>
      <h1 style={{fontSize: 24, marginBottom: 8}}>✅ Smoke Test OK</h1>
      <p>이 화면이 보이면 Vite/React/엔트리/루트는 모두 정상입니다.</p>
      <ol>
        <li><code>index.html</code>을 원래 엔트리(<code>/src/main.tsx</code>)로 되돌리세요.</li>
        <li>그 다음 기존 <code>App.tsx</code>로 교체해보며 어느 지점에서 깨지는지 확인하세요.</li>
      </ol>
    </div>
  );
}

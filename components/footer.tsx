export default function Footer() {
  const go = () => {
    window.open('https://beian.miit.gov.cn/')
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        fontSize: 12,
        background: '#555555',
        padding: 20,
        color: '#eee'
      }}
    >
      <span onClick={go} style={{ cursor: 'pointer' }}>赣ICP2024021529号-1</span>
      <span style={{ color: '#959595' }}> | Copyright © 2024-2027 swagger-ts</span>
    </div>
  );
}

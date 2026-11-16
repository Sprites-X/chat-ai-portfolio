import './projects.css';

// ผลงานส่วนตัวของสมาชิก (ข้อมูลอยู่ที่ projects ใน data/team.js) ใช้ร่วมกันในห้อง, แอป team ของ OS และ Neural
// detailed = แสดงทักษะและรายละเอียดเป็นข้อ ๆ ถ้าไม่ใส่จะแสดงแค่สรุปบรรทัดเดียว (การ์ดในห้องมีที่น้อย)
// level = ระดับหัวข้อของชื่อโปรเจกต์ ให้ต่อจากหัวข้อของหน้านั้น (เช่น ชื่อสมาชิกเป็น h2 ชื่อโปรเจกต์เป็น h3)
// onPick = ถ้าใส่ ชื่อโปรเจกต์จะเป็นปุ่ม (Neural ใช้เปิดจุดของโปรเจกต์บนเครือข่าย)
export function ProjectList({ projects, detailed = false, level = 3, onPick }) {
  if (!projects?.length) return null;
  return (
    <section className="projects" aria-label="ผลงานส่วนตัว">
      <p className="projects-title">ผลงานส่วนตัว</p>
      {projects.map((p) => (
        <ProjectItem key={p.id} project={p} detailed={detailed} level={level} onPick={onPick} />
      ))}
    </section>
  );
}

// ป้ายของลิงก์: repo บน GitHub ขึ้น "GitHub" ลิงก์อื่น (เช่นหน้า demo หรือฟอร์ม) ขึ้น "ลองใช้" หรือตั้งเองด้วย urlLabel
function linkLabel(p) {
  if (p.urlLabel) return p.urlLabel;
  return /^https:\/\/github\.com\//.test(p.url) ? 'GitHub' : 'ลองใช้';
}

export function ProjectItem({ project: p, detailed = false, level = 3, onPick }) {
  const H = `h${Math.min(6, Math.max(2, level))}`;
  return (
    <article className="project">
      <H className="project-name">
        {onPick ? (
          <button className="project-pick" type="button" onClick={() => onPick(p.id)}>{p.name}</button>
        ) : (
          p.name
        )}
      </H>
      <p className="project-meta">
        {p.meta}
        {p.url && (
          <>
            {' · '}
            <a href={p.url} target="_blank" rel="noopener">{linkLabel(p)} ↗</a>
          </>
        )}
      </p>
      {detailed ? (
        <>
          <div className="chips">{p.stack.map((s) => <span key={s} className="chip">{s}</span>)}</div>
          <ul className="project-points">
            {p.points.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </>
      ) : (
        <p className="project-summary">{p.summary}</p>
      )}
    </article>
  );
}

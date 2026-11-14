import { useEffect, useMemo, useRef, useState } from 'react';
import { useOs } from '../osContext.js';
import { listFiles, readFile, rawUrl, fileInfo, BLOB_URL } from '../github.js';

// เรียงแบบ VS Code: โฟลเดอร์ก่อนไฟล์ในทุกชั้น
const treeKey = (p) => p.split('/').map((c, i, a) => `${i < a.length - 1 ? 0 : 1}${c.toLowerCase()}`).join('/');

export default function Files() {
  const { filePath, openFile, runInTerminal, phone } = useOs();
  const [repo, setRepo] = useState({ live: null, files: [] });
  const [loaded, setLoaded] = useState({}); // path → { text } หรือ { error } (เก็บไว้ ไม่ต้องโหลดซ้ำ)
  const viewRef = useRef(null);

  useEffect(() => {
    let on = true;
    listFiles().then((r) => on && setRepo(r));
    return () => {
      on = false;
    };
  }, []);

  const info = fileInfo(filePath);
  const content = loaded[filePath] || {};
  useEffect(() => {
    if (info.kind !== 'text' || loaded[filePath]) return undefined;
    let on = true;
    readFile(filePath)
      .then((text) => on && setLoaded((m) => ({ ...m, [filePath]: { text } })))
      .catch((e) => on && setLoaded((m) => ({ ...m, [filePath]: { error: e.message } })));
    return () => {
      on = false;
    };
  }, [filePath, info.kind, loaded]);

  // แปลงรายชื่อไฟล์เป็นแถวของต้นไม้ (หัวโฟลเดอร์ + ไฟล์)
  const rows = useMemo(() => {
    const out = [];
    const seen = new Set();
    [...repo.files].sort((a, b) => treeKey(a).localeCompare(treeKey(b))).forEach((path) => {
      const parts = path.split('/');
      for (let i = 1; i < parts.length; i++) {
        const dir = parts.slice(0, i).join('/');
        if (!seen.has(dir)) {
          seen.add(dir);
          out.push({ dir: true, key: dir + '/', name: parts[i - 1] + '/', depth: i - 1 });
        }
      }
      out.push({ dir: false, key: path, name: parts[parts.length - 1], depth: parts.length - 1 });
    });
    return out;
  }, [repo.files]);

  const pick = (path) => {
    openFile(path);
    if (phone) viewRef.current?.scrollIntoView({ block: 'start' });
  };

  let body;
  if (info.kind === 'image') body = <img className="fimg" src={rawUrl(filePath)} alt={`ไฟล์ภาพ ${filePath}`} />;
  else if (info.kind === 'big') body = <span className="l empty">ไฟล์นี้ยาวมาก ไม่แสดงตรงนี้ กด "เปิดบน GitHub" เพื่อดูไฟล์เต็ม</span>;
  else if (content.error) body = <span className="l empty">โหลดไฟล์ไม่ได้ ({content.error}) กด "เปิดบน GitHub" แทนได้</span>;
  else if (content.text === undefined) body = <span className="l empty">กำลังโหลดจาก GitHub…</span>;
  else body = content.text.replace(/\n$/, '').split('\n').map((line, i) => <span key={i} className="l">{line || ' '}</span>);

  return (
    <>
      <nav className="ftree" aria-label="ไฟล์ใน repo">
        {repo.live === false && <p className="fnote">ดึงรายชื่อไฟล์ล่าสุดจาก GitHub ไม่ได้ ตอนนี้แสดงรายชื่อสำรองแทน</p>}
        {rows.map((r) =>
          r.dir ? (
            <div key={r.key} className="fdir" style={{ '--d': r.depth }}>{r.name}</div>
          ) : (
            <button key={r.key} className="fitem" type="button" style={{ '--d': r.depth }} title={r.key} aria-current={filePath === r.key} onClick={() => pick(r.key)}>
              {r.name}
            </button>
          ),
        )}
      </nav>
      <div className="fview" ref={viewRef}>
        <div className="fhead">
          <p className="fpath">{filePath}</p>
          <div className="fmeta">
            <span className="chip">{info.own}</span>
            {info.desc && <span>{info.desc}</span>}
          </div>
          <div className="links">
            {info.kind === 'text' && <button className="btn" type="button" onClick={() => runInTerminal('cat ' + filePath)}>cat ใน terminal</button>}
            <a className="btn" href={BLOB_URL + filePath} target="_blank" rel="noopener">เปิดบน GitHub ↗</a>
          </div>
        </div>
        <pre className="fcode" tabIndex={0} aria-label="เนื้อหาไฟล์">{body}</pre>
      </div>
    </>
  );
}

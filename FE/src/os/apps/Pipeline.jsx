import { useEffect, useRef, useState } from 'react';
import { ACTIONS_URL } from '../github.js';

// จำลองการทำงานของ .github/workflows/ci-cd.yml: เลือกไฟล์ที่แก้แล้วดูว่า job ไหนรัน/ข้าม
const SCENARIOS = {
  fe: { file: 'FE/src/App.jsx', be: false, fe: true },
  be: { file: 'BE/index.js', be: true, fe: false },
  md: { file: 'README.md', be: false, fe: false, md: true },
  wf: { file: 'ci-cd.yml', be: true, fe: true },
};
const JOBS = ['detect', 'test-be', 'test-fe', 'build-be', 'build-fe', 'scan-be', 'scan-fe', 'deploy-be', 'deploy-fe'];
const LABEL = { wait: 'รอ', run: 'กำลังรัน', pass: 'ผ่าน', skip: 'ข้าม', block: 'ไม่ได้รัน' };
const INITIAL_JOBS = { detect: 'pass', 'test-be': 'pass', 'test-fe': 'pass', 'build-be': 'skip', 'build-fe': 'pass', 'scan-be': 'skip', 'scan-fe': 'pass', 'deploy-be': 'skip', 'deploy-fe': 'pass' };
const INITIAL_LOG = [
  { t: '$ merge PR → main  # แก้ FE/src/App.jsx' },
  { t: 'detect     be-changed=false fe-changed=true' },
  { t: 'build-be   ข้าม · โค้ด BE ไม่เปลี่ยน', c: 'dim' },
  { t: 'deploy-fe  ยิง Deploy Hook ของ Render ✓' },
  { t: 'เสร็จ · เว็บจริงอัปเดตแล้ว', c: 'ok' },
];
const pad = (s) => s.padEnd(11, ' ');

export default function Pipeline() {
  const [file, setFile] = useState('fe');
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [log, setLog] = useState(INITIAL_LOG);
  const [running, setRunning] = useState(false);
  const alive = useRef(true);
  const logRef = useRef(null);
  useEffect(() => () => { alive.current = false; }, []);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  const setJob = (id, s) => alive.current && setJobs((j) => ({ ...j, [id]: s }));
  const say = (t, c) => alive.current && setLog((l) => [...l, { t, c }]);

  async function lane(side, changed, sha) {
    setJob('test-' + side, 'run');
    await pause(side === 'be' ? 1100 : 1400);
    setJob('test-' + side, 'pass');
    say(pad('test-' + side) + (side === 'be' ? 'node --test ✓' : 'npm run build ✓'));
    if (!changed) {
      ['build', 'scan', 'deploy'].forEach((k) => setJob(`${k}-${side}`, 'skip'));
      say(pad('build-' + side) + `ข้าม · โค้ด ${side.toUpperCase()} ไม่เปลี่ยน`, 'dim');
      return;
    }
    setJob('build-' + side, 'run');
    await pause(1200);
    setJob('build-' + side, 'pass');
    say(pad('build-' + side) + `push portfolio-${side}:${sha}`);
    setJob('scan-' + side, 'run');
    await pause(900);
    setJob('scan-' + side, 'pass');
    say(pad('scan-' + side) + 'trivy · ไม่พบ CRITICAL ที่แก้ได้');
    setJob('deploy-' + side, 'run');
    await pause(800);
    setJob('deploy-' + side, 'pass');
    say(pad('deploy-' + side) + 'Render deploy hook ✓');
  }

  async function merge() {
    if (running) return;
    setRunning(true);
    const s = SCENARIOS[file];
    const sha = Math.random().toString(16).slice(2, 9).padEnd(7, '0');
    setJobs(Object.fromEntries(JOBS.map((j) => [j, 'wait'])));
    setLog([{ t: `$ merge PR → main  # แก้ ${s.file}` }]);
    setJob('detect', 'run');
    await pause(600);
    setJob('detect', 'pass');
    say(pad('detect') + (s.md ? '.md ไม่นับ → ' : '') + `be-changed=${s.be} fe-changed=${s.fe}`);
    await Promise.all([lane('be', s.be, sha), lane('fe', s.fe, sha)]);
    say(s.be || s.fe ? 'เสร็จ · เว็บจริงอัปเดตแล้ว' : 'เสร็จ · test ผ่าน ไม่มีอะไรต้อง deploy', 'ok');
    if (alive.current) setRunning(false);
  }

  async function pushMain() {
    if (running) return;
    setRunning(true);
    setJobs(Object.fromEntries(JOBS.map((j) => [j, 'block'])));
    setLog([{ t: '$ git push origin main' }]);
    await pause(500);
    say('remote: error: GH013: Repository rule violations found for refs/heads/main.', 'bad');
    say('remote: - Changes must be made through a pull request.', 'bad');
    say('remote: - Required status checks "test-be" and "test-fe" are expected.', 'bad');
    say(' ! [remote rejected] main -> main', 'bad');
    if (alive.current) setRunning(false);
  }

  return (
    <>
      <p>เลือกไฟล์ที่แก้แล้วกด merge ระบบ build และ deploy เฉพาะฝั่งที่โค้ดเปลี่ยน</p>
      <fieldset className="files">
        <legend>ไฟล์ที่แก้</legend>
        {Object.entries(SCENARIOS).map(([k, s]) => (
          <label key={k} className="fopt">
            <input type="radio" name="pipe-file" value={k} checked={file === k} onChange={() => setFile(k)} />
            <span>{s.file}</span>
          </label>
        ))}
      </fieldset>
      <div className="links">
        <button className="btn btn-solid" type="button" disabled={running} onClick={merge}>merge PR เข้า main</button>
        <button className="btn" type="button" disabled={running} onClick={pushMain}>push ตรงเข้า main</button>
      </div>
      <div className="jobs">
        {JOBS.map((j) => (
          <div key={j} className={'job' + (j === 'detect' ? ' job-detect' : '')} data-state={jobs[j]}>
            <b>{j}</b>
            <span>{LABEL[jobs[j]]}</span>
          </div>
        ))}
      </div>
      <pre className="log" ref={logRef} aria-live="polite">
        {log.map((l, i) => <span key={i} className={l.c}>{l.t + '\n'}</span>)}
      </pre>
      <p className="pf-role">
        นี่คือการจำลอง ของจริงจาก merge ถึง deploy ใช้ราว 1 นาทีครึ่ง ดูรันจริงได้ที่ <a href={ACTIONS_URL} target="_blank" rel="noopener">GitHub Actions</a> · ดูแลโดย พงศกร ศรีทอง
      </p>
    </>
  );
}

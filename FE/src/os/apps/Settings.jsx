import { WALLPAPERS, APPS } from '../appList.js';
import { useOs } from '../osContext.js';

export default function Settings() {
  const { wall, setWall, tile, reboot } = useOs();
  return (
    <>
      <fieldset className="walls">
        <legend>วอลเปเปอร์</legend>
        {Object.entries(WALLPAPERS).map(([k, [color, label]]) => (
          <label key={k} className="wopt">
            <input type="radio" name="wall" value={k} checked={wall === k} onChange={() => setWall(k)} />
            <i style={{ backgroundColor: color }} />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="links">
        <button className="btn m-hide" type="button" onClick={tile}>จัดหน้าต่างใหม่</button>
        <button className="btn" type="button" onClick={reboot}>รีบูตเครื่อง</button>
      </div>
      <div className="box">
        <p className="kicker">เกี่ยวกับเครื่องนี้</p>
        <p>ByteMind OS 1.0 · {APPS.length} แอป · ทำเพื่อนำเสนอโปรเจกต์ Chat AI Portfolio วิชา AIE312</p>
      </div>
    </>
  );
}

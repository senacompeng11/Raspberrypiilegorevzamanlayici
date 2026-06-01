// ===== CLOCK =====
function tick() {
  const clk = document.getElementById('clk');
  if (clk) {
    clk.textContent = new Date().toLocaleTimeString('tr-TR');
  }
}
setInterval(tick, 1000);
tick();

// ===== STATE =====
let e1Count = 0;
let e2Count = 0;
let prevLight = null;
let fanTimer = null;
let fanActive = false;
let smokeState = 'off'; // 'off' | 'on' | 'clearing'

function setFanSpin(active) {
  const g1 = document.getElementById('fanBladesG');
  const g2 = document.getElementById('extFanBladesG');

  [g1, g2].forEach(function(g) {
    if (!g) return;
    if (active) {
      g.style.animation = 'fanSpin 0.4s linear infinite';
      g.style.transformOrigin = '10px 10px';
    } else {
      g.style.animation = '';
    }
  });
}

// ===== DUMAN YARDIMCI =====
function setSmoke(state) {
  if (state === smokeState) return;

  const box = document.getElementById('smokeBox');
  if (!box) return;

  if (state === 'on') {
    box.className = 'smoke-container';
    smokeState = 'on';
  } else if (state === 'clearing') {
    smokeState = 'clearing';
    box.className = 'smoke-container smoke-clear';

    setTimeout(function () {
      if (smokeState === 'clearing') {
        box.className = 'smoke-container smoke-off';
        smokeState = 'off';
      }
    }, 1200);
  } else {
    box.className = 'smoke-container smoke-off';
    smokeState = 'off';
  }
}

// ===== BUZZER YARDIMCI =====
function setBuzzer(active) {
  const body = document.getElementById('bBody');
  const rays = document.getElementById('bRays');
  const ring1 = document.getElementById('bRing1');
  const ring2 = document.getElementById('bRing2');
  const ring3 = document.getElementById('bRing3');
  const status = document.getElementById('bStatus');
  const bzzr = document.getElementById('bzzr');

  if (!body) return;

  if (active) {
    body.className = 'b-body ringing';
    if (rays) rays.className = 'b-rays lit';
    if (ring1) ring1.className = 'b-ring r1';
    if (ring2) ring2.className = 'b-ring r2';
    if (ring3) ring3.className = 'b-ring r3';
    if (status) {
      status.className = 'buzzer-status-txt bon';
      status.textContent = 'ÇALIYOR';
    }
    if (bzzr) {
      bzzr.textContent = 'AÇIK';
      bzzr.className = 'atag on';
    }
  } else {
    body.className = 'b-body';
    if (rays) rays.className = 'b-rays';
    if (ring1) ring1.className = 'b-ring r1 off';
    if (ring2) ring2.className = 'b-ring r2 off';
    if (ring3) ring3.className = 'b-ring r3 off';
    if (status) {
      status.className = 'buzzer-status-txt boff';
      status.textContent = 'KAPALI';
    }
    if (bzzr) {
      bzzr.textContent = 'KAPALI';
      bzzr.className = 'atag off';
    }
  }
}

// ===== LAPTOP ANİMASYON YARDIMCI =====
function setLaptopLDR(isLight) {
  if (isLight === prevLight) return;
  prevLight = isLight;

  const lid = document.getElementById('lid');
  const lidBack = document.getElementById('lidBack');
  const scr = document.getElementById('scr');
  const glow = document.getElementById('glow');
  const ind = document.getElementById('ldrInd');
  const lt = document.getElementById('ldrTxt');
  const lidSt = document.getElementById('lidSt');
  const scrOff = document.getElementById('scrOff');
  const hwLogo = document.getElementById('hwLogo');
  const img = document.getElementById('ldrImg');

  if (isLight) {
    if (lid) lid.classList.add('open');
    if (scr) scr.classList.add('on');
    if (glow) glow.className = 'glow on';
    if (ind) ind.className = 'ldr-ind lt';
    if (lt) lt.textContent = 'Aydınlık';
    if (lidSt) {
      lidSt.textContent = 'Açık ✓';
      lidSt.style.color = '#16a34a';
    }
    if (scrOff) scrOff.style.display = 'none';
    if (hwLogo) hwLogo.style.opacity = '0';
    if (lidBack) lidBack.style.opacity = '0';
    if (img) img.style.display = 'block';
  } else {
    if (lid) lid.classList.remove('open');
    if (scr) scr.classList.remove('on');
    if (glow) glow.className = 'glow off';
    if (ind) ind.className = 'ldr-ind dk';
    if (lt) lt.textContent = 'Karanlık';
    if (lidSt) {
      lidSt.textContent = 'Kapalı';
      lidSt.style.color = '#64748b';
    }
    if (scrOff) scrOff.style.display = 'flex';
    if (hwLogo) hwLogo.style.opacity = '0.55';
    if (lidBack) lidBack.style.opacity = '1';
    if (img) img.style.display = 'none';
  }
}

// ===== ESP1 =====
function updateESP1(d) {
  if (!d || !d.received_at) return;

  const t = parseFloat(d.temperature) || 0;
  const ARC_LEN = 219.9;
  const offset = ARC_LEN - Math.min(1, Math.max(0, (t - 10) / 30)) * ARC_LEN;

  const arcEl = document.getElementById('tempArc');
  const tNumEl = document.getElementById('tNum');
  const badgeEl = document.getElementById('tempBadge');
  const tt = document.getElementById('e1task');
  const e1t = document.getElementById('e1t');
  const sTemp = document.getElementById('s-temp');
  const e1conn = document.getElementById('e1conn');
  const e1tot = document.getElementById('e1tot');

  if (arcEl) {
    arcEl.style.strokeDashoffset = offset;
    arcEl.style.stroke = t >= 28 ? '#ef4444' : t >= 25 ? '#f97316' : '#3b82f6';
  }

  if (tNumEl) tNumEl.textContent = t.toFixed(1);

  if (badgeEl) {
    if (t >= 28) {
      badgeEl.className = 'temp-badge hb';
      badgeEl.textContent = 'Kritik Sıcak';
    } else if (t >= 25) {
      badgeEl.className = 'temp-badge wb';
      badgeEl.textContent = 'Uyarı';
    } else {
      badgeEl.className = 'temp-badge nb';
      badgeEl.textContent = 'Normal';
    }
  }

  const tn = d.task_name || 'bekleniyor';
  if (tt) {
    tt.textContent = tn;
    tt.className = 'task-t ' + (tn === 'fan_ac' ? 'h' : tn === 'buzzer_on' ? 'w' : 'n');
  }

  if (e1t) e1t.textContent = d.received_at;
  if (sTemp) sTemp.textContent = t.toFixed(1) + '°';

  if (e1conn) {
    e1conn.textContent = 'Bağlı ✓';
    e1conn.style.color = '#16a34a';
  }

  e1Count++;
  if (e1tot) e1tot.textContent = e1Count;
}

// ===== ESP2 =====
function updateESP2(d) {
  if (!d || !d.received_at) return;

  const isLight = parseInt(d.value) === 1;

  const ldrRaw = document.getElementById('ldrRaw');
  const e2b = document.getElementById('e2b');
  const e2t = document.getElementById('e2t');
  const sldr = document.getElementById('s-ldr');
  const e2conn = document.getElementById('e2conn');
  const e2tot = document.getElementById('e2tot');

  if (ldrRaw) ldrRaw.textContent = d.value;
  if (e2b) e2b.textContent = '—';
  if (e2t) e2t.textContent = d.received_at;

  if (sldr) {
    sldr.textContent = isLight ? '☀ Aydınlık' : '● Karanlık';
    sldr.style.color = isLight ? '#b45309' : '#333';
  }

  if (e2conn) {
    e2conn.textContent = 'Bağlı ✓';
    e2conn.style.color = '#16a34a';
  }

  e2Count++;
  if (e2tot) e2tot.textContent = e2Count;
}

// ===== FIFO KUYRUK + ANİMASYON =====
function updateSched(data) {
  const ct = data.current_task;
  const q = data.queue || [];
  const box = document.getElementById('curBox');
  const nm = document.getElementById('curName');
  const dv = document.getElementById('curDev');
  const pw = document.getElementById('pbWrap');
  const rd = document.getElementById('rdot');

  if (ct) {
    if (box) box.className = 'cur';
    if (nm) {
      nm.className = 'cur-name';
      nm.textContent = ct.task_name;
    }
    if (dv) dv.textContent = ct.device_id.toUpperCase() + ' · ' + (ct.started_at || '');
    if (pw) pw.style.display = 'none';
    if (rd) rd.style.display = 'inline-block';

    const actv = document.getElementById('actv');
    if (actv) actv.textContent = ct.task_name;
  } else {
    if (box) box.className = 'cur empty';
    if (nm) {
      nm.className = 'cur-name idle';
      nm.textContent = '— Boşta —';
    }
    if (dv) dv.textContent = '';
    if (pw) pw.style.display = 'none';
    if (rd) rd.style.display = 'none';

    const actv = document.getElementById('actv');
    if (actv) actv.textContent = '—';
  }

  const taskName = ct ? ct.task_name : null;
  const activeDev = ct ? ct.device_id : null;
  const sv = document.getElementById('srvo');
  const fn = document.getElementById('fanst');

  if (activeDev === 'esp1' && taskName === 'buzzer_on') {
    setBuzzer(true);
    setSmoke('on');
    setLaptopLDR(false);

    if (fanActive) {
      fanActive = false;
      setFanSpin(false);
      clearTimeout(fanTimer);
    }

    if (sv) {
      sv.textContent = '90°';
      sv.className = 'atag off';
    }
    if (fn) {
      fn.textContent = 'KAPALI';
      fn.className = 'atag off';
    }

  } else if (activeDev === 'esp1' && taskName === 'fan_ac') {
    setBuzzer(false);
    setLaptopLDR(false);

    if (!fanActive) {
      fanActive = true;
      setFanSpin(true);

      if (smokeState === 'on') {
        clearTimeout(fanTimer);
        fanTimer = setTimeout(function () {
          setSmoke('clearing');
        }, 5000);
      } else {
        setSmoke('off');
      }
    }

    if (sv) {
      sv.textContent = 'DEVREDE';
      sv.className = 'atag act';
    }
    if (fn) {
      fn.textContent = 'AÇIK';
      fn.className = 'atag act';
    }

  } else if (activeDev === 'esp2' && taskName === 'laptop_ac') {
    setBuzzer(false);

    if (fanActive) {
      fanActive = false;
      setFanSpin(false);
      clearTimeout(fanTimer);
    }

    setSmoke('off');
    setLaptopLDR(true);

    if (sv) {
      sv.textContent = '—';
      sv.className = 'atag off';
    }
    if (fn) {
      fn.textContent = 'KAPALI';
      fn.className = 'atag off';
    }

  } else {
    setBuzzer(false);

    if (fanActive) {
      fanActive = false;
      setFanSpin(false);
      clearTimeout(fanTimer);
    }

    setSmoke('off');

    if (sv) {
      sv.textContent = '—';
      sv.className = 'atag off';
    }
    if (fn) {
      fn.textContent = 'KAPALI';
      fn.className = 'atag off';
    }
  }

  const esp1Running = ct && ct.device_id === 'esp1';
  const esp2InQueue = q.some(function (t) {
    return t.device_id === 'esp2';
  });

  const waitBanner = document.getElementById('esp2WaitBanner');
  if (waitBanner) {
    if (esp1Running && esp2InQueue) {
      waitBanner.style.display = 'flex';
      const wt = document.getElementById('esp2WaitTask');
      const esp2q = q.find(function (t) {
        return t.device_id === 'esp2';
      });
      if (wt && esp2q) wt.textContent = esp2q.task_name;
    } else {
      waitBanner.style.display = 'none';
    }
  }

  const sq = document.getElementById('s-q');
  if (sq) sq.textContent = q.length;

  const qi = document.getElementById('qItems');
  if (qi) {
    if (q.length === 0) {
      qi.innerHTML = '<div class="qempty">Kuyruk boş</div>';
    } else {
      qi.innerHTML = q.map(function (t, i) {
        const isBlocked = esp1Running && t.device_id === 'esp2';
        return '<div class="qi' + (isBlocked ? ' qi-blocked' : '') + '">'
          + '<span class="qi-n">' + (i + 1) + '</span>'
          + '<span class="qi-d ' + t.device_id + '">' + t.device_id.toUpperCase() + '</span>'
          + '<span class="qi-nm">' + t.task_name + '</span>'
          + (isBlocked
              ? '<span class="qi-wait">⏳ ESP1 bekliyor</span>'
              : '<span class="qi-b">' + (t.arrived_at || '') + '</span>')
          + '</div>';
      }).join('');
    }
  }

  const done = (data.completed || []).slice().reverse();
  const sd = document.getElementById('s-d');
  if (sd) sd.textContent = done.length;

  const lb = document.getElementById('logB');
  if (lb) {
    if (done.length === 0) {
      lb.innerHTML = '<tr class="lempty"><td colspan="5">Henüz tamamlanan görev yok</td></tr>';
    } else {
      lb.innerHTML = done.slice(0, 8).map(function (t) {
        return '<tr>'
          + '<td>' + t.finished_at + '</td>'
          + '<td><span class="bdev ' + t.device_id + '">' + t.device_id.toUpperCase() + '</span></td>'
          + '<td>' + t.task_name + '</td>'
          + '<td>' + (t.started_at || '—') + '</td>'
          + '<td><span class="bdone">Tamamlandı</span></td>'
          + '</tr>';
      }).join('');
    }
  }
}

// ===== ANA POLL =====
async function poll() {
  try {
    const r = await fetch('/status');
    if (!r.ok) return;

    const d = await r.json();

    if (d.esp1 && d.esp1.received_at) updateESP1(d.esp1);
    if (d.esp2 && d.esp2.received_at) updateESP2(d.esp2);

    updateSched(d);
    updateRaspberry(d.raspberry);
  } catch (e) {
    console.error('poll hatası:', e);
  }
}

poll();
setInterval(poll, 1500);



function updateRaspberry(pi) {
  if (!pi) return;

  const cpu = document.getElementById('piCpu');
  const ram = document.getElementById('piRam');
  const disk = document.getElementById('piDisk');
  const cpuBar = document.getElementById('piCpuBar');
  const ramBar = document.getElementById('piRamBar');
  const diskBar = document.getElementById('piDiskBar');
  const ramText = document.getElementById('piRamText');
  const diskText = document.getElementById('piDiskText');
  const cpuBadge = document.getElementById('piCpuBadge');
  const ramBadge = document.getElementById('piRamBadge');
  const diskBadge = document.getElementById('piDiskBadge');

  if (cpu) cpu.textContent = pi.cpu.toFixed(0) + '%';
  if (ram) ram.textContent = pi.ram_percent.toFixed(0) + '%';
  if (disk) disk.textContent = pi.disk_percent.toFixed(0) + '%';
  if (ramText) ramText.textContent = pi.ram_used + ' GB / ' + pi.ram_total + ' GB';
  if (diskText) diskText.textContent = pi.disk_used + ' GB / ' + pi.disk_total + ' GB';
  if (cpuBar) cpuBar.style.width = pi.cpu + '%';
  if (ramBar) ramBar.style.width = pi.ram_percent + '%';
  if (diskBar) diskBar.style.width = pi.disk_percent + '%';

  function badgeState(val) {
    if (val > 80) return ['crit', 'Kritik'];
    if (val > 50) return ['warn', 'Yüksek'];
    return ['ok', 'Normal'];
  }

  if (cpuBadge)  { var b = badgeState(pi.cpu);          cpuBadge.className  = 'pi-badge ' + b[0]; cpuBadge.textContent  = b[1]; }
  if (ramBadge)  { var b = badgeState(pi.ram_percent);  ramBadge.className  = 'pi-badge ' + b[0]; ramBadge.textContent  = b[1]; }
  if (diskBadge) { var b = badgeState(pi.disk_percent); diskBadge.className = 'pi-badge ' + b[0]; diskBadge.textContent = b[1]; }
}

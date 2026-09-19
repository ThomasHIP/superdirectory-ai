import { useEffect, useState } from 'react';
import { Search, MapPin, Database, X, Share2, ExternalLink, BadgeCheck } from 'lucide-react';

const SEARCH_URL = 'https://xuygpfswpimhtvtmoljg.supabase.co/functions/v1/sd-otop-json-v2';
const PROFILE_URL = 'https://xuygpfswpimhtvtmoljg.supabase.co/functions/v1/sd-otop-profile-api';

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'Request failed');
  return data;
}

type Item = {
  operator_id: string;
  otop_no: string | null;
  official_name: string;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  operator_type: string | null;
  profile_status: string;
  total_count?: number;
};

type DetailResponse = {
  operator: {
    id: string;
    otop_no: string | null;
    official_name: string;
    province: string | null;
    district: string | null;
    subdistrict: string | null;
    operator_type: string | null;
    source_year: number;
    source_name: string;
  };
  profile: null | {
    mobile: string | null;
    email: string | null;
    line_id: string | null;
    facebook_page: string | null;
    website: string | null;
    google_map: string | null;
    otop_level: string | null;
    otop_stars: number | null;
    product_champion_1: string | null;
    product_champion_2: string | null;
    product_champion_3: string | null;
    product_champion_4: string | null;
    product_champion_5: string | null;
    profile_status: string;
  };
};

type BrandMarkProps = {
  compact?: boolean;
  animated?: boolean;
};

function BrandMark({ compact = false, animated = false }: BrandMarkProps) {
  return (
    <div className={`sd-native-brand ${compact ? 'sd-native-brand-compact' : ''} ${animated ? 'sd-native-brand-animated' : ''}`}>
      <div className='sd-native-glyphs' aria-hidden='true'>
        <span className='sd-native-s'>S</span>
        <span className='sd-native-d'>D</span>
        <span className='sd-native-pixels'><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
      </div>
      <div className='sd-native-copy'>
        <div className='sd-native-name'>SUPER DIRECTORY <span>AI</span></div>
        <div className='sd-native-tag'>FIND. UNDERSTAND. ENGAGE. <span>GROW.</span></div>
      </div>
    </div>
  );
}

function App() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [selected, setSelected] = useState<DetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setIntroLeaving(true), 3000);
    const removeTimer = window.setTimeout(() => setShowIntro(false), 3800);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  const search = async () => {
    const term = q.trim();
    if (!term) {
      setItems([]);
      setTotal(0);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const data = await postJson(SEARCH_URL, { q: term, limit: 50 });
      setItems(data.items || []);
      setTotal(data.total || 0);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (operatorId: string) => {
    setDetailLoading(true);
    setSelected(null);
    setShowClaim(false);
    setSubmitMessage('');
    try {
      const data = await postJson(PROFILE_URL, { action: 'detail', operator_id: operatorId });
      setSelected(data);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setDetailLoading(false);
    setShowClaim(false);
    setSubmitMessage('');
  };

  const mapUrl = () => {
    if (!selected) return '#';
    if (selected.profile?.google_map) return selected.profile.google_map;
    const o = selected.operator;
    const query = [o.official_name, o.subdistrict, o.district, o.province].filter(Boolean).join(' ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const shareProfile = async () => {
    if (!selected) return;
    const o = selected.operator;
    const text = `${o.official_name} · OTOP ${o.otop_no || ''} · ${[o.subdistrict, o.district, o.province].filter(Boolean).join(' · ')}`;
    if (navigator.share) {
      await navigator.share({ title: o.official_name, text, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(`${text} ${window.location.href}`);
      setSubmitMessage('Copied profile details.');
    }
  };

  const submitProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    const form = new FormData(e.currentTarget);
    if (form.get('consent_confirmed') !== 'on') {
      setSubmitMessage('กรุณายืนยันความถูกต้องและความยินยอมก่อนส่ง');
      return;
    }

    const requesterName = String(form.get('requester_name') || '').trim();
    const requesterRole = String(form.get('requester_role') || '').trim();
    const requesterMobile = String(form.get('requester_mobile') || '').trim();
    const requesterEmail = String(form.get('requester_email') || '').trim();

    if (!requesterName || !requesterRole || (!requesterMobile && !requesterEmail)) {
      setSubmitMessage('กรุณาระบุชื่อผู้ยื่นคำขอ ความสัมพันธ์กับกิจการ และเบอร์มือถือหรืออีเมล / Please provide requester name, role, and mobile or email.');
      return;
    }

    const fields = [
      'requester_name', 'requester_role', 'requester_mobile', 'requester_email', 'verification_note',
      'mobile', 'email', 'line_id', 'facebook_page', 'website', 'google_map',
      'otop_level', 'otop_stars', 'product_champion_1', 'product_champion_2',
      'product_champion_3', 'product_champion_4', 'product_champion_5'
    ];

    const payload: Record<string, unknown> = {
      operator_id: selected.operator.id,
      consent_confirmed: true
    };
    fields.forEach((key) => {
      const value = String(form.get(key) || '').trim();
      payload[key] = value || null;
    });

    setSubmitting(true);
    setSubmitMessage('');
    try {
      const data = await postJson(PROFILE_URL, { ...payload, action: 'submit' });
      if (data.ok) {
        setSubmitMessage('ส่งคำขอเรียบร้อย / Request submitted — Pending Verification. ข้อมูลสาธารณะยังไม่เปลี่ยนจนกว่าจะได้รับอนุมัติ / The public profile will not change until approved.');
      } else {
        setSubmitMessage(data.error || 'Submit failed');
      }
    } catch {
      setSubmitMessage('Submit failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {showIntro && (
        <div className={`sd-intro ${introLeaving ? 'sd-intro-leaving' : ''}`} aria-label='Super Directory AI intro'>
          <div className='sd-intro-glow sd-intro-glow-one' />
          <div className='sd-intro-glow sd-intro-glow-two' />
          <div className='sd-pixel-field' aria-hidden='true'>
            <span /><span /><span /><span /><span /><span /><span /><span />
          </div>
          <div className='sd-intro-stage'>
            <BrandMark animated />
            <div className='sd-intro-line' />
          </div>
        </div>
      )}

      <div className='min-h-screen bg-slate-50 text-slate-900'>
        <header className='bg-white border-b-4 border-orange-500'>
          <div className='max-w-6xl mx-auto px-5 py-4 flex items-center'>
            <BrandMark compact />
          </div>
        </header>

        <section className='bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 text-white'>
          <div className='max-w-6xl mx-auto px-5 py-12'>
            <div className='text-orange-400 font-black tracking-widest'>FULL 2026 OTOP REGISTRY</div>
            <h1 className='text-4xl md:text-6xl font-black mt-2'>98,177 OTOP Records</h1>
            <p className='text-blue-100 mt-3 text-lg'>ค้นหาผู้ประกอบการ OTOP ทั่วประเทศ และอัพเดทข้อมูลธุรกิจของคุณ</p>
          </div>
        </section>

        <main className='max-w-6xl mx-auto px-5 py-7'>
          <form
            className='bg-white p-4 rounded-2xl shadow-lg flex gap-2'
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
          >
            <div className='relative flex-1'>
              <Search className='absolute left-4 top-3.5 text-slate-400' size={21} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='ค้นหา เช่น Balm, Hat, หมวก, เชียงใหม่…'
                className='w-full border rounded-xl py-3 pl-12 pr-4'
              />
            </div>
            <button className='bg-orange-500 text-white font-black px-5 rounded-xl'>ค้นหา</button>
          </form>

          {!searched && !loading && (
            <div className='text-center py-14'>
              <Search className='mx-auto text-blue-800' size={36} />
              <h2 className='text-xl font-black text-blue-950 mt-3'>เริ่มค้นหา OTOP</h2>
              <p className='text-slate-500 mt-2'>ค้นหาได้ทั้งภาษาไทยและภาษาอังกฤษ</p>
            </div>
          )}

          {searched && (
            <div className='flex flex-wrap justify-between items-center gap-3 mt-6'>
              <div>
                <b>{loading ? 'กำลังค้นหา…' : total.toLocaleString() + ' records found'}</b>
                <div className='text-sm text-slate-500'>แตะผลการค้นหาเพื่อเปิด Business Profile</div>
              </div>
              <div className='flex items-center gap-2 text-sm bg-emerald-50 text-emerald-800 px-3 py-2 rounded-full'>
                <Database size={16} /> Full 98,177 database
              </div>
            </div>
          )}

          <div className='grid md:grid-cols-2 gap-4 mt-5'>
            {items.map((x) => (
              <button
                key={x.operator_id}
                type='button'
                onClick={() => openDetail(x.operator_id)}
                className='text-left bg-white border rounded-2xl p-5 shadow-sm border-t-4 border-t-blue-700 hover:shadow-md active:scale-[0.99] transition'
              >
                <div className='flex justify-between gap-3'>
                  <div>
                    <h2 className='text-xl font-black text-blue-950'>{x.official_name}</h2>
                    <p className='text-slate-500 mt-2'>{[x.subdistrict, x.district, x.province].filter(Boolean).join(' · ')}</p>
                  </div>
                  <BadgeCheck className='text-blue-700 shrink-0' />
                </div>
                <div className='mt-3 text-sm bg-slate-100 p-3 rounded-lg'>OTOP No: {x.otop_no || '—'}</div>
                <div className='mt-3 inline-block text-sm bg-emerald-50 text-emerald-800 px-3 py-2 rounded-full'>{x.operator_type || 'OTOP'}</div>
                <div className='mt-3 text-xs font-bold text-blue-700'>แตะเพื่อเปิด Business Profile →</div>
              </button>
            ))}
          </div>

          {searched && !loading && items.length === 0 && (
            <div className='text-center py-16 text-slate-500'>ไม่พบข้อมูลที่ตรงกับ “{q.trim()}”</div>
          )}
        </main>
      </div>

      {(detailLoading || selected) && (
        <div className='fixed inset-0 z-[5000] bg-slate-950/70 flex items-end md:items-center justify-center' onClick={closeDetail}>
          <div className='bg-white w-full md:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-3xl p-5 md:p-7' onClick={(e) => e.stopPropagation()}>
            {detailLoading && <div className='py-16 text-center font-bold'>กำลังโหลด Business Profile…</div>}
            {selected && (
              <>
                <div className='flex justify-between gap-4 items-start'>
                  <div>
                    <h2 className='text-2xl md:text-3xl font-black text-blue-950'>{selected.operator.official_name}</h2>
                    <div className='inline-block mt-2 text-xs font-bold bg-blue-50 text-blue-800 px-3 py-2 rounded-full'>
                      {selected.profile ? 'Verified Business Profile' : 'Official Registry Record · Unclaimed'}
                    </div>
                  </div>
                  <button className='p-2 rounded-full bg-slate-100' onClick={closeDetail}><X /></button>
                </div>

                <div className='grid gap-3 mt-5'>
                  <div className='bg-slate-50 rounded-xl p-4'><div className='text-xs text-slate-500'>OTOP Number</div><div className='font-bold mt-1'>{selected.operator.otop_no || '—'}</div></div>
                  <div className='bg-slate-50 rounded-xl p-4'><div className='text-xs text-slate-500'>Location</div><div className='font-bold mt-1'>{[selected.operator.subdistrict, selected.operator.district, selected.operator.province].filter(Boolean).join(' · ')}</div></div>
                  <div className='bg-slate-50 rounded-xl p-4'><div className='text-xs text-slate-500'>Operator Type</div><div className='font-bold mt-1'>{selected.operator.operator_type || '—'}</div></div>
                  <div className='bg-slate-50 rounded-xl p-4'><div className='text-xs text-slate-500'>OTOP Level / Stars</div><div className='font-bold mt-1'>{selected.profile?.otop_level || 'ยังไม่ได้อัปเดต'} {selected.profile?.otop_stars ? '· ' + '★'.repeat(selected.profile.otop_stars) : ''}</div></div>
                </div>

                {selected.profile && (
                  <div className='flex flex-wrap gap-2 mt-4'>
                    {selected.profile.mobile && <a className='profile-chip' href={`tel:${selected.profile.mobile}`}>โทร {selected.profile.mobile}</a>}
                    {selected.profile.email && <a className='profile-chip' href={`mailto:${selected.profile.email}`}>Email</a>}
                    {selected.profile.line_id && <a className='profile-chip' href={`https://line.me/ti/p/~${encodeURIComponent(selected.profile.line_id)}`} target='_blank' rel='noreferrer'>LINE</a>}
                    {selected.profile.facebook_page && <a className='profile-chip' href={selected.profile.facebook_page} target='_blank' rel='noreferrer'>Facebook</a>}
                    {selected.profile.website && <a className='profile-chip' href={selected.profile.website} target='_blank' rel='noreferrer'>Website</a>}
                  </div>
                )}

                <div className='grid grid-cols-2 gap-3 mt-5'>
                  <a href={mapUrl()} target='_blank' rel='noreferrer' className='profile-action'><MapPin size={18} /> Google Map</a>
                  <button className='profile-action' onClick={shareProfile}><Share2 size={18} /> Share</button>
                  <button className='col-span-2 bg-orange-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2' onClick={() => setShowClaim((v) => !v)}>
                    <ExternalLink size={18} /> Claim / Update Business Profile
                  </button>
                </div>

                {showClaim && (
                  <form className='mt-6 border-t pt-5' onSubmit={submitProfile}>
                    <h3 className='text-xl font-black text-blue-950'>ขอแก้ไข / Claim & Update Business Profile</h3>
                    <div className='mt-3 bg-blue-50 border border-blue-200 text-blue-950 p-3 rounded-xl text-sm'>
                      <b>สำคัญ / Important:</b> การส่งแบบฟอร์มนี้เป็นเพียงคำขอแก้ไข ข้อมูลสาธารณะจะยังไม่เปลี่ยนจนกว่า SD AI จะตรวจสอบตัวตนและอนุมัติ / This form submits an amendment request only. Public data will not change until ownership is verified and the request is approved.
                    </div>
                    <div className='mt-3 bg-orange-50 border border-orange-200 text-orange-900 p-3 rounded-xl font-bold text-sm'>
                      หลังผ่านการตรวจสอบ มีสิทธิ์รับ 200 HERO Points / After approval, eligible for 200 HERO Points — ใช้เป็นส่วนลด 200 บาท สำหรับประกัน พ.ร.บ. กับ HERO Insure
                    </div>

                    <h4 className='mt-5 font-black text-blue-950'>ยืนยันผู้ขอแก้ไข / Requester Verification</h4>
                    <div className='grid md:grid-cols-2 gap-3 mt-3'>
                      <label className='profile-field field-blue'>
                        <span>ชื่อผู้ยื่นคำขอ / Requester Name *</span>
                        <input className='profile-input' name='requester_name' placeholder='ชื่อ-นามสกุล / Full name' />
                      </label>
                      <label className='profile-field field-orange'>
                        <span>ตำแหน่งหรือความสัมพันธ์กับกิจการ / Role or Relationship *</span>
                        <input className='profile-input' name='requester_role' placeholder='เจ้าของ / Owner, Manager, Staff…' />
                      </label>
                      <label className='profile-field field-blue'>
                        <span>มือถือผู้ยื่นคำขอ / Requester Mobile *</span>
                        <input className='profile-input' name='requester_mobile' inputMode='tel' placeholder='08x-xxx-xxxx' />
                      </label>
                      <label className='profile-field field-orange'>
                        <span>อีเมลผู้ยื่นคำขอ / Requester Email</span>
                        <input className='profile-input' name='requester_email' type='email' placeholder='name@example.com' />
                      </label>
                      <label className='profile-field field-blue md:col-span-2'>
                        <span>ข้อมูลประกอบการตรวจสอบ / Verification Note</span>
                        <textarea className='profile-input profile-textarea' name='verification_note' placeholder='เช่น เป็นเจ้าของกิจการตามทะเบียน OTOP / e.g. registered owner, authorized manager'></textarea>
                      </label>
                    </div>

                    <h4 className='mt-5 font-black text-blue-950'>ข้อมูลธุรกิจ / Business Information</h4>
                    <div className='grid md:grid-cols-2 gap-3 mt-3'>
                      <label className='profile-field field-orange'><span>เบอร์มือถือธุรกิจ / Business Mobile</span><input className='profile-input' name='mobile' placeholder='Mobile No.' /></label>
                      <label className='profile-field field-blue'><span>อีเมลธุรกิจ / Business Email</span><input className='profile-input' name='email' type='email' placeholder='Email' /></label>
                      <label className='profile-field field-orange'><span>LINE ID / ไลน์ไอดี</span><input className='profile-input' name='line_id' placeholder='LINE ID' /></label>
                      <label className='profile-field field-blue'><span>Facebook Page / เพจเฟซบุ๊ก</span><input className='profile-input' name='facebook_page' placeholder='Facebook Page URL' /></label>
                      <label className='profile-field field-orange'><span>เว็บไซต์ / Website</span><input className='profile-input' name='website' placeholder='https://...' /></label>
                      <label className='profile-field field-blue'><span>Google Map / แผนที่ Google</span><input className='profile-input' name='google_map' placeholder='Google Map Link' /></label>
                      <label className='profile-field field-orange'><span>ระดับ OTOP / OTOP Level</span><input className='profile-input' name='otop_level' placeholder='เช่น ระดับจังหวัด / Provincial Level' /></label>
                      <label className='profile-field field-blue'>
                        <span>ดาว OTOP / OTOP Stars</span>
                        <select className='profile-input' name='otop_stars' defaultValue=''>
                          <option value=''>เลือก / Select</option>
                          <option value='1'>★ 1 ดาว / 1 Star</option>
                          <option value='2'>★★ 2 ดาว / 2 Stars</option>
                          <option value='3'>★★★ 3 ดาว / 3 Stars</option>
                          <option value='4'>★★★★ 4 ดาว / 4 Stars</option>
                          <option value='5'>★★★★★ 5 ดาว / 5 Stars</option>
                        </select>
                      </label>
                      <label className='profile-field field-orange'><span>สินค้าเด่น 1 / Product Champion 1</span><input className='profile-input' name='product_champion_1' /></label>
                      <label className='profile-field field-blue'><span>สินค้าเด่น 2 / Product Champion 2</span><input className='profile-input' name='product_champion_2' /></label>
                      <label className='profile-field field-orange'><span>สินค้าเด่น 3 / Product Champion 3</span><input className='profile-input' name='product_champion_3' /></label>
                      <label className='profile-field field-blue'><span>สินค้าเด่น 4 / Product Champion 4</span><input className='profile-input' name='product_champion_4' /></label>
                      <label className='profile-field field-orange md:col-span-2'><span>สินค้าเด่น 5 / Product Champion 5</span><input className='profile-input' name='product_champion_5' /></label>
                    </div>
                    <label className='flex items-start gap-2 mt-4 text-sm text-slate-600'>
                      <input className='mt-1' type='checkbox' name='consent_confirmed' />
                      <span>ยืนยันว่าท่านมีสิทธิ์ยื่นคำขอแก้ไขข้อมูลของกิจการนี้ และยินยอมให้ SD AI ตรวจสอบก่อนเผยแพร่ / I confirm I am authorized to request changes to this business profile and consent to verification before publication.</span>
                    </label>
                    <button disabled={submitting} className='w-full mt-4 bg-blue-800 text-white font-black py-3 rounded-xl disabled:opacity-60'>
                      {submitting ? 'กำลังส่ง / Submitting…' : 'ส่งเพื่อตรวจสอบ / Submit for Verification'}
                    </button>
                    {submitMessage && <div className='mt-3 bg-slate-100 rounded-xl p-3 text-sm font-bold'>{submitMessage}</div>}
                    <div className='mt-3 text-xs text-slate-500'>เอกสารประกอบ เช่น Business Card / Logo / Brochure จะเชื่อมเข้ากับขั้นตอนตรวจสอบนี้ในลำดับถัดไป / Supporting-document upload will be connected to this verification workflow next.</div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
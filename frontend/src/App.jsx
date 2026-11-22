import { useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, Clock3, FileText, Link2, LoaderCircle, Play, Sparkles, Target, Youtube } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

function App() {
  const [url, setUrl] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('Overview');

  async function analyze(event) {
    event.preventDefault(); setError(''); setData(null); setBusy(true);
    try {
      const response = await fetch(`${API}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Could not analyze this video.');
      setData(result);
    } catch (err) { setError(err.message || 'Could not connect to the analysis service.'); }
    finally { setBusy(false); }
  }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-icon"><Play size={15} fill="currentColor" /></span> vidbrief<span className="brand-dot">.</span></a><div className="top-right"><span className="top-label"><span className="status-dot"/> AI VIDEO NOTES</span><a className="github" href="https://github.com" target="_blank" rel="noreferrer">About <ArrowUpRight size={14}/></a></div></header>
    <main>
      <section className="hero"><div className="eyebrow"><Sparkles size={14}/> YOUR PERSONAL VIDEO RESEARCHER</div><h1>Understand the video.<br/><span>Skip the scrubbing.</span></h1><p className="hero-copy">Get the ideas, insights, and important moments from any YouTube video — in seconds.</p>
        <form className="url-form" onSubmit={analyze}><div className="input-wrap"><Youtube size={19} className="youtube-icon"/><input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste a YouTube link here..." aria-label="YouTube URL"/><span className="input-hint">YOUTUBE URL</span></div><button disabled={busy || !url.trim()}>{busy ? <><LoaderCircle size={17} className="spin"/> Analyzing</> : <><Sparkles size={16}/> Analyze video <ArrowUpRight size={15}/></>}</button></form>
        {error && <div className="error-banner">{error}</div>}
        <div className="trust-row"><span><Check size={14}/> No signup required</span><span className="trust-sep"/><span><Check size={14}/> Transcript-powered insights</span><span className="trust-sep"/><span><Check size={14}/> Free to get started</span></div>
      </section>

      {data ? <section className="results"><div className="result-heading"><div><div className="section-kicker">VIDEO BRIEF <span className="live-pill"><span/> READY</span></div><h2>{data.video.title}</h2><a href={data.video.url} target="_blank" rel="noreferrer" className="video-link"><Link2 size={13}/> Open original video <ArrowUpRight size={12}/></a></div><div className="duration-chip"><Clock3 size={14}/> {data.video.language?.toUpperCase() || 'TRANSCRIPT'}</div></div>
        <div className="tabs">{['Overview', 'Key points', 'Outline', 'Transcript'].map(t => <button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div>
        <div className="result-body">{tab==='Overview' && <><article className="summary-card"><div className="card-label"><span className="label-icon purple"><Sparkles size={15}/></span> THE BIG PICTURE</div><p>{data.summary}</p></article><div className="agent-card"><span className="agent-orb"><Sparkles size={14}/></span><div><strong>{data.used_ai ? 'Your brief is ready' : 'AI analysis unavailable'}</strong><span>{data.used_ai ? 'Three AI specialists worked through this video.' : data.agent_notes?.at(-1) || 'Showing transcript-based results.'}</span></div><span className="agent-check"><Check size={14}/></span></div></>}
          {tab==='Key points' && <article className="content-card"><div className="card-label"><span className="label-icon orange"><Target size={15}/></span> MAIN TAKEAWAYS</div><ol className="points">{data.key_points.map((p,i)=><li key={i}><span className="point-num">{String(i+1).padStart(2,'0')}</span><span>{p}</span></li>)}</ol></article>}
          {tab==='Outline' && <><article className="content-card"><div className="card-label"><span className="label-icon blue"><FileText size={15}/></span> VIDEO OUTLINE</div><div className="outline-list">{data.outline.map((item,i)=><div className="outline-item" key={i}><span className="outline-num">{String(i+1).padStart(2,'0')}</span><div><strong>{item.section}</strong><p>{item.description}</p></div></div>)}</div></article>{data.script && <article className="script-card"><div className="card-label">SCRIPT-STYLE RECAP</div><p>{data.script}</p></article>}</>}
          {tab==='Transcript' && <article className="content-card"><div className="card-label"><span className="label-icon blue"><FileText size={15}/></span> FULL TRANSCRIPT</div><p className="transcript">{data.transcript}</p></article>}
        </div>
      </section> : <section className="how"><div className="how-heading"><div className="section-kicker">THREE STEPS. ZERO GUESSWORK.</div><h2>A clearer way to catch up.</h2></div><div className="steps"><div className="step"><span className="step-num">01</span><div className="step-icon pink"><Link2 size={19}/></div><h3>Drop in a link</h3><p>Share a YouTube video. No downloads or setup needed.</p></div><div className="step"><span className="step-num">02</span><div className="step-icon violet"><Sparkles size={19}/></div><h3>Let AI do the work</h3><p>Specialist agents read the transcript and find the signal.</p></div><div className="step"><span className="step-num">03</span><div className="step-icon mint"><FileText size={19}/></div><h3>Get the whole picture</h3><p>See a clear summary, key takeaways, and a structured outline.</p></div></div><div className="sample-card"><div className="sample-left"><span className="sample-icon"><Play size={13} fill="currentColor"/></span><div><span className="sample-kicker">MADE FOR YOUR WATCH LATER LIST</span><strong>More insight. Less rewind.</strong></div></div><div className="sample-right"><span>Long lectures</span><span>Deep dives</span><span>Talks & interviews</span></div></div></section>}
    </main><footer><span>vidbrief<span className="brand-dot">.</span> <span className="footer-copy">A little more clarity for your next video.</span></span><span>BUILT FOR THE CURIOUS <span className="footer-star">✳</span></span></footer>
  </div>;
}

export default App;

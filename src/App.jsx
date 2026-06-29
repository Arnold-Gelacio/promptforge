import { useState, useRef } from "react";

const C = {
  bg: "#0A0A0F", surface: "#111118", surface2: "#1A1A26", border: "#2A2A3E",
  violet: "#7C3AED", violetLight: "#9B5FFF", cyan: "#06B6D4",
  text: "#F8FAFC", muted: "#8B8FA8", green: "#10B981", red: "#EF4444", yellow: "#F59E0B"
};

const STYLES = ["Aesthetic", "Bold & Hype", "Minimalist", "Cinematic", "Playful", "Luxury"];

export default function App() {
  const [imgBase64, setImgBase64] = useState(null);
  const [imgType, setImgType] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [contentType, setContentType] = useState("image");
  const [audience, setAudience] = useState("gen z");
  const [style, setStyle] = useState("Aesthetic");
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setImgType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImgPreview(e.target.result);
      setImgBase64(e.target.result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImgBase64(null); setImgType(null); setImgPreview(null);
    setResults([]); setError(""); setSelected(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function generate() {
    if (!imgBase64) { setError("Please upload a product image first."); return; }
    setError(""); setLoading(true); setResults([]);

    const systemPrompt = `You are an expert TikTok content strategist and AI prompt engineer. Respond ONLY with a valid JSON array, no markdown, no backticks, no explanation.`;
    const userPrompt = `Analyze this product image and generate 3 distinct content packages.
Settings: content type=${contentType}, audience=${audience}, style=${style}, extra context=${extra || "none"}

Return a JSON array of exactly 3 objects each with:
{
  "styleLabel": "short catchy style name",
  "imagePrompt": ${contentType !== "video" ? '"detailed image generation prompt, 60-90 words"' : "null"},
  "videoPrompt": ${contentType !== "image" ? '"detailed video generation prompt, 60-90 words"' : "null"},
  "characterScript": "2-3 sentence TikTok voiceover script, natural and platform-native tone",
  "tiktokSafety": "safe" or "warning" or "unsafe",
  "tiktokNote": "1 sentence reason for the safety rating"
}
Make each of the 3 packages feel meaningfully different. Be creative and specific to what you see in the product image.`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: imgType, data: imgBase64 } },
              { type: "text", text: userPrompt }
            ]
          }]
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const raw = data.content.map(i => i.text || "").join("").replace(/```json|```/g, "").trim();
      setResults(JSON.parse(raw));
    } catch (e) {
      setError("Generation failed: " + (e.message || "Please try again."));
    } finally {
      setLoading(false);
    }
  }

  function copyCard(r, idx) {
    const text = [r.imagePrompt, r.videoPrompt, r.characterScript].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }

  const safetyColors = { safe: C.green, warning: C.yellow, unsafe: C.red };
  const safetyLabels = { safe: "✓ TikTok Safe", warning: "⚠ Review", unsafe: "✕ Flagged" };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Inter',sans-serif", padding: "0 0 80px" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        select option { background: #1A1A26; }
        ::-webkit-scrollbar { width: 6px; } 
        ::-webkit-scrollbar-track { background: #111118; }
        ::-webkit-scrollbar-thumb { background: #2A2A3E; border-radius: 3px; }
      `}</style>

      {/* Ambient glows */}
      <div style={{ position:"fixed", top:"-30%", left:"-10%", width:"50%", height:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.13) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"-20%", right:"-10%", width:"45%", height:"45%", background:"radial-gradient(circle,rgba(6,182,212,0.08) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"28px 0 36px" }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, letterSpacing:-0.5 }}>
            Prompt<span style={{ color:C.cyan }}>Forge</span>
            <span style={{ display:"inline-block", width:6, height:6, background:C.violet, borderRadius:"50%", marginLeft:3, verticalAlign:"middle" }} />
          </div>
          <div style={{ fontSize:11, fontWeight:600, padding:"4px 12px", borderRadius:20, background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.3)", color:C.violetLight, letterSpacing:1, textTransform:"uppercase" }}>
            TikTok Ready
          </div>
        </div>

        {/* Hero */}
        <div style={{ textAlign:"center", marginBottom:44 }}>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"clamp(28px,5vw,48px)", fontWeight:700, lineHeight:1.1, letterSpacing:-1.5, marginBottom:14 }}>
            Turn products into{" "}
            <span style={{ background:"linear-gradient(135deg,#9B5FFF,#06B6D4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              viral content
            </span>
          </h1>
          <p style={{ color:C.muted, fontSize:16, maxWidth:480, margin:"0 auto", lineHeight:1.7, fontWeight:300 }}>
            Upload a product image and get AI-generated prompts, character scripts, and TikTok safety checks.
          </p>
        </div>

        {/* Main Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20, marginBottom:24 }}>

          {/* Upload Panel */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", color:C.muted, marginBottom:14 }}>Product Image</div>
            {!imgPreview ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current.click()}
                style={{ border:`1.5px dashed ${dragging ? C.cyan : C.border}`, borderRadius:12, padding:"44px 20px", textAlign:"center", cursor:"pointer", background: dragging ? "rgba(6,182,212,0.08)" : C.surface2, transition:"all 0.2s" }}
              >
                <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
                <div style={{ width:48, height:48, margin:"0 auto 14px", background:"rgba(124,58,237,0.15)", border:`1px solid ${C.border}`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>📦</div>
                <div style={{ fontSize:15, fontWeight:500, marginBottom:6 }}>Tap to upload product image</div>
                <div style={{ fontSize:13, color:C.muted }}>PNG, JPG, WEBP</div>
              </div>
            ) : (
              <div style={{ position:"relative", borderRadius:12, overflow:"hidden" }}>
                <img src={imgPreview} alt="Preview" style={{ width:"100%", borderRadius:12, display:"block", maxHeight:260, objectFit:"cover" }} />
                <button onClick={clearImage} style={{ position:"absolute", top:10, right:10, background:"rgba(0,0,0,0.75)", border:"none", color:"#fff", borderRadius:8, padding:"5px 12px", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>✕ Remove</button>
              </div>
            )}
          </div>

          {/* Settings Panel */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", color:C.muted, marginBottom:14 }}>Generation Settings</div>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:6, fontWeight:500 }}>Content Type</label>
                <select value={contentType} onChange={e => setContentType(e.target.value)} style={{ width:"100%", background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontFamily:"inherit", fontSize:14, padding:"10px 14px", outline:"none" }}>
                  <option value="image">Image Prompt</option>
                  <option value="video">Video Prompt</option>
                  <option value="both">Both (Image + Video)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:6, fontWeight:500 }}>Target Audience</label>
                <select value={audience} onChange={e => setAudience(e.target.value)} style={{ width:"100%", background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontFamily:"inherit", fontSize:14, padding:"10px 14px", outline:"none" }}>
                  <option value="gen z">Gen Z (18–25)</option>
                  <option value="millennials">Millennials (26–40)</option>
                  <option value="general">General Audience</option>
                  <option value="beauty enthusiasts">Beauty & Lifestyle</option>
                  <option value="tech savvy">Tech Savvy</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:8, fontWeight:500 }}>Vibe / Style</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {STYLES.map(s => (
                    <button key={s} onClick={() => setStyle(s)} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${style === s ? C.violet : C.border}`, background: style === s ? "rgba(124,58,237,0.2)" : C.surface2, color: style === s ? C.violetLight : C.muted, fontSize:13, cursor:"pointer", fontFamily:"inherit", fontWeight: style === s ? 600 : 400, transition:"all 0.15s" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:6, fontWeight:500 }}>Extra context (optional)</label>
                <textarea value={extra} onChange={e => setExtra(e.target.value)} placeholder="e.g. perfume brand, 30% fragrance oil, long lasting..." rows={3} style={{ width:"100%", background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontFamily:"inherit", fontSize:13, padding:"10px 14px", outline:"none", resize:"vertical" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"14px 18px", color:"#FCA5A5", fontSize:14, marginBottom:20 }}>
            ⚠ {error}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={generate}
          disabled={loading}
          style={{ width:"100%", padding:16, border:"none", borderRadius:12, background: loading ? "#3B1E7A" : "linear-gradient(135deg,#7C3AED,#5B21B6)", color:"#fff", fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:600, cursor: loading ? "not-allowed" : "pointer", letterSpacing:-0.3, transition:"all 0.2s", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Generating…" : "✦ Generate Prompts"}
        </button>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center", padding:"40px 0" }}>
            <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTopColor:C.violet, borderRadius:"50%", margin:"0 auto 14px", animation:"spin 0.7s linear infinite" }} />
            <p style={{ color:C.muted, fontSize:14 }}>Analyzing product and crafting prompts…</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ marginTop:40 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:600 }}>Your Prompts</h2>
              <span style={{ fontSize:13, color:C.muted }}>{results.length} variations</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:20 }}>
              {results.map((r, i) => {
                const sc = safetyColors[r.tiktokSafety] || C.muted;
                const sl = safetyLabels[r.tiktokSafety] || r.tiktokSafety;
                const isSelected = selected === i;
                return (
                  <div key={i} onClick={() => setSelected(i)} style={{ background:C.surface, border:`1px solid ${isSelected ? C.cyan : C.border}`, borderRadius:16, overflow:"hidden", cursor:"pointer", boxShadow: isSelected ? `0 0 0 1px ${C.cyan},0 8px 32px rgba(6,182,212,0.15)` : "none", transition:"all 0.2s", animation:"fadeUp 0.4s ease forwards", animationDelay:`${i * 0.1}s`, opacity:0 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px 12px", borderBottom:`1px solid ${C.border}` }}>
                      <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:C.cyan }}>{r.styleLabel}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:500, padding:"3px 9px", borderRadius:20, background:`${sc}22`, border:`1px solid ${sc}55`, color:sc }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:sc, flexShrink:0 }} />{sl}
                      </div>
                    </div>
                    <div style={{ padding:16 }}>
                      {r.imagePrompt && <>
                        <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:C.muted, marginBottom:7 }}>Image Prompt</div>
                        <div style={{ fontSize:13, lineHeight:1.65, background:C.surface2, borderRadius:8, padding:12, borderLeft:`2px solid ${C.violet}`, marginBottom:14 }}>{r.imagePrompt}</div>
                      </>}
                      {r.videoPrompt && <>
                        <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:C.muted, marginBottom:7 }}>Video Prompt</div>
                        <div style={{ fontSize:13, lineHeight:1.65, background:C.surface2, borderRadius:8, padding:12, borderLeft:`2px solid ${C.violet}`, marginBottom:14 }}>{r.videoPrompt}</div>
                      </>}
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:C.muted, marginBottom:7 }}>Character Script</div>
                      <div style={{ fontSize:13, lineHeight:1.7, color:"#C4C8E2", background:C.surface2, borderRadius:8, padding:12, borderLeft:`2px solid ${C.cyan}`, fontStyle:"italic", marginBottom:10 }}>"{r.characterScript}"</div>
                      {r.tiktokNote && <div style={{ fontSize:12, color:C.muted }}>💬 {r.tiktokNote}</div>}
                    </div>
                    <div style={{ display:"flex", gap:8, padding:"0 16px 16px" }}>
                      <button onClick={e => { e.stopPropagation(); copyCard(r, i); }} style={{ flex:1, padding:"8px", borderRadius:8, border:`1px solid ${copied === i ? C.green : C.border}`, background: copied === i ? "rgba(16,185,129,0.08)" : C.surface2, color: copied === i ? C.green : C.muted, fontFamily:"inherit", fontSize:12, fontWeight:500, cursor:"pointer", transition:"all 0.15s" }}>
                        {copied === i ? "Copied! ✓" : "Copy All"}
                      </button>
                      <button onClick={e => { e.stopPropagation(); setSelected(i); }} style={{ flex:1, padding:"8px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#7C3AED,#5B21B6)", color:"#fff", fontFamily:"inherit", fontSize:12, fontWeight:500, cursor:"pointer" }}>
                        {isSelected ? "Selected ✓" : "Select This"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:24, background:"rgba(6,182,212,0.06)", border:"1px solid rgba(6,182,212,0.15)", borderRadius:12, padding:"14px 18px", fontSize:13, color:C.muted, lineHeight:1.6 }}>
              <span style={{ color:C.cyan, fontWeight:500 }}>TikTok Safety</span> indicators are AI estimates. Always review before posting.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

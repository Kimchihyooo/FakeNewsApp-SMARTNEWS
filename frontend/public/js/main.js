// static/js/main.js

const BASE_URL = "YOUR_BACKEND_PRODUCTION_URL"; // REPLACE WITH YOUR DEPLOYED BACKEND URL

// =========================================
// NEW LOADING OVERLAY FUNCTION
// =========================================
function toggleLoadingState(isLoading) {
    const overlay = document.getElementById('custom-loader-overlay');

    if (!overlay) return; 

    if (isLoading) {
        overlay.style.setProperty('display', 'flex', 'important');
        document.body.classList.add('loading-active');
        
        // Start trivia carousel
        if (typeof window.startTriviaCycle === 'function') {
            window.startTriviaCycle();
        }
    } else {
        overlay.style.setProperty('display', 'none', 'important');
        document.body.classList.remove('loading-active');

        // Stop trivia carousel
        if (typeof window.stopTriviaCycle === 'function') {
            window.stopTriviaCycle();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderHistory === 'function') renderHistory();

    const searchInput = document.getElementById('history-search-input');
    const filterSelect = document.getElementById('history-filter-select');

    if (searchInput) {
        searchInput.addEventListener('input', filterHistoryItems);
    }
    if (filterSelect) {
        const optionsToAdd = [
            { value: 'verified', text: '✅ Verified / Real' },
            { value: 'fake', text: '⚠️ Fake / Deepfake' },
            { value: 'uncertain', text: '❓ Uncertain / Unknown' }
        ];
        
        optionsToAdd.forEach(opt => {
            if (!filterSelect.querySelector(`option[value="${opt.value}"]`)) {
                const option = document.createElement('option');
                option.value = opt.value;
                option.innerText = opt.text;
                filterSelect.appendChild(option);
            }
        });
        
        filterSelect.addEventListener('change', filterHistoryItems);
    }

    const imgModal = document.getElementById('image-modal-overlay');
    const imgClose = document.getElementById('image-modal-close');
    
    if (imgClose && imgModal) {
        imgClose.onclick = () => imgModal.style.display = "none";
        imgModal.onclick = (e) => {
            if (e.target === imgModal) imgModal.style.display = "none";
        };
    }

    const histBtn = document.getElementById('history-trigger-btn');
    const histModal = document.getElementById('history-modal-overlay');
    const histClose = document.getElementById('history-close-btn');
    
    if(histBtn && histModal) {
        histBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            histModal.classList.add('modal-active');
            histModal.style.display = "flex"; 
            if (typeof filterHistoryItems === 'function') filterHistoryItems();
        });
        
        const closeModal = () => {
            histModal.classList.remove('modal-active');
            histModal.style.display = "none"; 
        };

        if(histClose) histClose.addEventListener('click', closeModal);
        histModal.addEventListener('click', (e) => {
            if(e.target === histModal) closeModal();
        });
    }

    const wordInput = document.getElementById('userInput');
    const wordCountDisplay = document.getElementById('word-counts');
    const analyzeBtn = document.getElementById('btntext'); 

    if (wordInput && wordCountDisplay) {
        const updateCount = () => {
            const text = wordInput.value.trim();
            const count = text ? text.split(/\s+/).length : 0;
            
            wordCountDisplay.innerText = `${count} / 1000 words`;

            if (count > 1000) {
                wordCountDisplay.style.color = "#ef4444"; 
                wordCountDisplay.style.fontWeight = "bold";
                if(analyzeBtn) {
                    analyzeBtn.disabled = true;
                    analyzeBtn.style.opacity = "0.5";
                    analyzeBtn.style.cursor = "not-allowed";
                }
            } else {
                wordCountDisplay.style.color = "#94a3b8"; 
                wordCountDisplay.style.fontWeight = "normal";
                if(analyzeBtn) {
                    analyzeBtn.disabled = false;
                    analyzeBtn.style.opacity = "1";
                    analyzeBtn.style.cursor = "pointer";
                }
            }
        };
        wordInput.addEventListener('input', updateCount);
    }
});

// =========================================
// EXISTING ADVANCED MODAL (For Frames)
// =========================================
// =========================================
// EXISTING ADVANCED MODAL (For Frames)
// =========================================
function openImageModal(imgElement, confidenceScore) {
    const modal = document.getElementById('image-modal-overlay');
    const originalImg = document.getElementById('modal-original-img');
    const zoomImg = document.getElementById('modal-zoom-img');
    const scoreDisplay = document.getElementById('modal-score');
    
    if (modal && originalImg && zoomImg) {
        // --- THE FIX: Find the image whether the <div> or the <img> was clicked ---
        const targetImg = imgElement.tagName === 'IMG' ? imgElement : imgElement.querySelector('img');
        
        if (targetImg) {
            const src = targetImg.src;
            originalImg.src = src;
            zoomImg.src = src;
        }
        
        if(scoreDisplay) {
            scoreDisplay.innerText = `${Math.round(confidenceScore)}%`;
            if (confidenceScore > 85) scoreDisplay.style.color = "#ef4444"; 
            else if (confidenceScore > 60) scoreDisplay.style.color = "#f59e0b"; 
            else scoreDisplay.style.color = "#4ade80"; 
        }
        
        modal.style.display = "flex";
    }
}

// =========================================
// NEW SIMPLE MODAL (For Timeline Graph)
// =========================================
function openSimpleGraphModal(imgSrc) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(15, 23, 42, 0.9); z-index:10000; display:flex; align-items:center; justify-content:center; cursor:pointer; padding:20px; backdrop-filter:blur(4px);';

    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = 'max-width:95%; max-height:90%; background:#fff; padding:8px; border-radius:8px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);';

    const img = document.createElement('img');
    img.src = imgSrc;
    img.style.cssText = 'width:100%; height:auto; display:block; border-radius:4px; object-fit:contain; max-height: 85vh;';

    imgContainer.appendChild(img);
    overlay.appendChild(imgContainer);
    document.body.appendChild(overlay);

    overlay.onclick = () => {
        document.body.removeChild(overlay);
    };
}

function highlightKeywords(text, keywords) {
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) return text;
    
    const escapedKeywords = keywords
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .sort((a, b) => b.length - a.length);

    const pattern = new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'gi');
    return text.replace(pattern, '<span style="background-color: #fef08a; color: #000; font-weight: bold; padding: 0 2px; border-radius: 2px;">$1</span>');
}

const form = document.getElementById('analyzeForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        // 1. SHOW THE LOADING OVERLAY IMMEDIATELY
        toggleLoadingState(true);

        const btnText = document.getElementById('btntext');
        const btnVid = document.getElementById('btnvid');
        
        const videoTab = document.querySelector('.tab[data-mode="video"]');
        const isVideoMode = videoTab && videoTab.classList.contains('tab-active');

        const activeInput = isVideoMode 
            ? document.getElementById('videoUrlInput') 
            : document.getElementById('userInput');
            
        const activeBtn = isVideoMode ? btnVid : btnText;
        const originalText = activeBtn.innerText;

        const startTime = Date.now(); 
        const loadingTimerText = document.getElementById('loading-timer');
        
        // 2. START THE TIMER ANIMATION
        let timerInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            if(loadingTimerText) loadingTimerText.innerText = `Processing: ${elapsed.toFixed(2)}s`;
        }, 50);

        if(activeInput) activeInput.classList.add('scanning-effect');

        activeBtn.innerText = "Analyzing..."; 
        activeBtn.disabled = true;
        activeBtn.style.opacity = "0.7";
        
        const formData = new FormData(form);

        try {
            const response = await fetch(`${BASE_URL}${form.getAttribute('action')}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Server Error");
            }

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            displayAnalysis(data);
            addToHistory(data);

        } catch (error) {
            displayError(error.message); 
            console.error(error);
        } finally {
            // 3. STOP TIMER AND HIDE OVERLAY
            clearInterval(timerInterval);
            toggleLoadingState(false); 
            
            if(activeInput) activeInput.classList.remove('scanning-effect');

            activeBtn.innerText = originalText;
            activeBtn.disabled = false;
            activeBtn.style.opacity = "1";
        }
    });
}

function displayError(message) {
    const resultsArea = document.getElementById('results-area');
    const placeholder = document.getElementById('results-placeholder');
    
    placeholder.style.display = 'none';
    resultsArea.style.display = 'block';

    document.getElementById('scoreBox').style.display = 'none';
    document.getElementById('classifications').style.display = 'none';
    
    const resultContainer = document.getElementById('text-results-container');
    const videoContainer = document.getElementById('video-results-container');
    
    if(videoContainer) videoContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    
    resultContainer.innerHTML = `
        <div style="text-align:center; padding: 30px; color: #f87171; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px;">
            <h3 style="margin-top:0; font-family: 'Rubik', sans-serif;">⚠️ Analysis Failed</h3>
            <p style="margin-top:10px; font-size: 1.1rem; line-height: 1.5;">${message}</p>
        </div>
    `;
}

function displayAnalysis(data) {
    const resultsArea = document.getElementById('results-area');
    const placeholder = document.getElementById('results-placeholder');
    
    if(placeholder) placeholder.style.display = 'none';
    if(resultsArea) resultsArea.style.display = 'block';

    const containers = ['scoreBox', 'classifications', 'text-results-container', 'video-results-container'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });

    // --- 1. INITIALIZE KEY VARIABLES EARLY ---
    let isVideo = false;
    if (data.type) {
        isVideo = (data.type === 'video');
    } else {
        isVideo = (data.suspicious_frames !== undefined || data.scan_skipped !== undefined);
    }

    const actualFrameCount = (data.frame_count !== undefined) 
        ? data.frame_count 
        : (data.suspicious_frames ? data.suspicious_frames.length : 0);

    let verdictLabel = data.score_label || "Processing..."; 
    const isVerifiedSource = data.search_verdict === "VERIFIED";

    // --- DYNAMIC THRESHOLD OVERRIDE FOR VIDEO ---
    if (isVideo && verdictLabel.toLowerCase().includes("deepfake")) {
        if (actualFrameCount < 45) {
            if (isVerifiedSource) {
                verdictLabel = "LIKELY REAL (NOISE DETECTED)";
            } else {
                verdictLabel = "INCONCLUSIVE / SUSPICIOUS";
            }
            data.score_label = verdictLabel; 
        }
    }

    // --- 2. DYNAMIC THEME COLOR LOGIC & UNCERTAIN CHECK ---
    const labelLower = verdictLabel.toLowerCase().trim();
    
    const isUncertain = labelLower.includes("uncertain") || 
                        labelLower.includes("inconclusive") || 
                        labelLower.includes("suspicious") || 
                        labelLower.includes("unknown");

    let themeColor = "#3b82f6"; // Default blue
    let isReal = false;
    
    if (labelLower.includes("source verified") || labelLower.includes("real") || labelLower.includes("most likely real")) {
        themeColor = "#4ade80"; // Green
        isReal = true;
    } else if (labelLower.includes("fake") || labelLower.includes("deepfake") || labelLower.includes("most likely fake")) {
        themeColor = "#f87171"; // Red
    } else if (isUncertain) {
        themeColor = "#f59e0b"; // Yellow/Amber
    }

    const rawConf = data.model_confidence;
    let displayConf = "- - "; 
    let barValue = 0;

    if (rawConf !== null && rawConf !== undefined && rawConf !== "None") {
        const parsed = parseFloat(rawConf);
        if (!isNaN(parsed)) {
            barValue = Math.round(parsed);
            displayConf = barValue + "%";
        }
    }

    // --- 3. BUILD UI COMPONENTS ---
    let videoMetaHTML = "";
    if (isVideo) {
        let author = data.author;
        let platform = data.platform;

        const previewAuthorEl = document.getElementById('preview-author');
        const previewPlatformEl = document.getElementById('preview-platform');

        if (!author || author === "Unknown" || author === "...") {
            author = previewAuthorEl ? previewAuthorEl.innerText : "Unknown";
        }
        if (!platform || platform === "Platform" || platform === "...") {
            platform = previewPlatformEl ? previewPlatformEl.innerText : "Unknown";
        }
        
        videoMetaHTML = `
            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:0.75rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Source Channel</div>
                    <div style="font-weight:600; color:#f8fafc; font-size:1rem;">${author !== "..." ? author : "Could not fetch"}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.75rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Platform</div>
                    <div style="font-weight:600; color:#f8fafc; font-size:1rem;">${platform !== "..." ? platform : "Could not fetch"}</div>
                </div>
            </div>
        `;
    }

    let timelineHTML = "";
    if (isVideo && data.timeline_graph) {
        timelineHTML = `
            <div style="margin-top: 25px;">
                <h5 style="color: #cbd5e1; margin-bottom: 10px; font-size: 0.9rem;">
                    ${isReal ? 'Frame Integrity Timeline' : '⚠️ Anomaly Detection Timeline'}
                </h5>
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; overflow: hidden;">
                    <img src="data:image/png;base64,${data.timeline_graph}" 
                         style="width: 100%; height: auto; display: block; cursor: pointer; transition: transform 0.2s;" 
                         alt="Deepfake Detection Timeline"
                         onclick="openSimpleGraphModal(this.src)" 
                         onmouseover="this.style.opacity='0.8'"
                         onmouseout="this.style.opacity='1'">
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 0.75rem;">
                    <div style="display: flex; gap: 12px; color: #94a3b8;">
                        <span style="display:flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#22c55e; border-radius:2px;"></span> Clean</span>
                        <span style="display:flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#f59e0b; border-radius:2px;"></span> Noise</span>
                        <span style="display:flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#ef4444; border-radius:2px;"></span> Deepfake</span>
                    </div>
                    <div style="color: #cbd5e1; font-style: italic;">🔍 Click graph to expand</div>
                </div>
            </div>
        `;
    }

    let evidenceHTML = "";
    const evidenceList = data.evidence || data.supporting_articles || [];
    if (evidenceList.length > 0) {
        evidenceHTML += `
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h5 style="color: #f8fafc; font-weight: 700; font-size: 1.05rem; margin-bottom: 15px; display:flex; align-items:center; gap:8px;">
                    <span>📚</span> Supporting Sources
                </h5>
        `;
        evidenceList.forEach((item, index) => {
            let sourceName = item.website || item.displayLink || "Source";
            const uniqueId = `match-details-${index}`; 

            const highlightedClaim = typeof highlightKeywords === 'function' 
                ? highlightKeywords(data.extracted_claim || "No claim extracted.", item.matched_keywords) 
                : (data.extracted_claim || "No claim extracted.");
            
            const highlightedSnippet = typeof highlightKeywords === 'function'
                ? highlightKeywords(item.snippet || "", item.matched_keywords)
                : item.snippet;

            let transparencyHTML = "";
            let toggleBtnHTML = "";

            if (item.relevance_score && item.relevance_score > 0) {
                toggleBtnHTML = `
                    <button onclick="document.getElementById('${uniqueId}').style.display = (document.getElementById('${uniqueId}').style.display === 'none' ? 'block' : 'none')" 
                        style="background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 0.85rem; font-weight: 600; text-decoration: none; padding: 0; margin-top: 8px; display: inline-flex; align-items: center; gap: 4px; transition: color 0.2s;">
                        <span style="font-size: 1rem;">🔍</span> Explain Relevance
                    </button>
                `;

                transparencyHTML = `
                    <div id="${uniqueId}" style="display: none; margin-top: 10px; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 6px; border-left: 3px solid #3b82f6; font-size: 0.85rem;">
                        <div style="margin-bottom: 6px; color: #94a3b8; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            Claim:
                        </div>
                        <div style="color: #f8fafc; line-height: 1.6; font-style: italic; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 12px;">
                            "${highlightedClaim}"
                        </div>
                        <div style="margin-bottom: 6px; color: #94a3b8; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            Supporting Evidence from Source:
                        </div>
                        <div style="color: #f8fafc; line-height: 1.6; background: rgba(59, 130, 246, 0.05); padding: 8px; border-radius: 4px; border: 1px solid rgba(59, 130, 246, 0.2);">
                            "${highlightedSnippet}"
                        </div>
                        <div style="margin-top: 10px; font-size: 0.75rem; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
                            <strong>Common Keywords:</strong> ${item.matched_keywords ? item.matched_keywords.join(', ') : 'None'}
                        </div>
                    </div>
                `;
            }

            evidenceHTML += `
                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div style="font-size: 1.05rem; font-weight: 600; margin-bottom: 4px; line-height: 1.4;">
                        <a href="${item.link}" target="_blank" style="text-decoration:none; color:#60a5fa;">
                            ${item.title}
                        </a>
                    </div>
                    <div style="font-size: 0.85rem; color: #4ade80; margin-bottom: 6px;">
                        ${sourceName}
                    </div>
                    <div style="font-size: 0.9rem; color: #cbd5e1; line-height: 1.5;">
                        ${item.snippet || "No preview text available."}
                    </div>
                    ${toggleBtnHTML}
                    ${transparencyHTML}
                </div>
            `;
        });
        evidenceHTML += `</div>`;
    } else {
        evidenceHTML += `
            <div style="margin-top: 20px; padding: 20px; text-align: center; color: #94a3b8; background: rgba(255,255,255,0.05); border-radius: 8px;">
                No matching news reports found.
            </div>
        `;
    }

    let gridHTML = "";
    if (isVideo) {
        let visualCheckText = "Clean";
        let visualCheckColor = "#4ade80"; 
        let anomaliesText = "0 Frames";
        let anomaliesColor = "#cbd5e1"; 

        if (!isReal) {
            visualCheckText = "Failed";
            visualCheckColor = "#f87171"; 
            anomaliesText = `${actualFrameCount} Frames`;
            anomaliesColor = "#f87171"; 
        } 
        else if (data.suspicious_frames && data.suspicious_frames.length > 0) {
            visualCheckText = "Pass";
            visualCheckColor = "#fbbf24"; 
            anomaliesText = "0 Frames"; 
        }

        gridHTML = `
            <div class="forensic-stat">
                <h5>Visual Check</h5>
                <p style="color: ${visualCheckColor}; font-weight: 700;">${visualCheckText}</p>
            </div>
            <div class="forensic-stat">
                <h5>Metadata</h5>
                <p style="color: ${data.search_verdict === 'VERIFIED' ? '#4ade80' : '#94a3b8'}">
                    ${data.search_verdict || "Checked"}
                </p>
            </div>
            <div class="forensic-stat">
                <h5>Anomalies</h5>
                <p style="color: ${anomaliesColor}; font-weight: 700;">${anomaliesText}</p>
            </div>
        `;
    } else {
        const articleCount = evidenceList.length;
        gridHTML = `
            <div class="forensic-stat"><h5>Type</h5><p>Text Article</p></div>
            <div class="forensic-stat"><h5>Fact Check</h5><p style="color:${articleCount > 0 ? '#4ade80':'#94a3b8'}">${articleCount > 0 ? 'Evidence Found' : 'No Matches'}</p></div>
            <div class="forensic-stat"><h5>Sources</h5><p>${articleCount} Links</p></div>
        `;
    }

    let sourceBadge = "";
    if (isVideo && data.search_verdict === "VERIFIED") {
        sourceBadge = `<div style="background:#dcfce7; color:#14532d; padding:10px; border-radius:6px; margin-bottom:15px; font-weight:600;">✅ Source Verified</div>`;
    } else if (isVideo && !data.scan_skipped && verdictLabel === "UNKNOWN SOURCE") {
         sourceBadge = `<div style="background:#fff7ed; color:#c2410c; padding:10px; border-radius:6px; margin-bottom:15px; font-weight:600;">⚠️ Unknown Source</div>`;
    }

    let frameGalleryHTML = "";
    if (isVideo && data.suspicious_frames && data.suspicious_frames.length > 0) {
        const frameImages = data.suspicious_frames.map((base64Img) => {
            const confidenceVal = data.model_confidence || 85; 
            return `
            <div style="cursor: pointer; overflow: hidden; border-radius: 8px; border: 2px solid rgba(255,255,255,0.1); transition: transform 0.2s, border-color 0.2s;" 
                onmouseover="this.style.transform='scale(1.05)'; this.style.borderColor='#f59e0b';" 
                onmouseout="this.style.transform='scale(1)'; this.style.borderColor='rgba(255,255,255,0.1)';"
                onclick="openImageModal(this, ${confidenceVal})">
                <img src="data:image/jpeg;base64,${base64Img}" 
                    alt="Suspicious Frame" 
                    style="width: 100%; height: auto; display: block;">
            </div>
            `;
        }).join('');

        frameGalleryHTML = `
            <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
                <h5 style="color: #94a3b8; margin-bottom: 10px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">Visual Forensic Evidence</h5>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px;">
                    ${frameImages}
                </div>
            </div>
        `;
    }

// --- DYNAMIC CONTEXTUAL ANALYSIS BOX ---
    let explanationHTML = "";
    if (!isVideo && data.explanation) {
        
        // Change the icon based on the verdict
        let icon = "⚠️";
        if (isReal) icon = "✅";
        else if (!isUncertain) icon = "🚨"; // For Most Likely Fake

        // We use the themeColor and append hex opacity (1A = 10%, 33 = 20%)
        explanationHTML = `
            <div style="background: ${themeColor}1A; border-left: 4px solid ${themeColor}; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-right: 1px solid ${themeColor}33; border-top: 1px solid ${themeColor}33; border-bottom: 1px solid ${themeColor}33;">
                <div style="color: ${themeColor}; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                    <span>${icon}</span> Contextual Analysis
                </div>
                <div style="color: #f8fafc; font-size: 0.95rem; line-height: 1.6; font-family: 'Rubik', sans-serif;">
                    ${data.explanation}
                </div>
            </div>
        `;
    }

    // --- 4. ASSEMBLE REPORT HTML (Hiding logic applied here) ---
    const reportHTML = `
        <div class="forensic-card">
            <div class="forensic-header" style="border-left: 6px solid ${themeColor}; display: flex; flex-direction: column; gap: 15px; padding-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div class="forensic-verdict-box">
                        <h4>Verdict</h4>
                        <h2 style="color: ${themeColor}; margin: 0;">${verdictLabel}</h2>
                    </div>
                    
                    ${(!isVideo && !isUncertain) ? `
                    <div style="text-align: right;">
                        <h4 style="margin: 0; color: ${themeColor}; font-size: 35px;">${displayConf}</h4>
                        <span style="font-size: 0.7em; opacity: 0.8; color: #94a3b8;">Confidence</span>
                    </div>
                    ` : ''}
                </div>
                
                <div style="width: 100%; height: 8px; background-color: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; ${(isVideo || isUncertain) ? 'display: none;' : ''}">
                    <div style="width: ${barValue}%; height: 100%; background-color: ${themeColor}; transition: width 0.6s ease-in-out;"></div>
                </div>
            </div>
            
            <div class="forensic-grid">
                ${gridHTML}
            </div>
            
            <div class="forensic-analysis-text">
                ${videoMetaHTML}
                ${sourceBadge}
                
                ${explanationHTML}
                
                <div style="color: #f8fafc; line-height: 1.8; font-size: 1.05rem; margin-bottom: 10px;">
                    ${data.lime_html || data.news_text || data.interpretation || "No content."}
                </div>

                ${timelineHTML}
                ${frameGalleryHTML}
                ${evidenceHTML}
            </div>
        </div>
    `;

    // --- 5. RENDER TO DOM ---
    let container = document.getElementById('forensic-report-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'forensic-report-container';
        resultsArea.insertBefore(container, resultsArea.firstChild);
    }
    container.innerHTML = reportHTML;
    container.style.display = 'block';

    setTimeout(() => {
        resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // --- 6. RENDER BIAS DISTRIBUTION ---
    const biasContainer = document.getElementById('bias-container');
    const segLeft = document.getElementById('bias-seg-left');
    const segCenter = document.getElementById('bias-seg-center');
    const segRight = document.getElementById('bias-seg-right');
    const txtLeft = segLeft ? segLeft.querySelector('.bias-text') : null;
    const txtCenter = segCenter ? segCenter.querySelector('.bias-text') : null;
    const txtRight = segRight ? segRight.querySelector('.bias-text') : null;
    const legLeft = document.getElementById('bias-legend-left');
    const legCenter = document.getElementById('bias-legend-center');
    const legRight = document.getElementById('bias-legend-right');
    const dominantLabel = document.getElementById('bias-dominant-label');

    if (biasContainer) biasContainer.style.display = 'none';

    if (data.bias_data && !isVideo) {
        if (biasContainer) biasContainer.style.display = 'block';
        
        const scores = data.bias_data.all_scores || {};
        let domLabel = data.bias_data.label;
        const domConf = data.bias_data.confidence;

        const pLeft = scores['Left'] || scores['left'] || scores['0'] || 0;
        const pCenter = scores['Center'] || scores['center'] || scores['1'] || 0;
        const pRight = scores['Right'] || scores['right'] || scores['2'] || 0;

        if (domLabel == '0') domLabel = "Left";
        if (domLabel == '1') domLabel = "Center";
        if (domLabel == '2') domLabel = "Right";

        if (segLeft) segLeft.style.width = `${pLeft}%`;
        if (segCenter) segCenter.style.width = `${pCenter}%`;
        if (segRight) segRight.style.width = `${pRight}%`;

        if (txtLeft) txtLeft.innerText = pLeft > 8 ? `${Math.round(pLeft)}%` : '';
        if (txtCenter) txtCenter.innerText = pCenter > 8 ? `${Math.round(pCenter)}%` : '';
        if (txtRight) txtRight.innerText = pRight > 8 ? `${Math.round(pRight)}%` : '';

        if (legLeft) legLeft.innerText = `Left: ${pLeft}%`;
        if (legCenter) legCenter.innerText = `Center: ${pCenter}%`;
        if (legRight) legRight.innerText = `Right: ${pRight}%`;
        
        if (dominantLabel) {
            dominantLabel.innerText = `${domLabel} (${domConf}%)`;
            const dLow = String(domLabel).toLowerCase();
            if (dLow.includes('left') || dLow === '0') dominantLabel.style.color = "#3b82f6";
            else if (dLow.includes('right') || dLow === '2') dominantLabel.style.color = "#ef4444";
            else dominantLabel.style.color = "#a855f7";
        }
    }
}

function addToHistory(data) {
    let itemType = 'text';
    const content = data.input_text || data.news_text || "";
    if (content.trim().startsWith('http') && (content.includes('youtube') || content.includes('youtu.be') || content.includes('tiktok') || content.includes('facebook'))) {
        itemType = 'video';
    }

    // --- THE FIX: Use the true frame count from Python, not the image array length ---
    const actualFrameCount = (data.frame_count !== undefined) 
        ? data.frame_count 
        : (data.suspicious_frames ? data.suspicious_frames.length : 0);

    const baseSnapshot = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        type: itemType,
        input_text: content,
        score_label: data.score_label,
        classification_text: data.classification_text,
        model_confidence: data.model_confidence,
        colors: data.colors,   
        
                frame_count: actualFrameCount,
        scan_skipped: data.scan_skipped,
        timeline_graph: data.timeline_graph,
        lime_html: data.lime_html,
        supporting_articles: data.supporting_articles,
        bias_data: data.bias_data,
        interpretation: data.interpretation,
        search_verdict: data.search_verdict,
        search_reason: data.search_reason,
        evidence: data.evidence,
        explanation: data.explanation,
        extracted_claim: data.extracted_claim,
        author: document.getElementById('preview-author') ? document.getElementById('preview-author').innerText : (data.author || "Unknown"),
        platform: document.getElementById('preview-platform') ? document.getElementById('preview-platform').innerText : (data.platform || "Platform"),
        isFavorite: false 
    };

    let history = JSON.parse(localStorage.getItem('credibility_history')) || [];

    try {
        const fullSnapshot = { 
            ...baseSnapshot, 
            suspicious_frames: data.suspicious_frames ? data.suspicious_frames.slice(0, 3) : [] 
        };
        
        history.unshift(fullSnapshot);
        
        if (history.length > 15) {
            let indexToRemove = -1;
            for (let i = history.length - 1; i >= 0; i--) {
                if (!history[i].isFavorite) { indexToRemove = i; break; }
            }
            if (indexToRemove !== -1) history.splice(indexToRemove, 1);
            else history.pop();
        }

        localStorage.setItem('credibility_history', JSON.stringify(history));
    
    } catch (e) {
        console.warn("Storage full! Saving history without images.");
        
        if(history[0] && history[0].id === baseSnapshot.id) history.shift();

        const lightSnapshot = { 
            ...baseSnapshot, 
            suspicious_frames: [] 
        };
        
        history.unshift(lightSnapshot);
        
        try {
            while(history.length > 10) history.pop();
            localStorage.setItem('credibility_history', JSON.stringify(history));
        } catch(err2) {
            console.error("Critical Storage Error", err2);
        }
    }
    
    filterHistoryItems(); 
}

window.filterHistoryItems = function() {
    const searchInput = document.getElementById('history-search-input');
    const filterSelect = document.getElementById('history-filter-select');
    
    const keyword = searchInput ? searchInput.value.toLowerCase() : "";
    const category = filterSelect ? filterSelect.value : "all";

    let history = JSON.parse(localStorage.getItem('credibility_history')) || [];

    if (category !== 'all') {
        history = history.filter(item => {
            let type = item.type || 'text';
            let label = item.score_label ? item.score_label.toLowerCase() : "";

            if (category === 'saved') return item.isFavorite === true;
            if (category === 'text') return type === 'text';
            if (category === 'video') return type === 'video';
            
            if (category === 'verified') {
                return label.includes('verified') || label.includes('real') || label.includes('high');
            }
            if (category === 'fake') {
                return label.includes('fake') || label.includes('low') || label.includes('debunked');
            }
            if (category === 'uncertain') {
                return label.includes('uncertain') || label.includes('unknown');
            }

            return true;
        });
    }

    if (keyword.trim() !== "") {
        history = history.filter(item => 
            (item.score_label && item.score_label.toLowerCase().includes(keyword)) ||
            (item.input_text && item.input_text.toLowerCase().includes(keyword)) ||
            (item.timestamp && item.timestamp.toLowerCase().includes(keyword))
        );
    }

    renderHistory(history);
};

function renderHistory(itemsToRender = null) {
    const container = document.getElementById('history-list');
    if (!container) return;

    let history;
    if (itemsToRender) {
        history = itemsToRender;
    } else {
        history = JSON.parse(localStorage.getItem('credibility_history')) || [];
        history.sort((a, b) => (b.isFavorite === true) - (a.isFavorite === true));
    }

    container.innerHTML = '';

    if (history.length === 0) {
        const msg = itemsToRender ? "No matches found." : "No history yet.";
        container.innerHTML = `<p style="text-align:center; color:#999; padding:20px;">${msg}</p>`;
        return;
    }

    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const isLocked = item.isFavorite;
        const starIcon = isLocked ? '⭐' : '☆';
        const typeIcon = item.type === 'video' ? '🎥' : '📄';

        div.onclick = (e) => {
            if(e.target.tagName === 'BUTTON') return;
            restoreSession(item.id);
        };

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="flex: 1; min-width: 0; padding-right: 15px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:1.1em;">${typeIcon}</span>
                        <strong style="color:#f8fafc; font-size:1.05rem;">${item.score_label}</strong>
                    </div>
                    <div style="font-size:0.85rem; color:#cbd5e1; margin-top:6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${item.input_text.substring(0, 60)}...
                    </div>
                    <div style="font-size:0.75rem; color:#6b7280; margin-top:4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        Claim: ${item.extracted_claim ? item.extracted_claim.substring(0, 60) + '...' : 'N/A'}
                    </div>
                </div>
                <div style="font-size:0.85rem; color:#94a3b8; font-weight: 500; text-align: right; flex-shrink: 0; margin-top: 2px;">
                    ${item.timestamp}
                </div>
            </div>

            <div class="history-actions" style="margin-top:10px; display:flex; gap:10px; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;">
                <button onclick="toggleFavorite(event, ${item.id})" style="border:none; background:none; cursor:pointer; color:${isLocked ? '#f59e0b' : '#94a3b8'}; font-weight:600;">
                    ${starIcon} Save
                </button>
                <button onclick="deleteItem(event, ${item.id})" style="border:none; background:none; cursor:pointer; color:#f87171;">
                    🗑️ Delete
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

window.restoreSession = function(id) {
    const history = JSON.parse(localStorage.getItem('credibility_history')) || [];
    const item = history.find(x => x.id === id);

    if (item) {
        const data = {
            ...item,
            suspicious_frames: item.suspicious_frames || [],
            extracted_claim: item.extracted_claim // Ensure extracted_claim is passed when restoring
        };
        
        if(item.type === 'video') {
             const vInput = document.getElementById('videoUrlInput');
             if(vInput) vInput.value = item.input_text;
             const vidTab = document.querySelector('.tab[data-mode="video"]');
             if(vidTab) vidTab.click();
        } else {
             const tInput = document.getElementById('userInput');
             if(tInput) tInput.value = item.input_text;
             const textTab = document.querySelector('.tab[data-mode="text"]');
             if(textTab) textTab.click();
        }

        displayAnalysis(data);
        
        const modal = document.getElementById('history-modal-overlay');
        if(modal) {
             modal.classList.remove('modal-active');
             modal.style.display = 'none';
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.toggleFavorite = function(event, id) {
    if(event) event.stopPropagation();
    let history = JSON.parse(localStorage.getItem('credibility_history')) || [];
    const index = history.findIndex(x => x.id === id);
    if (index !== -1) {
        history[index].isFavorite = !history[index].isFavorite;
        localStorage.setItem('credibility_history', JSON.stringify(history));
        filterHistoryItems(); 
    }
};

window.deleteItem = function(event, id) {
    if(event) event.stopPropagation();
    let history = JSON.parse(localStorage.getItem('credibility_history')) || [];
    const item = history.find(x => x.id === id);
    if (item && item.isFavorite) {
        alert("This item is saved! Unsave it first to delete.");
        return; 
    }
    if(!confirm("Delete this analysis?")) return;
    history = history.filter(x => x.id !== id);
    localStorage.setItem('credibility_history', JSON.stringify(history));
    filterHistoryItems(); 
};

const videoInput = document.getElementById('videoUrlInput');
const previewCard = document.getElementById('video-preview-card');
let debounceTimer;

if (videoInput && previewCard) {
    videoInput.addEventListener('input', () => {
        const url = videoInput.value.trim();
        
        if (!url) {
            previewCard.style.display = 'none';
            return;
        }

        previewCard.style.display = 'block';
        document.getElementById('preview-title').innerText = "Fetching details...";
        document.getElementById('preview-author').innerText = "...";
        document.getElementById('preview-thumb').src = "https://via.placeholder.com/140x100?text=Loading"; 

        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(async () => {
            try {
                const formData = new FormData();
                formData.append('video_url', url);

                const res = await fetch(`${BASE_URL}/fetch-video-metadata`, {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) throw new Error("Invalid URL");
                
                const data = await res.json();
                
                if (data.status === "success") {
                    document.getElementById('preview-title').innerText = data.title;
                    document.getElementById('preview-thumb').src = data.thumbnail;
                    document.getElementById('preview-author').innerText = data.author;
                    document.getElementById('preview-platform').innerText = data.platform;
                    
                    const mins = Math.floor(data.duration / 60);
                    const secs = data.duration % 60;
                    document.getElementById('preview-duration').innerText = 
                        `${mins}:${secs.toString().padStart(2, '0')}`;
                        
                } else {
                    throw new Error(data.message);
                }
            } catch (err) {
                document.getElementById('preview-title').innerText = "❌ Video not found or invalid URL";
                document.getElementById('preview-thumb').src = "https://via.placeholder.com/140x100?text=Error";
            }
        }, 600); 
    });
}
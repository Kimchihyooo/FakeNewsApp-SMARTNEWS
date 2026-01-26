// static/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize History
    if (typeof renderHistory === 'function') renderHistory();

    // 2. Initialize Filters
    const searchInput = document.getElementById('history-search-input');
    const filterSelect = document.getElementById('history-filter-select');

    if (searchInput) {
        searchInput.addEventListener('input', filterHistoryItems);
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', filterHistoryItems);
    }

    // 3. Initialize Image Modal Logic
    const imgModal = document.getElementById('image-modal-overlay');
    const imgClose = document.getElementById('image-modal-close');
    
    if (imgClose && imgModal) {
        imgClose.onclick = () => imgModal.style.display = "none";
        imgModal.onclick = (e) => {
            if (e.target === imgModal) imgModal.style.display = "none";
        };
    }

    // 4. WORD COUNTER WITH 1000 WORD CAP
    const wordInput = document.getElementById('userInput');
    const wordCountDisplay = document.getElementById('word-counts');
    const analyzeBtn = document.getElementById('btntext'); // The button to disable

    if (wordInput && wordCountDisplay) {
        const updateCount = () => {
            const text = wordInput.value.trim();
            // Split by whitespace to count words accurately
            const count = text ? text.split(/\s+/).length : 0;
            
            // Update the display text
            wordCountDisplay.innerText = `${count} / 1000 words`;

            // LOGIC: Check if limit is exceeded
            if (count > 1000) {
                // Limit Exceeded: Red text + Disable Button
                wordCountDisplay.style.color = "#dc2626"; // Red
                wordCountDisplay.style.fontWeight = "bold";
                
                if(analyzeBtn) {
                    analyzeBtn.disabled = true;
                    analyzeBtn.style.opacity = "0.5";
                    analyzeBtn.style.cursor = "not-allowed";
                    analyzeBtn.title = "Please reduce text to under 1000 words";
                }
            } else {
                // Within Limit: Normal text + Enable Button
                wordCountDisplay.style.color = "#64748b"; // Gray
                wordCountDisplay.style.fontWeight = "normal";
                
                if(analyzeBtn) {
                    analyzeBtn.disabled = false;
                    analyzeBtn.style.opacity = "1";
                    analyzeBtn.style.cursor = "pointer";
                    analyzeBtn.title = "";
                }
            }
        };

        wordInput.addEventListener('input', updateCount);
    }
});

// =========================================================
// 1. HELPER: OPEN IMAGE MODAL
// =========================================================
function openImageModal(src) {
    const modal = document.getElementById('image-modal-overlay');
    const modalImg = document.getElementById('image-modal-img');
    if (modal && modalImg) {
        modal.style.display = "flex";
        modalImg.src = src;
    }
}

// =========================================================
// 2. FORM SUBMIT
// =========================================================
const form = document.getElementById('analyzeForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const btnText = document.getElementById('btntext');
        const btnVid = document.getElementById('btnvid');
        const timerDisplay = document.getElementById('timer-display');
        
        // A. FIND ACTIVE ELEMENTS
        const videoTab = document.querySelector('.tab[data-mode="video"]');
        const isVideoMode = videoTab && videoTab.classList.contains('tab-active');

        // This determines which box (Text or Video) gets the animation
        const activeInput = isVideoMode 
            ? document.getElementById('videoUrlInput') 
            : document.getElementById('userInput');
            
        const activeBtn = isVideoMode ? btnVid : btnText;
        const originalText = activeBtn.innerText;

        // B. START VISUAL EFFECTS
        const startTime = Date.now(); 
        let timerInterval = null;

        // --- NEW: Add Scanning Class ---
        if(activeInput) activeInput.classList.add('scanning-effect');

        activeBtn.innerText = "Analyzing..."; 
        activeBtn.disabled = true;
        activeBtn.style.opacity = "0.7";
        
        if(timerDisplay) {
            timerDisplay.style.display = 'block';
            timerDisplay.innerText = "Processing: 0.00s";
            timerInterval = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000;
                timerDisplay.innerText = `Processing: ${elapsed.toFixed(2)}s`;
            }, 50);
        }

        const formData = new FormData(form);

        try {
            const response = await fetch(form.getAttribute('action'), {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Server Error");
            }

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            // 1. SHOW RESULTS (With Animation)
            displayAnalysis(data);

            // 2. SAVE TO HISTORY
            addToHistory(data);

        } catch (error) {
            displayError(error.message); 
            console.error(error);
        } finally {
            if (timerInterval) clearInterval(timerInterval);
            
            if (timerDisplay) {
                const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
                timerDisplay.innerText = `Process finished (${totalTime}s)`;
            }

            // --- NEW: Remove Scanning Class ---
            if(activeInput) activeInput.classList.remove('scanning-effect');

            activeBtn.innerText = originalText;
            activeBtn.disabled = false;
            activeBtn.style.opacity = "1";
        }
    });
}

// =========================================================
// 3. HELPER: DISPLAY ERROR
// =========================================================
function displayError(message) {
    const resultsArea = document.getElementById('results-area');
    const placeholder = document.getElementById('results-placeholder');
    
    placeholder.style.display = 'none';
    resultsArea.style.display = 'block';

    // Hide normal results
    document.getElementById('scoreBox').style.display = 'none';
    document.getElementById('classifications').style.display = 'none';
    
    // Show Error Box in result container
    const resultContainer = document.getElementById('text-results-container');
    const videoContainer = document.getElementById('video-results-container');
    
    // Reset views
    if(videoContainer) videoContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    
    resultContainer.innerHTML = `
        <div style="text-align:center; padding: 30px; color: #b91c1c; background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 12px;">
            <h3 style="margin-top:0; font-family: 'Rubik', sans-serif;">⚠️ Analysis Failed</h3>
            <p style="margin-top:10px; font-size: 1.1rem; line-height: 1.5;">${message}</p>
        </div>
    `;
}

// =========================================================
// 4. DISPLAY ANALYSIS (WITH PROGRESS BAR)
// =========================================================
function displayAnalysis(data) {
    const resultsArea = document.getElementById('results-area');
    const placeholder = document.getElementById('results-placeholder');
    
    // 1. Show Results Area / Hide Placeholder
    if(placeholder) placeholder.style.display = 'none';
    if(resultsArea) resultsArea.style.display = 'block';

    // 2. Hide Legacy External Containers
    const oldScore = document.getElementById('scoreBox');
    if(oldScore) oldScore.style.display = 'none';
    const oldClass = document.getElementById('classifications');
    if(oldClass) oldClass.style.display = 'none';
    const oldTextResults = document.getElementById('text-results-container');
    if(oldTextResults) oldTextResults.style.display = 'none';
    const oldVideoResults = document.getElementById('video-results-container');
    if(oldVideoResults) oldVideoResults.style.display = 'none';

    // 3. Setup Variables
    const isVideo = data.suspicious_frames !== undefined;
    let themeColor = "#3b82f6"; // Default Blue
    let verdictLabel = data.score_label || "Processing..."; 
    let isReal = false;

    // Color Logic
    const labelLower = verdictLabel.toLowerCase();
    if (labelLower.includes("real") || labelLower.includes("high credibility") || labelLower.includes("verified")) {
        themeColor = "#166534"; // Green
        isReal = true;
    } else if (labelLower.includes("fake") || labelLower.includes("low credibility")) {
        themeColor = "#b91c1c"; // Red
    } else {
        themeColor = "#d97706"; // Orange
    }

    // 4. PREPARE DATA & CONFIDENCE BAR
    const confValue = data.model_confidence ? Math.round(parseFloat(data.model_confidence)) : 0;
    const displayConf = confValue + "%";

    // 5. GET VIDEO METADATA
    let videoMetaHTML = "";
    if (isVideo) {
        const author = document.getElementById('preview-author') ? document.getElementById('preview-author').innerText : "Unknown";
        const platform = document.getElementById('preview-platform') ? document.getElementById('preview-platform').innerText : "Platform";
        
        videoMetaHTML = `
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Source Channel</div>
                    <div style="font-weight:600; color:#334155; font-size:1rem;">${author}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Platform</div>
                    <div style="font-weight:600; color:#334155; font-size:1rem;">${platform}</div>
                </div>
            </div>
        `;
    }

    // 6. BUILD FRAME GALLERY
    let framesHTML = "";
    if (isVideo && data.suspicious_frames && data.suspicious_frames.length > 0) {
        let images = "";
        data.suspicious_frames.forEach(b64 => {
            if(b64) {
                images += `<img src="data:image/jpeg;base64,${b64}" 
                    style="width: 100px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; cursor: pointer; transition: transform 0.2s;" 
                    onclick="openImageModal(this.src)" 
                    onmouseover="this.style.transform='scale(1.05)'" 
                    onmouseout="this.style.transform='scale(1)'" />`;
            }
        });
        framesHTML = `
            <div style="margin-top: 20px;">
                <h5 style="color: #64748b; margin-bottom: 10px; font-size: 0.9rem;">
                    ${isReal ? 'Analyzed Frames (Sample)' : '⚠️ Anomalies Detected'}
                </h5>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">${images}</div>
            </div>
        `;
    } else if (isVideo) {
         framesHTML = `<div style="margin-top:20px; color:#94a3b8; font-style:italic; font-size:0.9rem;">No anomalies detected in video frames.</div>`;
    }

    // 7. BUILD EVIDENCE LIST
    let evidenceHTML = "";
    const evidenceList = data.evidence || data.supporting_articles || [];
    if (evidenceList.length > 0) {
        evidenceHTML += `
            <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #f3f4f6;">
                <h5 style="color: #111827; font-weight: 700; font-size: 1.05rem; margin-bottom: 15px; display:flex; align-items:center; gap:8px;">
                    <span>📚</span> Supporting Sources
                </h5>
        `;
        evidenceList.forEach(item => {
            evidenceHTML += `
                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #e5e7eb;">
                    <a href="${item.link}" target="_blank" style="font-weight: 600; color: #1a0dab; text-decoration: none; display:block; margin-bottom:2px;">
                        ${item.title}
                    </a>
                    <div style="font-size: 0.85rem; color: #6b7280;">
                        ${item.website || item.displayLink || "Source"}
                    </div>
                </div>
            `;
        });
        evidenceHTML += `</div>`;
    }

    // 8. BUILD LEGEND
    let legendHTML = "";
    if (!isVideo && data.lime_html && data.lime_html.includes('lime-bad')) {
        legendHTML = `
            <div style="margin-top: 15px; margin-bottom: 20px; padding: 10px 12px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: #991b1b;">
                <div style="width: 16px; height: 16px; background-color: #fca5a5; border: 1px solid #ef4444; border-radius: 3px;"></div>
                <span>Sentences flagged as highly suspicious.</span>
            </div>
        `;
    }

    // 9. BUILD GRID STATS
    let gridHTML = "";
    if (isVideo) {
        gridHTML = `
            <div class="forensic-stat"><h5>Visual Check</h5><p>${data.suspicious_frames.length > 0 ? (isReal ? 'Pass' : 'Fail') : 'Clean'}</p></div>
            <div class="forensic-stat"><h5>Metadata</h5><p>${data.search_verdict || "Checked"}</p></div>
            <div class="forensic-stat"><h5>Anomalies</h5><p>${data.suspicious_frames.length} Frames</p></div>
        `;
    } else {
        gridHTML = `
            <div class="forensic-stat"><h5>Type</h5><p>Text Article</p></div>
            <div class="forensic-stat"><h5>Fact Check</h5><p style="color:${evidenceList.length > 0 ? '#166534':'#64748b'}">${evidenceList.length > 0 ? 'Evidence Found' : 'No Matches'}</p></div>
            <div class="forensic-stat"><h5>Sources</h5><p>${evidenceList.length} Links</p></div>
        `;
    }

    // 10. BUILD FINAL CARD HTML (WITH PROGRESS BAR)
    let sourceBadge = "";
    if (isVideo && data.search_verdict === "VERIFIED") {
        sourceBadge = `<div style="background:#dcfce7; color:#14532d; padding:10px; border-radius:6px; margin-bottom:15px; font-weight:600;">✅ Source Verified</div>`;
    }

    const reportHTML = `
        <div class="forensic-card">
            <div class="forensic-header" style="border-left: 6px solid ${themeColor}; display: flex; flex-direction: column; gap: 15px; padding-bottom: 20px;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div class="forensic-verdict-box">
                        <h4>Verdict</h4>
                        <h2 style="color: ${themeColor}; margin: 0;">${verdictLabel}</h2>
                    </div>
                    <div class="forensic-score-circle" style="text-align: right;">
                        <div class="forensic-score-val" style="font-size: 2rem; font-weight: 700; color: ${themeColor}; line-height: 1;">${displayConf}</div>
                        <div class="forensic-score-label" style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; margin-top: 5px;">Confidence</div>
                    </div>
                </div>

                <div style="width: 100%; height: 8px; background-color: #f1f5f9; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${confValue}%; height: 100%; background-color: ${themeColor}; transition: width 0.6s ease-in-out;"></div>
                </div>
            </div>
            
            <div class="forensic-grid">
                ${gridHTML}
            </div>
            
            <div class="forensic-analysis-text">
                ${videoMetaHTML}
                ${sourceBadge}
                
                <div style="color: #374151; line-height: 1.8; font-size: 1.05rem; margin-bottom: 10px;">
                    ${data.lime_html || data.news_text || data.interpretation || "No content."}
                </div>

                ${legendHTML}
                ${framesHTML}
                ${evidenceHTML}
            </div>
        </div>
    `;

    // 11. INJECT CARD
    let container = document.getElementById('forensic-report-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'forensic-report-container';
        resultsArea.insertBefore(container, resultsArea.firstChild);
    }
    container.innerHTML = reportHTML;
    container.style.display = 'block';

    // 12. SCROLL
    setTimeout(() => {
        resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// =========================================================
// 5. ADD TO HISTORY (SAFE VERSION - NO IMAGES)
// =========================================================
function addToHistory(data) {
    try {
        let history = JSON.parse(localStorage.getItem('credibility_history')) || [];

        // Determine type
        let itemType = 'text';
        const content = data.input_text || data.news_text || "";
        if (content.trim().startsWith('http') && (content.includes('youtube') || content.includes('youtu.be') || content.includes('tiktok') || content.includes('facebook'))) {
            itemType = 'video';
        }

        const snapshot = {
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            type: itemType,
            input_text: content,
            score_label: data.score_label,
            classification_text: data.classification_text,
            model_confidence: data.model_confidence,
            colors: data.colors,
            
            // Text Mode Data
            lime_html: data.lime_html,
            supporting_articles: data.supporting_articles,

            // Video Mode Data
            // CRITICAL FIX: We save an empty array for frames to prevent "Quota Exceeded" error.
            // Images are too big for LocalStorage.
            suspicious_frames: [], 
            interpretation: data.interpretation,
            search_verdict: data.search_verdict,
            search_reason: data.search_reason,
            evidence: data.evidence,

            isFavorite: false 
        };

        history.unshift(snapshot);

        // Strict Limit: Keep only last 15 items to save space
        if (history.length > 15) {
            let indexToRemove = -1;
            for (let i = history.length - 1; i >= 0; i--) {
                if (!history[i].isFavorite) {
                    indexToRemove = i;
                    break;
                }
            }
            if (indexToRemove !== -1) {
                history.splice(indexToRemove, 1);
            } else {
                history.pop();
            }
        }

        localStorage.setItem('credibility_history', JSON.stringify(history));
        filterHistoryItems(); // Refresh list immediately
        
    } catch (e) {
        console.warn("History Quota Exceeded. Clearing old non-favorite items...");
        // Emergency cleanup if it still fails
        try {
            let history = JSON.parse(localStorage.getItem('credibility_history')) || [];
            // Keep only favorites
            history = history.filter(item => item.isFavorite);
            localStorage.setItem('credibility_history', JSON.stringify(history));
        } catch (err) {
            console.error("Could not save history:", err);
        }
    }
}

// =========================================================
// 6. FILTER LOGIC
// =========================================================
window.filterHistoryItems = function() {
    const searchInput = document.getElementById('history-search-input');
    const filterSelect = document.getElementById('history-filter-select');
    
    const keyword = searchInput ? searchInput.value.toLowerCase() : "";
    const category = filterSelect ? filterSelect.value : "all";

    let history = JSON.parse(localStorage.getItem('credibility_history')) || [];

    if (category !== 'all') {
        history = history.filter(item => {
            const label = (item.score_label || "").toLowerCase();
            let type = item.type || 'text';

            if (category === 'saved') return item.isFavorite === true;
            if (category === 'text') return type === 'text';
            if (category === 'video') return type === 'video';
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

// =========================================================
// 7. RENDER HISTORY
// =========================================================
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
        const starClass = isLocked ? 'star-active' : 'star-inactive';
        const starIcon = isLocked ? '⭐' : '☆';
        const typeIcon = item.type === 'video' ? '🎥' : '📄';

        div.onclick = (e) => {
            // Prevent triggering if clicked on buttons
            if(e.target.tagName === 'BUTTON') return;
            restoreSession(item.id);
        };

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="flex: 1; min-width: 0; padding-right: 10px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:1.1em;">${typeIcon}</span>
                        <strong style="color:#333;">${item.score_label}</strong>
                    </div>
                    <div style="font-size:0.75rem; color:#888; margin-top:4px;">${item.timestamp}</div>
                    <div style="font-size:0.8rem; color:#555; margin-top:4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${item.input_text.substring(0, 50)}...
                    </div>
                </div>
                
                <span style="font-size:0.8rem; background:#eee; padding:2px 6px; border-radius:4px; height:fit-content; white-space:nowrap;">
                    ${item.model_confidence}%
                </span>
            </div>

            <div class="history-actions" style="margin-top:10px; display:flex; gap:10px; border-top:1px solid #eee; padding-top:8px;">
                <button onclick="toggleFavorite(event, ${item.id})" style="border:none; background:none; cursor:pointer; color:${isLocked ? '#f59e0b' : '#64748b'}; font-weight:600;">
                    ${starIcon} Save
                </button>
                <button onclick="deleteItem(event, ${item.id})" style="border:none; background:none; cursor:pointer; color:#ef4444;">
                    🗑️ Delete
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// =========================================================
// 8. RESTORE & ACTIONS
// =========================================================
window.restoreSession = function(id) {
    const history = JSON.parse(localStorage.getItem('credibility_history')) || [];
    const item = history.find(x => x.id === id);

    if (item) {
        const data = {
            score_label: item.score_label,
            classification_text: item.classification_text,
            model_confidence: item.model_confidence,
            colors: item.colors,
            lime_html: item.lime_html,
            supporting_articles: item.supporting_articles,
            suspicious_frames: item.suspicious_frames,
            interpretation: item.interpretation,
            search_verdict: item.search_verdict,
            search_reason: item.search_reason,
            evidence: item.evidence
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
        document.getElementById('history-modal-overlay').classList.remove('modal-active');
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

// =========================================================
// 9. AUTO-FETCH VIDEO METADATA
// =========================================================
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

                const res = await fetch('/fetch-video-metadata', {
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
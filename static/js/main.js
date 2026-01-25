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

        const activeInput = isVideoMode 
            ? document.getElementById('videoUrlInput') 
            : document.getElementById('userInput');
            
        const activeBtn = isVideoMode ? btnVid : btnText;
        const originalText = activeBtn.innerText;

        // B. START VISUAL EFFECTS
        const startTime = Date.now(); 
        let timerInterval = null;

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
            displayError(error.message); // Use the helper to show error in UI
            console.error(error);
        } finally {
            if (timerInterval) clearInterval(timerInterval);
            
            if (timerDisplay) {
                const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
                timerDisplay.innerText = `Process finished (${totalTime}s)`;
            }

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
// 4. DISPLAY ANALYSIS (UPDATED: FORENSIC CARD)
// =========================================================
function displayAnalysis(data) {
    const resultsArea = document.getElementById('results-area');
    const placeholder = document.getElementById('results-placeholder');
    
    // 1. Hide placeholder, Show results
    placeholder.style.display = 'none';
    resultsArea.style.display = 'block';

    // 2. Hide old generic boxes (We are replacing them)
    document.getElementById('scoreBox').style.display = 'none';
    document.getElementById('classifications').style.display = 'none';

    // 3. GENERATE FORENSIC REPORT CARD
    // Determine Theme Colors based on Verdict
    let themeColor = "#3b82f6"; // Default Blue
    let isReal = false;
    
    if (data.score_label.toLowerCase().includes("real")) {
        themeColor = "#166534"; // Green
        isReal = true;
    } else if (data.score_label.toLowerCase().includes("fake") || data.score_label.toLowerCase().includes("deepfake")) {
        themeColor = "#b91c1c"; // Red
    } else if (data.score_label.toLowerCase().includes("debunked")) {
        themeColor = "#b91c1c"; // Red
    } else {
        themeColor = "#d97706"; // Orange/Uncertain
    }

    // Determine Frame Label (Trust Signal)
    const frameLabel = isReal ? "Artifact" : "Manipulation";
    const frameClass = isReal ? "frame-artifact" : "frame-fake";
    const frameColor = isReal ? "#f59e0b" : "#ef4444";

    // Build the HTML
    const reportHTML = `
        <div class="forensic-card">
            <div class="forensic-header" style="border-left: 6px solid ${themeColor};">
                <div class="forensic-verdict-box">
                    <h4>Authenticity Verdict</h4>
                    <h2 style="color: ${themeColor};">${data.score_label}</h2>
                </div>
                <div class="forensic-score-circle">
                    <div class="forensic-score-val">${Math.round(data.model_confidence)}%</div>
                    <div class="forensic-score-label">Confidence</div>
                </div>
            </div>
            
            <div class="forensic-grid">
                <div class="forensic-stat">
                    <h5>Visual Check</h5>
                    <p style="color: ${data.suspicious_frames && data.suspicious_frames.length > 5 ? '#d97706' : '#166534'}">
                        ${data.suspicious_frames && data.suspicious_frames.length > 0 ? (isReal ? 'Pass with noise' : 'Fail') : 'Clean'}
                    </p>
                </div>
                <div class="forensic-stat">
                    <h5>Metadata</h5>
                    <p style="color: ${data.search_verdict === 'VERIFIED' ? '#166534' : '#64748b'}">
                        ${data.search_verdict || 'N/A'}
                    </p>
                </div>
                <div class="forensic-stat">
                    <h5>Anomalies</h5>
                    <p>${data.suspicious_frames ? data.suspicious_frames.length : 0} Frames</p>
                </div>
            </div>
            
            <div class="forensic-analysis-text">
                ${data.interpretation || "No detailed interpretation available."}
            </div>
        </div>
    `;

    // Inject into a container (We reuse text-results-container for positioning, or insert before it)
    let forensicContainer = document.getElementById('forensic-report-container');
    if (!forensicContainer) {
        forensicContainer = document.createElement('div');
        forensicContainer.id = 'forensic-report-container';
        // Insert before the detailed tabs
        const parent = document.getElementById('text-results-container').parentNode;
        parent.insertBefore(forensicContainer, document.getElementById('text-results-container'));
    }
    forensicContainer.innerHTML = reportHTML;
    forensicContainer.style.display = 'block';

    // 4. SWITCH MODE (Text vs Video Details)
    const textContainer = document.getElementById('text-results-container');
    const videoContainer = document.getElementById('video-results-container');

    // CHECK: Video Mode if specific fields exist
    if (data.suspicious_frames || data.evidence) {
        // === VIDEO MODE ===
        if(textContainer) textContainer.style.display = 'none';
        if(videoContainer) videoContainer.style.display = 'block';

        // Hide old interpretation box since it's now in the card
        const oldInterp = document.getElementById('video-interpretation').parentNode;
        if(oldInterp) oldInterp.style.display = 'none';

        // Frame Gallery (Trustable Colors)
        const gallery = document.getElementById('frame-gallery');
        if(gallery) {
            gallery.innerHTML = ""; 
            if (data.suspicious_frames && data.suspicious_frames.length > 0) {
                data.suspicious_frames.forEach(b64 => {
                    const wrapper = document.createElement('div');
                    wrapper.style.position = "relative";
                    
                    const img = document.createElement('img');
                    img.src = "data:image/jpeg;base64," + b64;
                    img.style.width = "100%";
                    img.style.borderRadius = "8px";
                    img.className = frameClass; // Apply Orange or Red class
                    img.style.cursor = "zoom-in";
                    img.onclick = () => openImageModal(img.src);
                    
                    // Add Label Badge
                    const badge = document.createElement('span');
                    badge.innerText = frameLabel;
                    badge.style.position = "absolute";
                    badge.style.bottom = "8px";
                    badge.style.right = "8px";
                    badge.style.background = frameColor;
                    badge.style.color = "#fff";
                    badge.style.fontSize = "0.7rem";
                    badge.style.padding = "2px 6px";
                    badge.style.borderRadius = "4px";
                    badge.style.fontWeight = "bold";
                    badge.style.pointerEvents = "none";

                    wrapper.appendChild(img);
                    wrapper.appendChild(badge);
                    gallery.appendChild(wrapper);
                });
            } else {
                gallery.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #9ca3af; font-style: italic;">No suspicious artifacts detected.</p>`;
            }
        }

        // Verification Results (Google Search)
        const transcriptBox = document.getElementById('video-transcript-container');
        if(transcriptBox) {
            transcriptBox.innerHTML = "";
            
            // Search Header
            const searchHeader = document.createElement('h4');
            searchHeader.style.marginTop = "0";
            searchHeader.style.color = "#374151";
            searchHeader.innerHTML = `🔎 Content Verification`;
            transcriptBox.appendChild(searchHeader);

            // Verdict Banner
            const statusDiv = document.createElement('div');
            statusDiv.style.padding = "12px";
            statusDiv.style.borderRadius = "8px";
            statusDiv.style.marginBottom = "15px";
            statusDiv.style.fontWeight = "bold";
            
            if (data.search_verdict === "DEBUNKED") {
                statusDiv.style.backgroundColor = "#fee2e2";
                statusDiv.style.color = "#b91c1c";
                statusDiv.innerHTML = `🚩 DEBUNKED: ${data.search_reason || ''}`;
            } else if (data.search_verdict === "VERIFIED") {
                statusDiv.style.backgroundColor = "#dcfce7";
                statusDiv.style.color = "#166534";
                statusDiv.innerHTML = `✅ VERIFIED: ${data.search_reason || ''}`;
            } else {
                statusDiv.style.backgroundColor = "#f3f4f6";
                statusDiv.style.color = "#4b5563";
                statusDiv.innerHTML = `❓ ${data.search_verdict || 'Uncertain'}: ${data.search_reason || ''}`;
            }
            transcriptBox.appendChild(statusDiv);

            // Evidence Links
            if (data.evidence && data.evidence.length > 0) {
                const list = document.createElement('div');
                data.evidence.forEach(item => {
                    const row = document.createElement('div');
                    row.style.marginBottom = "10px";
                    row.style.padding = "10px";
                    row.style.borderLeft = "4px solid #ddd";
                    row.style.backgroundColor = "#f9fafb";
                    row.style.borderRadius = "0 8px 8px 0";
                    
                    let icon = "🔗";
                    if(item.status === "DEBUNKED") icon = "❌";
                    if(item.status === "VERIFIED") icon = "✅";

                    row.innerHTML = `
                        <div style="font-size: 0.95rem; font-weight: 600; margin-bottom: 4px;">
                            ${icon} <a href="${item.link}" target="_blank" style="text-decoration:none; color:#2563eb;">${item.title}</a>
                        </div>
                        <div style="font-size: 0.8rem; color: #666;">
                            ${item.website} • <span style="font-style:italic;">${item.status}</span>
                        </div>
                    `;
                    list.appendChild(row);
                });
                transcriptBox.appendChild(list);
            } else {
                const noEv = document.createElement('p');
                noEv.style.color = "#888";
                noEv.style.fontStyle = "italic";
                noEv.innerText = "No matching news reports found for this video title.";
                transcriptBox.appendChild(noEv);
            }
        }

    } else {
        // === TEXT MODE ===
        // (Hide forensic card if strictly text mode, or adapt it)
        if(forensicContainer) forensicContainer.style.display = 'none';
        document.getElementById('scoreBox').style.display = 'block'; // Show old box for text
        document.getElementById('classifications').style.display = 'block';

        if(videoContainer) videoContainer.style.display = 'none';
        if(textContainer) textContainer.style.display = 'block';

        const resultContainer = document.getElementById('result-container');
        if(resultContainer) resultContainer.innerHTML = data.lime_html || data.news_text;
        
        // ... (Keep existing text mode sources logic) ...
         const sourcesList = document.getElementById('sources-list');
        if(sourcesList) {
            sourcesList.innerHTML = '';
            if (data.supporting_articles && data.supporting_articles.length > 0) {
                data.supporting_articles.forEach(article => {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <div style="margin-bottom: 10px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <a href="${article.link}" target="_blank" style="color: #2563eb; font-weight: 600;">${article.title}</a>
                            <div style="font-size: 0.8rem; color: #64748b;">${article.displayLink}</div>
                        </div>`;
                    sourcesList.appendChild(div);
                });
            } else {
                sourcesList.innerHTML = '<p style="color:#94a3b8; font-style: italic;">No specific supporting sources found.</p>';
            }
        }
    }
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
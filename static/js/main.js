// static/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize History
    if (typeof renderHistory === 'function') renderHistory();

    // 2. Initialize Filters (THIS WAS MISSING)
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

        if (activeInput) activeInput.classList.add('scanning');

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

            // 1. SHOW RESULTS
            displayAnalysis(data);

            // 2. SAVE TO HISTORY (This was missing!)
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
            
            if (activeInput) activeInput.classList.remove('scanning');
        }
    });
}

// =========================================================
// 3. HELPER: DISPLAY ERROR
// =========================================================
function displayError(message) {
    document.getElementById('results-placeholder').style.display = 'none';
    document.getElementById('results-area').style.display = 'block';

    document.getElementById('scoreBox').style.display = 'none';
    document.getElementById('classifications').style.display = 'none';
    document.getElementById('sources-list').innerHTML = ''; 

    const resultContainer = document.getElementById('result-container');
    resultContainer.style.display = 'block';
    resultContainer.innerHTML = `
        <div style="text-align:center; padding: 24px; color: #b91c1c; background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px;">
            <h3 style="margin-top:0; font-family: 'Rubik', sans-serif;">⚠️ Analysis Failed</h3>
            <p style="margin-top:10px; font-size: 1.1rem; line-height: 1.5;">${message}</p>
        </div>
    `;
}

// =========================================================
// 4. DISPLAY ANALYSIS
// =========================================================
function displayAnalysis(data) {
    document.getElementById('results-placeholder').style.display = 'none';
    document.getElementById('results-area').style.display = 'block';

    // Reset visibility in case it was hidden by an error before
    document.getElementById('scoreBox').style.display = 'block';
    document.getElementById('classifications').style.display = 'block';

    // Common UI Updates
    const scoreBox = document.getElementById('scoreBox');
    const verdictLabel = document.getElementById('verdict-label');
    const confScore = document.getElementById('confidence-score');
    const confBar = document.getElementById('confidence-bar');
    const classificationText = document.getElementById('classification-text');

    verdictLabel.innerText = data.score_label;
    if(classificationText) classificationText.innerText = data.classification_text || data.score_label;
    confScore.innerText = data.model_confidence + "%";

    if (data.colors) {
        scoreBox.style.backgroundColor = data.colors.bg_color;
        scoreBox.style.border = `1px solid ${data.colors.accent_color}`;
        verdictLabel.style.color = data.colors.text_color;
        
        if (confBar) {
            confBar.style.width = '0%';
            confBar.style.backgroundColor = data.colors.text_color;
            setTimeout(() => { confBar.style.width = data.model_confidence + "%"; }, 100);
        }
    }

    // SWITCH MODE
    const textContainer = document.getElementById('text-results-container');
    const videoContainer = document.getElementById('video-results-container');

    // CHECK: Video Mode if specific fields exist
    if (data.suspicious_frames || data.interpretation || data.evidence) {
        // === VIDEO MODE ===
        if(textContainer) textContainer.style.display = 'none';
        if(videoContainer) videoContainer.style.display = 'block';

        // 1. Deepfake Interpretation
        const interpBox = document.getElementById('video-interpretation');
        if(interpBox) interpBox.innerText = data.interpretation || "No interpretation available.";

        // 2. Frame Gallery
        const gallery = document.getElementById('frame-gallery');
        if(gallery) {
            gallery.innerHTML = ""; 
            if (data.suspicious_frames && data.suspicious_frames.length > 0) {
                data.suspicious_frames.forEach(b64 => {
                    const img = document.createElement('img');
                    img.src = "data:image/jpeg;base64," + b64;
                    img.style.width = "100%";
                    img.style.borderRadius = "5px";
                    img.style.border = "2px solid #ef4444"; 
                    img.onclick = () => openImageModal(img.src);
                    img.style.cursor = "pointer";
                    gallery.appendChild(img);
                });
            } else {
                gallery.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #9ca3af;">No suspicious frames detected.</p>`;
            }
        }

        // 3. Verification Results
        const transcriptBox = document.getElementById('video-transcript-container');
        if(transcriptBox) {
            transcriptBox.innerHTML = "";
            
            // Header
            const searchHeader = document.createElement('h4');
            searchHeader.style.marginTop = "20px";
            searchHeader.style.color = "#374151";
            searchHeader.innerHTML = `🔎 Content Verification <span style="font-size:0.8em; color:#666; font-weight:normal;">(via Google Search)</span>`;
            transcriptBox.appendChild(searchHeader);

            // Banner
            const statusDiv = document.createElement('div');
            statusDiv.style.padding = "10px";
            statusDiv.style.borderRadius = "6px";
            statusDiv.style.marginBottom = "10px";
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

            // Evidence List
            if (data.evidence && data.evidence.length > 0) {
                const list = document.createElement('div');
                data.evidence.forEach(item => {
                    const row = document.createElement('div');
                    row.style.marginBottom = "8px";
                    row.style.padding = "8px";
                    row.style.borderLeft = "3px solid #ddd";
                    row.style.backgroundColor = "#f9fafb";
                    
                    let icon = "🔗";
                    if(item.status === "DEBUNKED") icon = "❌";
                    if(item.status === "VERIFIED") icon = "✅";

                    row.innerHTML = `
                        <div style="font-size: 0.9rem; font-weight: 600;">
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
        if(videoContainer) videoContainer.style.display = 'none';
        if(textContainer) textContainer.style.display = 'block';

        const resultContainer = document.getElementById('result-container');
        if(resultContainer) resultContainer.innerHTML = data.lime_html || data.news_text;

        const sourcesList = document.getElementById('sources-list');
        if(sourcesList) {
            sourcesList.innerHTML = '';
            if (data.supporting_articles && data.supporting_articles.length > 0) {
                data.supporting_articles.forEach(article => {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #eee; border-radius: 6px;">
                            <a href="${article.link}" target="_blank" style="color: #2563eb; font-weight: 600;">${article.title}</a>
                            <div style="font-size: 0.8rem; color: #666;">${article.displayLink}</div>
                        </div>`;
                    sourcesList.appendChild(div);
                });
            } else {
                sourcesList.innerHTML = '<p style="color:#999;">No supporting sources found.</p>';
            }
        }
    }
}

// =========================================================
// 5. ADD TO HISTORY (UPDATED FOR VIDEO)
// =========================================================
function addToHistory(data) {
    let history = JSON.parse(localStorage.getItem('credibility_history')) || [];

    // Determine type
    let itemType = 'text';
    const content = data.input_text || data.news_text || "";
    if (content.trim().startsWith('http') && (content.includes('youtube') || content.includes('youtu.be') || content.includes('tiktok'))) {
        itemType = 'video';
    }

    const snapshot = {
        id: Date.now(),
        timestamp: data.timestamp || new Date().toLocaleString(),
        type: itemType,
        input_text: content,
        score_label: data.score_label,
        classification_text: data.classification_text,
        model_confidence: data.model_confidence,
        colors: data.colors,
        
        // Save Text Mode Data
        lime_html: data.lime_html,
        supporting_articles: data.supporting_articles,

        // Save Video Mode Data (NEW)
        suspicious_frames: data.suspicious_frames,
        interpretation: data.interpretation,
        search_verdict: data.search_verdict,
        search_reason: data.search_reason,
        evidence: data.evidence,

        isFavorite: false 
    };

    history.unshift(snapshot);

    // Limit to 20 items (keep favorites)
    if (history.length > 20) {
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
}

// =========================================================
// 6. FILTER LOGIC (SMARTER VERSION)
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
            
            // INTELLIGENT TYPE DETECTION (Fixes old data showing up wrong)
            let type = item.type;
            if (!type) {
                const txt = item.input_text || "";
                if (txt.includes('youtube.com') || txt.includes('youtu.be') || txt.includes('tiktok.com')) {
                    type = 'video';
                } else {
                    type = 'text';
                }
            }

            if (category === 'saved') return item.isFavorite === true;
            if (category === 'real') return label.includes('high') || label.includes('real') || label.includes('credible') || label.includes('verified');
            if (category === 'fake') return label.includes('low') || label.includes('fake') || label.includes('debunked');
            if (category === 'uncertain') return label.includes('uncertain');
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
        // Sort: Favorites first
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
        const deleteClass = isLocked ? 'delete-disabled' : 'delete-btn';
        
        // Icon for Type
        const typeIcon = item.type === 'video' ? '🎥' : '📄';

        div.onclick = () => restoreSession(item.id);

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="flex: 1; min-width: 0; padding-right: 10px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:1.1em;">${typeIcon}</span>
                        <strong style="color:#333;">${item.score_label}</strong>
                        ${isLocked ? '<span style="font-size:12px;">⭐</span>' : ''}
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
                <button onclick="toggleFavorite(event, ${item.id})" class="action-btn ${starClass}">
                    Save
                </button>
                <button onclick="deleteItem(event, ${item.id})" class="action-btn ${deleteClass}">
                    Delete
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// =========================================================
// 8. ACTIONS
// =========================================================
window.restoreSession = function(id) {
    const history = JSON.parse(localStorage.getItem('credibility_history')) || [];
    const item = history.find(x => x.id === id);

    if (item) {
        // Reconstruct the full data object
        const data = {
            score_label: item.score_label,
            classification_text: item.classification_text,
            model_confidence: item.model_confidence,
            colors: item.colors,
            
            // Text Mode
            lime_html: item.lime_html,
            supporting_articles: item.supporting_articles,

            // Video Mode
            suspicious_frames: item.suspicious_frames,
            interpretation: item.interpretation,
            search_verdict: item.search_verdict,
            search_reason: item.search_reason,
            evidence: item.evidence
        };
        
        // Update Inputs
        if(item.type === 'video') {
             const vInput = document.getElementById('videoUrlInput');
             if(vInput) vInput.value = item.input_text;
             // Trigger Video Tab
             const vidTab = document.querySelector('.tab[data-mode="video"]');
             if(vidTab) vidTab.click();
        } else {
             const tInput = document.getElementById('userInput');
             if(tInput) tInput.value = item.input_text;
             // Trigger Text Tab
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
        alert("This item is saved! Unsave it first if you want to delete it.");
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
        document.getElementById('preview-thumb').src = "https://via.placeholder.com/120x90?text=Loading"; 

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
                document.getElementById('preview-thumb').src = "https://via.placeholder.com/120x90?text=Error";
                document.getElementById('preview-author').innerText = "Error";
            }
        }, 600); 
    });
}
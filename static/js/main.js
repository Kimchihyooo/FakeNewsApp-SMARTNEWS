// static/js/main.js

// static/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Initialize History
    if (typeof renderHistory === 'function') renderHistory();

    // Initialize Image Modal Logic
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
// 2. FORM SUBMIT (FIXED TIMER + SCAN BEAM)
// =========================================================
const form = document.getElementById('analyzeForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const btnText = document.getElementById('btntext');
        const btnVid = document.getElementById('btnvid');
        const timerDisplay = document.getElementById('timer-display');
        
        // A. FIND ACTIVE ELEMENTS
        // Check which tab is active to decide which input to animate
        const videoTab = document.querySelector('.tab[data-mode="video"]');
        const isVideoMode = videoTab && videoTab.classList.contains('tab-active');

        // Select the visible input and button
        const activeInput = isVideoMode 
            ? document.getElementById('videoUrlInput') 
            : document.getElementById('userInput');
            
        const activeBtn = isVideoMode ? btnVid : btnText;
        const originalText = activeBtn.innerText;

        // B. START VISUAL EFFECTS
        const startTime = Date.now(); // Start clock
        let timerInterval = null;

        activeBtn.innerText = "Analyzing..."; 
        activeBtn.disabled = true;
        activeBtn.style.opacity = "0.7";
        
        // --- TIMER START ---
        if(timerDisplay) {
            timerDisplay.style.display = 'block';
            timerDisplay.innerText = "Processing: 0.00s";
            
            timerInterval = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000;
                timerDisplay.innerText = `Processing: ${elapsed.toFixed(2)}s`;
            }, 50);
        }

        // --- SCAN BEAM START ---
        if (activeInput) {
            activeInput.classList.add('scanning');
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

            displayAnalysis(data);

        } catch (error) {
            alert("Analysis Error: " + error.message);
            console.error(error);
        } finally {
            // C. RESET EFFECTS
            if (timerInterval) clearInterval(timerInterval);
            
            // --- TIMER END (Show Final Time) ---
            if (timerDisplay) {
                const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
                timerDisplay.innerText = `Process finished (${totalTime}s)`;
                // Do NOT hide the timer here, so the user can see it.
            }

            activeBtn.innerText = originalText;
            activeBtn.disabled = false;
            activeBtn.style.opacity = "1";
            
            // Remove .scanning from the input
            if (activeInput) {
                activeInput.classList.remove('scanning');
            }
        }
    });
}

// =========================================================
// 3. HELPER: DISPLAY ERROR
// =========================================================
function displayError(message) {
    // 1. Show the results area, hide the placeholder
    document.getElementById('results-placeholder').style.display = 'none';
    document.getElementById('results-area').style.display = 'block';

    // 2. Hide the normal success elements
    document.getElementById('scoreBox').style.display = 'none';
    document.getElementById('classifications').style.display = 'none';
    document.getElementById('sources-list').innerHTML = ''; // Clear sources

    // 3. Inject the error message into the result container (Red Box)
    const resultContainer = document.getElementById('result-container');
    
    // Ensure the container is visible to show the error
    resultContainer.style.display = 'block';
    
    resultContainer.innerHTML = `
        <div style="text-align:center; padding: 24px; color: #b91c1c; background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px;">
            <h3 style="margin-top:0; font-family: 'Rubik', sans-serif;">⚠️ Analysis Failed</h3>
            <p style="margin-top:10px; font-size: 1.1rem; line-height: 1.5;">${message}</p>
        </div>
    `;
}

// =========================================================
// 3. DISPLAY ANALYSIS
// =========================================================
function displayAnalysis(data) {
    document.getElementById('results-placeholder').style.display = 'none';
    document.getElementById('results-area').style.display = 'block';

    // Common UI Updates
    const scoreBox = document.getElementById('scoreBox');
    const verdictLabel = document.getElementById('verdict-label');
    const confScore = document.getElementById('confidence-score');
    const confBar = document.getElementById('confidence-bar');

    verdictLabel.innerText = data.score_label;
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

    if (data.suspicious_frames || data.interpretation) {
        // === VIDEO MODE ===
        textContainer.style.display = 'none';
        videoContainer.style.display = 'block';

        // Interpretation
        document.getElementById('video-interpretation').innerText = 
            data.interpretation || "No interpretation available.";

        // Frame Gallery
        const gallery = document.getElementById('frame-gallery');
        gallery.innerHTML = ""; 

        if (data.suspicious_frames && data.suspicious_frames.length > 0) {
            data.suspicious_frames.forEach(b64 => {
                const img = document.createElement('img');
                img.src = "data:image/jpeg;base64," + b64;
                img.style.width = "100%";
                img.style.borderRadius = "5px";
                img.style.border = "2px solid #ef4444"; 
                img.style.cursor = "zoom-in";
                img.onclick = () => openImageModal(img.src);
                gallery.appendChild(img);
            });
        } else {
            gallery.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #9ca3af;">No suspicious frames detected.</p>`;
        }

        // Transcript
        document.getElementById('video-transcript').innerText = data.transcript || "No transcript available.";

    } else {
        // === TEXT MODE ===
        videoContainer.style.display = 'none';
        textContainer.style.display = 'block';

        document.getElementById('result-container').innerHTML = data.lime_html || data.news_text;

        const sourcesList = document.getElementById('sources-list');
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
// =========================================================
// 5. ADD TO HISTORY
// =========================================================
function addToHistory(data) {
    let history = JSON.parse(localStorage.getItem('credibility_history')) || [];

    let itemType = 'text';
    const content = data.input_text || data.news_text || "";
    if (content.trim().startsWith('http') && (content.includes('youtube') || content.includes('youtu.be'))) {
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
        lime_html: data.lime_html,
        supporting_articles: data.supporting_articles,
        colors: data.colors,
        isFavorite: false 
    };

    history.unshift(snapshot);

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
    filterHistoryItems();
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
            const type = (item.type || "text").toLowerCase();

            if (category === 'saved') return item.isFavorite === true;
            if (category === 'real') return label.includes('high') || label.includes('real') || label.includes('credible');
            if (category === 'fake') return label.includes('low') || label.includes('fake');
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
        
        div.onclick = () => restoreSession(item.id);

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="flex: 1; min-width: 0; padding-right: 10px;">
                    <div style="display:flex; align-items:center; gap:8px;">
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
        const data = {
            score_label: item.score_label,
            classification_text: item.classification_text,
            model_confidence: item.model_confidence,
            lime_html: item.lime_html,
            supporting_articles: item.supporting_articles,
            colors: item.colors 
        };
        displayAnalysis(data);
        const inputBox = document.getElementById('userInput');
        if (inputBox) inputBox.value = item.input_text;
        
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
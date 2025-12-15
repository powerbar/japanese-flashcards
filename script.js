// Flashcard App Logic
let vocabulary = [];
let currentIndex = 0;
let knownCards = new Set();
let isFlipped = false;
let showingUnknownOnly = false;
let searchResults = [];
let isSearchMode = false;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const fileStatus = document.getElementById('fileStatus');
const flashcard = document.getElementById('flashcard');
const cardFront = document.getElementById('cardFront');
const cardBack = document.getElementById('cardBack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const markBtn = document.getElementById('markBtn');
const randomBtn = document.getElementById('randomBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const resetBtn = document.getElementById('resetBtn');
const showUnknownBtn = document.getElementById('showUnknownBtn');
const progress = document.getElementById('progress');
const knownCount = document.getElementById('knownCount');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');

// Auto-load vocabulary.txt on page load
window.addEventListener('DOMContentLoaded', () => {
    fetch('vocabulary.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error('vocabulary.txt not found');
            }
            return response.text();
        })
        .then(content => {
            parseVocabularyFile(content);
            fileStatus.textContent = `✓ Auto-loaded vocabulary.txt (${vocabulary.length} cards)`;
            fileStatus.style.color = '#4CAF50';
            initializeFlashcards();
        })
        .catch(error => {
            fileStatus.textContent = 'No vocabulary.txt found. Please upload a file.';
            fileStatus.style.color = '#FF9800';
            console.log('Auto-load failed:', error);
        });
});

// File Upload
uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
        fileStatus.textContent = '✗ Error: Please upload a .txt file';
        fileStatus.style.color = '#f44336';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            parseVocabularyFile(event.target.result);
            fileStatus.textContent = `✓ Loaded: ${file.name} (${vocabulary.length} cards)`;
            fileStatus.style.color = '#4CAF50';
            initializeFlashcards();
        } catch (error) {
            fileStatus.textContent = `✗ Error: ${error.message}`;
            fileStatus.style.color = '#f44336';
        }
    };
    reader.readAsText(file);
});

// Parse TXT file (3 columns: hiragana, kanji, english)
function parseVocabularyFile(content) {
    vocabulary = [];
    
    // TXT format - expecting 3 columns separated by commas
    const lines = content.split('\n').filter(line => line.trim());
    
    for (let line of lines) {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 3 && parts[0] && parts[2]) {
            vocabulary.push({
                hiragana: parts[0],
                kanji: parts[1] || parts[0],
                english: parts[2]
            });
        }
    }

    if (vocabulary.length === 0) {
        throw new Error('No valid vocabulary found. Format: hiragana,kanji,english');
    }
}

// Initialize flashcards
function initializeFlashcards() {
    currentIndex = 0;
    knownCards.clear();
    showingUnknownOnly = false;
    isSearchMode = false;
    searchResults = [];
    searchInput.value = '';
    
    // Enable buttons
    prevBtn.disabled = false;
    nextBtn.disabled = false;
    markBtn.disabled = false;
    randomBtn.disabled = false;
    shuffleBtn.disabled = false;
    resetBtn.disabled = false;
    showUnknownBtn.disabled = false;
    searchInput.disabled = false;
    searchBtn.disabled = false;
    clearSearchBtn.disabled = false;
    
    showCard();
    updateStats();
}

// Show current card
function showCard() {
    if (vocabulary.length === 0) return;
    
    const card = vocabulary[currentIndex];
    
    // Front shows all 3 rows with labels: hiragana/katakana, kanji, english
    cardFront.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 25px; align-items: center; width: 100%;">
            <div style="text-align: center; width: 100%;">
                <div style="font-size: 0.4em; color: #999; font-weight: normal; margin-bottom: 8px;">Hiragana/Katakana</div>
                <p style="font-size: 1em; color: #667eea; font-weight: bold; margin: 0;">${card.hiragana}</p>
            </div>
            <div style="text-align: center; width: 100%;">
                <div style="font-size: 0.4em; color: #999; font-weight: normal; margin-bottom: 8px;">Kanji</div>
                <p style="font-size: 1.2em; color: #333; font-weight: bold; margin: 0;">${card.kanji}</p>
            </div>
            <div style="text-align: center; width: 100%;">
                <div style="font-size: 0.4em; color: #999; font-weight: normal; margin-bottom: 8px;">English</div>
                <p style="font-size: 0.8em; color: #666; font-weight: normal; margin: 0;">${card.english}</p>
            </div>
        </div>
    `;
    
    // Back shows just English (or you can customize this)
    cardBack.innerHTML = `<p>${card.english}</p>`;
    
    // Remove all special styling first
    cardFront.classList.remove('known', 'search-highlight');
    
    // Update card styling if known
    if (knownCards.has(currentIndex)) {
        cardFront.classList.add('known');
        markBtn.textContent = '✓ Known';
        markBtn.classList.add('marked');
    } else {
        markBtn.textContent = '✓ Mark as Known';
        markBtn.classList.remove('marked');
    }
    
    // Highlight if this is a search result
    if (isSearchMode) {
        cardFront.classList.add('search-highlight');
    }
    
    // Reset flip state
    flashcard.classList.remove('flipped');
    isFlipped = false;
    
    updateStats();
    updateNavigationButtons();
}

// Flip card
function flipCard() {
    if (vocabulary.length === 0) return;
    flashcard.classList.toggle('flipped');
    isFlipped = !isFlipped;
}

flashcard.addEventListener('click', flipCard);

// Navigation
function nextCard() {
    if (isSearchMode && searchResults.length > 0) {
        // Navigate within search results
        const currentSearchIndex = searchResults.indexOf(currentIndex);
        if (currentSearchIndex < searchResults.length - 1) {
            currentIndex = searchResults[currentSearchIndex + 1];
            showCard();
        }
    } else if (currentIndex < vocabulary.length - 1) {
        currentIndex++;
        showCard();
    }
}

function prevCard() {
    if (isSearchMode && searchResults.length > 0) {
        // Navigate within search results
        const currentSearchIndex = searchResults.indexOf(currentIndex);
        if (currentSearchIndex > 0) {
            currentIndex = searchResults[currentSearchIndex - 1];
            showCard();
        }
    } else if (currentIndex > 0) {
        currentIndex--;
        showCard();
    }
}

function updateNavigationButtons() {
    if (isSearchMode && searchResults.length > 0) {
        const currentSearchIndex = searchResults.indexOf(currentIndex);
        prevBtn.disabled = currentSearchIndex === 0;
        nextBtn.disabled = currentSearchIndex === searchResults.length - 1;
    } else {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === vocabulary.length - 1;
    }
}

prevBtn.addEventListener('click', prevCard);
nextBtn.addEventListener('click', nextCard);

// Random card
function showRandomCard() {
    if (vocabulary.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * vocabulary.length);
    currentIndex = randomIndex;
    isSearchMode = false;
    searchResults = [];
    showCard();
    fileStatus.textContent = '🎲 Random card selected!';
    fileStatus.style.color = '#FF5722';
}

randomBtn.addEventListener('click', showRandomCard);

// Search functionality
function searchVocabulary() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        fileStatus.textContent = 'Please enter a search term';
        fileStatus.style.color = '#f44336';
        return;
    }
    
    searchResults = [];
    
    for (let i = 0; i < vocabulary.length; i++) {
        const card = vocabulary[i];
        if (card.hiragana.toLowerCase().includes(query) || 
            card.kanji.toLowerCase().includes(query) ||
            card.english.toLowerCase().includes(query)) {
            searchResults.push(i);
        }
    }
    
    if (searchResults.length === 0) {
        fileStatus.textContent = `No results found for "${query}"`;
        fileStatus.style.color = '#f44336';
        isSearchMode = false;
    } else {
        isSearchMode = true;
        currentIndex = searchResults[0];
        showCard();
        fileStatus.textContent = `Found ${searchResults.length} result(s) for "${query}"`;
        fileStatus.style.color = '#4CAF50';
    }
}

searchBtn.addEventListener('click', searchVocabulary);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchVocabulary();
    }
});

// Clear search
function clearSearch() {
    searchInput.value = '';
    searchResults = [];
    isSearchMode = false;
    showCard();
    fileStatus.textContent = 'Search cleared';
    fileStatus.style.color = '#4CAF50';
}

clearSearchBtn.addEventListener('click', clearSearch);

// Mark as known
function toggleKnown() {
    if (vocabulary.length === 0) return;
    
    if (knownCards.has(currentIndex)) {
        knownCards.delete(currentIndex);
    } else {
        knownCards.add(currentIndex);
    }
    
    showCard();
}

markBtn.addEventListener('click', toggleKnown);

// Shuffle cards
function shuffleCards() {
    for (let i = vocabulary.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [vocabulary[i], vocabulary[j]] = [vocabulary[j], vocabulary[i]];
    }
    
    knownCards.clear();
    currentIndex = 0;
    isSearchMode = false;
    searchResults = [];
    showCard();
    fileStatus.textContent = '🔀 Cards shuffled!';
    fileStatus.style.color = '#4CAF50';
}

shuffleBtn.addEventListener('click', shuffleCards);

// Reset progress
function resetProgress() {
    if (confirm('Reset all progress? This will clear all "known" markers.')) {
        knownCards.clear();
        currentIndex = 0;
        showingUnknownOnly = false;
        isSearchMode = false;
        searchResults = [];
        showCard();
        fileStatus.textContent = '↺ Progress reset';
        fileStatus.style.color = '#4CAF50';
    }
}

resetBtn.addEventListener('click', resetProgress);

// Show unknown only
function toggleUnknownOnly() {
    showingUnknownOnly = !showingUnknownOnly;
    
    if (showingUnknownOnly) {
        const unknownIndices = [];
        for (let i = 0; i < vocabulary.length; i++) {
            if (!knownCards.has(i)) {
                unknownIndices.push(i);
            }
        }
        
        if (unknownIndices.length === 0) {
            alert('Great job! You know all the cards!');
            showingUnknownOnly = false;
            return;
        }
        
        showUnknownBtn.textContent = '📚 Show All Cards';
        fileStatus.textContent = `Studying ${unknownIndices.length} unknown cards`;
        fileStatus.style.color = '#FF9800';
        
        currentIndex = unknownIndices[0];
        isSearchMode = false;
        searchResults = [];
        showCard();
    } else {
        showUnknownBtn.textContent = '📚 Study Unknown Only';
        fileStatus.textContent = 'Showing all cards';
        fileStatus.style.color = '#4CAF50';
        isSearchMode = false;
        searchResults = [];
        showCard();
    }
}

showUnknownBtn.addEventListener('click', toggleUnknownOnly);

// Update statistics
function updateStats() {
    if (isSearchMode && searchResults.length > 0) {
        const currentSearchIndex = searchResults.indexOf(currentIndex);
        progress.textContent = `${currentSearchIndex + 1} / ${searchResults.length} (search results)`;
    } else {
        progress.textContent = `${currentIndex + 1} / ${vocabulary.length}`;
    }
    knownCount.textContent = knownCards.size;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (vocabulary.length === 0) return;
    
    // Don't trigger shortcuts when typing in search box
    if (document.activeElement === searchInput) return;
    
    switch(e.key) {
        case ' ':
        case 'Spacebar':
            e.preventDefault();
            flipCard();
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (currentIndex < vocabulary.length - 1) nextCard();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (currentIndex > 0) prevCard();
            break;
        case 'k':
        case 'K':
            e.preventDefault();
            toggleKnown();
            break;
        case 'r':
        case 'R':
            e.preventDefault();
            showRandomCard();
            break;
    }
});

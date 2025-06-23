// Global variables
let dictionary = {};
let currentRandomWord = null;
let weakWords = new Set();
let usedWords = new Set();
let currentWeakWord = null;
let quizScore = 0;
let activeCategory = null;

// Initialize
async function initialize() {
    await initializeVoices();
    loadDictionary();
    loadWeakWords();
    updateStats();
    setupSearchListener();
    setupImportListener();
    setupCategoryFilters();
    // Clear any existing content in weak words display
    document.getElementById('weak-word-content').innerHTML = '';
}

// Voice Initialization
function initializeVoices() {
    return new Promise((resolve) => {
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
                resolve(voices);
            };
        }
    });
}

// Speech Synthesis
function speakJapanese(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const japaneseVoice = voices.find(voice => voice.lang.includes('ja')) || voices[0];

        utterance.voice = japaneseVoice;
        utterance.lang = 'ja-JP';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        window.speechSynthesis.speak(utterance);
    } else {
        alert('Speech synthesis is not supported in your browser.');
    }
}

// Random Word Feature
function getRandomWord() {
    const words = Object.keys(dictionary).filter(word => !usedWords.has(word));
    
    if (words.length === 0) {
        usedWords.clear();
        getRandomWord();
        return;
    }

    const randomIndex = Math.floor(Math.random() * words.length);
    currentRandomWord = words[randomIndex];
    usedWords.add(currentRandomWord);
    
    updateRandomWordDisplay();
}

function updateRandomWordDisplay() {
    const container = document.getElementById('random-word-content');
    if (currentRandomWord && dictionary[currentRandomWord]) {
        container.innerHTML = `
            <div class="word-display">${currentRandomWord}</div>
        `;
    }
    
    // Reset show meaning button
    const showMeaningBtn = document.getElementById('show-meaning-btn');
    showMeaningBtn.textContent = 'Show Meaning';
}

function toggleRandomMeaning() {
    const container = document.getElementById('random-word-content');
    const showMeaningBtn = document.getElementById('show-meaning-btn');
    const wordDisplay = container.querySelector('.word-display');
    
    if (wordDisplay) {
        // Add to weak words when showing meaning
        weakWords.add(currentRandomWord);
        saveWeakWords();
        updateWeakWordsCount();

        // Replace word with meaning
        container.innerHTML = `
            <div class="meaning-display">
                ${dictionary[currentRandomWord].meaning}
                <span class="speak-icon" onclick="speakJapanese('${dictionary[currentRandomWord].meaning}')">🔊</span>
            </div>
        `;
        showMeaningBtn.textContent = 'Show Word';
    } else {
        // Show word again
        container.innerHTML = `
            <div class="word-display">${currentRandomWord}</div>
        `;
        showMeaningBtn.textContent = 'Show Meaning';
    }
}

// Weak Words Feature
function loadWeakWords() {
    const savedWeakWords = localStorage.getItem('weakWords');
    if (savedWeakWords) {
        weakWords = new Set(JSON.parse(savedWeakWords));
        updateWeakWordsCount();
    }
}

function saveWeakWords() {
    localStorage.setItem('weakWords', JSON.stringify(Array.from(weakWords)));
}

function updateWeakWordsCount() {
    document.getElementById('weak-words-count').textContent = weakWords.size;
    updateWeakWordsList();
}

function updateWeakWordsList() {
    const container = document.getElementById('weak-words-list');
    container.innerHTML = '';

    weakWords.forEach(word => {
        if (dictionary[word]) {
            const card = createWeakWordCard(word);
            container.appendChild(card);
        }
    });
}

function createWeakWordCard(word) {
    const card = document.createElement('div');
    card.className = 'weak-word-card';

    const wordText = document.createElement('span');
    wordText.textContent = word;

    const controls = document.createElement('div');
    controls.className = 'weak-word-controls';

    const speakIcon = document.createElement('span');
    speakIcon.className = 'speak-icon';
    speakIcon.textContent = '🔊';
    speakIcon.onclick = (e) => {
        e.stopPropagation();
        speakJapanese(dictionary[word].meaning);
    };

    const removeBtn = document.createElement('button');
    removeBtn.className = 'control-button';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = (e) => {
        e.stopPropagation();
        removeFromWeakWords(word);
    };

    controls.appendChild(speakIcon);
    controls.appendChild(removeBtn);

    card.appendChild(wordText);
    card.appendChild(controls);

    return card;
}

function removeFromWeakWords(word) {
    weakWords.delete(word);
    saveWeakWords();
    updateWeakWordsCount();
    
    // Clear practice area if no words left
    if (weakWords.size === 0) {
        document.getElementById('weak-word-content').innerHTML = '';
        currentWeakWord = null;
    }
}
function practiceWeakWords() {
    const weakWordsArray = Array.from(weakWords);
    if (weakWordsArray.length === 0) {
        alert('No weak words to practice!');
        document.getElementById('weak-word-content').innerHTML = '';
        currentWeakWord = null;
        return;
    }

    // Select a random weak word
    const newWord = weakWordsArray[Math.floor(Math.random() * weakWordsArray.length)];
    
    // Make sure we don't get the same word twice in a row
    if (weakWordsArray.length > 1 && newWord === currentWeakWord) {
        practiceWeakWords();
        return;
    }

    currentWeakWord = newWord;
    updateWeakWordDisplay();
}

function updateWeakWordDisplay() {
    const container = document.getElementById('weak-word-content');
    if (currentWeakWord && dictionary[currentWeakWord]) {
        container.innerHTML = `
            <div class="word-display">${currentWeakWord}</div>
        `;
        
        // Reset show meaning button
        const showMeaningBtn = document.getElementById('weak-word-meaning-btn');
        if (showMeaningBtn) {
            showMeaningBtn.textContent = 'Show Meaning';
        }
    }
}

function toggleWeakWordMeaning() {
    if (!currentWeakWord) return;

    const container = document.getElementById('weak-word-content');
    const showMeaningBtn = document.getElementById('weak-word-meaning-btn');
    const wordDisplay = container.querySelector('.word-display');
    
    if (wordDisplay) {
        // Show meaning
        container.innerHTML = `
            <div class="meaning-display">
                ${dictionary[currentWeakWord].meaning}
                <span class="speak-icon" onclick="speakJapanese('${dictionary[currentWeakWord].meaning}')">🔊</span>
            </div>
        `;
        showMeaningBtn.textContent = 'Show Word';
    } else {
        // Show word
        container.innerHTML = `
            <div class="word-display">${currentWeakWord}</div>
        `;
        showMeaningBtn.textContent = 'Show Meaning';
    }
}

// Word Management
function addWord() {
    const word = document.getElementById('word-input').value.trim();
    const meaning = document.getElementById('meaning-input').value.trim();
    const category = document.getElementById('category-select').value;
    
    if (word && meaning) {
        dictionary[word] = {
            meaning: meaning,
            category: category,
            dateAdded: new Date().toISOString()
        };
        saveDictionary();
        updateWordDisplay();
        updateStats();
        clearInputs();
    }
}

function createWordCard(word) {
    const card = document.createElement('div');
    card.className = 'word-card';

    const banglaWord = document.createElement('div');
    banglaWord.className = 'word-card-bangla';
    banglaWord.textContent = word;

    const japaneseContainer = document.createElement('div');
    japaneseContainer.className = 'word-card-japanese';
    
    const japaneseWord = document.createElement('span');
    japaneseWord.textContent = dictionary[word].meaning;

    const speakIcon = document.createElement('span');
    speakIcon.className = 'speak-icon';
    speakIcon.textContent = '🔊';
    speakIcon.onclick = (e) => {
        e.stopPropagation();
        speakJapanese(dictionary[word].meaning);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'delete-button';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteWord(word, e);
    };

    japaneseContainer.appendChild(japaneseWord);
    japaneseContainer.appendChild(speakIcon);

    card.appendChild(banglaWord);
    card.appendChild(japaneseContainer);
    card.appendChild(deleteBtn);

    return card;
}

function deleteWord(word, event) {
    if (event) event.stopPropagation();
    delete dictionary[word];
    weakWords.delete(word);
    usedWords.delete(word);
    saveDictionary();
    saveWeakWords();
    updateWordDisplay();
    updateWeakWordsCount();
    updateStats();
}

function updateWordDisplay() {
    const container = document.getElementById('word-list-container');
    container.innerHTML = '';
    
    const words = Object.keys(dictionary);
    if (words.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No words added yet</p>';
        return;
    }
    
    words.forEach(word => {
        if (!activeCategory || dictionary[word].category === activeCategory) {
            container.appendChild(createWordCard(word));
        }
    });
}

// Quiz System
function startQuiz() {
    const words = Object.keys(dictionary);
    if (words.length < 4) {
        alert('Please add at least 4 words to start a quiz!');
        return;
    }

    const questionWord = words[Math.floor(Math.random() * words.length)];
    const correctAnswer = dictionary[questionWord].meaning;
    const options = [correctAnswer];

    while (options.length < 4) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        const randomMeaning = dictionary[randomWord].meaning;
        if (!options.includes(randomMeaning) && randomMeaning !== correctAnswer) {
            options.push(randomMeaning);
        }
    }

    options.sort(() => Math.random() - 0.5);

    currentQuiz = {
        word: questionWord,
        correctAnswer: correctAnswer,
        options: options
    };

    displayQuiz();
}

function displayQuiz() {
    const questionContainer = document.getElementById('quiz-question');
    const optionsContainer = document.getElementById('quiz-options');

    questionContainer.innerHTML = `
        <div class="quiz-word">
            <h4>What is the Japanese meaning of:</h4>
            <div class="quiz-bangla-word">${currentQuiz.word}</div>
        </div>
    `;

    optionsContainer.innerHTML = '';
    currentQuiz.options.forEach((option) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'quiz-option';
        optionDiv.innerHTML = `
            ${option}
            <span class="speak-icon" onclick="speakJapanese('${option}')">🔊</span>
        `;
        optionDiv.onclick = () => checkAnswer(option);
        optionsContainer.appendChild(optionDiv);
    });
}

function checkAnswer(selectedAnswer) {
    const options = document.querySelectorAll('.quiz-option');
    let correctOption = null;
    let selectedOption = null;

    options.forEach(option => {
        const optionText = option.textContent.replace('🔊', '').trim();
        if (optionText === currentQuiz.correctAnswer) {
            correctOption = option;
        }
        if (optionText === selectedAnswer) {
            selectedOption = option;
        }
        option.style.pointerEvents = 'none';
    });

    correctOption.classList.add('correct');
    if (selectedAnswer !== currentQuiz.correctAnswer) {
        selectedOption.classList.add('wrong');
        // Add to weak words if answered incorrectly
        weakWords.add(currentQuiz.word);
        saveWeakWords();
        updateWeakWordsCount();
    } else {
        quizScore++;
        updateStats();
    }

    setTimeout(startQuiz, 1500);
}

// Search and Filter
function setupCategoryFilters() {
    const categories = ['noun', 'verb', 'adjective', 'adverb', 'other'];
    const filterContainer = document.getElementById('category-filters');
    
    categories.forEach(category => {
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        tag.dataset.category = category;
        tag.onclick = () => filterByCategory(category);
        filterContainer.appendChild(tag);
    });
}

function filterByCategory(category) {
    activeCategory = activeCategory === category ? null : category;
    
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.classList.remove('active');
    });
    
    if (activeCategory) {
        document.querySelector(`.filter-tag[data-category="${category}"]`).classList.add('active');
    }
    
    updateWordDisplay();
}

function setupSearchListener() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterWords(searchTerm);
    });
}

function filterWords(searchTerm) {
    const container = document.getElementById('word-list-container');
    container.innerHTML = '';

    Object.keys(dictionary).forEach(word => {
        if ((word.toLowerCase().includes(searchTerm) || 
             dictionary[word].meaning.toLowerCase().includes(searchTerm)) && 
            (!activeCategory || dictionary[word].category === activeCategory)) {
            container.appendChild(createWordCard(word));
        }
    });
}

// Storage Management
function loadDictionary() {
    const savedDictionary = localStorage.getItem('dictionary');
    if (savedDictionary) {
        dictionary = JSON.parse(savedDictionary);
        updateWordDisplay();
    }
}

function saveDictionary() {
    localStorage.setItem('dictionary', JSON.stringify(dictionary));
}

function clearInputs() {
    document.getElementById('word-input').value = '';
    document.getElementById('meaning-input').value = '';
    document.getElementById('category-select').value = '';
}

// Stats
function updateStats() {
    document.getElementById('total-words').textContent = Object.keys(dictionary).length;
    document.getElementById('quiz-score').textContent = quizScore;
    document.getElementById('quiz-score-total').textContent = quizScore;
}

// Tab Management
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`.nav-tab[onclick="showTab('${tabName}')"]`).classList.add('active');
}

// Export/Import
function exportDictionary() {
    const exportData = {
        dictionary: dictionary,
        weakWords: Array.from(weakWords)
    };
    
    const dataStr = JSON.stringify(exportData);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'dictionary.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function setupImportListener() {
    const importFile = document.getElementById('import-file');
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                dictionary = {...dictionary, ...importedData.dictionary};
                if (importedData.weakWords) {
                    weakWords = new Set([...weakWords, ...importedData.weakWords]);
                }
                saveDictionary();
                saveWeakWords();
                updateWordDisplay();
                updateWeakWordsCount();
                updateStats();
                alert('Dictionary imported successfully!');
            } catch (error) {
                alert('Error importing dictionary. Please check the file format.');
            }
        };

        reader.readAsText(file);
    });
}

// Initialize when page loads
initialize();
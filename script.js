if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const tableSelect = document.getElementById("tableSelect");
  const timerDurationInput = document.getElementById("timerDuration");
  const startButton = document.getElementById("startButton");
  const quizArea = document.querySelector(".quiz-area");
  const settingsArea = document.querySelector(".settings-panel"); // Updated class for settings
  const resultsArea = document.querySelector(".results-area");
  const timeDisplay = document.getElementById("time");
  const currentQuestionNumDisplay =
    document.getElementById("currentQuestionNum");
  const questionDisplay = document.getElementById("question");
  const optionsContainer = document.getElementById("options");
  const correctAnswersDisplay = document.getElementById("correctAnswers");
  const incorrectAnswersDisplay = document.getElementById("incorrectAnswers");
  const restartButton = document.getElementById("restartButton");
  const timeTakenDisplay = document.getElementById("timeTaken");
  const levelDisplay = document.getElementById("levelDisplay"); // Targets the whole "Level: N/A |" span
  const currentLevelDisplay = document.getElementById("currentLevel"); // Targets only the "N/A" part

  // Game State Variables
  let selectedTable = "2"; // Changed to string to handle 'all'
  let quizQuestions = []; // Array of questions for the current table/level
  let currentQuestionIndex = 0; // Index of the current question in quizQuestions
  let correctCount = 0; // Total correct answers in the entire quiz session
  let incorrectCount = 0; // Total incorrect answers in the entire quiz session (usually 0 or 1 in 'stop on wrong' mode)
  let timer; // Holds the setInterval ID for the countdown timer
  let timeLeft; // Remaining time for the current level/quiz
  let quizDuration; // The initial timer duration set by the user

  let startTime; // Timestamp when the quiz (or 'All Mode') officially starts

  // All Mode specific variables
  let isAllMode = false; // Flag to indicate if "All Mode" is active
  let currentLevel = 2; // Tracks the current table (level) in "All Mode"
  const MIN_LEVEL = 2; // Starting table for "All Mode"
  const MAX_LEVEL = 12; // Ending table for "All Mode"
  const QUESTIONS_PER_LEVEL = 12; // Number of questions per table

  // --- Event Listeners ---
  tableSelect.addEventListener("change", (e) => {
    selectedTable = e.target.value; // Store value as string ('all' or '2'-'12')
    if (selectedTable === "all") {
      isAllMode = true;
      levelDisplay.classList.remove("hidden"); // Show level display when 'All Tables' is selected
    } else {
      isAllMode = false;
      levelDisplay.classList.add("hidden"); // Hide level display for single table mode
    }
  });

  startButton.addEventListener("click", startQuiz);
  restartButton.addEventListener("click", resetQuiz);

  // --- Quiz Logic Functions ---

  /**
   * Generates an array of multiplication questions for a given table.
   * @param {number} table The multiplication table to generate questions for.
   * @param {number} count The number of questions to generate (default 12).
   * @returns {Array<Object>} An array of question objects.
   */
  function generateQuestions(table, count = QUESTIONS_PER_LEVEL) {
    const questions = [];
    for (let i = 1; i <= count; i++) {
      const num1 = i;
      const num2 = table;
      const correctAnswer = num1 * num2;
      questions.push({
        question: `${num1} &times; ${num2} = ?`,
        correctAnswer: correctAnswer,
      });
    }
    return shuffleArray(questions); // Randomize the order of questions
  }

  /**
   * Generates a set of 4 unique options, including the correct answer.
   * @param {number} correctAnswer The correct answer for the question.
   * @returns {Array<number>} An array of 4 shuffled options.
   */
  function generateOptions(correctAnswer) {
    const options = new Set();
    options.add(correctAnswer); // Always include the correct answer

    // Generate 3 random incorrect options
    while (options.size < 4) {
      let incorrectOption;
      // Generate numbers around the correct answer, but not too close or too far
      const diff = Math.floor(Math.random() * 10) - 5; // Difference from -5 to +4
      incorrectOption = correctAnswer + diff;

      // Ensure options are positive, not the correct answer, and unique
      if (
        incorrectOption > 0 &&
        incorrectOption !== correctAnswer &&
        !options.has(incorrectOption)
      ) {
        options.add(incorrectOption);
      }
    }
    return shuffleArray(Array.from(options)); // Convert Set to Array and shuffle
  }

  /**
   * Shuffles an array in place using the Fisher-Yates (Knuth) algorithm.
   * @param {Array} array The array to shuffle.
   * @returns {Array} The shuffled array.
   */
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Initializes and starts the quiz based on selected mode.
   */
  function startQuiz() {
    quizDuration = parseInt(timerDurationInput.value);
    if (isNaN(quizDuration) || quizDuration < 10) {
      alert("Please enter a valid timer duration (at least 10 seconds).");
      return;
    }

    // Reset game state for a new quiz
    currentQuestionIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    startTime = Date.now(); // Record the start time for the entire quiz session

    // Update UI visibility
    settingsArea.classList.add("hidden");
    resultsArea.classList.add("hidden");
    quizArea.classList.remove("hidden");

    // Determine quiz mode
    if (isAllMode) {
      currentLevel = MIN_LEVEL; // Start with the minimum level (table 2)
      currentLevelDisplay.textContent = currentLevel; // Update level display
      startLevel(currentLevel); // Start the first level
    } else {
      levelDisplay.classList.add("hidden"); // Ensure level display is hidden for single mode
      quizQuestions = generateQuestions(parseInt(selectedTable)); // Generate questions for the chosen table
      timeLeft = quizDuration; // Set timer for single quiz
      startTimer(); // Start the timer
      showQuestion(); // Show the first question
    }
  }

  /**
   * Starts a new multiplication table level in "All Mode".
   * @param {number} table The multiplication table (level) to start.
   */
  function startLevel(table) {
    currentLevelDisplay.textContent = table; // Update the displayed level
    quizQuestions = generateQuestions(table); // Generate questions for the new table
    currentQuestionIndex = 0; // Reset question index for the new level
    timeLeft = quizDuration; // Reset timer for the new level
    timeDisplay.textContent = timeLeft; // Update time display immediately

    clearInterval(timer); // Clear any existing timer for smooth transition
    startTimer(); // Start timer for the new level
    showQuestion(); // Show the first question of the new level
  }

  /**
   * Starts the countdown timer for the current level/quiz.
   */
  function startTimer() {
    timeDisplay.textContent = timeLeft; // Display initial time
    timer = setInterval(() => {
      timeLeft--;
      timeDisplay.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timer); // Stop timer when it reaches 0
        endQuiz(); // End the quiz
      }
    }, 1000); // Update every second
  }

  /**
   * Displays the current question and its options.
   */
  function showQuestion() {
    // Check if all questions for the current level/quiz have been answered
    if (currentQuestionIndex >= quizQuestions.length) {
      // This case should ideally be handled by handleAnswer for level progression
      // But as a fallback, ensure timer is cleared if it somehow reaches here
      clearInterval(timer);
      endQuiz();
      return;
    }

    const q = quizQuestions[currentQuestionIndex];
    currentQuestionNumDisplay.textContent = currentQuestionIndex + 1; // Update question number display
    questionDisplay.innerHTML = q.question; // Display the question text
    optionsContainer.innerHTML = ""; // Clear previous options

    const optionsForCurrentQuestion = generateOptions(q.correctAnswer); // Generate options dynamically

    optionsForCurrentQuestion.forEach((option) => {
      const button = document.createElement("button");
      button.classList.add("option-button");
      button.textContent = option;
      // Attach event listener to handle answer clicks
      button.addEventListener("click", () =>
        handleAnswer(button, option, q.correctAnswer)
      );
      optionsContainer.appendChild(button);
    });
  }

  /**
   * Handles the user's answer selection.
   * @param {HTMLElement} clickedButton The button element that was clicked.
   * @param {number} chosenAnswer The numerical value of the chosen answer.
   * @param {number} correctAnswer The correct answer for the current question.
   */
  function handleAnswer(clickedButton, chosenAnswer, correctAnswer) {
    // Disable all options after an answer is chosen to prevent multiple clicks
    Array.from(optionsContainer.children).forEach((button) => {
      button.disabled = true;
      if (parseInt(button.textContent) === correctAnswer) {
        button.classList.add("correct"); // Highlight correct answer in green
      } else {
        button.classList.add("incorrect"); // Highlight incorrect answers in red
      }
    });

    if (parseInt(chosenAnswer) === correctAnswer) {
      correctCount++; // Increment correct answers
      currentQuestionIndex++; // Move to the next question within the current level/table

      // Check if current level/table is completed
      if (currentQuestionIndex >= quizQuestions.length) {
        clearInterval(timer); // Stop timer for the current level
        if (isAllMode) {
          currentLevel++; // Move to the next level
          if (currentLevel <= MAX_LEVEL) {
            // All Mode: Advance to the next level after a short delay
            setTimeout(() => {
              startLevel(currentLevel);
            }, 1000); // 1-second delay to show feedback
          } else {
            // All Mode: All levels completed, end the entire quiz
            setTimeout(() => {
              endQuiz();
            }, 1000);
          }
        } else {
          // Single Table Mode: Quiz completed, end the quiz
          setTimeout(() => {
            endQuiz();
          }, 1000);
        }
      } else {
        // More questions in current level/table, show the next one instantly
        showQuestion();
      }
    } else {
      // Incorrect answer: Quiz ends immediately (stop on wrong answer mode)
      incorrectCount++; // Increment incorrect answers
      clearInterval(timer); // Stop the timer
      setTimeout(() => {
        // Give a small delay for visual feedback before showing results
        endQuiz();
      }, 1000); // 1-second delay
    }
  }

  /**
   * Ends the quiz, calculates final scores and time, and displays results.
   */
  function endQuiz() {
    clearInterval(timer); // Ensure timer is stopped if it's not already
    const endTime = Date.now(); // Record the end time
    const timeTaken = Math.floor((endTime - startTime) / 1000); // Calculate total time in seconds

    // Update UI visibility
    quizArea.classList.add("hidden");
    settingsArea.classList.add("hidden");
    resultsArea.classList.remove("hidden");

    // Display results
    correctAnswersDisplay.textContent = correctCount;
    incorrectAnswersDisplay.textContent = incorrectCount;
    timeTakenDisplay.textContent = timeTaken;
  }

  /**
   * Resets the quiz to its initial state, ready for a new game.
   */
  function resetQuiz() {
    clearInterval(timer); // Clear any active timer

    // Reset UI visibility
    settingsArea.classList.remove("hidden");
    quizArea.classList.add("hidden");
    resultsArea.classList.add("hidden");

    // Reset settings inputs to default
    timerDurationInput.value = 30;
    tableSelect.value = "2"; // Reset table selection to default single mode (table of 2)

    // Reset all game state variables
    currentQuestionIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    startTime = 0;
    isAllMode = false; // Reset All Mode flag
    currentLevel = MIN_LEVEL; // Reset current level to its starting value

    levelDisplay.classList.add("hidden"); // Hide level display by default
  }

  // --- Initial Setup on Page Load ---
  resetQuiz(); // Call reset to ensure everything is in its default state when the page loads
});

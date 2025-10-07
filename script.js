document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const tableSelect = document.getElementById("tableSelect");
  const timerDurationInput = document.getElementById("timerDuration");
  const startButton = document.getElementById("startButton");
  const quizArea = document.querySelector(".quiz-area");
  const settingsArea = document.querySelector(".settings");
  const resultsArea = document.querySelector(".results-area");
  const timeDisplay = document.getElementById("time");
  const currentQuestionNumDisplay =
    document.getElementById("currentQuestionNum");
  const questionDisplay = document.getElementById("question");
  const optionsContainer = document.getElementById("options");
  // Removed nextButton since it's no longer used
  const correctAnswersDisplay = document.getElementById("correctAnswers");
  const incorrectAnswersDisplay = document.getElementById("incorrectAnswers");
  const restartButton = document.getElementById("restartButton");

  let selectedTable = 2;
  let quizQuestions = [];
  let currentQuestionIndex = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let timer;
  let timeLeft;
  let quizDuration;

  // Event Listeners
  tableSelect.addEventListener("change", (e) => {
    selectedTable = parseInt(e.target.value);
  });

  startButton.addEventListener("click", startQuiz);
  // nextButton.addEventListener('click', showNextQuestion); // Removed this listener
  restartButton.addEventListener("click", resetQuiz);

  // --- Quiz Logic Functions ---

  function generateQuestions(table, count = 12) {
    const questions = [];
    // Generate all possible questions for the table (1xTable to 12xTable)
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

  function generateOptions(correctAnswer) {
    const options = new Set();
    options.add(correctAnswer); // Always include the correct answer

    // Generate 3 random incorrect options
    while (options.size < 4) {
      let incorrectOption;
      // Generate numbers around the correct answer, but not too close or too far
      const diff = Math.floor(Math.random() * 10) - 5; // -5 to +4 difference
      incorrectOption = correctAnswer + diff;

      // Ensure options are positive and not the correct answer, and somewhat distinct
      if (
        incorrectOption > 0 &&
        incorrectOption !== correctAnswer &&
        !options.has(incorrectOption)
      ) {
        options.add(incorrectOption);
      }
    }

    return shuffleArray(Array.from(options));
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function startQuiz() {
    selectedTable = parseInt(tableSelect.value);
    quizDuration = parseInt(timerDurationInput.value);
    if (isNaN(quizDuration) || quizDuration < 10) {
      alert("Please enter a valid timer duration (at least 10 seconds).");
      return;
    }

    quizQuestions = generateQuestions(selectedTable);
    currentQuestionIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    timeLeft = quizDuration;

    settingsArea.classList.add("hidden");
    resultsArea.classList.add("hidden");
    quizArea.classList.remove("hidden");
    // nextButton.classList.add('hidden'); // No longer needed as button is removed

    startTimer();
    showQuestion();
  }

  function startTimer() {
    timeDisplay.textContent = timeLeft;
    timer = setInterval(() => {
      timeLeft--;
      timeDisplay.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timer);
        endQuiz();
      }
    }, 1000);
  }

  function showQuestion() {
    // If all questions answered, end quiz
    if (currentQuestionIndex >= quizQuestions.length) {
      clearInterval(timer); // Stop timer immediately if all questions are done
      endQuiz();
      return;
    }

    const q = quizQuestions[currentQuestionIndex];
    currentQuestionNumDisplay.textContent = currentQuestionIndex + 1;
    questionDisplay.innerHTML = q.question;
    optionsContainer.innerHTML = ""; // Clear previous options

    const optionsForCurrentQuestion = generateOptions(q.correctAnswer); // Generate options each time

    optionsForCurrentQuestion.forEach((option) => {
      const button = document.createElement("button");
      button.classList.add("option-button");
      button.textContent = option;
      button.addEventListener("click", () =>
        handleAnswer(button, option, q.correctAnswer)
      );
      optionsContainer.appendChild(button);
    });
  }

  function handleAnswer(clickedButton, chosenAnswer, correctAnswer) {
    // Disable all options after an answer is chosen
    Array.from(optionsContainer.children).forEach((button) => {
      button.disabled = true;
      if (parseInt(button.textContent) === correctAnswer) {
        button.classList.add("correct");
      } else {
        button.classList.add("incorrect");
      }
    });

    if (parseInt(chosenAnswer) === correctAnswer) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    // Automatically advance to the next question after a short delay for visual feedback
    setTimeout(() => {
      currentQuestionIndex++;
      showQuestion();
    }, 1000); // 1 second delay
  }

  // showNextQuestion is no longer needed as handleAnswer directly advances

  function endQuiz() {
    clearInterval(timer);
    quizArea.classList.add("hidden");
    settingsArea.classList.add("hidden");
    resultsArea.classList.remove("hidden");

    correctAnswersDisplay.textContent = correctCount;
    incorrectAnswersDisplay.textContent = incorrectCount;
  }

  function resetQuiz() {
    clearInterval(timer);
    settingsArea.classList.remove("hidden");
    quizArea.classList.add("hidden");
    resultsArea.classList.add("hidden");
    timerDurationInput.value = 30; // Reset timer input
    tableSelect.value = 2; // Reset table selection
    currentQuestionIndex = 0; // Ensure index is reset
    correctCount = 0;
    incorrectCount = 0;
  }

  // Initial setup
  resetQuiz();
});
